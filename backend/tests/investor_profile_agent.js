#!/usr/bin/env node

/**
 * IoPulse Investor Profile Agent - Production Ready Test
 *
 * This script demonstrates how to use the Investor Profile Agent
 * to convert investment strategies into structured JSON profiles.
 */

const { ionetClient, MODELS } = require("../config/ionet");
require("dotenv").config();

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a senior investment analyst. Your task is to receive a user's current token holdings and their investment strategy in natural language text. You MUST convert this text into a single, structured JSON object.

The JSON object MUST contain the following keys:
- "current_holding_symbol": The ticker symbol of the user's current token.
- "risk_tolerance": Classify the user's strategy into one of three categories: "low", "medium", or "high".
- "desired_market_cap": Classify the desired investment into one of three categories: "low", "mid", or "high".
- "investment_horizon": Classify the horizon into "short-term" or "long-term".

CRITICAL INSTRUCTIONS:
- Your response MUST be ONLY a valid JSON object
- Do NOT include any explanations, reasoning, or additional text
- Do NOT include markdown formatting or code blocks
- Start your response with { and end with }
- No text before or after the JSON object

Example response format:
{"current_holding_symbol":"BTC","risk_tolerance":"medium","desired_market_cap":"mid","investment_horizon":"long-term"}`;

/**
 * Process investment strategy using the Investor Profile Agent
 * @param {Object} strategy - Strategy object with name, description, coin, amount
 * @returns {Object} - Parsed investment profile JSON
 */
async function processInvestorProfile(
    strategyText,
    apiKey = process.env.IONET_API_KEY
) {
    if (!strategyText) {
        throw new Error("Strategy text is required");
    }

    if (!apiKey) {
        throw new Error("IONET_API_KEY is required");
    }

    try {
        console.log("📊 Processing investor profile...");
        console.log(`📝 Strategy Text: "${strategyText}"`);

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
                    content: `Please convert this investment strategy into a structured JSON profile: "${strategyText}"`,
                },
            ],
            temperature: 0.1,
            max_tokens: 1000,
        });

        // Extract and parse response
        const message = response.choices[0].message;
        const messageContent = message.content;

        if (!messageContent) {
            throw new Error("No content received from the API response");
        }

        const agentResponse = messageContent.trim();

        // Try to parse the response as JSON
        let parsedProfile;
        try {
            parsedProfile = JSON.parse(agentResponse);
        } catch (parseError) {
            throw new Error(
                `Failed to parse JSON response: ${parseError.message}`
            );
        }

        // Return successful result
        return {
            success: true,
            profile: parsedProfile,
            rawResponse: agentResponse,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Investor Profile Processing Error:", error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

// Test different strategy examples
async function runTests() {
    console.log("🚀 IoPulse Investor Profile Agent - Test Suite\n");

    const testStrategies = [
        {
            name: "Conservative DeFi Yield",
            description:
                "Looking for stable yield farming opportunities with low risk and established protocols",
            coin: "USDC",
            amount: "10000",
        },
        {
            name: "Aggressive AI Token Hunt",
            description:
                "High-growth AI tokens with aggressive risk tolerance for short-term gains",
            coin: "ETH",
            amount: "5",
        },
        {
            name: "Long-term Blue Chip Hold",
            description:
                "Building a portfolio of established cryptocurrencies for long-term wealth building with medium risk",
            coin: "BTC",
            amount: "0.5",
        },
    ];

    for (let i = 0; i < testStrategies.length; i++) {
        const strategy = testStrategies[i];
        console.log(`\n📋 Test ${i + 1}: ${strategy.name}`);
        console.log("━".repeat(50));
        console.log(`📝 Description: ${strategy.description}`);
        console.log(`🪙 Holdings: ${strategy.amount} ${strategy.coin}`);

        const result = await processInvestorProfile(
            `${strategy.description}. Current holding: ${strategy.amount} ${strategy.coin}.`
        );

        if (result.success) {
            console.log("✅ Success!");
            console.log(
                "📊 Investment Profile:",
                JSON.stringify(result.profile, null, 2)
            );
            console.log(
                `💰 Token Usage: ${result.usage.total_tokens} total (${result.usage.prompt_tokens} prompt + ${result.usage.completion_tokens} completion)`
            );
        } else {
            console.log("❌ Failed!");
            console.log("🚨 Error:", result.error);
        }
    }

    console.log("\n🎉 All tests completed!");
}

// Main execution
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { processInvestorProfile };
