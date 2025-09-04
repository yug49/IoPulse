#!/usr/bin/env node

/**
 * IoPulse Quantitative Analysis Agent
 *
 * This agent performs rigorous quantitative analysis on investment candidates.
 * It analyzes historical and real-time price data to score each candidate.
 */

const { ionetClient, MODELS, CRYPTO_TOOLS } = require('../config/ionet');
const { executeTool } = require('../utils/cryptoTools');
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a quantitative analyst. Your input is a JSON array of coin symbols and the user's current holding symbol. For EACH symbol including the user's current holding, you must perform a rigorous quantitative analysis and generate a structured report.

For each coin (including the user's current holding), follow these steps:
1. Use the \`get_coin_quotes_historical\` tool to get the price data for the last 90 days.
2. From this data, calculate the 90-day price percentage change.
3. From this data, calculate the 30-day price percentage change.
4. Use the \`get_coin_quotes\` tool to get the latest 24-hour price percentage change.
5. Based on these three metrics (90d, 30d, 24h performance), calculate a weighted "Quant Score" out of 10. Give 50% weight to 90d, 30% to 30d, and 20% to 24h.

IMPORTANT: Include the user's current holding in your analysis so they can compare against their current position. You MUST use both tools (get_coin_quotes_historical and get_coin_quotes) for proper analysis. Start by calling these tools immediately.

Your final output must be a single JSON array of objects. Each object must contain: "symbol", "90d_change", "30d_change", "24h_change", and "quant_score".`;

/**
 * Process investment candidates using the Quantitative Analysis Agent
 * @param {Array} candidates - Array of coin symbols from market screener
 * @param {string} userCurrentHolding - User's current token symbol (optional)
 * @returns {Object} - Result with quantitative analysis scores
 */
async function processQuantitativeAnalysis(
    candidates,
    userCurrentHolding = null
) {
    const apiKey = process.env.IONET_API_KEY;
    if (!apiKey) {
        throw new Error("IONET_API_KEY not found in environment variables.");
    }

    console.log("📈 Starting Quantitative Analysis...");
    console.log("🎯 Input Candidates:", JSON.stringify(candidates, null, 2));
    if (userCurrentHolding) {
        console.log("💼 User's Current Holding:", userCurrentHolding);
    }

    // Include user's current holding in analysis if provided and not already in candidates
    let allSymbolsToAnalyze = [...candidates];
    if (userCurrentHolding && !candidates.includes(userCurrentHolding)) {
        allSymbolsToAnalyze.push(userCurrentHolding);
        console.log("➕ Added user's current holding to analysis");
    }

    console.log("📤 Sending request to Quantitative Analysis Agent...");

    try {
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
                    content: `Please perform rigorous quantitative analysis on these symbols including the user's current holding. Return ONLY a JSON array of analysis results.

Symbols to analyze: ${JSON.stringify(allSymbolsToAnalyze)}
User's current holding: ${userCurrentHolding || "None"}`,
                },
            ],
            tools: CRYPTO_TOOLS,
            tool_choice: "auto",
            temperature: 0.1,
            max_tokens: 4000,
        });

        console.log("✅ Quantitative Analysis API call successful!");

        let messages = [
            {
                role: "system",
                content: AGENT_INSTRUCTIONS,
            },
            {
                role: "user",
                content: `Please perform rigorous quantitative analysis on these symbols including the user's current holding. Return ONLY a JSON array of analysis results.

Symbols to analyze: ${JSON.stringify(allSymbolsToAnalyze)}
User's current holding: ${userCurrentHolding || "None"}`,
            },
        ];
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
                console.log("🔧 Tool call registered:", toolCall.function.name);

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

            // Continue conversation with tool results (this won't be reached due to error above)
            console.log(`📤 Continuing conversation with tool results...`);
            try {
                response = await ionetClient.chat.completions.create({
                    model: MODELS.FAST,
                    messages: messages,
                    tools: CRYPTO_TOOLS,
                    tool_choice: "auto",
                    temperature: 0.1,
                    max_tokens: 4000,
                });
            } catch (continueError) {
                console.error(
                    "❌ Continuation request failed:",
                    continueError.message
                );
                throw continueError;
            }
        }

        // Extract final response
        const finalChoice = response.choices[0];
        const agentResponse = finalChoice.message.content;

        console.log("📋 Final Quantitative Analysis Response:", agentResponse);

        let finalAnalysis = null;

        // Try to parse the final response as JSON array
        if (agentResponse) {
            try {
                const analysisResults = JSON.parse(agentResponse.trim());
                if (Array.isArray(analysisResults)) {
                    finalAnalysis = analysisResults;
                }
            } catch (parseError) {
                console.log(
                    "🔍 Direct JSON parsing failed, attempting extraction..."
                );

                // Look for JSON array patterns
                const arrayPattern = /\[[\s\S]*?\]/;
                const match = agentResponse.match(arrayPattern);

                if (match) {
                    try {
                        const extractedJson = JSON.parse(match[0]);
                        if (Array.isArray(extractedJson)) {
                            finalAnalysis = extractedJson;
                            console.log(
                                "✅ Successfully extracted analysis results from response"
                            );
                        }
                    } catch (extractError) {
                        console.log(
                            "❌ Failed to parse extracted JSON:",
                            extractError.message
                        );
                    }
                }

                if (!finalAnalysis) {
                    throw new Error(
                        `No JSON array found in quantitative analysis response: ${agentResponse.substring(0, 500)}...`
                    );
                }
            }
        }

        if (!finalAnalysis) {
            throw new Error("No analysis results received from agent");
        }

        return {
            success: true,
            analysis: finalAnalysis,
            toolCalls: allToolCalls,
            toolCallsCount: toolCallsCount,
            rawResponse: agentResponse,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Quantitative Analysis failed:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

// Test function
async function runQuantitativeAnalysisTests() {
    console.log("🚀 IoPulse Quantitative Analysis Agent - Test Suite\n");

    const testCandidateSets = [
        {
            name: "Top 3 Market Leaders",
            candidates: ["BTC", "ETH", "SOL"],
            userHolding: null,
        },
        {
            name: "Analyzing 4 candidates",
            candidates: ["PEPE", "SHIB", "DOGE", "FLOKI"],
            userHolding: null,
        },
        {
            name: "Analyzing 5 candidates",
            candidates: ["ADA", "DOT", "MATIC", "AVAX", "UNI"],
            userHolding: null,
        },
    ];

    for (let i = 0; i < testCandidateSets.length; i++) {
        const test = testCandidateSets[i];
        console.log(`\n📋 Test ${i + 1}: ${test.name}`);
        console.log("━".repeat(60));
        console.log(`🎯 Candidates: ${test.candidates.join(", ")}`);

        const result = await processQuantitativeAnalysis(test.candidates, test.userHolding);

        if (result.success) {
            console.log("✅ Quantitative Analysis Successful!");
            if (result.analysis) {
                console.log(`📊 Analysis Results (${result.analysis.length} coins):`);
                result.analysis.forEach((coin, index) => {
                    console.log(
                        `  💰 ${coin.symbol}: Score ${coin.quant_score}/10 (90d: ${coin["90d_change"]}%, 30d: ${coin["30d_change"]}%, 24h: ${coin["24h_change"]}%)`
                    );
                });
            } else {
                console.log("📄 Raw Response:", result.rawResponse);
            }

            if (result.simulatedMode) {
                console.log("🧠 Used simulated quantitative analysis");
            }

            console.log(
                `🔧 Tool Calls Made: ${
                    result.toolCallsCount || result.toolCalls?.length || 0
                }`
            );

            if (result.toolCalls && result.toolCalls.length > 0) {
                console.log("📋 Tools Used: None");
            }

            console.log(
                `💰 Token Usage: ${result.usage?.total_tokens || "N/A"} total`
            );
        } else {
            console.log("❌ Quantitative Analysis Failed!");
            console.log("🚨 Error:", result.error);
        }

        if (i < testCandidateSets.length - 1) {
            console.log("\n⏳ Waiting 2 seconds before next test...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    console.log("\n🎉 All quantitative analysis tests completed!");
}

// Main execution
if (require.main === module) {
    runQuantitativeAnalysisTests().catch(console.error);
}

module.exports = { processQuantitativeAnalysis };
