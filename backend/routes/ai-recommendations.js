const express = require("express");
const router = express.Router();
const Strategy = require("../models/Strategy");
const User = require("../models/User");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");

// Import the 5-agent workflow
const {
    runCompleteWorkflow,
    runCompleteWorkflowWithUpdates,
} = require("../tests/complete_workflow");

/**
 * @route   GET /api/ai-recommendations/:strategyId/request-stream
 * @desc    Request AI recommendation for a specific strategy with real-time updates (SSE)
 * @access  Private
 */
router.get("/:strategyId/request-stream", async (req, res) => {
    try {
        const { strategyId } = req.params;
        const { token } = req.query; // Get token from query params for SSE

        // Verify the token
        if (!token) {
            return res
                .status(401)
                .json({ message: "Access denied. No token provided." });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ message: "Invalid token." });
        }

        console.log(
            `🤖 AI Recommendation SSE requested for strategy: ${strategyId} by user: ${userId}`
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

        // Set up Server-Sent Events
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        });

        // Send initial message
        res.write(
            `data: ${JSON.stringify({
                type: "init",
                message: "Starting AI workflow...",
            })}\n\n`
        );

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

        // Start the AI workflow with real-time progress updates
        console.log("🚀 Starting 5-Agent AI Workflow...");
        const workflowResult = await runCompleteWorkflowWithUpdates(
            workflowInput,
            previousRecommendation,
            (update) => {
                // Send real-time updates to frontend
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
        );

        if (!workflowResult.success) {
            console.error("❌ Workflow failed:", workflowResult.error);

            // Send error update
            res.write(
                `data: ${JSON.stringify({
                    type: "error",
                    message: workflowResult.error,
                    errorType: "workflow_error",
                })}\n\n`
            );

            res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
            res.end();
            return;
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

        // Send final completion message
        res.write(
            `data: ${JSON.stringify({
                type: "complete",
                data: {
                    strategyId: strategy._id,
                    recommendation: finalRecommendation,
                    analysisData: analysisData,
                    executionTime: workflowResult.totalTime,
                    agentsExecuted: workflowResult.agentsUsed.length,
                    notification: strategy.latestNotification,
                },
            })}\n\n`
        );

        res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
        res.end();
    } catch (error) {
        console.error("❌ Error processing AI recommendation:", error);

        res.write(
            `data: ${JSON.stringify({
                type: "error",
                message: error.message,
                errorType: "server_error",
            })}\n\n`
        );

        res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
        res.end();
    }
});

/**
 * @route   POST /api/ai-recommendations/:strategyId/request
 * @desc    Request AI recommendation for a specific strategy with real-time updates
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

        // Set up Server-Sent Events
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        });

        // Send initial message
        res.write(
            `data: ${JSON.stringify({
                type: "init",
                message: "Starting AI workflow...",
            })}\n\n`
        );

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

        // Start the AI workflow with real-time progress updates
        console.log("🚀 Starting 5-Agent AI Workflow...");
        const workflowResult = await runCompleteWorkflowWithUpdates(
            workflowInput,
            previousRecommendation,
            (update) => {
                // Send real-time updates to frontend
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
        );

        if (!workflowResult.success) {
            console.error("❌ Workflow failed:", workflowResult.error);

            // Send error update
            res.write(
                `data: ${JSON.stringify({
                    type: "error",
                    message: workflowResult.error,
                    errorType: "workflow_error",
                })}\n\n`
            );

            res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
            res.end();
            return;
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

        // Send final completion message
        res.write(
            `data: ${JSON.stringify({
                type: "complete",
                data: {
                    strategyId: strategy._id,
                    recommendation: finalRecommendation,
                    analysisData: analysisData,
                    executionTime: workflowResult.totalTime,
                    agentsExecuted: workflowResult.agentsUsed.length,
                    notification: strategy.latestNotification,
                },
            })}\n\n`
        );

        res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
        res.end();
    } catch (error) {
        console.error("❌ Error processing AI recommendation:", error);

        res.write(
            `data: ${JSON.stringify({
                type: "error",
                message: error.message,
                errorType: "server_error",
            })}\n\n`
        );

        res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
        res.end();
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
