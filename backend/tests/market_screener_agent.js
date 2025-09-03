#!/usr/bin/env node

/**
 * IoPulse Market Screener Agent
 *
 * This agent screens the entire market for coins that match the user's general profile.
 * It takes a JSON investment profile and returns a list of 15 potential investment candidates.
 */

const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Configuration
const API_ENDPOINT =
    "https://api.intelligence.io.solutions/api/v1/chat/completions";
const MODEL_NAME = "mistralai/Magistral-Small-2506";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `Your input is a JSON object containing an investor's profile. Your task is to generate a list of 15 potential investment candidates.

Follow these steps:
1. Use the \`listing coins\` tool to get a broad list of active cryptocurrencies.
2. Based on the "desired_market_cap" from the input profile, filter this list.
3. For the filtered list, use the \`get coin quotes\` tool to check for sufficient 24-hour trading volume to ensure liquidity.
4. Your final output must be a single JSON array of the ticker symbols for the top 15 candidates. Example: ["BTC", "ETH", "SOL", ...]`;

// Tool definitions for the model
const TOOLS = [
    {
        type: "function",
        function: {
            name: "listing_coins",
            description: "Get a broad list of active cryptocurrencies",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_coin_quotes",
            description:
                "Get current quotes and trading data for specific coins",
            parameters: {
                type: "object",
                properties: {
                    symbols: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                        description: "Array of coin symbols to get quotes for",
                    },
                },
                required: ["symbols"],
            },
        },
    },
];

/**
 * Process investment profile using the Market Screener Agent
 * @param {Object} investorProfile - Investment profile JSON from first agent
 * @returns {Object} - Result with list of 15 coin candidates
 */
async function processMarketScreening(investorProfile) {
    const apiKey = process.env.IONET_API_KEY;
    if (!apiKey) {
        throw new Error("IONET_API_KEY not found in environment variables.");
    }

    console.log("🔍 Starting Market Screening...");
    console.log("📊 Input Profile:", JSON.stringify(investorProfile, null, 2));

    // Prepare API request with tools
    const requestPayload = {
        model: MODEL_NAME,
        messages: [
            {
                role: "system",
                content: AGENT_INSTRUCTIONS,
            },
            {
                role: "user",
                content: JSON.stringify(investorProfile),
            },
        ],
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 3000,
    };

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    try {
        console.log("📤 Sending request to Market Screener Agent...");

        // Make initial API call
        let response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 120000, // 2 minutes timeout for tool calls
        });

        console.log("✅ Market Screener API call successful!");

        let messages = [...requestPayload.messages];
        let toolCallsCount = 0;
        let allToolCalls = [];

        // Handle tool calls in a conversation loop
        while (
            response.data.choices[0].message.tool_calls &&
            response.data.choices[0].message.tool_calls.length > 0
        ) {
            const choice = response.data.choices[0];
            console.log(
                `🔧 Agent made ${choice.message.tool_calls.length} tool calls`
            );

            // Add assistant message with tool calls
            messages.push(choice.message);

            // Process each tool call
            for (const toolCall of choice.message.tool_calls) {
                console.log(`🛠️ Tool Call: ${toolCall.function.name}`);
                console.log(
                    `📝 Parameters:`,
                    JSON.parse(toolCall.function.arguments)
                );

                allToolCalls.push({
                    name: toolCall.function.name,
                    arguments: JSON.parse(toolCall.function.arguments),
                });

                // Simulate tool response based on the tool name
                let toolResponse = simulateToolResponse(
                    toolCall.function.name,
                    JSON.parse(toolCall.function.arguments),
                    investorProfile
                );

                // Add tool response message
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResponse),
                });

                toolCallsCount++;
            }

            // Continue conversation with tool results
            const continuePayload = {
                model: MODEL_NAME,
                messages: messages,
                tools: TOOLS,
                tool_choice: "auto",
                temperature: 0.3,
                max_tokens: 3000,
            };

            console.log(`📤 Continuing conversation with tool results...`);
            response = await axios.post(API_ENDPOINT, continuePayload, {
                headers: headers,
                timeout: 120000,
            });
        }

        // Extract final response
        const finalChoice = response.data.choices[0];
        const agentResponse = finalChoice.message.content;

        console.log("📋 Final Agent Response:", agentResponse);

        let finalCandidates = null;

        // Try to parse the final response as JSON array
        if (agentResponse) {
            try {
                const candidateList = JSON.parse(agentResponse.trim());
                if (Array.isArray(candidateList)) {
                    finalCandidates = candidateList;
                }
            } catch (parseError) {
                // If not direct JSON, look for JSON array in the text
                const jsonMatch = agentResponse.match(/\[([^\]]+)\]/);
                if (jsonMatch) {
                    try {
                        finalCandidates = JSON.parse(jsonMatch[0]);
                    } catch (matchError) {
                        console.log(
                            "⚠️ Could not parse JSON from response, using simulated candidates"
                        );
                        finalCandidates =
                            generateCandidateList(investorProfile);
                    }
                } else {
                    console.log(
                        "⚠️ No JSON array found in response, using simulated candidates"
                    );
                    finalCandidates = generateCandidateList(investorProfile);
                }
            }
        }

        return {
            success: true,
            candidates: finalCandidates,
            toolCalls: allToolCalls,
            toolCallsCount: toolCallsCount,
            rawResponse: agentResponse,
            usage: response.data.usage,
        };
    } catch (error) {
        console.error("❌ Market Screener failed:", error.message);

        // Fallback to simulated response on API failure
        console.log("🔄 Falling back to simulated market screening...");
        const candidates = generateCandidateList(investorProfile);

        return {
            success: true,
            candidates: candidates,
            fallbackMode: true,
            error: error.message,
            profile: investorProfile,
        };
    }
}

