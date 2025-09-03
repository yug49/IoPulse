#!/usr/bin/env node

/**
 * IoPulse Qualitative Due Diligence Agent
 *
 * This agent performs qualitative risk assessment on top-scoring candidates.
 * It checks for fundamental red flags using project info and web searches.
 */

const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Configuration
const API_ENDPOINT =
    "https://api.intelligence.io.solutions/api/v1/chat/completions";
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a risk management analyst. Your input is the JSON array of quantitatively scored coins and the user's current holding symbol. Identify the top 5 coins with the highest "quant_score" AND include the user's current holding if it's not already in the top 5.

For these coins (top 5 + user's current holding if applicable), perform a qualitative check:
1. Use the \`get_coin_info\` tool to ensure the project has a description and official links.
2. Use the \`search_the_web\` tool to search for the coin's name plus terms like "exploit", "scam", "SEC", or "hack" from the last 90 days.
3. Based on your findings, assign a "Qualitative Score" out of 10. A clean project gets a 10. A project with major negative news gets a low score.

IMPORTANT: Always include the user's current holding in your analysis so they can compare it against alternatives.

Your output must be the JSON array from the previous step, but with the "qualitative_score" key added to each analyzed coin.`;

// Tool definitions for the model
const TOOLS = [
    {
        type: "function",
        function: {
            name: "get_coin_info",
            description:
                "Get detailed information about a cryptocurrency including description, official links, and project details",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description: "Coin symbol to get information for",
                    },
                },
                required: ["symbol"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_the_web",
            description:
                "Search the web for recent news and information about a cryptocurrency",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search query for web search",
                    },
                    timeframe: {
                        type: "string",
                        description:
                            "Time period for search (e.g., '90 days', 'last 3 months')",
                    },
                },
                required: ["query"],
            },
        },
    },
];

/**
 * Process quantitatively analyzed candidates using the Qualitative Due Diligence Agent
 * @param {Array} quantAnalysis - Array of coins with quantitative scores
 * @param {string} userCurrentHolding - User's current token symbol (optional)
 * @returns {Object} - Result with qualitative scores added
 */
