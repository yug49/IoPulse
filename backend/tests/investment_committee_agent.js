#!/usr/bin/env node

/**
 * IoPulse Investment Committee Agent
 *
 * This agent synthesizes all data into a single, actionable investment recommendation.
 * It selects the best coin based on quantitative and qualitative scores.
 */

const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Configuration
const API_ENDPOINT =
    "https://api.intelligence.io.solutions/api/v1/chat/completions";
const MODEL_NAME = "Qwen/Qwen3-235B-A22B-Thinking-2507";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are the head of the investment committee. Your input is the final, fully-scored list of coins, the user's current token, and optionally their previous recommendation with timestamp.

CRITICAL - RESPOND WITH ONLY JSON:
- Your entire response must be ONLY the JSON object below
- NO explanations, reasoning, or any other text
- NO markdown formatting or code blocks
- NO text before or after the JSON
- Start your response with { and end with }
- Do not include any reasoning or thinking process in your response
- ONLY return the JSON object

ANALYSIS STEPS (think internally but do not output):
1. Consider the user's current holding performance vs alternatives.
2. If a previous recommendation exists, evaluate time elapsed and market changes.
3. Select the single best action: either maintain current position or swap to a better alternative.
4. For swaps, select the coin with the best combination of high "quant_score" and high "qualitative_score".

REQUIRED JSON FORMAT (your complete response - nothing else):
{
  "recommendation": "Swap [Current Token] for [Selected Token] and hold for [time period]" OR "Don't swap anything and hold [Current Token] for more [time period]",
  "explanation": "Brief explanation of the decision"
}

RECOMMENDATION FORMAT RULES (MUST BE EXACT):
- For swaps: "Swap ETH for RENDER and hold for 2-4 weeks"
- For holds: "Don't swap anything and hold ETH for more 1-2 weeks"
- Always include specific time periods (days/weeks/months)
- Use EXACT format shown above - no variations allowed
- The recommendation field must start with either "Swap" or "Don't swap anything"

EXAMPLE VALID RESPONSES (entire response):
{"recommendation": "Swap ETH for PEPE and hold for 2-4 weeks", "explanation": "PEPE shows superior combined scores"}
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
    const apiKey = process.env.IONET_API_KEY;
    if (!apiKey) {
        throw new Error("IONET_API_KEY not found in environment variables.");
    }

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
                content: `Return ONLY JSON. No explanations.

User's current token: ${userToken}
${
    previousRecommendation
        ? `Previous recommendation: ${JSON.stringify(previousRecommendation)}`
        : "No previous recommendation."
}

Coin analysis data: ${JSON.stringify(finalAnalysis)}

Return ONLY this JSON format:
{"recommendation": "Swap [token] for [token] and hold for [period]" or "Don't swap anything and hold [token] for more [period]", "explanation": "brief reason"}`,
            },
        ],
        temperature: 0.0, // Reduced for more consistent output
        max_tokens: 200, // Reduced to encourage concise JSON responses
    };

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    try {
        console.log("📤 Sending request to Investment Committee Agent...");

        const response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 120000, // 2 minutes timeout
        });

        console.log("✅ Investment Committee API call successful!");

        // Extract final response
        const finalChoice = response.data.choices[0];
        const agentResponse =
            finalChoice.message.content ||
            finalChoice.message.reasoning_content;
        const reasoningContent = finalChoice.message.reasoning_content;

        console.log("📋 Investment Committee Response:", agentResponse);
        if (reasoningContent) {
            console.log(
                "🧠 Committee Reasoning:",
                reasoningContent.substring(0, 500) + "..."
            );
        }

        let recommendation = null;

        // Try to parse the final response as JSON
        if (agentResponse) {
            try {
                const recommendationResult = JSON.parse(agentResponse.trim());
                if (
                    recommendationResult &&
                    recommendationResult.recommendation
                ) {
                    recommendation = recommendationResult;
                }
            } catch (parseError) {
                console.log(
                    "⚠️ Failed to parse direct JSON, trying extraction..."
                );
                // If not direct JSON, look for JSON object in the text
                const jsonMatch = agentResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const extractedJson = JSON.parse(jsonMatch[0]);
                        if (extractedJson && extractedJson.recommendation) {
                            recommendation = extractedJson;
                        }
                    } catch (matchError) {
                        console.log(
                            "⚠️ Could not parse extracted JSON, using simulated recommendation"
                        );
                    }
                } else {
                    console.log(
                        "⚠️ No JSON object found in response, using simulated recommendation"
                    );
                }
            }
        }

        // If no valid recommendation found, generate simulated one
        if (!recommendation) {
            console.log(
                "🔄 Generating simulated recommendation due to parsing issues"
            );
            recommendation = generateSimulatedRecommendation(
                finalAnalysis,
                userToken,
                previousRecommendation
            );
        }

        return {
            success: true,
            recommendation: recommendation,
            rawResponse: agentResponse,
            reasoning: reasoningContent,
            usage: response.data.usage,
        };
    } catch (error) {
        console.error("❌ Investment Committee failed:", error.message);

        // Fallback to simulated recommendation on API failure
        console.log(
            "🔄 Falling back to simulated investment recommendation..."
        );
        const recommendation = generateSimulatedRecommendation(
            finalAnalysis,
            userToken,
            previousRecommendation
        );

        return {
            success: true,
            recommendation: recommendation,
            fallbackMode: true,
            error: error.message,
        };
    }
}

