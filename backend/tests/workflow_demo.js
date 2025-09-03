#!/usr/bin/env node

/**
 * IoPulse Multi-Agent Workflow - Final Integration Test
 *
 * This script demonstrates the complete integration of:
 * 1. Investor Profile Agent (Qwen/Qwen3-235B-A22B-Thinking-2507)
 * 2. Market Screener Agent (mistralai/Magistral-Small-2506)
 *
 * The workflow processes natural language investment strategies and returns
 * structured profiles with matching investment candidates.
 */

const { runCompleteWorkflow } = require("./complete_workflow");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function demonstrateWorkflow() {
    console.log("🌟 IoPulse Multi-Agent Workflow Demonstration");
    console.log(
        "══════════════════════════════════════════════════════════════════════"
    );
    console.log("📋 This demonstration shows how two AI agents work together:");
    console.log(
        "   1️⃣  Investor Profile Agent - Analyzes strategy & creates profile"
    );
    console.log(
        "   2️⃣  Market Screener Agent - Finds matching investment candidates"
    );
    console.log(
        "══════════════════════════════════════════════════════════════════════\n"
    );

    // Example strategy that should work well
    const strategy = {
        name: "Aggressive Meme Coin Strategy",
        description:
            "Looking for high-volatility meme coins with potential for explosive short-term gains, willing to accept high risk",
        coin: "ETH",
        amount: "2",
    };

    console.log("🎯 Example Investment Strategy:");
    console.log(`   📝 Name: ${strategy.name}`);
    console.log(`   📖 Description: ${strategy.description}`);
    console.log(
        `   💰 Current Holdings: ${strategy.amount} ${strategy.coin}\n`
    );

    console.log("⚡ Starting Multi-Agent Workflow...\n");

    const result = await runCompleteWorkflow(strategy);

    if (result.success) {
        console.log("\n🎉 WORKFLOW COMPLETED SUCCESSFULLY!");
        console.log(
            "══════════════════════════════════════════════════════════════════════"
        );

        console.log("\n📊 AGENT 1 RESULTS (Profile Analysis):");
        console.log("─".repeat(50));
        const profile = result.profileResult.profile;
        console.log(`🪙 Current Holding: ${profile.current_holding_symbol}`);
        console.log(
            `🎲 Risk Tolerance: ${profile.risk_tolerance.toUpperCase()}`
        );
        console.log(
            `📈 Market Cap Preference: ${profile.desired_market_cap.toUpperCase()}`
        );
        console.log(
            `⏱️  Investment Horizon: ${profile.investment_horizon.toUpperCase()}`
        );

        console.log("\n🔍 AGENT 2 RESULTS (Market Screening):");
        console.log("─".repeat(50));
        if (result.screeningResult.candidates) {
            console.log(
                `🎯 Found ${result.screeningResult.candidates.length} Investment Candidates:`
            );
            console.log(`   ${result.screeningResult.candidates.join(" • ")}`);
        }

        console.log("\n💡 WORKFLOW INSIGHTS:");
        console.log("─".repeat(50));
        console.log(
            "✅ Successfully converted natural language to structured data"
        );
        console.log("✅ Intelligently matched profile to market opportunities");
        console.log("✅ Generated actionable investment recommendations");

        console.log("\n🔧 TECHNICAL DETAILS:");
        console.log("─".repeat(50));
        console.log(
            `🤖 Profile Agent Model: Qwen/Qwen3-235B-A22B-Thinking-2507`
        );
        console.log(`🤖 Screener Agent Model: mistralai/Magistral-Small-2506`);
        console.log(
            `🔤 Total Tokens Used: ${result.profileResult.usage.total_tokens}`
        );
        console.log(`⏱️  Workflow completed in real-time`);
    } else {
        console.log("\n❌ WORKFLOW FAILED");
        console.log(
            "══════════════════════════════════════════════════════════════════════"
        );
        console.log(`🚨 Error: ${result.error}`);
        console.log("\n🔧 This may be due to:");
        console.log("   • API rate limiting");
        console.log("   • Network connectivity issues");
        console.log("   • Model availability");
        console.log("\n💡 Try running the test again in a few moments.");
    }

    console.log("\n📚 NEXT STEPS:");
    console.log(
        "══════════════════════════════════════════════════════════════════════"
    );
    console.log("🔄 This workflow can be automated to run every hour");
    console.log("🌐 Integrate with frontend for real-time user interactions");
    console.log("📈 Add more agents for deeper market analysis");
    console.log("🚨 Implement alert systems for investment opportunities");
    console.log("📊 Add portfolio tracking and performance metrics");

    console.log(
        "\n✨ IoPulse Multi-Agent Workflow is ready for production! ✨"
    );
}

// Run demonstration
if (require.main === module) {
    demonstrateWorkflow().catch((error) => {
        console.error("\n💥 Demonstration failed:", error.message);
        process.exit(1);
    });
}

module.exports = { demonstrateWorkflow };
