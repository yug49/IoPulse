const express = require("express");
const router = express.Router();
const Strategy = require("../models/Strategy");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Import the 5-agent workflow
const { runCompleteWorkflow } = require("../tests/complete_workflow");

/**
 * @route   POST /api/ai-recommendations/:strategyId/request
 * @desc    Request AI recommendation for a specific strategy
 * @access  Private
 */
router.post("/:strategyId/request", auth, async (req, res) => {
    try {
        const { strategyId } = req.params;
        const userId = req.user.id;

        console.log(
            `🤖 AI Recommendation requested for strategy: ${strategyId} by user: ${userId}`
        );

        // Find the strategy and ensure it belongs to the user
        const strategy = await Strategy.findOne({
            _id: strategyId,
            user: userId,
        });

        if (!strategy) {
            console.log(`❌ Strategy not found or unauthorized: ${strategyId}`);
            return res.status(404).json({
                success: false,
                message: "Strategy not found or unauthorized",
            });
        }

        // Prepare the strategy data for the AI workflow
        const workflowInput = {
            name: strategy.title,
            description: strategy.description,
            coin: strategy.coin,
            amount: strategy.currentAmount.toString(),
        };

        // Prepare previous recommendation context
        let previousRecommendation = null;
        if (
            strategy.lastObeyedRecommendation &&
            strategy.lastObeyedRecommendation.message !==
                "No recommendations followed yet"
        ) {
            previousRecommendation = {
                recommendation:
                    strategy.lastObeyedRecommendation.recommendation || "HOLD",
                timestamp:
                    strategy.lastObeyedRecommendation.timestamp ||
                    strategy.lastObeyedRecommendation.createdAt,
                original_duration: "1 day", // Default duration
                justification:
                    strategy.lastObeyedRecommendation.message ||
                    "Previous AI recommendation",
            };
        }

        console.log("📊 Workflow Input:", workflowInput);
        console.log("📝 Previous Recommendation:", previousRecommendation);

        // Start the AI workflow
        console.log("🚀 Starting 5-Agent AI Workflow...");
        const workflowResult = await runCompleteWorkflow(
            workflowInput,
            previousRecommendation
        );

        if (!workflowResult.success) {
            console.error("❌ Workflow failed:", workflowResult.error);

            // Determine the type of error and provide appropriate message
            let errorMessage = "AI analysis failed";
            let errorType = "workflow_error";

            if (workflowResult.error) {
                const errorStr = workflowResult.error.toLowerCase();

                if (
                    errorStr.includes("no content received") ||
                    errorStr.includes("api response") ||
                    errorStr.includes("network") ||
                    errorStr.includes("connection") ||
                    errorStr.includes("timeout")
                ) {
                    errorMessage =
                        "Connectivity issues with AI services. Please check your internet connection and try again.";
                    errorType = "connectivity_error";
                } else if (
                    errorStr.includes("api key") ||
                    errorStr.includes("authorization")
                ) {
                    errorMessage =
                        "AI service authorization failed. Please contact support.";
                    errorType = "auth_error";
                } else if (
                    errorStr.includes("rate limit") ||
                    errorStr.includes("quota")
                ) {
                    errorMessage =
                        "AI service temporarily unavailable due to high demand. Please try again in a few minutes.";
                    errorType = "rate_limit_error";
                } else {
                    errorMessage = `AI analysis failed: ${workflowResult.error}`;
                    errorType = "analysis_error";
                }
            }

            return res.status(500).json({
                success: false,
                message: errorMessage,
                errorType: errorType,
                error: workflowResult.error,
                workflowResult: workflowResult,
            });
        }

        console.log("✅ Workflow completed successfully!");

        // Extract the final recommendation
        const finalRecommendation = workflowResult.recommendation;
        const analysisData = {
            profile: workflowResult.profile,
            candidates: workflowResult.candidates,
            quantitativeAnalysis: workflowResult.analysis,
            qualitativeAnalysis: workflowResult.finalAnalysis,
            recommendation: finalRecommendation,
            totalTime: workflowResult.totalTime,
            agentsUsed: workflowResult.agentsUsed,
        };

        // Create a comprehensive notification for the strategy
        const notificationData = {
            message: finalRecommendation.explanation,
            recommendation: finalRecommendation.recommendation
                .toLowerCase()
                .includes("don't swap")
                ? "hold"
                : finalRecommendation.recommendation
                      .toLowerCase()
                      .includes("swap")
                ? "swap"
                : "hold",
            confidence: 85, // Default confidence, could be extracted from AI analysis
            priceAtRecommendation: 0, // Would need to be fetched from current market data
            aiAnalysisData: analysisData,
            workflowExecutionTime: workflowResult.totalTime,
        };

        // Add the notification to the strategy
        await strategy.addNotification(notificationData);

        // Return the complete analysis result
        res.json({
            success: true,
            message: "AI recommendation generated successfully",
            data: {
                strategyId: strategy._id,
                recommendation: finalRecommendation,
                analysisData: analysisData,
                executionTime: workflowResult.totalTime,
                agentsExecuted: workflowResult.agentsUsed.length,
                notification: strategy.latestNotification,
            },
        });
    } catch (error) {
        console.error("❌ Error processing AI recommendation:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during AI analysis",
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/ai-recommendations/:strategyId/status
 * @desc    Get the status of the latest AI recommendation for a strategy
 * @access  Private
 */
router.get("/:strategyId/status", auth, async (req, res) => {
    try {
        const { strategyId } = req.params;
        const userId = req.user.id;

        const strategy = await Strategy.findOne({
            _id: strategyId,
            user: userId,
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Strategy not found or unauthorized",
            });
        }

        // Get the latest notification which should contain AI analysis data
        const latestNotification = strategy.latestNotification;

        if (!latestNotification || !latestNotification.aiAnalysisData) {
            return res.json({
                success: true,
                message: "No AI analysis found for this strategy",
                data: {
                    hasAnalysis: false,
                    strategyId: strategy._id,
                },
            });
        }

        res.json({
            success: true,
            message: "AI analysis status retrieved",
            data: {
                hasAnalysis: true,
                strategyId: strategy._id,
                latestAnalysis: latestNotification.aiAnalysisData,
                recommendation:
                    latestNotification.aiAnalysisData.recommendation,
                executionTime: latestNotification.workflowExecutionTime,
                createdAt: latestNotification.createdAt,
            },
        });
    } catch (error) {
        console.error("Error getting AI recommendation status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

module.exports = router;
