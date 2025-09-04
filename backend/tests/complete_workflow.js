#!/usr/bin/env node

/**
 * IoPulse Multi-Agent Workflow
 *
 * This script demonstrates the complete workflow:
 * 1. Investor Profile Agent - Converts strategy to structured profile
 * 2. Market Screener Agent - Finds 15 investment candidates based on profile
 */

const { processInvestmentStrategy } = require("./investor_profile_agent.js");
const { processMarketScreening } = require("./market_screener_agent.js");
const {
    processQuantitativeAnalysis,
} = require("./quantitative_analysis_agent.js");
const {
    processQualitativeDueDiligence,
} = require("./qualitative_due_diligence_agent.js");
const {
    processInvestmentCommittee,
} = require("./investment_committee_agent.js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

/**
 * Complete IoPulse Workflow with all 5 agents:
 * 1. Investor Profile Agent - Converts strategy to investor profile
 * 2. Market Screener Agent - Finds candidate coins with two tools
 * 3. Quantitative Analysis Agent - Analyzes candidates with historical data + current holding
 * 4. Qualitative Due Diligence Agent - Risk assessment of top 5 candidates + current holding
 * 5. Investment Committee Agent - Final investment recommendation with previous recommendation context
 * @param {string} strategy - Investment strategy description
 * @param {Object} previousRecommendation - Previous recommendation with timestamp (optional)
 * @returns {Object} - Complete workflow result
 */
async function runCompleteWorkflow(strategy, previousRecommendation = null) {
    console.log("🚀 Starting Complete IoPulse Multi-Agent Workflow...");
    console.log("📋 Input Strategy:", JSON.stringify(strategy, null, 2));
    if (previousRecommendation) {
        console.log(
            "📝 Previous Recommendation:",
            JSON.stringify(previousRecommendation, null, 2)
        );
    }
    console.log("━".repeat(80));

    let currentWorkflowStep = 1;
    const workflowResults = {
        strategy: strategy,
        profile: null,
        candidates: null,
        analysis: null,
        finalAnalysis: null,
        recommendation: null,
        success: false,
        totalTime: 0,
        agentsUsed: [],
    };

    const workflowStart = Date.now();

    // Extract user's current token for the entire workflow
    const userToken = strategy.coin || "ETH";

    try {
        // Step 1: Investor Profile Agent
        console.log(`
🎯 Step ${currentWorkflowStep}: Processing Investor Profile...`);
        const step1Start = Date.now();

        const profileResult = await processInvestmentStrategy(strategy);
        const step1Time = Date.now() - step1Start;

        if (!profileResult.success) {
            throw new Error(`Profile Agent failed: ${profileResult.error}`);
        }

        workflowResults.profile = profileResult.profile;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Investor Profile Agent",
            success: true,
            time: step1Time,
            output: profileResult.profile,
        });

        console.log("✅ Investor Profile Generated Successfully!");
        console.log(`⏱️ Time: ${step1Time}ms`);
        console.log(
            "📊 Profile:",
            JSON.stringify(profileResult.profile, null, 2)
        );

        // Step 2: Market Screener Agent
        console.log(`
� Step ${currentWorkflowStep}: Processing Market Screening...`);
        const step2Start = Date.now();

        const screeningResult = await processMarketScreening(
            profileResult.profile
        );
        const step2Time = Date.now() - step2Start;

        if (!screeningResult.success) {
            throw new Error(
                `Market Screener Agent failed: ${screeningResult.error}`
            );
        }

        workflowResults.candidates = screeningResult.candidates;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Market Screener Agent",
            success: true,
            time: step2Time,
            toolCalls: screeningResult.toolCallsCount || 0,
            output: screeningResult.candidates,
        });

        console.log("✅ Market Screening Completed Successfully!");
        console.log(`⏱️ Time: ${step2Time}ms`);
        console.log(
            `🔧 Tools Used: ${screeningResult.toolCallsCount || 0} calls`
        );
        console.log("🎯 Candidates:", screeningResult.candidates);

        // Step 3: Quantitative Analysis Agent
        console.log(`
📈 Step ${currentWorkflowStep}: Processing Quantitative Analysis...`);
        const step3Start = Date.now();

        const analysisResult = await processQuantitativeAnalysis(
            screeningResult.candidates,
            userToken
        );
        const step3Time = Date.now() - step3Start;

        if (!analysisResult.success) {
            throw new Error(
                `Quantitative Analysis Agent failed: ${analysisResult.error}`
            );
        }

        workflowResults.analysis = analysisResult.analysis;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Quantitative Analysis Agent",
            success: true,
            time: step3Time,
            toolCalls: analysisResult.toolCallsCount || 0,
            output: analysisResult.analysis,
        });

        console.log("✅ Quantitative Analysis Completed Successfully!");
        console.log(`⏱️ Time: ${step3Time}ms`);
        console.log(
            `🔧 Tools Used: ${analysisResult.toolCallsCount || 0} calls`
        );
        console.log("📊 Analysis Results:");
        analysisResult.analysis.forEach((coin) => {
            console.log(
                `  💰 ${coin.symbol}: Score ${coin.quant_score}/10 (90d: ${coin["90d_change"]}%, 30d: ${coin["30d_change"]}%, 24h: ${coin["24h_change"]}%)`
            );
        });

        // Step 4: Qualitative Due Diligence Agent
        console.log(
            `\n🔍 Step ${currentWorkflowStep}: Processing Qualitative Due Diligence...`
        );
        const step4Start = Date.now();

        const dueDiligenceResult = await processQualitativeDueDiligence(
            analysisResult.analysis,
            userToken
        );
        const step4Time = Date.now() - step4Start;

        if (!dueDiligenceResult.success) {
            throw new Error(
                `Qualitative Due Diligence Agent failed: ${dueDiligenceResult.error}`
            );
        }

        workflowResults.finalAnalysis = dueDiligenceResult.analysis;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Qualitative Due Diligence Agent",
            success: true,
            time: step4Time,
            toolCalls: dueDiligenceResult.toolCallsCount || 0,
            output: dueDiligenceResult.analysis,
        });

        console.log("✅ Qualitative Due Diligence Completed Successfully!");
        console.log(`⏱️ Time: ${step4Time}ms`);
        console.log(
            `🔧 Tools Used: ${dueDiligenceResult.toolCallsCount || 0} calls`
        );
        console.log(
            "🔍 Due Diligence Results (Top 5 with qualitative scores):"
        );
        dueDiligenceResult.analysis.forEach((coin) => {
            if (coin.qualitative_score !== undefined) {
                console.log(
                    `  🔍 ${coin.symbol}: Quant ${coin.quant_score}/10, Qual ${coin.qualitative_score}/10`
                );
            }
        });

        // Step 5: Investment Committee Agent
        console.log(
            `\n🏛️ Step ${currentWorkflowStep}: Processing Investment Committee Decision...`
        );
        const step5Start = Date.now();

        const committeeResult = await processInvestmentCommittee(
            dueDiligenceResult.analysis,
            userToken,
            previousRecommendation
        );
        const step5Time = Date.now() - step5Start;

        if (!committeeResult.success) {
            throw new Error(
                `Investment Committee Agent failed: ${committeeResult.error}`
            );
        }

        workflowResults.recommendation = committeeResult.recommendation;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Investment Committee Agent",
            success: true,
            time: step5Time,
            output: committeeResult.recommendation,
        });

        console.log("✅ Investment Committee Decision Completed Successfully!");
        console.log(`⏱️ Time: ${step5Time}ms`);
        console.log("🏆 Final Investment Recommendation:");
        console.log(`   📈 ${committeeResult.recommendation.recommendation}`);
        console.log(`   💡 ${committeeResult.recommendation.explanation}`);

        // Workflow completed successfully
        workflowResults.totalTime = Date.now() - workflowStart;
        workflowResults.success = true;

        console.log("\n🎉 Complete IoPulse Workflow Successful!");
        console.log("━".repeat(80));
        console.log(`⏱️ Total Workflow Time: ${workflowResults.totalTime}ms`);
        console.log(`🤖 Agents Used: ${workflowResults.agentsUsed.length}`);

        // Highlight the final investment committee recommendation
        console.log("\n🏆 FINAL INVESTMENT COMMITTEE RECOMMENDATION:");
        console.log(`   📈 ${workflowResults.recommendation.recommendation}`);
        console.log(`   💡 ${workflowResults.recommendation.explanation}`);

        console.log("\n📊 COMPLETE ANALYSIS SUMMARY:");
        // Sort by quant score and show top recommendations with qualitative scores
        const sortedFinalAnalysis = workflowResults.finalAnalysis.sort(
            (a, b) => b.quant_score - a.quant_score
        );
        sortedFinalAnalysis.forEach((coin, index) => {
            if (coin.qualitative_score !== undefined) {
                const isRecommended =
                    workflowResults.recommendation.recommendation.includes(
                        coin.symbol
                    );
                const marker = isRecommended ? "🏆" : "  ";
                console.log(
                    `${marker}${index + 1}. ${coin.symbol}: Quant ${
                        coin.quant_score
                    }/10, Qual ${coin.qualitative_score}/10 (90d: ${
                        coin["90d_change"]
                    }%, 30d: ${coin["30d_change"]}%, 24h: ${
                        coin["24h_change"]
                    }%)`
                );
            } else {
                console.log(
                    `  ${index + 1}. ${coin.symbol}: Quant ${
                        coin.quant_score
                    }/10 (90d: ${coin["90d_change"]}%, 30d: ${
                        coin["30d_change"]
                    }%, 24h: ${coin["24h_change"]}%)`
                );
            }
        });

        return workflowResults;
    } catch (error) {
        console.error("❌ Complete Workflow Failed!");
        console.error("🚨 Error:", error.message);

        workflowResults.totalTime = Date.now() - workflowStart;
        workflowResults.success = false;
        workflowResults.error = error.message;

        return workflowResults;
    }
}

