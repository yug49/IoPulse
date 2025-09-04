#!/usr/bin/env node

/**
 * IoPulse Quantitative Analysis Agent
 *
 * This agent performs quantitative analysis on investment candidates.
 * No external tools - relies purely on AI model knowledge.
 */

const { ionetClient, MODELS } = require("../config/ionet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a quantitative crypto analyst. Your job is to analyze cryptocurrency candidates and assign quantitative scores.

IMPORTANT: You must respond with ONLY a JSON array. No explanations, no text, no reasoning - just the JSON array.

Input: Array of cryptocurrency symbols
Output: JSON array with quantitative analysis for each coin

Required output format for each coin:
{
  "symbol": "BTC",
  "90d_change": -15.2,
  "30d_change": 8.5,
  "24h_change": -2.1,
  "quant_score": 7.2
}

Use your knowledge of cryptocurrency markets to provide realistic price changes and assign quantitative scores (0-10) based on:
- Technical indicators
- Market momentum  
- Volume patterns
- Price action
- Market sentiment

The quant_score should reflect the overall quantitative attractiveness of the investment (10 = excellent, 0 = poor).`;

/**
 * Process candidates using the Quantitative Analysis Agent
 * @param {Array} candidates - Array of cryptocurrency symbols
 * @returns {Object} - Result with quantitative analysis
 */
async function processQuantitativeAnalysis(candidates) {
    console.log("📈 Starting Quantitative Analysis...");
    console.log("🎯 Input Candidates:", JSON.stringify(candidates, null, 2));

    try {
        console.log("📤 Sending request to Quantitative Analysis Agent...");

        // Make API call using OpenAI client
        const response = await ionetClient.chat.completions.create({
            model: MODELS.FAST,
            messages: [
                {
                    role: "system",
                    content: AGENT_INSTRUCTIONS,
                },
                {
                    role: "user",
                    content: `Analyze these cryptocurrency candidates and return ONLY a JSON array with quantitative analysis for each:

Candidates: ${JSON.stringify(candidates)}`,
                },
            ],
            temperature: 0.1,
            max_tokens: 2000,
        });

        console.log("✅ Quantitative Analysis API call successful!");

        // Extract final response
        const finalChoice = response.choices[0];
        const agentResponse = finalChoice.message.content;

        console.log("📋 Final Agent Response:", agentResponse);

        let quantAnalysis = null;

        // Try to parse the final response as JSON array
        if (agentResponse) {
            try {
                const analysisResult = JSON.parse(agentResponse.trim());
                if (Array.isArray(analysisResult)) {
                    quantAnalysis = analysisResult;
                }
            } catch (parseError) {
                // If not direct JSON, look for JSON array in the text
                const jsonMatch = agentResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        quantAnalysis = JSON.parse(jsonMatch[0]);
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
            analysis: quantAnalysis,
            toolCalls: [], // No tool calls used
            toolCallsCount: 0,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Quantitative Analysis Error:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

// Test data
const testCandidates = [
    {
        name: "Top 3 Market Leaders",
        candidates: ["BTC", "ETH", "SOL"],
    },
    {
        name: "Analyzing 4 candidates",
        candidates: ["PEPE", "SHIB", "DOGE", "FLOKI"],
    },
    {
        name: "Analyzing 5 candidates",
        candidates: ["ADA", "DOT", "MATIC", "AVAX", "UNI"],
    },
];

/**
 * Run test suite for Quantitative Analysis Agent
 */
async function runTests() {
    console.log("🚀 IoPulse Quantitative Analysis Agent - Test Suite\n");

    for (let i = 0; i < testCandidates.length; i++) {
        const test = testCandidates[i];
        console.log(`📋 Test ${i + 1}: ${test.name}`);
        console.log("━".repeat(70));
        console.log(`🎯 Candidates: ${test.candidates.join(", ")}`);

        const result = await processQuantitativeAnalysis(test.candidates);

        if (result.success) {
            console.log("✅ Quantitative Analysis Successful!");
            console.log("📊 Analysis Results:");
            result.analysis.forEach((coin) => {
                console.log(
                    `  ${coin.symbol}: Score ${coin.quant_score}/10 (90d: ${coin["90d_change"]}%, 30d: ${coin["30d_change"]}%, 24h: ${coin["24h_change"]}%)`
                );
            });
            console.log(`💰 Token Usage: ${result.usage.total_tokens} total`);
        } else {
            console.log("❌ Quantitative Analysis Failed!");
            console.log("🚨 Error:", result.error);
        }

        // Wait between tests
        if (i < testCandidates.length - 1) {
            console.log("\n⏳ Waiting 2 seconds before next test...\n");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    console.log("\n🎉 All quantitative analysis tests completed!");
}

// Main execution
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { processQuantitativeAnalysis };
