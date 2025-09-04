#!/usr/bin/env node

/**
 * IoPulse Investment Committee Agent
 *
 * This agent synthesizes all data into a single, actionable investment recommendation.
 * It selects the best coin based on quantitative and qualitative scores.
 */

const { ionetClient, MODELS } = require("../config/ionet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Configuration - Using a more reliable model for JSON output
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are an investment committee making final decisions. You will analyze cryptocurrency data and return ONLY a JSON response.

CRITICAL RULES:
1. Your response must be ONLY valid JSON
2. NO explanations, reasoning, or other text outside the JSON
3. NO markdown code blocks
4. Start with { and end with }

ANALYSIS PROCESS:
- Compare the user's current token performance against alternatives
- Select the best action: hold current position or swap to better alternative
- For swaps: choose coin with best combined quant_score + qualitative_score

REQUIRED JSON FORMAT:
{
  "recommendation": "Swap [Current] for [New] and hold for [period]" OR "Don't swap anything and hold [Current] for more [period]",
  "explanation": "Brief reason for decision"
}

EXAMPLES:
{"recommendation": "Swap ETH for RENDER and hold for 2-4 weeks", "explanation": "RENDER shows superior combined scores"}
{"recommendation": "Don't swap anything and hold ETH for more 1-2 weeks", "explanation": "ETH remains competitive"}`;

/**
 * Process final analysis to make investment recommendation using Investment Committee Agent
 * @param {Array} finalAnalysis - Array of coins with both quantitative and qualitative scores
 * @param {string} userToken - User's current token symbol
 * @param {Object} previousRecommendation - Previous recommendation with timestamp (optional)
 * @returns {Object} - Result with final investment recommendation
 */
async function processInvestmentCommittee(
    finalAnalysis,
    userToken = "ETH",
    previousRecommendation = null
) {
    console.log("🏛️ Starting Investment Committee Decision...");
    console.log(
        "📊 Input Final Analysis:",
        JSON.stringify(finalAnalysis, null, 2)
    );
    console.log("💰 User's Current Token:", userToken);

    if (previousRecommendation) {
        console.log(
            "📝 Previous Recommendation:",
            JSON.stringify(previousRecommendation, null, 2)
        );
        const timeElapsed = Date.now() - previousRecommendation.timestamp;
        const hoursElapsed = Math.round(timeElapsed / (1000 * 60 * 60));
        console.log(
            `⏰ Time since previous recommendation: ${hoursElapsed} hours`
        );
    }

    // Find user's current holding performance for comparison
    const userCurrentHoldingAnalysis = finalAnalysis.find(
        (coin) => coin.symbol === userToken
    );
    if (userCurrentHoldingAnalysis) {
        console.log(
            `💼 User's current holding performance: ${userToken} - Quant ${
                userCurrentHoldingAnalysis.quant_score
            }/10, Qual ${
                userCurrentHoldingAnalysis.qualitative_score || "N/A"
            }/10`
        );
    }

    // Find coins with both scores for analysis
    const coinsWithBothScores = finalAnalysis.filter(
        (coin) =>
            coin.qualitative_score !== undefined &&
            coin.quant_score !== undefined
    );

    console.log(
        `🎯 Analyzing ${coinsWithBothScores.length} coins with both quantitative and qualitative scores`
    );
    coinsWithBothScores.forEach((coin) => {
        console.log(
            `  📊 ${coin.symbol}: Quant ${coin.quant_score}/10, Qual ${coin.qualitative_score}/10`
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
                content: `RESPOND WITH ONLY JSON. NO TEXT OUTSIDE JSON.

Current token: ${userToken}
${
    previousRecommendation
        ? `Previous: ${JSON.stringify(previousRecommendation)}`
        : "No previous recommendation"
}

Analysis data: ${JSON.stringify(finalAnalysis)}

Required JSON format:
{"recommendation": "Swap X for Y and hold for Z" or "Don't swap anything and hold X for more Z", "explanation": "reason"}

