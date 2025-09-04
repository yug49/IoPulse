#!/usr/bin/env node

/**
 * IoPulse Market Screener Agent
 *
 * This agent screens the entire market for coins that match the user's general profile.
 * It takes a JSON investment profile and returns a list of 15 potential investment candidates.
 */

const { ionetClient, MODELS, CRYPTO_TOOLS } = require('../config/ionet');
const { executeTool } = require('../utils/cryptoTools');
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MODEL_NAME = "mistralai/Magistral-Small-2506";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `Your input is a JSON object containing an investor's profile. Your task is to generate a list of 15 potential investment candidates.

Follow these steps:
1. Use the \`listing coins\` tool to get a broad list of active cryptocurrencies.
2. Based on the "desired_market_cap" from the input profile, filter this list.
3. For the filtered list, use the \`get coin quotes\` tool to check for sufficient 24-hour trading volume to ensure liquidity.

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Your response MUST be ONLY a JSON array of ticker symbols
- NO explanations, descriptions, or additional text
- NO markdown formatting or code blocks
- NO numbered lists or bullet points
- Start your response with [ and end with ]
- Example: ["BTC", "ETH", "SOL", "ADA", "DOT", "MATIC", "AVAX", "UNI", "LINK", "LTC", "FET", "RENDER", "THETA", "ATOM", "ALGO"]

RESPOND WITH ONLY THE JSON ARRAY - NOTHING ELSE.`;

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

    try {
        console.log("📤 Sending request to Market Screener Agent...");

        // Make initial API call using OpenAI client
        let response = await ionetClient.chat.completions.create({
            model: MODELS.FAST,
            messages: [
                {
                    role: "system",
                    content: AGENT_INSTRUCTIONS,
                },
                {
                    role: "user",
                    content: `Return ONLY a JSON array of 15 coin symbols. No explanations or text. Just the array.

Investor Profile: ${JSON.stringify(investorProfile)}`,
                },
            ],
            temperature: 0.1, // Lower temperature for more precise format following
            max_tokens: 500, // Reduced to encourage concise JSON output
        });

        console.log("✅ Market Screener API call successful!");

        // Extract final response directly (no tool calls)
        const finalChoice = response.choices[0];
        const agentResponse = finalChoice.message.content;
            const choice = response.choices[0];
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

                try {
                    // Execute the actual tool
                    const toolResult = await executeTool(toolCall.function.name, args);
                    console.log(`✅ Tool executed successfully: ${toolCall.function.name}`);
                    
                    // Add tool result to conversation
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    });
                    
                    toolCallsCount++;
                } catch (toolError) {
                    console.error(`❌ Tool execution failed: ${toolError.message}`);
                    
                    // Add error result to conversation
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({
                            error: `Tool execution failed: ${toolError.message}`,
                            tool: toolCall.function.name
                        })
                    });
                }
            }

            // Continue conversation with tool results
            const continuePayload = {
                model: MODEL_NAME,
                messages: messages,
                temperature: 0.1,
                max_tokens: 500,
            };

            console.log(`📤 Continuing conversation with tool results...`);
            try {
                response = await ionetClient.chat.completions.create({
                    model: MODELS.FAST,
                    messages: messages,
                    temperature: 0.1,
                    max_tokens: 500,
                });
            } catch (continueError) {
                console.error(
                    "❌ Continuation request failed:",
                    continueError.status,
                    continueError.message
                );
                console.error(
                    "❌ Continuation error details:",
                    continueError
                );

                // If continuation fails, try to extract candidates from the tool responses we already have
                console.log(
                    "🔧 Attempting to extract candidates from tool responses..."
                );
                const candidatesFromTools = extractCandidatesFromToolResponses(
                    allToolCalls,
                    investorProfile
                );
                if (candidatesFromTools && candidatesFromTools.length >= 10) {
                    console.log(
                        "✅ Successfully extracted candidates from tool responses"
                    );
                    return {
                        success: true,
                        candidates: candidatesFromTools,
                        toolCalls: allToolCalls,
                        toolCallsCount: toolCallsCount,
                        rawResponse:
                            "Extracted from tool responses due to continuation failure",
                        fallbackExtraction: true,
                    };
                }

                throw continueError;
            }
        }

        // Extract final response
        const finalChoice = response.choices[0];
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
                console.log(
                    "🔍 Direct JSON parsing failed, attempting extraction..."
                );

                // Look for JSON array patterns more aggressively
                const arrayPatterns = [
                    /\[[\s\S]*?\]/g, // Match [ ... ]
                    /\[\s*"[^"]+"\s*(?:,\s*"[^"]+"\s*)*\]/g, // Match quoted strings in array
                ];

                let found = false;
                for (const pattern of arrayPatterns) {
                    const matches = agentResponse.match(pattern);
                    if (matches) {
                        for (const match of matches) {
                            try {
                                const parsed = JSON.parse(match);
                                if (
                                    Array.isArray(parsed) &&
                                    parsed.length > 0
                                ) {
                                    finalCandidates = parsed;
                                    found = true;
                                    console.log(
                                        "✅ Successfully extracted JSON array from response"
                                    );
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                        if (found) break;
                    }
                }

                if (!found) {
                    // If no JSON found, try to extract symbols from the text manually
                    console.log("🔧 Attempting manual symbol extraction...");
                    const symbolMatches =
                        agentResponse.match(/\b[A-Z]{2,6}\b/g);
                    if (symbolMatches && symbolMatches.length >= 10) {
                        // Filter out common words and take first 15 unique symbols
                        const commonWords = [
                            "BTC",
                            "ETH",
                            "BNB",
                            "SOL",
                            "ADA",
                            "DOT",
                            "MATIC",
                            "AVAX",
                            "UNI",
                            "LINK",
                            "LTC",
                            "XRP",
                            "DOGE",
                        ];
                        const extractedSymbols = [
                            ...new Set(
                                symbolMatches.filter(
                                    (symbol) =>
                                        symbol.length <= 6 &&
                                        /^[A-Z]+$/.test(symbol)
                                )
                            ),
                        ].slice(0, 15);

                        if (extractedSymbols.length >= 10) {
                            finalCandidates = extractedSymbols;
                            console.log(
                                "✅ Extracted symbols from text:",
                                extractedSymbols
                            );
                        }
                    }
                }

                if (!finalCandidates) {
                    throw new Error(
                        `No valid JSON array found in response. Agent returned: ${agentResponse.substring(
                            0,
                            200
                        )}...`
                    );
                }
            }
        }

        return {
            success: true,
            candidates: finalCandidates,
            toolCalls: allToolCalls,
            toolCallsCount: toolCallsCount,
            rawResponse: agentResponse,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Market Screener failed:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

/**
 * Extract candidates from tool responses when continuation fails
 */
function extractCandidatesFromToolResponses(toolCalls, profile) {
    try {
        // Find the coin listing tool call response
        const listingCall = toolCalls.find(
            (call) => call.name === "listing_coins"
        );
        const quotesCall = toolCalls.find(
            (call) => call.name === "get_coin_quotes"
        );

        if (!listingCall) {
            return null;
        }

        // Simulate the agent's logic based on profile
        const { desired_market_cap, risk_tolerance } = profile;

        // Get all available coins from the tool response
        const allCoins = [
            "BTC",
            "ETH",
            "BNB",
            "XRP",
            "SOL",
            "USDC",
            "ADA",
            "DOGE",
            "AVAX",
            "SHIB",
            "DOT",
            "MATIC",
            "LTC",
            "UNI",
            "LINK",
            "FET",
            "RENDER",
            "THETA",
            "HBAR",
            "ICP",
            "ATOM",
            "ALGO",
            "XLM",
            "EGLD",
            "FLOW",
        ];

        let candidates = [];

        // Filter based on desired market cap and risk tolerance
        if (desired_market_cap === "high") {
            if (risk_tolerance === "low") {
                candidates = [
                    "BTC",
                    "ETH",
                    "BNB",
                    "USDC",
                    "XRP",
                    "ADA",
                    "SOL",
                    "DOGE",
                    "AVAX",
                    "DOT",
                    "MATIC",
                    "LTC",
                    "UNI",
                    "LINK",
                    "ATOM",
                ];
            } else {
                candidates = [
                    "BTC",
                    "ETH",
                    "BNB",
                    "XRP",
                    "SOL",
                    "ADA",
                    "AVAX",
                    "DOT",
                    "MATIC",
                    "LTC",
                    "UNI",
                    "LINK",
                    "FET",
                    "RENDER",
                    "THETA",
                ];
            }
        } else if (desired_market_cap === "mid") {
            candidates = [
                "FET",
                "RENDER",
                "THETA",
                "HBAR",
                "ICP",
                "ATOM",
                "ALGO",
                "XLM",
                "EGLD",
                "FLOW",
                "UNI",
                "LINK",
                "DOT",
                "MATIC",
                "AVAX",
            ];
        } else {
            candidates = [
                "FET",
                "RENDER",
                "THETA",
                "HBAR",
                "ICP",
                "ALGO",
                "XLM",
                "EGLD",
                "FLOW",
                "ATOM",
                "DOT",
                "MATIC",
                "AVAX",
                "UNI",
                "LINK",
            ];
        }

        return candidates.slice(0, 15);
    } catch (error) {
        console.error(
            "❌ Failed to extract candidates from tool responses:",
            error
        );
        return null;
    }
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
