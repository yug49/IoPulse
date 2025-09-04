#!/usr/bin/env node

/**
 * IoPulse Market Screener Agent
 *
 * This agent finds 15 investment candidates based on the investor profile.
 * No external tools - relies purely on AI model knowledge.
 */

const { ionetClient, MODELS } = require("../config/ionet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a crypto market screening expert. Your job is to find 15 cryptocurrency investment candidates based on the provided investor profile.

IMPORTANT: You must respond with ONLY a JSON array of 15 cryptocurrency symbols. No explanations, no text, no reasoning - just the JSON array.

Example output format: ["BTC", "ETH", "SOL", ...]

Consider the investor profile:
- current_holding_symbol: User's current cryptocurrency
- risk_tolerance: "low", "medium", or "high" 
- desired_market_cap: "low", "mid", or "high"
- investment_horizon: "short-term", "medium-term", or "long-term"

Based on these factors, select 15 appropriate cryptocurrency symbols that match the profile. Use your knowledge of the cryptocurrency market to make appropriate selections.`;

/**
 * Process investor profile using the Market Screener Agent
 * @param {Object} investorProfile - Structured investor profile
 * @returns {Object} - Result with 15 investment candidates
 */
async function processMarketScreening(investorProfile) {
    console.log("🔍 Starting Market Screening...");
    console.log("📊 Input Profile:", JSON.stringify(investorProfile, null, 2));

    try {
        console.log("📤 Sending request to Market Screener Agent...");

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
                    content: `Return ONLY a JSON array of 15 coin symbols. No explanations or text. Just the array.

Investor Profile: ${JSON.stringify(investorProfile)}`,
                },
            ],
            temperature: 0.1, // Lower temperature for more precise format following
            max_tokens: 500, // Reduced to encourage concise JSON output
        });

        console.log("✅ Market Screener API call successful!");

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
                // If not direct JSON, look for JSON array in the text
                const jsonMatch = agentResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        finalCandidates = JSON.parse(jsonMatch[0]);
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
            candidates: finalCandidates,
            toolCalls: [], // No tool calls used
            toolCallsCount: 0,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Market Screening Error:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

// Test data
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

/**
 * Run test suite for Market Screener Agent
 */
async function runTests() {
    console.log("🚀 IoPulse Market Screener Agent - Test Suite\n");

    for (let i = 0; i < testProfiles.length; i++) {
        const test = testProfiles[i];
        console.log(`📋 Test ${i + 1}: ${test.name}`);
        console.log("━".repeat(70));

        const result = await processMarketScreening(test.profile);

        if (result.success) {
            console.log("✅ Market Screening Successful!");
            console.log(
                `🎯 Found ${result.candidates.length} candidates:`,
                result.candidates
            );
            console.log(`💰 Token Usage: ${result.usage.total_tokens} total`);
        } else {
            console.log("❌ Market Screening Failed!");
            console.log("🚨 Error:", result.error);
        }

        // Wait between tests
        if (i < testProfiles.length - 1) {
            console.log("\n⏳ Waiting 2 seconds before next test...\n");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    console.log("\n🎉 All market screener tests completed!");
}

// Main execution
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { processMarketScreening };