RESPOND WITH ONLY THE JSON OBJECT:`,
            },
        ],
        temperature: 0.0, // Reduced for more consistent output
        max_tokens: 200, // Reduced to encourage concise JSON responses
    };

    try {
        console.log("📤 Sending request to Investment Committee Agent...");

        const response = await ionetClient.chat.completions.create({
            model: requestPayload.model,
            messages: requestPayload.messages,
            temperature: requestPayload.temperature,
            max_tokens: requestPayload.max_tokens,
        });

        console.log("✅ Investment Committee API call successful!");

        // Extract final response - prioritize message content over reasoning
        const finalChoice = response.choices[0];
        let agentResponse = finalChoice.message.content;

        // If no content, fall back to reasoning content
        if (!agentResponse && finalChoice.message.reasoning_content) {
            agentResponse = finalChoice.message.reasoning_content;
        }

        console.log(
            "📋 Investment Committee Response:",
            agentResponse?.substring(0, 300)
        );

        let recommendation = null;

        // Try to parse the response as JSON
        if (agentResponse) {
            // Clean the response - remove any non-JSON text
            let cleanResponse = agentResponse.trim();

            // Look for JSON object in the response
            const jsonMatch = cleanResponse.match(
                /\{[^{}]*"recommendation"[^{}]*\}/
            );
            if (jsonMatch) {
                try {
                    const parsedJson = JSON.parse(jsonMatch[0]);
                    if (parsedJson && parsedJson.recommendation) {
                        recommendation = parsedJson;
                        console.log(
                            "✅ Successfully parsed JSON recommendation"
                        );
                    }
                } catch (parseError) {
                    console.log(
                        "⚠️ Failed to parse extracted JSON:",
                        parseError.message
                    );
                }
            } else {
                // Try parsing the entire response
                try {
                    const parsedJson = JSON.parse(cleanResponse);
                    if (parsedJson && parsedJson.recommendation) {
                        recommendation = parsedJson;
                        console.log(
                            "✅ Successfully parsed full JSON response"
                        );
                    }
                } catch (parseError) {
                    console.log(
                        "⚠️ Failed to parse full JSON:",
                        parseError.message
                    );
                }
            }
        }

        // If no valid recommendation found, return error
        if (!recommendation) {
            throw new Error(
                "Investment Committee Agent failed to generate valid recommendation format"
            );
        }

        return {
            success: true,
            recommendation: recommendation,
            rawResponse: agentResponse,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Investment Committee failed:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

/**

/**
 * Test the Investment Committee Agent with sample final analysis
 */
async function runInvestmentCommitteeTests() {
    console.log("🚀 IoPulse Investment Committee Agent - Test Suite\n");

    const testFinalAnalysis = [
        [
            {
                symbol: "BTC",
                quant_score: 4.6,
                qual_score: 5.2,
                recommendation: "HOLD",
            },
            {
                symbol: "ETH",
                quant_score: 6.33,
                qual_score: 7.1,
                recommendation: "BUY",
            },
        ],
    ];

    for (let i = 0; i < testFinalAnalysis.length; i++) {
        const test = testFinalAnalysis[i];
        console.log(`\n📋 Test ${i + 1}: Sample Final Analysis`);
        console.log("━".repeat(60));

        const result = await processInvestmentCommittee(test, "ETH", null);

        if (result.success) {
            console.log("✅ Investment Committee Decision Successful!");
            if (result.recommendation) {
                console.log(`🎯 Final Recommendation:`, result.recommendation);
            } else {
                console.log("📄 Raw Response:", result.rawResponse);
            }

            console.log(
                `💰 Token Usage: ${result.usage?.total_tokens || "N/A"} total`
            );
        } else {
            console.log("❌ Investment Committee Decision Failed!");
            console.log("🚨 Error:", result.error);
        }
    }

    console.log("\n🎉 All investment committee tests completed!");
}

// Main execution
if (require.main === module) {
    runInvestmentCommitteeTests().catch(console.error);
}

module.exports = { processInvestmentCommittee };
