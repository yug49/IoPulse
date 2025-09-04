#!/usr/bin/env node

/**
 * IoPulse Qualitative Due Diligence Agent
 *
 * This agent performs qualitative risk assessment on top-scoring candidates.
 * It checks for fundamental red flags using project info and web searches.
 */

const { ionetClient, MODELS, CRYPTO_TOOLS } = require('../config/ionet');
const { executeTool } = require('../utils/cryptoTools');
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a risk management analyst. Your input is the JSON array of quantitatively scored coins and the user's current holding symbol. Identify the top 5 coins with the highest "quant_score" AND include the user's current holding if it's not already in the top 5.

For these coins (top 5 + user's current holding if applicable), perform a qualitative check:
1. Use the \`get_coin_info\` tool to ensure the project has a description and official links.
2. Use the \`search_the_web\` tool to search for the coin's name plus terms like "exploit", "scam", "SEC", or "hack" from the last 90 days.
3. Based on your findings, assign a "Qualitative Score" out of 10. A clean project gets a 10. A project with major negative news gets a low score.

IMPORTANT: Always include the user's current holding in your analysis so they can compare it against alternatives.

Your output must be the JSON array from the previous step, but with the "qualitative_score" key added to each analyzed coin.`;

// Use crypto tools from ionet config
const TOOLS = CRYPTO_TOOLS;

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

    try {
        console.log("📤 Sending request to Qualitative Due Diligence Agent...");

        // Make initial API call
        let response = await ionetClient.chat.completions.create({
            model: MODEL_NAME,
            messages: requestPayload.messages,
            tools: requestPayload.tools,
            tool_choice: requestPayload.tool_choice,
            temperature: requestPayload.temperature,
            max_tokens: requestPayload.max_tokens,
        });

        console.log("✅ Qualitative Due Diligence API call successful!");

        let messages = [...requestPayload.messages];
        let toolCallsCount = 0;
        let allToolCalls = [];

        // Handle tool calls in a conversation loop
        while (
            response.choices[0].message.tool_calls &&
            response.choices[0].message.tool_calls.length > 0
        ) {
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
                tools: TOOLS,
                tool_choice: "auto",
                temperature: 0.1,
                max_tokens: 4000,
            };

            console.log(`📤 Continuing conversation with tool results...`);
            response = await ionetClient.chat.completions.create({
                model: continuePayload.model,
                messages: continuePayload.messages,
                tools: continuePayload.tools,
                tool_choice: continuePayload.tool_choice,
                temperature: continuePayload.temperature,
                max_tokens: continuePayload.max_tokens,
            });
        }

        // Extract final response
        const finalChoice = response.choices[0];
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
                        throw new Error(
                            `No valid JSON array found in response: ${agentResponse.substring(
                                0,
                                200
                            )}...`
                        );
                    }
                } else {
                    throw new Error(
                        `No JSON array found in response: ${agentResponse.substring(
                            0,
                            200
                        )}...`
                    );
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
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}


/**
 * Test the Qualitative Due Diligence Agent with sample quantitative analysis
 */
async function runQualitativeDueDiligenceTests() {
    console.log("🚀 IoPulse Qualitative Due Diligence Agent - Test Suite\n");

    const testQuantAnalysis = [
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
        ],
    ];

    for (let i = 0; i < testQuantAnalysis.length; i++) {
        const test = testQuantAnalysis[i];
        console.log(`\n📋 Test ${i + 1}: Sample Quantitative Analysis`);
        console.log("━".repeat(60));

        const result = await processQualitativeDueDiligence(test);

        if (result.success) {
            console.log("✅ Qualitative Due Diligence Successful!");
            if (result.analysis) {
                console.log(
                    `🎯 Analysis completed for ${result.analysis.length} candidates:`
                );
                result.analysis.forEach((candidate, index) => {
                    console.log(
                        `   ${index + 1}. ${candidate.symbol}: Score ${candidate.qual_score}, Recommendation: ${candidate.recommendation}`
                    );
                });
            } else {
                console.log("📄 Raw Response:", result.rawResponse);
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
                `�� Token Usage: ${result.usage?.total_tokens || "N/A"} total`
            );
        } else {
            console.log("❌ Qualitative Due Diligence Failed!");
            console.log("🚨 Error:", result.error);
        }
    }

    console.log("\n🎉 All qualitative due diligence tests completed!");
}

// Main execution
if (require.main === module) {
    runQualitativeDueDiligenceTests().catch(console.error);
}

module.exports = { processQualitativeDueDiligence };