/**
 * Test the complete workflow with different strategies
 */
async function runWorkflowTests() {
    console.log("🧪 IoPulse Complete Multi-Agent Workflow - Test Suite");
    console.log("═".repeat(70));

    const testStrategies = [
        {
            strategy: {
                name: "Aggressive AI Token Hunt",
                description:
                    "High-growth AI tokens with aggressive risk tolerance for short-term gains",
                coin: "ETH",
                amount: "5",
            },
            previousRecommendation: null, // First time user
        },
        {
            strategy: {
                name: "Conservative DeFi Yield",
                description:
                    "Looking for stable yield farming opportunities with low risk and established protocols",
                coin: "USDC",
                amount: "10000",
            },
            previousRecommendation: null, // First time user
        },
        {
            strategy: {
                name: "Follow-up Check",
                description:
                    "Check if I should still hold my current position or swap to something better",
                coin: "BTC",
                amount: "1",
            },
            previousRecommendation: {
                recommendation: "HOLD BTC",
                timestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
                original_duration: "1 day",
                justification:
                    "Bitcoin showing strong support levels with institutional buying",
            }, // User checking 6 hours after getting a "hold for 1 day" recommendation
        },
    ];

    const results = [];

    for (let i = 0; i < testStrategies.length; i++) {
        const { strategy, previousRecommendation } = testStrategies[i];

        console.log(`\n\n🎯 WORKFLOW TEST ${i + 1}: ${strategy.name}`);
        console.log("═".repeat(70));

        const result = await runCompleteWorkflow(
            strategy,
            previousRecommendation
        );
        results.push(result);

        // Wait between tests to avoid rate limiting
        if (i < testStrategies.length - 1) {
            console.log("\n⏳ Waiting 3 seconds before next test...");
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }

    // Final summary
    console.log("\n\n📊 FINAL TEST SUMMARY");
    console.log("═".repeat(70));

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    console.log(`✅ Successful workflows: ${successful}/${results.length}`);
    console.log(`❌ Failed workflows: ${failed}/${results.length}`);

    if (failed > 0) {
        console.log("\n🚨 Failed workflow details:");
        results.forEach((result, index) => {
            if (!result.success) {
                console.log(
                    `  - Test ${index + 1} (${result.strategy.name}): ${
                        result.error
                    }`
                );
            }
        });
    }

    console.log("\n🎉 All workflow tests completed!");
    return results;
}

/**
 * Complete IoPulse Workflow with real-time updates
 * Same as runCompleteWorkflow but sends progress updates via callback
 * @param {string} strategy - Investment strategy description
 * @param {Object} previousRecommendation - Previous recommendation with timestamp (optional)
 * @param {Function} updateCallback - Callback function to send real-time updates
 * @returns {Object} - Complete workflow result
 */
async function runCompleteWorkflowWithUpdates(
    strategy,
    previousRecommendation = null,
    updateCallback
) {
    console.log(
        "🚀 Starting Complete IoPulse Multi-Agent Workflow with Real-time Updates..."
    );
    console.log("📋 Input Strategy:", JSON.stringify(strategy, null, 2));
    if (previousRecommendation) {
        console.log(
            "📝 Previous Recommendation:",
            JSON.stringify(previousRecommendation, null, 2)
        );
    }
    console.log("━".repeat(80));

    let currentWorkflowStep = 1;
    const workflowResults = {
        strategy: strategy,
        profile: null,
        candidates: null,
        analysis: null,
        finalAnalysis: null,
        recommendation: null,
        success: false,
        totalTime: 0,
        agentsUsed: [],
    };

    const workflowStart = Date.now();

    // Extract user's current token for the entire workflow
    const userToken = strategy.coin || "ETH";

    try {
        // Step 1: Investor Profile Agent
        console.log(
            `\n🎯 Step ${currentWorkflowStep}: Processing Investor Profile...`
        );
        updateCallback({
            type: "agent_start",
            agent: "Investor Profile Agent",
            step: currentWorkflowStep,
            message:
                "Analyzing investment strategy and creating investor profile...",
        });

        const step1Start = Date.now();
        const profileResult = await processInvestmentStrategy(strategy);
        const step1Time = Date.now() - step1Start;

        if (!profileResult.success) {
            throw new Error(`Profile Agent failed: ${profileResult.error}`);
        }

        workflowResults.profile = profileResult.profile;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Investor Profile Agent",
            success: true,
            time: step1Time,
            output: profileResult.profile,
        });

        updateCallback({
            type: "agent_complete",
            agent: "Investor Profile Agent",
            step: currentWorkflowStep - 1,
            output: profileResult.profile,
            time: step1Time,
            message: "Investor profile created successfully",
        });

        console.log("✅ Investor Profile Generated Successfully!");
        console.log(`⏱️ Time: ${step1Time}ms`);

        // Step 2: Market Screener Agent
        console.log(
            `\n🔍 Step ${currentWorkflowStep}: Processing Market Screening...`
        );
        updateCallback({
            type: "agent_start",
            agent: "Market Screener Agent",
            step: currentWorkflowStep,
            message: "Screening market for investment candidates...",
        });

        const step2Start = Date.now();
        const screeningResult = await processMarketScreening(
            profileResult.profile
        );
        const step2Time = Date.now() - step2Start;

        if (!screeningResult.success) {
            throw new Error(
                `Market Screener Agent failed: ${screeningResult.error}`
            );
        }

        workflowResults.candidates = screeningResult.candidates;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Market Screener Agent",
            success: true,
            time: step2Time,
            toolCalls: screeningResult.toolCallsCount || 0,
            output: screeningResult.candidates,
        });

        updateCallback({
            type: "agent_complete",
            agent: "Market Screener Agent",
            step: currentWorkflowStep - 1,
            output: screeningResult.candidates,
            time: step2Time,
            message: `Found ${screeningResult.candidates.length} investment candidates`,
        });

        console.log("✅ Market Screening Completed Successfully!");
        console.log(`⏱️ Time: ${step2Time}ms`);

        // Step 3: Quantitative Analysis Agent
        console.log(
            `\n📈 Step ${currentWorkflowStep}: Processing Quantitative Analysis...`
        );
        updateCallback({
            type: "agent_start",
            agent: "Quantitative Analysis Agent",
            step: currentWorkflowStep,
            message: "Performing quantitative analysis on candidates...",
        });

        const step3Start = Date.now();
        const analysisResult = await processQuantitativeAnalysis(
            screeningResult.candidates,
            userToken
        );
        const step3Time = Date.now() - step3Start;

        if (!analysisResult.success) {
            throw new Error(
                `Quantitative Analysis Agent failed: ${analysisResult.error}`
            );
        }

        workflowResults.analysis = analysisResult.analysis;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Quantitative Analysis Agent",
            success: true,
            time: step3Time,
            toolCalls: analysisResult.toolCallsCount || 0,
            output: analysisResult.analysis,
        });

        updateCallback({
            type: "agent_complete",
            agent: "Quantitative Analysis Agent",
            step: currentWorkflowStep - 1,
            output: analysisResult.analysis,
            time: step3Time,
            message: "Quantitative analysis completed with scores and metrics",
        });

        console.log("✅ Quantitative Analysis Completed Successfully!");
        console.log(`⏱️ Time: ${step3Time}ms`);

        // Step 4: Qualitative Due Diligence Agent
        console.log(
            `\n🔍 Step ${currentWorkflowStep}: Processing Qualitative Due Diligence...`
        );
        updateCallback({
            type: "agent_start",
            agent: "Qualitative Due Diligence Agent",
            step: currentWorkflowStep,
            message: "Conducting qualitative due diligence review...",
        });

        const step4Start = Date.now();
        const dueDiligenceResult = await processQualitativeDueDiligence(
            analysisResult.analysis,
            userToken
        );
        const step4Time = Date.now() - step4Start;

        if (!dueDiligenceResult.success) {
            throw new Error(
                `Qualitative Due Diligence Agent failed: ${dueDiligenceResult.error}`
            );
        }

        workflowResults.finalAnalysis = dueDiligenceResult.analysis;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Qualitative Due Diligence Agent",
            success: true,
            time: step4Time,
            toolCalls: dueDiligenceResult.toolCallsCount || 0,
            output: dueDiligenceResult.analysis,
        });

        updateCallback({
            type: "agent_complete",
            agent: "Qualitative Due Diligence Agent",
            step: currentWorkflowStep - 1,
            output: dueDiligenceResult.analysis,
            time: step4Time,
            message: "Qualitative due diligence assessment completed",
        });

        console.log("✅ Qualitative Due Diligence Completed Successfully!");
        console.log(`⏱️ Time: ${step4Time}ms`);

        // Step 5: Investment Committee Agent
        console.log(
            `\n🏛️ Step ${currentWorkflowStep}: Processing Investment Committee Decision...`
        );
        updateCallback({
            type: "agent_start",
            agent: "Investment Committee Agent",
            step: currentWorkflowStep,
            message: "Making final investment recommendation...",
        });

        const step5Start = Date.now();
        const committeeResult = await processInvestmentCommittee(
            dueDiligenceResult.analysis,
            userToken,
            previousRecommendation
        );
        const step5Time = Date.now() - step5Start;

        if (!committeeResult.success) {
            throw new Error(
                `Investment Committee Agent failed: ${committeeResult.error}`
            );
        }

        workflowResults.recommendation = committeeResult.recommendation;
        workflowResults.agentsUsed.push({
            step: currentWorkflowStep++,
            agent: "Investment Committee Agent",
            success: true,
            time: step5Time,
            output: committeeResult.recommendation,
        });

        updateCallback({
            type: "agent_complete",
            agent: "Investment Committee Agent",
            step: currentWorkflowStep - 1,
            output: committeeResult.recommendation,
            time: step5Time,
            message: "Final investment recommendation generated",
        });

        console.log("✅ Investment Committee Decision Completed Successfully!");
        console.log(`⏱️ Time: ${step5Time}ms`);

        // Workflow completed successfully
        workflowResults.totalTime = Date.now() - workflowStart;
        workflowResults.success = true;

        console.log("\n🎉 Complete IoPulse Workflow Successful!");
        console.log("━".repeat(80));
        console.log(`⏱️ Total Workflow Time: ${workflowResults.totalTime}ms`);
        console.log(`🤖 Agents Used: ${workflowResults.agentsUsed.length}`);

        return workflowResults;
    } catch (error) {
        console.error("❌ Complete Workflow Failed!");
        console.error("🚨 Error:", error.message);

        updateCallback({
            type: "agent_error",
            message: error.message,
            step: currentWorkflowStep,
        });

        workflowResults.totalTime = Date.now() - workflowStart;
        workflowResults.success = false;
        workflowResults.error = error.message;

        return workflowResults;
    }
}

