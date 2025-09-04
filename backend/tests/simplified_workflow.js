#!/usr/bin/env node

/**
 * IoPulse Simplified 2-Agent Workflow
 *
 * This script demonstrates the simplified workflow with 2 agents:
 * 1. Analysis Agent (Magistral-Small-2506) - Comprehensive crypto market analysis
 * 2. Decision Agent (Qwen Thinking) - Final investment recommendation
 */

const { ionetClient, MODELS } = require("../config/ionet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Model configuration
const ANALYSIS_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
const DECISION_MODEL = "meta-llama/Llama-3.3-70B-Instruct";

/**
 * Agent 1: Analysis Agent (Llama-3.3-70B-Instruct)
 * Performs comprehensive cryptocurrency market analysis
 */
async function processAnalysisAgent(strategy) {
    console.log("🔍 Starting Analysis Agent (Llama-3.3-70B-Instruct)...");
    console.log("📊 Input Strategy:", JSON.stringify(strategy, null, 2));

    const ANALYSIS_INSTRUCTIONS = `You are a cryptocurrency market analysis expert. Your task is to analyze the current market and provide comprehensive insights based on the investment strategy.

INPUT: Investment strategy with current holding and preferences
OUTPUT: Detailed market analysis in JSON format

ANALYSIS REQUIREMENTS:
1. Market overview and current trends
2. Analysis of user's current holding
3. Alternative cryptocurrency opportunities
4. Risk assessment and market conditions
5. Quantitative and qualitative scores for top candidates

Based on the strategy provided, use your extensive cryptocurrency market knowledge to:
- Thoroughly evaluate the user's current holding performance and prospects
- Assess whether the current holding still has strong potential
- Identify 10-15 alternative cryptocurrencies that match the profile
- Compare alternatives against the current holding fairly
- Assess market conditions and trends
- Provide quantitative scores (1-10) for growth potential
- Provide qualitative scores (1-10) for risk assessment
- Consider both holding the current coin and exploring alternatives

REQUIRED JSON OUTPUT FORMAT:
{
  "market_overview": "Current market conditions and trends",
  "current_holding_analysis": {
    "symbol": "user's current token",
    "performance_assessment": "detailed analysis",
    "quant_score": number,
    "qualitative_score": number
  },
  "alternative_opportunities": [
    {
      "symbol": "TOKEN_SYMBOL",
      "reason": "why this token is recommended",
      "quant_score": number,
      "qualitative_score": number,
      "market_cap_category": "low/mid/high",
      "risk_level": "low/medium/high"
    }
  ],
  "market_conditions": "overall market sentiment and key factors"
}

Important: Use only your built-in cryptocurrency market knowledge. No external tools or mock data.`;

    try {
        const response = await ionetClient.chat.completions.create({
            model: ANALYSIS_MODEL,
            messages: [
                {
                    role: "system",
                    content: ANALYSIS_INSTRUCTIONS,
                },
                {
                    role: "user",
                    content: `Analyze the cryptocurrency market based on this investment strategy:

Strategy: ${JSON.stringify(strategy)}

Provide a comprehensive analysis with quantitative and qualitative scores for the user's current holding and potential alternatives. Focus on current market conditions and realistic investment opportunities.

Respond with ONLY the JSON object as specified in the format above.`,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        });

        const agentResponse = response.choices[0].message.content;
        console.log("✅ Analysis Agent completed!");
        console.log(
            "📋 Analysis Response preview:",
            agentResponse.substring(0, 200) + "..."
        );

        // Parse JSON response
        let analysisResult = null;
        try {
            analysisResult = JSON.parse(agentResponse);
        } catch (parseError) {
            // Try to extract JSON from the response
            const jsonMatch = agentResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Failed to parse analysis response as JSON");
            }
        }

        return {
            success: true,
            analysis: analysisResult,
            rawResponse: agentResponse,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Analysis Agent failed:", error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Agent 2: Decision Agent (Llama-3.3-70B-Instruct)
 * Makes final investment recommendation based on analysis
 */
async function processDecisionAgent(
    analysisResult,
    userToken,
    previousRecommendation = null
) {
    console.log("🏛️ Starting Decision Agent (Llama-3.3-70B-Instruct)...");
    console.log("💰 User's Current Token:", userToken);

    const DECISION_INSTRUCTIONS = `You are an investment decision committee making final cryptocurrency investment recommendations.

Your task is to analyze the provided market analysis and make a clear investment decision.

CRITICAL RULES:
1. Your response must be ONLY valid JSON
2. NO explanations, reasoning, or other text outside the JSON
3. NO markdown code blocks
4. Start with { and end with }

DECISION PROCESS:
- Review the comprehensive market analysis provided
- Compare user's current holding against alternatives
- Consider market conditions and risk factors
- If a previous recommendation exists, evaluate its performance and whether to continue or change
- Make a clear decision: hold current position or swap to better alternative
- Consider both continuing current holdings and exploring new opportunities
- When previous recommendation was to hold the same coin, evaluate if conditions have changed
- Factor in the timing and performance of any previous recommendations

REQUIRED JSON FORMAT:
{
  "recommendation": "Swap [Current] for [New] and hold for [period]" OR "Don't swap anything and hold [Current] for more [period]",
  "explanation": "Brief reason for the decision based on analysis"
}

RECOMMENDATION FORMAT RULES:
- For swaps: "Swap ETH for RENDER and hold for 2-4 weeks"
- For holds: "Don't swap anything and hold ETH for more 1-2 weeks"
- Always include specific time periods (days/weeks/months)
- Must start with either "Swap" or "Don't swap anything"

EXAMPLES:
{"recommendation": "Swap ETH for SOL and hold for 3-5 weeks", "explanation": "SOL shows superior growth potential with strong ecosystem development"}
{"recommendation": "Don't swap anything and hold BTC for more 2-3 weeks", "explanation": "BTC maintains strong position despite market volatility"}`;

    try {
        const response = await ionetClient.chat.completions.create({
            model: DECISION_MODEL,
            messages: [
                {
                    role: "system",
                    content: DECISION_INSTRUCTIONS,
                },
                {
                    role: "user",
                    content: `RESPOND WITH ONLY JSON. NO TEXT OUTSIDE JSON.

Current holding: ${userToken}
${
    previousRecommendation
        ? `Previous recommendation: ${JSON.stringify(previousRecommendation)}
IMPORTANT: Consider this previous recommendation when making your decision. If the previous recommendation was successful or still valid, you may choose to continue holding the current coin.`
        : "No previous recommendation"
}

Market Analysis Data:
${JSON.stringify(analysisResult, null, 2)}

Based on this analysis and any previous recommendation context, make your investment decision. Consider the scores, market conditions, risk factors, and the performance/validity of any previous recommendations.

RESPOND WITH ONLY THE JSON OBJECT:`,
                },
            ],
            temperature: 0.0,
            max_tokens: 300,
        });

        // Extract response - handle both content and reasoning_content
        let agentResponse = response.choices[0].message.content;
        if (!agentResponse && response.choices[0].message.reasoning_content) {
            agentResponse = response.choices[0].message.reasoning_content;
        }

        console.log("📋 Decision Response:", agentResponse?.substring(0, 200));

        let recommendation = null;

        // Parse JSON response
        if (agentResponse) {
            let cleanResponse = agentResponse.trim();

            // Look for JSON object in the response
            const jsonMatch = cleanResponse.match(
                /\{[^{}]*"recommendation"[^{}]*\}/
            );
            if (jsonMatch) {
                try {
                    recommendation = JSON.parse(jsonMatch[0]);
                    console.log("✅ Successfully parsed JSON recommendation");
                } catch (parseError) {
                    console.log(
                        "⚠️ Failed to parse extracted JSON:",
                        parseError.message
                    );
                }
            } else {
                // Try parsing the entire response
                try {
                    recommendation = JSON.parse(cleanResponse);
                    console.log("✅ Successfully parsed full JSON response");
                } catch (parseError) {
                    console.log(
                        "⚠️ Failed to parse full JSON:",
                        parseError.message
                    );
                    console.log(
                        "📋 Raw response for debugging:",
                        cleanResponse
                    );
                }
            }
        }

        if (!recommendation || !recommendation.recommendation) {
            throw new Error(
                "Decision Agent failed to generate valid recommendation format"
            );
        }

        return {
            success: true,
            recommendation: recommendation,
            rawResponse: agentResponse,
            usage: response.usage,
        };
    } catch (error) {
        console.error("❌ Decision Agent failed:", error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Complete Simplified 2-Agent Workflow:
 * 1. Analysis Agent (Llama-3.3-70B-Instruct) - Comprehensive market analysis
 * 2. Decision Agent (Llama-3.3-70B-Instruct) - Final investment recommendation
 * @param {Object} strategy - Investment strategy with user preferences
 * @param {Object} previousRecommendation - Previous recommendation with timestamp (optional)
 * @returns {Object} - Complete workflow result
 */
async function runSimplifiedWorkflow(strategy, previousRecommendation = null) {
    console.log("🚀 Starting Simplified 2-Agent Workflow...");
    console.log("📋 Input Strategy:", JSON.stringify(strategy, null, 2));
    if (previousRecommendation) {
        console.log(
            "📝 Previous Recommendation:",
            JSON.stringify(previousRecommendation, null, 2)
        );
    }
    console.log("━".repeat(80));

    const workflowResults = {
        strategy: strategy,
        analysis: null,
        recommendation: null,
        success: false,
        totalTime: 0,
        agentsUsed: [],
    };

    const workflowStart = Date.now();
    const userToken = strategy.coin || "ETH";

    try {
        // Step 1: Analysis Agent (Magistral-Small-2506)
        console.log("\n🔍 Step 1: Running Analysis Agent...");
        const step1Start = Date.now();

        const analysisResult = await processAnalysisAgent(strategy);
        const step1Time = Date.now() - step1Start;

        if (!analysisResult.success) {
            throw new Error(`Analysis Agent failed: ${analysisResult.error}`);
        }

        workflowResults.analysis = analysisResult.analysis;
        workflowResults.agentsUsed.push({
            step: 1,
            agent: "Analysis Agent (Llama-3.3-70B-Instruct)",
            success: true,
            time: step1Time,
        });

        console.log("✅ Analysis Agent completed successfully!");
        console.log(`⏱️ Time: ${step1Time}ms`);

        // Step 2: Decision Agent (Qwen Thinking)
        console.log("\n🏛️ Step 2: Running Decision Agent...");
        const step2Start = Date.now();

        const decisionResult = await processDecisionAgent(
            analysisResult.analysis,
            userToken,
            previousRecommendation
        );
        const step2Time = Date.now() - step2Start;

        if (!decisionResult.success) {
            throw new Error(`Decision Agent failed: ${decisionResult.error}`);
        }

        workflowResults.recommendation = decisionResult.recommendation;
        workflowResults.agentsUsed.push({
            step: 2,
            agent: "Decision Agent (Llama-3.3-70B-Instruct)",
            success: true,
            time: step2Time,
        });

        console.log("✅ Decision Agent completed successfully!");
        console.log(`⏱️ Time: ${step2Time}ms`);

        // Complete workflow
        workflowResults.success = true;
        workflowResults.totalTime = Date.now() - workflowStart;

        console.log("\n🎉 Simplified Workflow Completed Successfully!");
        console.log(`⏱️ Total Time: ${workflowResults.totalTime}ms`);
        console.log("🔧 Agents Used:", workflowResults.agentsUsed.length);
        console.log(
            "📊 Final Recommendation:",
            JSON.stringify(workflowResults.recommendation, null, 2)
        );

        return workflowResults;
    } catch (error) {
        console.error("❌ Simplified Workflow Failed!");
        console.error("🚨 Error:", error.message);
        workflowResults.error = error.message;
        workflowResults.totalTime = Date.now() - workflowStart;
        return workflowResults;
    }
}

// Test function
async function runSimplifiedWorkflowTests() {
    console.log("🧪 Testing Simplified 2-Agent Workflow...");
    console.log("━".repeat(80));

    const testStrategy = {
        coin: "MATIC",
        strategy:
            "I want to invest in DeFi and gaming tokens with medium risk tolerance. Looking for medium-term growth opportunities in the 2-6 month timeframe.",
        risk_tolerance: "medium",
        investment_horizon: "medium-term",
        preferred_sectors: ["DeFi", "Gaming"],
    };

    try {
        const result = await runSimplifiedWorkflow(testStrategy);

        if (result.success) {
            console.log("\n✅ Test Passed!");
            console.log(
                "📊 Analysis Preview:",
                JSON.stringify(
                    result.analysis?.market_overview?.substring(0, 100)
                )
            );
            console.log("🎯 Final Recommendation:", result.recommendation);
        } else {
            console.log("\n❌ Test Failed:", result.error);
        }
    } catch (error) {
        console.error("❌ Test Error:", error.message);
    }
}

/**
 * Complete Simplified 2-Agent Workflow with Real-time Updates:
 * Sends progress updates via callback for SSE streaming
 * @param {Object} strategy - Investment strategy with user preferences
 * @param {Object} previousRecommendation - Previous recommendation with timestamp (optional)
 * @param {Function} progressCallback - Callback function for real-time updates
 * @returns {Object} - Complete workflow result
 */
async function runSimplifiedWorkflowWithUpdates(
    strategy,
    previousRecommendation = null,
    progressCallback = null
) {
    console.log(
        "🚀 Starting Simplified 2-Agent Workflow with Real-time Updates..."
    );
    console.log("📋 Input Strategy:", JSON.stringify(strategy, null, 2));
    if (previousRecommendation) {
        console.log(
            "📝 Previous Recommendation:",
            JSON.stringify(previousRecommendation, null, 2)
        );
    }
    console.log("━".repeat(80));

    const workflowResults = {
        strategy: strategy,
        analysis: null,
        recommendation: null,
        success: false,
        totalTime: 0,
        agentsUsed: [],
    };

    const workflowStart = Date.now();
    const userToken = strategy.coin || "ETH";

    // Send initial update
    if (progressCallback) {
        progressCallback({
            type: "workflow_start",
            message: "Starting simplified 2-agent AI workflow...",
            timestamp: new Date().toISOString(),
            step: 0,
            totalSteps: 2,
        });
    }

    try {
        // Step 1: Analysis Agent (Llama-3.3-70B-Instruct)
        console.log("\n🔍 Step 1: Running Analysis Agent...");
        if (progressCallback) {
            progressCallback({
                type: "step_start",
                message: "Running Analysis Agent (Llama-3.3-70B-Instruct)...",
                timestamp: new Date().toISOString(),
                step: 1,
                totalSteps: 2,
            });
        }

        const step1Start = Date.now();
        const analysisResult = await processAnalysisAgent(strategy);
        const step1Time = Date.now() - step1Start;

        if (!analysisResult.success) {
            throw new Error(`Analysis Agent failed: ${analysisResult.error}`);
        }

        workflowResults.analysis = analysisResult.analysis;
        workflowResults.agentsUsed.push({
            step: 1,
            agent: "Analysis Agent (Llama-3.3-70B-Instruct)",
            success: true,
            time: step1Time,
        });

        console.log("✅ Analysis Agent completed successfully!");
        console.log(`⏱️ Time: ${step1Time}ms`);

        if (progressCallback) {
            progressCallback({
                type: "step_complete",
                message: "Analysis Agent completed successfully!",
                timestamp: new Date().toISOString(),
                step: 1,
                totalSteps: 2,
                stepTime: step1Time,
            });
        }

        // Step 2: Decision Agent (Llama-3.3-70B-Instruct)
        console.log("\n🏛️ Step 2: Running Decision Agent...");
        if (progressCallback) {
            progressCallback({
                type: "step_start",
                message: "Running Decision Agent (Llama-3.3-70B-Instruct)...",
                timestamp: new Date().toISOString(),
                step: 2,
                totalSteps: 2,
            });
        }

        const step2Start = Date.now();
        const decisionResult = await processDecisionAgent(
            analysisResult.analysis,
            userToken,
            previousRecommendation
        );
        const step2Time = Date.now() - step2Start;

        if (!decisionResult.success) {
            throw new Error(`Decision Agent failed: ${decisionResult.error}`);
        }

        workflowResults.recommendation = decisionResult.recommendation;
        workflowResults.agentsUsed.push({
            step: 2,
            agent: "Decision Agent (Llama-3.3-70B-Instruct)",
            success: true,
            time: step2Time,
        });

        console.log("✅ Decision Agent completed successfully!");
        console.log(`⏱️ Time: ${step2Time}ms`);

        if (progressCallback) {
            progressCallback({
                type: "step_complete",
                message: "Decision Agent completed successfully!",
                timestamp: new Date().toISOString(),
                step: 2,
                totalSteps: 2,
                stepTime: step2Time,
            });
        }

        // Complete workflow
        workflowResults.success = true;
        workflowResults.totalTime = Date.now() - workflowStart;

        console.log("\n🎉 Simplified Workflow Completed Successfully!");
        console.log(`⏱️ Total Time: ${workflowResults.totalTime}ms`);
        console.log("🔧 Agents Used:", workflowResults.agentsUsed.length);
        console.log(
            "📊 Final Recommendation:",
            JSON.stringify(workflowResults.recommendation, null, 2)
        );

        if (progressCallback) {
            progressCallback({
                type: "workflow_complete",
                message: "Simplified workflow completed successfully!",
                timestamp: new Date().toISOString(),
                totalTime: workflowResults.totalTime,
                recommendation: workflowResults.recommendation,
            });
        }

        return workflowResults;
    } catch (error) {
        console.error("❌ Simplified Workflow Failed!");
        console.error("🚨 Error:", error.message);
        workflowResults.error = error.message;
        workflowResults.totalTime = Date.now() - workflowStart;

        if (progressCallback) {
            progressCallback({
                type: "workflow_error",
                message: `Workflow failed: ${error.message}`,
                timestamp: new Date().toISOString(),
                error: error.message,
            });
        }

        return workflowResults;
    }
}

// Export functions
module.exports = {
    runSimplifiedWorkflow,
    runSimplifiedWorkflowWithUpdates,
    processAnalysisAgent,
    processDecisionAgent,
};

// Run tests if this file is executed directly
if (require.main === module) {
    runSimplifiedWorkflowTests().catch(console.error);
}
