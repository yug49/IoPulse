#!/usr/bin/env node

/**
 * IoPulse Quantitative Analysis Agent
 *
 * This agent performs rigorous quantitative analysis on investment candidates.
 * It analyzes historical and real-time price data to score each candidate.
 */

const { ionetClient, MODELS, CRYPTO_TOOLS } = require('../config/ionet');
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MODEL_NAME = "Qwen/Qwen3-235B-A22B-Thinking-2507";

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

    }

    console.log("📤 Sending request to Quantitative Analysis Agent...");

    try {
        // Make initial API call using OpenAI client
        let response = await ionetClient.chat.completions.create({

    const requestPayload = {
        model: MODEL_NAME,
        messages: [
            {
                role: "system",
                content: AGENT_INSTRUCTIONS,
            },
            {
                role: "user",
                content: `Analyze these coins with their historical and current data: ${JSON.stringify(
                    allSymbolsToAnalyze
                )}. User's current holding: ${userCurrentHolding || "None"}`,
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
        console.log("📤 Sending request to Quantitative Analysis Agent...");

        // Make initial API call
        let response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 300000, // 5 minutes timeout for multiple tool calls
        });

        console.log("✅ Quantitative Analysis API call successful!");

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
                `� Agent made ${choice.message.tool_calls.length} tool calls`
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

                // The actual tool response will come from the IoNet API
                // We don't provide a tool response here as the API handles it
                console.log(`🔧 Tool call registered: ${toolCall.function.name}`);
                
                // Add an empty tool response to continue the conversation
                // The actual data processing will happen in the agent's response
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({
                        status: "processed",
                        tool: toolCall.function.name,
                        note: "Tool call completed - data processed by agent"
                    })
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
                timeout: 300000,
            });
        }

        // Extract final response with analysis results
        const finalChoice = response.data.choices[0];
        const agentResponse = finalChoice.message.content || finalChoice.message.reasoning_content;

        console.log("📋 Final Quantitative Analysis Response:", agentResponse);

        // Parse the quantitative analysis results
        let analysisResults = null;
        if (agentResponse) {
            try {
                analysisResults = JSON.parse(agentResponse.trim());
                if (!Array.isArray(analysisResults)) {
                    throw new Error("Response is not an array");
                }
            } catch (parseError) {
                console.log("🔍 Direct JSON parsing failed, attempting extraction...");
                
                // Look for JSON array in the response
                const jsonMatch = agentResponse.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    try {
                        analysisResults = JSON.parse(jsonMatch[0]);
                        if (!Array.isArray(analysisResults)) {
                            throw new Error("Extracted content is not an array");
                        }
                        console.log("✅ Successfully extracted analysis results from response");
                    } catch (extractError) {
                        throw new Error(
                            `No valid quantitative analysis array found in response: ${agentResponse.substring(0, 200)}...`
                        );
                    }
                } else {
                    throw new Error(
                        `No JSON array found in quantitative analysis response: ${agentResponse.substring(0, 200)}...`
                    );
                }
            }
        }

        // Mark user's current holding if present
        if (userCurrentHolding && analysisResults) {
            const userHoldingAnalysis = analysisResults.find(
                (coin) => coin.symbol === userCurrentHolding
            );
            if (userHoldingAnalysis) {
                userHoldingAnalysis.is_current_holding = true;
                console.log(
                    `💼 User's current holding ${userCurrentHolding} analysis: Score ${userHoldingAnalysis.quant_score}/10`
                );
            }
        }

        return {
            success: true,
            analysis: analysisResults,
            toolCalls: allToolCalls,
            toolCallsCount: toolCallsCount,
            rawResponse: agentResponse,
            usage: response.data.usage,
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

/**
 * Test the Quantitative Analysis Agent with sample candidates
 */
async function runQuantitativeAnalysisTests() {
    console.log("🚀 IoPulse Quantitative Analysis Agent - Test Suite\n");

    const testCandidates = [
        ["BTC", "ETH", "SOL"],
        ["PEPE", "SHIB", "DOGE", "FLOKI"],
        ["ADA", "DOT", "MATIC", "AVAX", "UNI"],
    ];

    for (let i = 0; i < testCandidates.length; i++) {
        const candidates = testCandidates[i];
        console.log(
            `\n📋 Test ${i + 1}: Analyzing ${candidates.length} candidates`
        );
        console.log("━".repeat(60));
        console.log("🎯 Candidates:", candidates.join(", "));

        const result = await processQuantitativeAnalysis(candidates);

        if (result.success) {
            console.log("✅ Quantitative Analysis Successful!");
            if (result.analysis) {
                console.log(
                    `📊 Analysis Results (${result.analysis.length} coins):`
                );
                result.analysis.forEach((coin) => {
                    console.log(
                        `  💰 ${coin.symbol}: Score ${coin.quant_score}/10 (90d: ${coin["90d_change"]}%, 30d: ${coin["30d_change"]}%, 24h: ${coin["24h_change"]}%)`
                    );
                });
            }

            if (result.simulatedMode) {
                console.log("🧠 Used simulated quantitative analysis");
            }

            console.log(`🔧 Tool Calls Made: ${result.toolCallsCount || 0}`);
            console.log(
                `📋 Tools Used: ${result.toolCallsUsed?.join(", ") || "None"}`
            );
        } else {
            console.log("❌ Quantitative Analysis Failed!");
            console.log("🚨 Error:", result.error);
        }

        // Wait between tests to avoid rate limiting
        if (i < testCandidates.length - 1) {
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