// Helper function to save recommendation to database
async function saveRecommendationToDatabase(
    workflowResult,
    strategyData,
    userData
) {
    try {
        const Recommendation = require("../models/Recommendation");

        if (!workflowResult.success || !workflowResult.recommendation) {
            console.log(
                "⏭️ Skipping recommendation save - workflow failed or no recommendation"
            );
            return null;
        }

        const finalRecommendation = workflowResult.recommendation;

        // Determine action from recommendation text
        const action = finalRecommendation.recommendation
            .toLowerCase()
            .includes("don't swap")
            ? "HOLD"
            : finalRecommendation.recommendation.toLowerCase().includes("swap")
            ? "SWAP"
            : "HOLD";

        // Deactivate any existing recommendations for this strategy
        await Recommendation.updateMany(
            { strategy: strategyData._id, isActive: true },
            { isActive: false }
        );

        // Create new recommendation
        const newRecommendation = new Recommendation({
            strategy: strategyData._id,
            user: userData._id,
            recommendation: finalRecommendation.recommendation,
            action: action,
            confidence: 85, // Could be extracted from analysis
            explanation: finalRecommendation.explanation,
            executionTime: workflowResult.totalTime,
            agentsUsed: workflowResult.agentsUsed.length,
            analysisData: {
                profile: workflowResult.profile,
                candidates: workflowResult.candidates,
                quantitativeAnalysis: workflowResult.analysis,
                qualitativeAnalysis: workflowResult.finalAnalysis,
                totalTime: workflowResult.totalTime,
                agentsExecuted: workflowResult.agentsUsed,
            },
            status: "pending",
            isActive: true,
        });

        const savedRecommendation = await newRecommendation.save();
        console.log(
            "💾 Recommendation saved to database:",
            savedRecommendation._id
        );

        return savedRecommendation;
    } catch (error) {
        console.error("❌ Error saving recommendation to database:", error);
        return null;
    }
}

// Main execution
if (require.main === module) {
    runWorkflowTests().catch(console.error);
}

module.exports = {
    runCompleteWorkflow,
    runWorkflowTests,
    runCompleteWorkflowWithUpdates,
    saveRecommendationToDatabase,
};