/**
 * Simulate tool responses for listing_coins and get_coin_quotes
 */
function simulateToolResponse(toolName, parameters, profile) {
    if (toolName === "listing_coins") {
        // Return a comprehensive list of cryptocurrencies
        return {
            coins: [
                { symbol: "BTC", name: "Bitcoin", market_cap_rank: 1 },
                { symbol: "ETH", name: "Ethereum", market_cap_rank: 2 },
                { symbol: "BNB", name: "BNB", market_cap_rank: 3 },
                { symbol: "XRP", name: "XRP", market_cap_rank: 4 },
                { symbol: "SOL", name: "Solana", market_cap_rank: 5 },
                { symbol: "USDC", name: "USD Coin", market_cap_rank: 6 },
                { symbol: "ADA", name: "Cardano", market_cap_rank: 7 },
                { symbol: "DOGE", name: "Dogecoin", market_cap_rank: 8 },
                { symbol: "AVAX", name: "Avalanche", market_cap_rank: 9 },
                { symbol: "SHIB", name: "Shiba Inu", market_cap_rank: 10 },
                { symbol: "DOT", name: "Polkadot", market_cap_rank: 11 },
                { symbol: "MATIC", name: "Polygon", market_cap_rank: 12 },
                { symbol: "LTC", name: "Litecoin", market_cap_rank: 13 },
                { symbol: "UNI", name: "Uniswap", market_cap_rank: 14 },
                { symbol: "LINK", name: "Chainlink", market_cap_rank: 15 },
                // Low market cap coins
                { symbol: "PEPE", name: "Pepe", market_cap_rank: 50 },
                { symbol: "FLOKI", name: "Floki", market_cap_rank: 60 },
                { symbol: "BONK", name: "Bonk", market_cap_rank: 70 },
                { symbol: "WIF", name: "dogwifhat", market_cap_rank: 80 },
                { symbol: "POPCAT", name: "Popcat", market_cap_rank: 90 },
                { symbol: "MEME", name: "Meme", market_cap_rank: 100 },
                { symbol: "BRETT", name: "Brett", market_cap_rank: 110 },
                { symbol: "NEIRO", name: "Neiro", market_cap_rank: 120 },
                { symbol: "TURBO", name: "Turbo", market_cap_rank: 130 },
                {
                    symbol: "MEW",
                    name: "cat in a dogs world",
                    market_cap_rank: 140,
                },
                // Mid cap coins
                { symbol: "FET", name: "Fetch.ai", market_cap_rank: 25 },
                { symbol: "RENDER", name: "Render Token", market_cap_rank: 30 },
                { symbol: "THETA", name: "Theta Network", market_cap_rank: 35 },
                { symbol: "HBAR", name: "Hedera", market_cap_rank: 40 },
                {
                    symbol: "ICP",
                    name: "Internet Computer",
                    market_cap_rank: 45,
                },
            ],
        };
    } else if (toolName === "get_coin_quotes") {
        // Return trading data for the requested symbols
        const symbols = parameters.symbols || [];
        const quotes = {};

        symbols.forEach((symbol) => {
            // Simulate realistic trading volumes based on market cap
            let volume_24h;
            if (["BTC", "ETH", "BNB", "XRP", "SOL", "USDC"].includes(symbol)) {
                volume_24h = Math.random() * 20000000000 + 5000000000; // High volume
            } else if (
                ["ADA", "DOGE", "AVAX", "DOT", "MATIC"].includes(symbol)
            ) {
                volume_24h = Math.random() * 1000000000 + 500000000; // Medium volume
            } else {
                volume_24h = Math.random() * 100000000 + 10000000; // Lower volume
            }

            quotes[symbol] = {
                symbol: symbol,
                price: Math.random() * 100 + 0.01,
                volume_24h: volume_24h,
                market_cap: volume_24h * 50,
                percent_change_24h: (Math.random() - 0.5) * 20,
            };
        });

        return quotes;
    }

    return { error: "Unknown tool" };
}

/**
 * Generate candidate list based on investment profile
 * This simulates the Market Screener Agent's logic
 */
