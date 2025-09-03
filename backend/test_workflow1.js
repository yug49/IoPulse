#!/usr/bin/env node

/**
 * Test Script for IoPulse Investor Profile Agent
 *
 * This script tests the Investor Profile Agent by making a direct API call
 * to the io.net model endpoint using the Qwen/Qwen3-235B-A22B-Thinking-2507 model.
 *
 * The agent converts natural language investment strategy into structured JSON with keys:
 * - current_holding_symbol
 * - risk_tolerance
 * - desired_market_cap
 * - investment_horizon
 */

const axios = require("axios");
require("dotenv").config();

// Configuration
const API_ENDPOINT =
    "https://api.intelligence.io.solutions/api/v1/chat/completions";
const MODEL_NAME = "Qwen/Qwen3-235B-A22B-Thinking-2507";

// Sample test data - strategy parameters
const SAMPLE_STRATEGY = {
    name: "Aggressive AI Token Hunt",
    description:
        "Looking for high-growth AI tokens with aggressive risk tolerance for short-term gains",
    coin: "ETH",
    amount: "5",
};

// The exact instructions from the YAML workflow
const AGENT_INSTRUCTIONS = `You are a senior investment analyst. Your task is to receive a user's current token holdings and their investment strategy in natural language text. You MUST convert this text into a single, structured JSON object.

The JSON object MUST contain the following keys:
- "current_holding_symbol": The ticker symbol of the user's current token.
- "risk_tolerance": Classify the user's strategy into one of three categories: "low", "medium", or "high".
- "desired_market_cap": Classify the desired investment into one of three categories: "low", "mid", or "high".
- "investment_horizon": Classify the horizon into "short-term" or "long-term".

Your entire output must ONLY be the raw JSON object and nothing else.`;

/**
 * Main function to test the Investor Profile Agent
 */