/**
 * Generate simulated investment recommendation based on best combined scores and previous recommendations
 */
function generateSimulatedRecommendation(
    finalAnalysis,
    userToken,
    previousRecommendation = null
) {
    // Find user's current holding analysis
    const userCurrentHoldingAnalysis = finalAnalysis.find(
        (coin) => coin.symbol === userToken
    );

    // Find coins with both scores
    const coinsWithBothScores = finalAnalysis.filter(
        (coin) =>
            coin.qualitative_score !== undefined &&
            coin.quant_score !== undefined
    );

    if (coinsWithBothScores.length === 0) {
        // Fallback to best quantitative score only
        const bestQuantCoin = finalAnalysis.reduce((best, coin) =>
            coin.quant_score > best.quant_score ? coin : best
        );

        return {
            recommendation: `Swap ${userToken} for ${bestQuantCoin.symbol} and hold for 2-4 weeks`,
            explanation: `${bestQuantCoin.symbol} has the highest quantitative score of ${bestQuantCoin.quant_score}/10 with strong performance metrics including ${bestQuantCoin["90d_change"]}% 90-day momentum.`,
        };
    }

    // Calculate combined score (weighted: 60% quant, 40% qual)
    const scoredCoins = coinsWithBothScores.map((coin) => ({
        ...coin,
        combined_score: coin.quant_score * 0.6 + coin.qualitative_score * 0.4,
    }));

    // Sort by combined score
    scoredCoins.sort((a, b) => b.combined_score - a.combined_score);
    const bestCoin = scoredCoins[0];

    // Check if user should hold their current position
    let shouldHold = false;
    let holdJustification = "";

    if (
        userCurrentHoldingAnalysis &&
        userCurrentHoldingAnalysis.qualitative_score !== undefined
    ) {
        const userCombinedScore =
            userCurrentHoldingAnalysis.quant_score * 0.6 +
            userCurrentHoldingAnalysis.qualitative_score * 0.4;

        // Consider previous recommendation timing
        if (previousRecommendation) {
            const timeElapsed = Date.now() - previousRecommendation.timestamp;
            const hoursElapsed = timeElapsed / (1000 * 60 * 60);

            // If previous recommendation was to hold and less than recommended time has passed
            if (
                previousRecommendation.recommendation.includes("HOLD") &&
                hoursElapsed < 24
            ) {
                const scoreDifference =
                    bestCoin.combined_score - userCombinedScore;
                if (scoreDifference < 1.5) {
                    // Less than 1.5 points difference
                    shouldHold = true;
                    holdJustification = `Previous recommendation to hold ${userToken} still valid (${Math.round(
                        hoursElapsed
                    )}h elapsed), minimal advantage from alternatives`;
                }
            }
        }

        // If current holding is competitive (within 1 point of best)
        if (!shouldHold && bestCoin.combined_score - userCombinedScore < 1.0) {
            shouldHold = true;
            holdJustification = `${userToken} remains competitive with combined score of ${userCombinedScore.toFixed(
                2
            )}/10`;
        }
    }

    console.log("🏆 Investment Committee Analysis:");
    console.log(`   Top 3 Combined Scores:`);
    scoredCoins.slice(0, 3).forEach((coin, index) => {
        const marker = coin.symbol === userToken ? " (Current)" : "";
        console.log(
            `   ${index + 1}. ${
                coin.symbol
            }: Combined ${coin.combined_score.toFixed(2)}/10 (Quant: ${
                coin.quant_score
            }, Qual: ${coin.qualitative_score})${marker}`
        );
    });

    if (shouldHold) {
        const holdTime = previousRecommendation
            ? "more 1-2 weeks"
            : "1-3 weeks";
        return {
            recommendation: `Don't swap anything and hold ${userToken} for ${holdTime}`,
            explanation: holdJustification,
        };
    }

    // Generate swap justification
    let justification = `${
        bestCoin.symbol
    } offers superior combined performance (${bestCoin.combined_score.toFixed(
        2
    )}/10) vs ${userToken}`;

    if (userCurrentHoldingAnalysis) {
        const userCombinedScore =
            userCurrentHoldingAnalysis.quant_score * 0.6 +
            (userCurrentHoldingAnalysis.qualitative_score || 0) * 0.4;
        justification += ` (${userCombinedScore.toFixed(2)}/10)`;
    }

    // Add performance context
    if (bestCoin["90d_change"] > 50) {
        justification += " with exceptional 90-day momentum";
    } else if (bestCoin["90d_change"] > 20) {
        justification += " with strong 90-day growth";
    } else if (bestCoin["90d_change"] > 0) {
        justification += " with positive 90-day performance";
    }

    justification += ".";

    // Determine hold time based on performance strength
    let holdTime = "2-4 weeks";
    if (bestCoin["90d_change"] > 100) {
        holdTime = "4-6 weeks"; // Strong performers get longer hold
    } else if (bestCoin["90d_change"] < 20) {
        holdTime = "1-2 weeks"; // Weaker performers get shorter hold
    }

    return {
        recommendation: `Swap ${userToken} for ${bestCoin.symbol} and hold for ${holdTime}`,
        explanation: justification,
    };
}

