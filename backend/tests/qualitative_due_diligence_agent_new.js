#!/usr/bin/env node

/**
 * IoPulse Qualitative Due Diligence Agent
 *
 * This agent performs qualitative risk assessment on top-scoring candidates.
 * No external tools - relies purely on AI model knowledge.
 */

const { ionetClient, MODELS } = require("../config/ionet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a risk management analyst. Your input is the JSON array of quantitatively scored coins and the user's current holding symbol. Identify the top 5 coins with the highest "quant_score" AND include the user's current holding if it's not already in the top 5.

For these coins (top 5 + user's current holding if applicable), perform a qualitative risk assessment using your knowledge of:
1. Project fundamentals and reputation
2. Recent security issues or exploits
3. Regulatory concerns  
4. Market sentiment and news
5. Development activity and team credibility

IMPORTANT: You must respond with ONLY a JSON array. No explanations, no text, no reasoning - just the JSON array.

Based on your assessment, assign a "qualitative_score" out of 10. A clean, reputable project gets a 10. A project with major concerns gets a low score.

Required output format:
[
  {
    "symbol": "BTC",
    "90d_change": -15.2,
    "30d_change": 8.5, 
    "24h_change": -2.1,
    "quant_score": 7.2,
    "qualitative_score": 9.5
  }
]

IMPORTANT: Always include the user's current holding in your analysis so they can compare it against alternatives.`;

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

    try {
        console.log("📤 Sending request to Qualitative Due Diligence Agent...");

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
                    content: `Please perform qualitative due diligence on these quantitatively analyzed coins: ${JSON.stringify(
                        quantAnalysis
                    )}. Focus on the top 5 by quant_score and assess security, regulatory, and reputation risks. User's current holding: ${
                        userCurrentHolding || "None"
                    }`,
                },
            ],
            temperature: 0.1,
            max_tokens: 4000,
        });

        console.log("✅ Qualitative Due Diligence API call successful!");

        // Extract final response
        const finalChoice = response.choices[0];
        const agentResponse = finalChoice.message.content;

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
            toolCalls: [], // No tool calls used
            toolCallsCount: 0,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Qualitative Due Diligence Error:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

// Test data
const testData = [
    {
        name: "Sample Quantitative Analysis",
        analysis: [
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
        userHolding: null,
    },
];

/**
 * Run test suite for Qualitative Due Diligence Agent
 */
async function runTests() {
    console.log("🚀 IoPulse Qualitative Due Diligence Agent - Test Suite\n");

    for (let i = 0; i < testData.length; i++) {
        const test = testData[i];
        console.log(`📋 Test ${i + 1}: ${test.name}`);
        console.log("━".repeat(70));

        const result = await processQualitativeDueDiligence(
            test.analysis,
            test.userHolding
        );

        if (result.success) {
            console.log("✅ Qualitative Due Diligence Successful!");
            console.log("📊 Final Analysis with Qualitative Scores:");
            result.analysis.forEach((coin) => {
                console.log(
                    `  ${coin.symbol}: Quant ${coin.quant_score}/10, Qual ${coin.qualitative_score}/10`
                );
            });
            console.log(`💰 Token Usage: ${result.usage.total_tokens} total`);
        } else {
            console.log("❌ Qualitative Due Diligence Failed!");
            console.log("🚨 Error:", result.error);
        }
    }

    console.log("\n🎉 All qualitative due diligence tests completed!");
}

// Main execution
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { processQualitativeDueDiligence };
