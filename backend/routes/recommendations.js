const express = require("express");
const router = express.Router();
const Recommendation = require("../models/Recommendation");
const Strategy = require("../models/Strategy");
const auth = require("../middleware/auth");

/**
 * @route   GET /api/recommendations
 * @desc    Get all recommendations for the authenticated user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query; // Optional status filter

        console.log(`📋 Fetching recommendations for user: ${userId}`);

        const recommendations = await Recommendation.getForUser(userId, status);

        res.json({
            success: true,
            message: "Recommendations fetched successfully",
            data: recommendations,
            count: recommendations.length,
        });
    } catch (error) {
        console.error("❌ Error fetching recommendations:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/recommendations/:strategyId
 * @desc    Get the latest recommendation for a specific strategy
 * @access  Private
 */
router.get("/:strategyId", auth, async (req, res) => {
    try {
        const { strategyId } = req.params;
        const userId = req.user.id;

        console.log(
            `📋 Fetching latest recommendation for strategy: ${strategyId}`
        );

        // Verify strategy belongs to user
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

        const recommendation = await Recommendation.getLatestForStrategy(
            strategyId
        );

        if (!recommendation) {
            return res.json({
                success: true,
                message: "No recommendations found for this strategy",
                data: null,
            });
        }

        res.json({
            success: true,
            message: "Recommendation fetched successfully",
            data: recommendation,
        });
    } catch (error) {
        console.error("❌ Error fetching recommendation:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/recommendations/:recommendationId/respond
 * @desc    Respond to a recommendation (accept/reject)
 * @access  Private
 */
router.post("/:recommendationId/respond", auth, async (req, res) => {
    try {
        const { recommendationId } = req.params;
        const { response, notes } = req.body; // response: 'accepted' or 'rejected'
        const userId = req.user.id;

        console.log(
            `📝 User ${userId} responding to recommendation ${recommendationId}: ${response}`
        );

        // Find the recommendation and verify ownership
        const recommendation = await Recommendation.findById(recommendationId)
            .populate("strategy")
            .populate("user");

        if (!recommendation) {
            return res.status(404).json({
                success: false,
                message: "Recommendation not found",
            });
        }

        if (recommendation.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to respond to this recommendation",
            });
        }

        if (recommendation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Recommendation has already been responded to",
            });
        }

        // Update recommendation based on response
        if (response === "accepted") {
            await recommendation.accept(notes);
        } else if (response === "rejected") {
            await recommendation.reject(notes);
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid response. Must be 'accepted' or 'rejected'",
            });
        }

        const updatedRecommendation = await Recommendation.findById(
            recommendationId
        )
            .populate("strategy", "title coin")
            .populate("user", "username email");

        res.json({
            success: true,
            message: `Recommendation ${response} successfully`,
            data: updatedRecommendation,
        });
    } catch (error) {
        console.error("❌ Error responding to recommendation:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * @route   DELETE /api/recommendations/:recommendationId
 * @desc    Delete (deactivate) a recommendation
 * @access  Private
 */
router.delete("/:recommendationId", auth, async (req, res) => {
    try {
        const { recommendationId } = req.params;
        const userId = req.user.id;

        console.log(
            `🗑️ User ${userId} deleting recommendation ${recommendationId}`
        );

        // Find the recommendation and verify ownership
        const recommendation = await Recommendation.findById(recommendationId);

        if (!recommendation) {
            return res.status(404).json({
                success: false,
                message: "Recommendation not found",
            });
        }

        if (recommendation.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to delete this recommendation",
            });
        }

        // Deactivate instead of actually deleting
        recommendation.isActive = false;
        await recommendation.save();

        res.json({
            success: true,
            message: "Recommendation deleted successfully",
        });
    } catch (error) {
        console.error("❌ Error deleting recommendation:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

module.exports = router;