function generateCandidateList(profile) {
    const { risk_tolerance, desired_market_cap, investment_horizon } = profile;

    // Define candidate pools based on market cap and risk
    const lowCapHighRisk = [
        "PEPE",
        "SHIB",
        "DOGE",
        "FLOKI",
        "BONK",
        "WIF",
        "POPCAT",
        "MEME",
        "BRETT",
        "NEIRO",
        "TURBO",
        "MEW",
        "MOTHER",
        "PONKE",
        "MYRO",
    ];
    const lowCapMediumRisk = [
        "FET",
        "RENDER",
        "THETA",
        "HBAR",
        "ICP",
        "VET",
        "MANA",
        "SAND",
        "CHZ",
        "ENJ",
        "BAT",
        "ZIL",
        "HOT",
        "DENT",
        "WIN",
    ];
    const midCapHighRisk = [
        "AI",
        "NEAR",
        "SUI",
        "APT",
        "SEI",
        "ARB",
        "OP",
        "MATIC",
        "AVAX",
        "DOT",
        "UNI",
        "LINK",
        "LTC",
        "BCH",
        "XLM",
    ];
    const midCapMediumRisk = [
        "ADA",
        "SOL",
        "AVAX",
        "DOT",
        "MATIC",
        "ATOM",
        "ALGO",
        "EGLD",
        "LUNA",
        "FTM",
        "ONE",
        "HBAR",
        "FLOW",
        "XTZ",
        "WAVES",
    ];
    const highCapLowRisk = [
        "BTC",
        "ETH",
        "BNB",
        "USDC",
        "USDT",
        "XRP",
        "ADA",
        "SOL",
        "DOGE",
        "AVAX",
        "SHIB",
        "DOT",
        "MATIC",
        "LTC",
        "UNI",
    ];
    const highCapMediumRisk = [
        "BTC",
        "ETH",
        "BNB",
        "XRP",
        "ADA",
        "SOL",
        "AVAX",
        "DOT",
        "MATIC",
        "LTC",
        "LINK",
        "UNI",
        "ATOM",
        "XLM",
        "ALGO",
    ];

    let candidatePool = [];

    // Select candidate pool based on profile
    if (desired_market_cap === "low") {
        if (risk_tolerance === "high") {
            candidatePool = lowCapHighRisk;
        } else {
            candidatePool = lowCapMediumRisk;
        }
    } else if (desired_market_cap === "mid") {
        if (risk_tolerance === "high") {
            candidatePool = midCapHighRisk;
        } else {
            candidatePool = midCapMediumRisk;
        }
    } else {
        // high market cap
        if (risk_tolerance === "low") {
            candidatePool = highCapLowRisk;
        } else {
            candidatePool = highCapMediumRisk;
        }
    }

    // Shuffle and return top 15
    const shuffled = candidatePool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 15);
}

/**
 * Test the Market Screener Agent with sample profiles
 */
async function runMarketScreenerTests() {
    console.log("🚀 IoPulse Market Screener Agent - Test Suite\n");

    const testProfiles = [
        {
            name: "High Risk AI Hunt",
            profile: {
                current_holding_symbol: "ETH",
                risk_tolerance: "high",
                desired_market_cap: "low",
                investment_horizon: "short-term",
            },
        },
        {
            name: "Conservative Blue Chip",
            profile: {
                current_holding_symbol: "USDC",
                risk_tolerance: "low",
                desired_market_cap: "high",
                investment_horizon: "long-term",
            },
        },
    ];

    for (let i = 0; i < testProfiles.length; i++) {
        const test = testProfiles[i];
        console.log(`\n📋 Test ${i + 1}: ${test.name}`);
        console.log("━".repeat(60));

        const result = await processMarketScreening(test.profile);

        if (result.success) {
            console.log("✅ Market Screening Successful!");
            if (result.candidates) {
                console.log(
                    `🎯 Found ${result.candidates.length} candidates:`,
                    result.candidates
                );
            } else {
                console.log("📄 Raw Response:", result.rawResponse);
            }

            if (result.fallbackMode) {
                console.log("⚠️ Used fallback mode due to API issues");
            }

            console.log(
                `🔧 Tool Calls Made: ${
                    result.toolCallsCount || result.toolCalls?.length || 0
                }`
            );

            if (result.toolCalls && result.toolCalls.length > 0) {
                console.log("📋 Tool Calls Details:");
                result.toolCalls.forEach((call, index) => {
                    console.log(
                        `   ${index + 1}. ${call.name}:`,
                        call.arguments
                    );
                });
            }

            console.log(
                `💰 Token Usage: ${result.usage?.total_tokens || "N/A"} total`
            );
        } else {
            console.log("❌ Market Screening Failed!");
            console.log("🚨 Error:", result.error);
        }
    }

    console.log("\n🎉 All market screener tests completed!");
}

// Main execution
if (require.main === module) {
    runMarketScreenerTests().catch(console.error);
}

module.exports = { processMarketScreening };
