const express = require("express");
const router = express.Router();
const History = require("../models/History");
const Strategy = require("../models/Strategy");
const auth = require("../middleware/auth");

/**
 * @route   GET /api/history/strategy/:strategyId
 * @desc    Get history for a specific strategy
 * @access  Private
 */
router.get("/strategy/:strategyId", auth, async (req, res) => {
    try {
        const { strategyId } = req.params;
        const userId = req.user.id;
        const { limit = 50, page = 1 } = req.query;

        console.log(`📋 Fetching history for strategy: ${strategyId}`);

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

        const skip = (page - 1) * limit;
        const history = await History.find({ strategy: strategyId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate("user", "username email")
            .populate("strategy", "title coin");

        const totalCount = await History.countDocuments({
            strategy: strategyId,
        });

        res.json({
            success: true,
            message: "Strategy history fetched successfully",
            data: history,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("❌ Error fetching strategy history:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/history/user
 * @desc    Get history for the current user
 * @access  Private
 */
router.get("/user", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 100, page = 1, eventType } = req.query;

        console.log(`📋 Fetching user history for: ${userId}`);

        const filter = { user: userId };
        if (eventType) {
            filter.eventType = eventType;
        }

        const skip = (page - 1) * limit;
        const history = await History.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate("strategy", "title coin")
            .populate("user", "username email");

        const totalCount = await History.countDocuments(filter);

        res.json({
            success: true,
            message: "User history fetched successfully",
            data: history,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("❌ Error fetching user history:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/history
 * @desc    Create a new history entry (internal use)
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const historyData = {
            ...req.body,
            user: userId,
        };

        console.log(`📝 Creating history entry:`, historyData.eventType);

        const history = await History.createEntry(historyData);

        res.status(201).json({
            success: true,
            message: "History entry created successfully",
            data: history,
        });
    } catch (error) {
        console.error("❌ Error creating history entry:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

module.exports = router;
