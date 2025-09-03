#!/usr/bin/env node

/**
 * Test io.net API connectivity
 */

const axios = require("axios");
require("dotenv").config();

const API_ENDPOINT =
    "https://api.intelligence.io.solutions/api/v1/chat/completions";
const MODEL_NAME = "Qwen/Qwen3-235B-A22B-Thinking-2507";

async function testAPIConnectivity() {
    const apiKey = process.env.IONET_API_KEY;

    if (!apiKey) {
        console.error("❌ IONET_API_KEY not found in environment variables");
        return;
    }

    console.log("🔑 API Key found:", apiKey.substring(0, 20) + "...");
    console.log("🌐 Testing connectivity to:", API_ENDPOINT);
    console.log("🤖 Using model:", MODEL_NAME);

    const requestPayload = {
        model: MODEL_NAME,
        messages: [
            {
                role: "system",
                content:
                    "You are a helpful assistant. Respond with a simple 'Hello, API is working!' message.",
            },
            {
                role: "user",
                content: "Test connectivity",
            },
        ],
        temperature: 0.1,
        max_tokens: 50,
    };

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    try {
        console.log("📤 Sending test request...");

        const response = await axios.post(API_ENDPOINT, requestPayload, {
            headers: headers,
            timeout: 30000, // 30 second timeout
        });

        console.log("✅ API Response received!");
        console.log("📊 Status:", response.status);
        console.log(
            "📝 Response data:",
            JSON.stringify(response.data, null, 2)
        );

        if (
            response.data.choices &&
            response.data.choices[0] &&
            response.data.choices[0].message
        ) {
            const message = response.data.choices[0].message;
            const content = message.content || message.reasoning_content;
            console.log("💬 AI Response:", content);
        } else {
            console.log("⚠️ Unexpected response structure");
        }
    } catch (error) {
        console.error("❌ API Test Failed!");

        if (error.response) {
            // Server responded with error status
            console.error("📊 Status:", error.response.status);
            console.error(
                "📝 Response:",
                JSON.stringify(error.response.data, null, 2)
            );
            console.error(
                "🔗 Headers:",
                JSON.stringify(error.response.headers, null, 2)
            );
        } else if (error.request) {
            // Request was made but no response received
            console.error("📡 No response received");
            console.error("🔗 Request config:", error.config?.url);
            console.error("⏱️ Timeout:", error.config?.timeout);
        } else {
            // Something else happened
            console.error("🚨 Error:", error.message);
        }

        // Additional error details
        if (error.code) {
            console.error("🔍 Error code:", error.code);
        }

        // Common issues and solutions
        console.log("\n🔧 Troubleshooting:");
        if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
            console.log("   • Check internet connection");
            console.log("   • Verify API endpoint URL");
            console.log("   • Check if firewall is blocking the request");
        } else if (error.response?.status === 401) {
            console.log("   • Check API key validity");
            console.log("   • Verify API key format");
        } else if (error.response?.status === 429) {
            console.log("   • Rate limit exceeded, wait before retrying");
        } else if (error.response?.status >= 500) {
            console.log("   • Server error, try again later");
        } else if (error.code === "ETIMEDOUT") {
            console.log("   • Request timed out, server may be slow");
            console.log("   • Try increasing timeout or retry later");
        }
    }
}

if (require.main === module) {
    testAPIConnectivity();
}

module.exports = { testAPIConnectivity };
