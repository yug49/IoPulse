#!/usr/bin/env node

/**
 * IoPulse Investor Profile Agent - Production Ready Test
 *
 * This script demonstrates how to use the Investor Profile Agent
 * to convert investment strategies into structured JSON profiles.
 */

const axios = require("axios");
require("dotenv").config();

// Configuration
const API_ENDPOINT =
    "https://api.intelligence.io.solutions/api/v1/chat/completions";
const MODEL_NAME = "Qwen/Qwen3-235B-A22B-Thinking-2507";

// Agent instructions from YAML workflow
const AGENT_INSTRUCTIONS = `You are a senior investment analyst. Your task is to receive a user's current token holdings and their investment strategy in natural language text. You MUST convert this text into a single, structured JSON object.

The JSON object MUST contain the following keys:
- "current_holding_symbol": The ticker symbol of the user's current token.
- "risk_tolerance": Classify the user's strategy into one of three categories: "low", "medium", or "high".
- "desired_market_cap": Classify the desired investment into one of three categories: "low", "mid", or "high".
- "investment_horizon": Classify the horizon into "short-term" or "long-term".

Your entire output must ONLY be the raw JSON object and nothing else.`;

/**
 * Process investment strategy using the Investor Profile Agent
 * @param {Object} strategy - Strategy object with name, description, coin, amount
 * @returns {Object} - Parsed investment profile JSON
 */
async function processInvestmentStrategy(strategy) {
    const apiKey = process.env.IONET_API_KEY;
    if (!apiKey) {
        throw new Error("IONET_API_KEY not found in environment variables.");
    }

    // Create user input text
    const userInput = `Strategy Name: ${strategy.name}
Description: ${strategy.description}
Current Holdings: ${strategy.amount} ${strategy.coin}
Looking for investment recommendations with the described strategy.`;

    // Prepare API request
    const requestPayload = {
        model: MODEL_NAME,
        messages: [
            {
                role: "system",
                content: AGENT_INSTRUCTIONS,
            },
            {
                role: "user",
                content: userInput,
            },
        ],
        temperature: 0.1,
        max_tokens: 1000,
    };

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    try {
        // Make API call
        const response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 60000,
        });

        // Extract and parse response
        const messageContent = response.data.choices[0].message.content;
        if (!messageContent) {
            throw new Error("No content received from the API response");
        }

        const agentResponse = messageContent.trim();
        const parsedProfile = JSON.parse(agentResponse);

        return {
            success: true,
            profile: parsedProfile,
            reasoning:
                response.data.choices[0].message.reasoning_content || null,
            usage: response.data.usage,
        };
    } catch (error) {
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

        const result = await processInvestmentStrategy(strategy);

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

module.exports = { processInvestmentStrategy };