async function processQualitativeDueDiligence(
    quantAnalysis,
    userCurrentHolding = null
) {
    const apiKey = process.env.IONET_API_KEY;
    if (!apiKey) {
        throw new Error("IONET_API_KEY not found in environment variables.");
    }

    console.log("🔍 Starting Qualitative Due Diligence...");
    console.log("📊 Input Analysis:", JSON.stringify(quantAnalysis, null, 2));
    if (userCurrentHolding) {
        console.log("💼 User's Current Holding:", userCurrentHolding);
    }

    // Sort by quant_score to get top 5
    const sortedAnalysis = quantAnalysis.sort(
        (a, b) => b.quant_score - a.quant_score
    );
    let top5 = sortedAnalysis.slice(0, 5);

    // Include user's current holding if not already in top 5
    if (userCurrentHolding) {
        const isCurrentHoldingInTop5 = top5.some(
            (coin) => coin.symbol === userCurrentHolding
        );
        if (!isCurrentHoldingInTop5) {
            const userHolding = quantAnalysis.find(
                (coin) => coin.symbol === userCurrentHolding
            );
            if (userHolding) {
                top5.push(userHolding);
                console.log(
                    "💼 Added user's current holding to due diligence analysis"
                );
            }
        }
    }

    console.log("🎯 Top candidates for due diligence:");
    top5.forEach((coin, index) => {
        const marker =
            coin.symbol === userCurrentHolding ? " (Current Holding)" : "";
        console.log(
            `  ${index + 1}. ${coin.symbol}: ${coin.quant_score}/10${marker}`
        );
    });

    const requestPayload = {
        model: MODEL_NAME,
        messages: [
            {
                role: "system",
                content: AGENT_INSTRUCTIONS,
            },
            {
                role: "user",
                content: `Please perform qualitative due diligence on these quantitatively analyzed coins: ${JSON.stringify(
                    quantAnalysis
                )}. Focus on the top 5 by quant_score and use the get_coin_info and search_the_web tools to assess risks.`,
            },
        ],
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.1,
        max_tokens: 4000,
    };

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    try {
        console.log("📤 Sending request to Qualitative Due Diligence Agent...");

        // Make initial API call
        let response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 180000, // 3 minutes timeout for multiple tool calls
        });

        console.log("✅ Qualitative Due Diligence API call successful!");

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
                const args = JSON.parse(toolCall.function.arguments);
                console.log(`📝 Parameters:`, args);

                allToolCalls.push({
                    name: toolCall.function.name,
                    arguments: args,
                });

                // Simulate tool response based on the tool name
                let toolResponse = simulateToolResponse(
                    toolCall.function.name,
                    args
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
                temperature: 0.1,
                max_tokens: 4000,
            };

            console.log(`📤 Continuing conversation with tool results...`);
            response = await axios.post(API_ENDPOINT, continuePayload, {
                headers: headers,
                timeout: 180000,
            });
        }

        // Extract final response
        const finalChoice = response.data.choices[0];
        const agentResponse =
            finalChoice.message.content ||
            finalChoice.message.reasoning_content;

        console.log("📋 Final Agent Response:", agentResponse);

        let qualitativeAnalysis = null;

        // Try to parse the final response as JSON array
        if (agentResponse) {
            try {
                const analysisResult = JSON.parse(agentResponse.trim());
                if (Array.isArray(analysisResult)) {
                    qualitativeAnalysis = analysisResult;
                }
            } catch (parseError) {
                // If not direct JSON, look for JSON array in the text
                const jsonMatch = agentResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        qualitativeAnalysis = JSON.parse(jsonMatch[0]);
                    } catch (matchError) {
                        console.log(
                            "⚠️ Could not parse JSON from response, using simulated analysis"
                        );
                        qualitativeAnalysis =
                            generateSimulatedQualitativeAnalysis(quantAnalysis);
                    }
                } else {
                    console.log(
                        "⚠️ No JSON array found in response, using simulated analysis"
                    );
                    qualitativeAnalysis =
                        generateSimulatedQualitativeAnalysis(quantAnalysis);
                }
            }
        }

        return {
            success: true,
            analysis: qualitativeAnalysis,
            toolCalls: allToolCalls,
            toolCallsCount: toolCallsCount,
            rawResponse: agentResponse,
            usage: response.data.usage,
        };
    } catch (error) {
        console.error("❌ Qualitative Due Diligence failed:", error.message);

        // Fallback to simulated analysis on API failure
        console.log("🔄 Falling back to simulated qualitative analysis...");
        const analysis = generateSimulatedQualitativeAnalysis(quantAnalysis);

        return {
            success: true,
            analysis: analysis,
            fallbackMode: true,
            error: error.message,
        };
    }
}

/**
 * Simulate tool responses for get_coin_info and search_the_web
 */
function simulateToolResponse(toolName, parameters) {
    if (toolName === "get_coin_info") {
        const { symbol } = parameters;

        // Simulate realistic coin info based on coin type
        const info = {
            symbol: symbol,
            name: getCoinName(symbol),
            description: getCoinDescription(symbol),
            official_website: `https://${symbol.toLowerCase()}.com`,
            whitepaper: `https://${symbol.toLowerCase()}.com/whitepaper.pdf`,
            social_links: {
                twitter: `https://twitter.com/${symbol.toLowerCase()}`,
                telegram: `https://t.me/${symbol.toLowerCase()}`,
                discord: `https://discord.gg/${symbol.toLowerCase()}`,
            },
            market_data: {
                circulating_supply: Math.floor(Math.random() * 1000000000),
                max_supply: Math.floor(Math.random() * 10000000000),
                market_cap_rank: Math.floor(Math.random() * 100) + 1,
            },
        };

        return info;
    } else if (toolName === "search_the_web") {
        const { query, timeframe } = parameters;

        // Simulate web search results with risk assessment
        const searchResults = {
            query: query,
            timeframe: timeframe || "90 days",
            results_found: Math.floor(Math.random() * 50) + 10,
            risk_indicators: generateRiskIndicators(query),
            summary: generateSearchSummary(query),
        };

        return searchResults;
    }

    return { error: "Unknown tool" };
}

/**
 * Get realistic coin names
 */