async function testInvestorProfileAgent() {
    try {
        console.log("🚀 Starting IoPulse Investor Profile Agent Test...\n");

        // Validate environment variables
        const apiKey = process.env.IONET_API_KEY;
        if (!apiKey) {
            throw new Error(
                "IONET_API_KEY not found in environment variables. Please check your .env file."
            );
        }

        console.log("✅ API Key loaded successfully");
        console.log(`🤖 Testing Model: ${MODEL_NAME}`);
        console.log(`📋 Strategy Name: ${SAMPLE_STRATEGY.name}`);
        console.log(`📝 Strategy Description: ${SAMPLE_STRATEGY.description}`);
        console.log(
            `🪙 Current Holding: ${SAMPLE_STRATEGY.amount} ${SAMPLE_STRATEGY.coin}`
        );

        // Create the user input text based on strategy parameters
        const userInput = `Strategy Name: ${SAMPLE_STRATEGY.name}
Description: ${SAMPLE_STRATEGY.description}
Current Holdings: ${SAMPLE_STRATEGY.amount} ${SAMPLE_STRATEGY.coin}
Looking for investment recommendations with the described strategy.`;

        console.log(`\n📤 User Input Text:\n"${userInput}"\n`);

        // Prepare the request payload for chat completions API
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
            temperature: 0.1, // Low temperature for consistent structured output
            max_tokens: 1000, // Increased token limit
        };

        // Prepare headers
        const headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        };

        console.log("📤 Sending request to io.net API...");
        console.log(`🔗 Endpoint: ${API_ENDPOINT}`);
        console.log(
            "📦 Request Payload:",
            JSON.stringify(requestPayload, null, 2)
        );
        console.log("🔐 Headers:", {
            Authorization: `Bearer ${apiKey.substring(0, 20)}...`,
            "Content-Type": headers["Content-Type"],
            Accept: headers["Accept"],
        });
        console.log("\n⏳ Waiting for response...\n");

        // Make the API call
        const response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 60000, // 60 second timeout for model inference
        });

        // Log success response
        console.log("✅ API Call Successful!");
        console.log(
            `📊 Response Status: ${response.status} ${response.statusText}`
        );

        // Log the full response structure first
        console.log("\n📋 Full API Response Structure:");
        console.log(JSON.stringify(response.data, null, 2));

        // Extract the agent's response
        const agentResponse = response.data.choices[0].message.content;
        console.log("\n🎯 AGENT RESPONSE:");
        console.log("=".repeat(50));
        console.log(agentResponse);
        console.log("=".repeat(50));

        // Try to parse the response as JSON
        console.log("\n🔍 Parsing JSON Response...");

        try {
            const parsedResponse = JSON.parse(agentResponse.trim());

            console.log("✅ JSON parsing successful!");
            console.log(
                "📊 Parsed Investment Profile:",
                JSON.stringify(parsedResponse, null, 2)
            );

            // Validate the response structure
            const expectedKeys = [
                "current_holding_symbol",
                "risk_tolerance",
                "desired_market_cap",
                "investment_horizon",
            ];
            const responseKeys = Object.keys(parsedResponse);

            console.log(`\n📋 Expected Keys: ${expectedKeys.join(", ")}`);
            console.log(`📋 Received Keys: ${responseKeys.join(", ")}`);

            const missingKeys = expectedKeys.filter(
                (key) => !responseKeys.includes(key)
            );
            const extraKeys = responseKeys.filter(
                (key) => !expectedKeys.includes(key)
            );

            if (missingKeys.length === 0) {
                console.log(
                    "✅ All required keys are present in the response!"
                );
            } else {
                console.log(
                    `⚠️  Missing required keys: ${missingKeys.join(", ")}`
                );
            }

            if (extraKeys.length > 0) {
                console.log(
                    `ℹ️  Additional keys found: ${extraKeys.join(", ")}`
                );
            }

            // Display parsed values
            console.log("\n📊 Investment Profile Analysis:");
            expectedKeys.forEach((key) => {
                if (parsedResponse[key] !== undefined) {
                    console.log(`  🔹 ${key}: ${parsedResponse[key]}`);
                }
            });

            // Validate value ranges
            console.log("\n🔍 Validating Value Ranges...");

            const validRiskLevels = ["low", "medium", "high"];
            const validMarketCaps = ["low", "mid", "high"];
            const validHorizons = ["short-term", "long-term"];

            if (validRiskLevels.includes(parsedResponse.risk_tolerance)) {
                console.log(
                    `✅ Risk tolerance "${parsedResponse.risk_tolerance}" is valid`
                );
            } else {
                console.log(
                    `⚠️  Risk tolerance "${
                        parsedResponse.risk_tolerance
                    }" is not in valid range: ${validRiskLevels.join(", ")}`
                );
            }

            if (validMarketCaps.includes(parsedResponse.desired_market_cap)) {
                console.log(
                    `✅ Market cap "${parsedResponse.desired_market_cap}" is valid`
                );
            } else {
                console.log(
                    `⚠️  Market cap "${
                        parsedResponse.desired_market_cap
                    }" is not in valid range: ${validMarketCaps.join(", ")}`
                );
            }

            if (validHorizons.includes(parsedResponse.investment_horizon)) {
                console.log(
                    `✅ Investment horizon "${parsedResponse.investment_horizon}" is valid`
                );
            } else {
                console.log(
                    `⚠️  Investment horizon "${
                        parsedResponse.investment_horizon
                    }" is not in valid range: ${validHorizons.join(", ")}`
                );
            }
        } catch (jsonError) {
            console.log("❌ JSON parsing failed!");
            console.log("📄 Raw response (not valid JSON):", agentResponse);
            console.log("🔧 JSON Error:", jsonError.message);
        }

        console.log("\n🎉 Test completed successfully!");
    } catch (error) {
        console.error("\n❌ Test Failed!");

        if (error.response) {
            // API responded with error status
            console.error(
                `📊 Response Status: ${error.response.status} ${error.response.statusText}`
            );
            console.error(
                "📋 Response Headers:",
                JSON.stringify(error.response.headers, null, 2)
            );
            console.error(
                "📄 Response Data:",
                JSON.stringify(error.response.data, null, 2)
            );
        } else if (error.request) {
            // Request was made but no response received
            console.error("📡 No response received from server");
            console.error("🔗 Request details:", error.message);
        } else {
            // Error in setting up the request
            console.error("⚙️  Error setting up request:", error.message);
        }

        console.error("\n🔧 Troubleshooting Tips:");
        console.error("  1. Check your internet connection");
        console.error("  2. Verify your IONET_API_KEY in the .env file");
        console.error("  3. Ensure the model name is correct");
        console.error("  4. Check if the io.net API service is available");
        console.error(
            "  5. Verify your API key has access to the specified model"
        );

        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    console.log("🧪 IoPulse Investor Profile Agent Testing Script");
    console.log("==============================================\n");

    testInvestorProfileAgent()
        .then(() => {
            console.log("\n👋 Test script execution completed.");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Unexpected error:", error.message);
            process.exit(1);
        });
}

module.exports = { testInvestorProfileAgent };