/**
 * Test the Investment Committee Agent with sample final analysis
 */
async function runInvestmentCommitteeTests() {
    console.log("🚀 IoPulse Investment Committee Agent - Test Suite\n");

    const testFinalAnalysis = [
        // Test 1: Meme coins with mixed qual scores
        [
            {
                symbol: "MYRO",
                "90d_change": 179.1,
                "30d_change": 94.36,
                "24h_change": 23.62,
                quant_score: 10.0,
                qualitative_score: 5.16,
            },
            {
                symbol: "MEME",
                "90d_change": 73.17,
                "30d_change": 65.1,
                "24h_change": 25.13,
                quant_score: 9.12,
                qualitative_score: 4.89,
            },
            {
                symbol: "SHIB",
                "90d_change": 86.6,
                "30d_change": 55.67,
                "24h_change": 13.33,
                quant_score: 8.67,
                qualitative_score: 8.62,
            },
            {
                symbol: "BONK",
                "90d_change": 88.39,
                "30d_change": 31.73,
                "24h_change": 13.86,
                quant_score: 8.42,
                qualitative_score: 8.98,
            },
            {
                symbol: "TURBO",
                "90d_change": 62.8,
                "30d_change": 22.08,
                "24h_change": 3.35,
                quant_score: 7.63,
                qualitative_score: 5.57,
            },
        ],
        // Test 2: Established coins with high qual scores
        [
            {
                symbol: "LTC",
                "90d_change": 173.91,
                "30d_change": 102.03,
                "24h_change": 29.7,
                quant_score: 10.0,
                qualitative_score: 4.69,
            },
            {
                symbol: "FET",
                "90d_change": 130.76,
                "30d_change": 116.33,
                "24h_change": 38.83,
                quant_score: 10.0,
                qualitative_score: 8.77,
            },
            {
                symbol: "UNI",
                "90d_change": 65.94,
                "30d_change": 37.18,
                "24h_change": 15.78,
                quant_score: 7.74,
                qualitative_score: 9.36,
            },
            {
                symbol: "LINK",
                "90d_change": 52.54,
                "30d_change": 49.15,
                "24h_change": 9.69,
                quant_score: 7.5,
                qualitative_score: 8.18,
            },
            {
                symbol: "DOT",
                "90d_change": 59.36,
                "30d_change": 46.43,
                "24h_change": 14.84,
                quant_score: 7.74,
                qualitative_score: 8.05,
            },
        ],
    ];

    const testUserTokens = ["ETH", "USDC"];

    for (let i = 0; i < testFinalAnalysis.length; i++) {
        const finalAnalysis = testFinalAnalysis[i];
        const userToken = testUserTokens[i];

        console.log(
            `\n📋 Test ${i + 1}: Investment committee decision for ${
                finalAnalysis.length
            } candidates`
        );
        console.log("━".repeat(60));
        console.log("🎯 User Token:", userToken);
        console.log("📊 Candidates with dual scores:");
        finalAnalysis.forEach((coin) => {
            console.log(
                `  💰 ${coin.symbol}: Quant ${coin.quant_score}/10, Qual ${coin.qualitative_score}/10`
            );
        });

        const result = await processInvestmentCommittee(
            finalAnalysis,
            userToken
        );

        if (result.success) {
            console.log("✅ Investment Committee Decision Successful!");
            if (result.recommendation) {
                console.log("🏆 Final Investment Recommendation:");
                console.log(
                    `   📈 Decision: ${result.recommendation.recommendation}`
                );
                console.log(
                    `   💡 Explanation: ${result.recommendation.explanation}`
                );
            }

            if (result.fallbackMode) {
                console.log("⚠️ Used fallback mode due to API issues");
            }

            console.log(
                `💰 Token Usage: ${result.usage?.total_tokens || "N/A"} total`
            );
        } else {
            console.log("❌ Investment Committee Decision Failed!");
            console.log("🚨 Error:", result.error);
        }

        // Wait between tests to avoid rate limiting
        if (i < testFinalAnalysis.length - 1) {
            console.log("\n⏳ Waiting 2 seconds before next test...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    console.log("\n🎉 All investment committee tests completed!");
}

// Main execution
if (require.main === module) {
    runInvestmentCommitteeTests().catch(console.error);
}

module.exports = { processInvestmentCommittee };