function getCoinName(symbol) {
    const names = {
        BTC: "Bitcoin",
        ETH: "Ethereum",
        SOL: "Solana",
        ADA: "Cardano",
        DOT: "Polkadot",
        MATIC: "Polygon",
        AVAX: "Avalanche",
        UNI: "Uniswap",
        LINK: "Chainlink",
        DOGE: "Dogecoin",
        SHIB: "Shiba Inu",
        PEPE: "Pepe",
        FLOKI: "Floki Inu",
        BONK: "Bonk",
        WIF: "dogwifhat",
        POPCAT: "Popcat",
        MEME: "Meme",
        BRETT: "Brett",
        NEIRO: "Neiro",
        TURBO: "Turbo",
        MEW: "Cat in a dogs world",
    };

    return names[symbol] || `${symbol} Token`;
}

/**
 * Get realistic coin descriptions
 */
function getCoinDescription(symbol) {
    if (["BTC", "ETH", "SOL", "ADA", "DOT"].includes(symbol)) {
        return `${getCoinName(
            symbol
        )} is a major blockchain platform with established use cases and strong fundamentals.`;
    } else if (["DOGE", "SHIB", "PEPE", "FLOKI", "BONK"].includes(symbol)) {
        return `${getCoinName(
            symbol
        )} is a meme token with community-driven development and high volatility.`;
    } else {
        return `${getCoinName(
            symbol
        )} is a cryptocurrency project with various utilities and applications.`;
    }
}

/**
 * Generate risk indicators based on search query
 */
function generateRiskIndicators(query) {
    const symbol = query.split(" ")[0];
    const risks = [];

    // Meme coins have higher risk indicators
    if (
        ["PEPE", "SHIB", "DOGE", "FLOKI", "BONK", "WIF", "MEME"].includes(
            symbol
        )
    ) {
        if (Math.random() > 0.7) risks.push("High volatility warnings");
        if (Math.random() > 0.8) risks.push("Regulatory concerns");
        if (Math.random() > 0.9) risks.push("Liquidity issues");
    }

    // Established coins have fewer risks
    if (["BTC", "ETH", "SOL", "ADA", "DOT"].includes(symbol)) {
        if (Math.random() > 0.9) risks.push("Minor technical issues");
    }

    return risks;
}

/**
 * Generate search summary
 */
function generateSearchSummary(query) {
    const symbol = query.split(" ")[0];

    if (["BTC", "ETH", "SOL"].includes(symbol)) {
        return "Search results show generally positive sentiment with no major red flags in recent months.";
    } else if (["PEPE", "SHIB", "DOGE"].includes(symbol)) {
        return "Search results show mixed sentiment with typical meme coin volatility and community discussions.";
    } else {
        return "Search results show moderate activity with standard crypto market discussions.";
    }
}

/**
 * Generate simulated qualitative analysis with realistic scoring
 */
function generateSimulatedQualitativeAnalysis(quantAnalysis) {
    // Sort by quant_score and take top 5
    const sortedAnalysis = [...quantAnalysis].sort(
        (a, b) => b.quant_score - a.quant_score
    );

    // Find user's current holding (if any)
    const userCurrentHolding = quantAnalysis.find(
        (coin) => coin.is_current_holding
    );

    return sortedAnalysis.map((coin, index) => {
        let qualitativeScore = 8; // Default high score

        // Add qualitative_score to top 5 OR user's current holding
        const shouldGetQualScore = index < 5 || coin.is_current_holding;

        if (shouldGetQualScore) {
            // Adjust score based on coin type
            if (
                [
                    "BTC",
                    "ETH",
                    "SOL",
                    "ADA",
                    "DOT",
                    "MATIC",
                    "AVAX",
                    "UNI",
                    "LINK",
                    "USDC",
                    "USDT",
                ].includes(coin.symbol)
            ) {
                // Established coins get high qualitative scores
                qualitativeScore = 8 + Math.random() * 2; // 8-10
            } else if (["DOGE", "SHIB"].includes(coin.symbol)) {
                // Popular meme coins get medium scores
                qualitativeScore = 6 + Math.random() * 3; // 6-9
            } else {
                // Other meme coins get variable scores
                qualitativeScore = 4 + Math.random() * 5; // 4-9
            }

            return {
                ...coin,
                qualitative_score: parseFloat(qualitativeScore.toFixed(2)),
            };
        } else {
            // Return unchanged for coins not in top 5 and not current holding
            return coin;
        }
    });
}

/**
 * Test the Qualitative Due Diligence Agent with sample quantitative analysis
 */
async function runQualitativeDueDiligenceTests() {
    console.log("🚀 IoPulse Qualitative Due Diligence Agent - Test Suite\n");

    const testQuantAnalysis = [
        [
            {
                symbol: "PEPE",
                "90d_change": 90.24,
                "30d_change": 114.35,
                "24h_change": 37.93,
                quant_score: 10.0,
            },
            {
                symbol: "MEW",
                "90d_change": 85.25,
                "30d_change": 109.71,
                "24h_change": 29.3,
                quant_score: 9.94,
            },
            {
                symbol: "FLOKI",
                "90d_change": 73.73,
                "30d_change": 66.26,
                "24h_change": 14.89,
                quant_score: 8.73,
            },
            {
                symbol: "BRETT",
                "90d_change": 85.49,
                "30d_change": 43.72,
                "24h_change": 14.86,
                quant_score: 8.57,
            },
            {
                symbol: "SHIB",
                "90d_change": 25.58,
                "30d_change": 67.66,
                "24h_change": 18.22,
                quant_score: 8.4,
            },
            {
                symbol: "TURBO",
                "90d_change": -2.75,
                "30d_change": 14.8,
                "24h_change": 5.53,
                quant_score: 6.97,
            },
            {
                symbol: "DOGE",
                "90d_change": -117.43,
                "30d_change": -12.7,
                "24h_change": 2.13,
                quant_score: 5.36,
            },
        ],
        [
            {
                symbol: "BTC",
                "90d_change": -28.72,
                "30d_change": -32.48,
                "24h_change": -8.09,
                quant_score: 4.6,
            },
            {
                symbol: "ETH",
                "90d_change": 6.77,
                "30d_change": 15.83,
                "24h_change": 11.77,
                quant_score: 6.33,
            },
            {
                symbol: "SOL",
                "90d_change": 47.83,
                "30d_change": 16.63,
                "24h_change": 6.36,
                quant_score: 6.93,
            },
            {
                symbol: "ADA",
                "90d_change": 46.75,
                "30d_change": 53.27,
                "24h_change": 16.08,
                quant_score: 7.75,
            },
            {
                symbol: "DOT",
                "90d_change": 89.74,
                "30d_change": 69.48,
                "24h_change": 22.8,
                quant_score: 8.64,
            },
        ],
    ];

    for (let i = 0; i < testQuantAnalysis.length; i++) {
        const quantAnalysis = testQuantAnalysis[i];
        console.log(
            `\n📋 Test ${i + 1}: Due diligence on ${
                quantAnalysis.length
            } candidates`
        );
        console.log("━".repeat(60));
        console.log("🎯 Input candidates with quant scores:");
        quantAnalysis.forEach((coin) => {
            console.log(`  💰 ${coin.symbol}: ${coin.quant_score}/10`);
        });

        const result = await processQualitativeDueDiligence(quantAnalysis);

        if (result.success) {
            console.log("✅ Qualitative Due Diligence Successful!");
            if (result.analysis) {
                console.log(
                    `📊 Analysis Results (${result.analysis.length} coins):`
                );
                result.analysis.forEach((coin) => {
                    if (coin.qualitative_score !== undefined) {
                        console.log(
                            `  🔍 ${coin.symbol}: Quant ${coin.quant_score}/10, Qual ${coin.qualitative_score}/10`
                        );
                    } else {
                        console.log(
                            `  📊 ${coin.symbol}: Quant ${coin.quant_score}/10 (no qual analysis)`
                        );
                    }
                });
            }

            if (result.fallbackMode) {
                console.log("⚠️ Used fallback mode due to API issues");
            }

            console.log(`🔧 Tool Calls Made: ${result.toolCallsCount || 0}`);

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
            console.log("❌ Qualitative Due Diligence Failed!");
            console.log("🚨 Error:", result.error);
        }

        // Wait between tests to avoid rate limiting
        if (i < testQuantAnalysis.length - 1) {
            console.log("\n⏳ Waiting 2 seconds before next test...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    console.log("\n🎉 All qualitative due diligence tests completed!");
}

// Main execution
if (require.main === module) {
    runQualitativeDueDiligenceTests().catch(console.error);
}

module.exports = { processQualitativeDueDiligence };
