const express = require("express");
const { body, validationResult } = require("express-validator");
const Strategy = require("../models/Strategy");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        );
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. User not found.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token.",
        });
    }
};

// @route   GET /api/strategies
// @desc    Get all strategies for the authenticated user
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
    try {
        const strategies = await Strategy.find({ user: req.user._id })
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: strategies.length,
            data: strategies,
        });
    } catch (error) {
        console.error("Get strategies error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching strategies",
        });
    }
});

// @route   GET /api/strategies/:id
// @desc    Get a single strategy by ID
// @access  Private
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).populate("user", "name email");

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Strategy not found",
            });
        }

        res.json({
            success: true,
            data: strategy,
        });
    } catch (error) {
        console.error("Get strategy error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching strategy",
        });
    }
});

// @route   POST /api/strategies
// @desc    Create a new strategy
// @access  Private
router.post(
    "/",
    [
        authenticateToken,
        body("title").notEmpty().withMessage("Title is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("coin").notEmpty().withMessage("Coin is required"),
        body("initialAmount")
            .isNumeric()
            .withMessage("Initial amount must be a number"),
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const { title, description, coin, initialAmount } = req.body;

            // Create new strategy
            const strategy = new Strategy({
                title: title.trim(),
                description: description.trim(),
                coin: coin.trim().toUpperCase(),
                initialAmount: parseFloat(initialAmount),
                currentAmount: parseFloat(initialAmount),
                user: req.user._id,
            });

            await strategy.save();

            // Add strategy to user's strategies array
            req.user.strategies.push(strategy._id);

            // Add initial holding to user
            await req.user.updateHolding(
                strategy.coin,
                strategy.initialAmount,
                strategy._id
            );

            await req.user.save();

            // Populate user data for response
            await strategy.populate("user", "name email");

            res.status(201).json({
                success: true,
                message: "Strategy created successfully",
                data: strategy,
            });
        } catch (error) {
            console.error("Create strategy error:", error);
            res.status(500).json({
                success: false,
                message: "Error creating strategy",
            });
        }
    }
);

// @route   PUT /api/strategies/:id
// @desc    Update a strategy
// @access  Private
router.put(
    "/:id",
    [
        authenticateToken,
        body("title")
            .optional()
            .notEmpty()
            .withMessage("Title cannot be empty"),
        body("description")
            .optional()
            .notEmpty()
            .withMessage("Description cannot be empty"),
        body("initialAmount")
            .optional()
            .isNumeric()
            .withMessage("Initial amount must be a number"),
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const strategy = await Strategy.findOne({
                _id: req.params.id,
                user: req.user._id,
            });

            if (!strategy) {
                return res.status(404).json({
                    success: false,
                    message: "Strategy not found",
                });
            }

            const { title, description, initialAmount, status } = req.body;

            // Update fields if provided
            if (title) strategy.title = title.trim();
            if (description) strategy.description = description.trim();
            if (status) strategy.status = status;

            // Handle amount update
            if (initialAmount !== undefined) {
                const oldAmount = strategy.initialAmount;
                const newAmount = parseFloat(initialAmount);
                const amountDifference = newAmount - oldAmount;

                strategy.initialAmount = newAmount;
                strategy.currentAmount += amountDifference;

                // Update user's holding
                await req.user.updateHolding(
                    strategy.coin,
                    strategy.currentAmount,
                    strategy._id
                );
            }

            await strategy.save();
            await strategy.populate("user", "name email");

            res.json({
                success: true,
                message: "Strategy updated successfully",
                data: strategy,
            });
        } catch (error) {
            console.error("Update strategy error:", error);
            res.status(500).json({
                success: false,
                message: "Error updating strategy",
            });
        }
    }
);

// @route   DELETE /api/strategies/:id
// @desc    Delete a strategy
// @access  Private
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Strategy not found",
            });
        }

        // Remove strategy from user's strategies array
        req.user.strategies.pull(strategy._id);

        // Remove associated holdings
        req.user.holdings = req.user.holdings.filter(
            (h) => h.strategy.toString() !== strategy._id.toString()
        );

        await req.user.save();
        await Strategy.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Strategy deleted successfully",
        });
    } catch (error) {
        console.error("Delete strategy error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting strategy",
        });
    }
});

// @route   POST /api/strategies/:id/notifications
// @desc    Add a notification to a strategy
// @access  Private
router.post(
    "/:id/notifications",
    [
        authenticateToken,
        body("message").notEmpty().withMessage("Message is required"),
        body("recommendation")
            .isIn(["buy", "sell", "hold"])
            .withMessage("Invalid recommendation"),
        body("confidence")
            .isInt({ min: 0, max: 100 })
            .withMessage("Confidence must be between 0 and 100"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const strategy = await Strategy.findOne({
                _id: req.params.id,
                user: req.user._id,
            });

            if (!strategy) {
                return res.status(404).json({
                    success: false,
                    message: "Strategy not found",
                });
            }

            const {
                message,
                recommendation,
                confidence,
                priceAtRecommendation,
            } = req.body;

            await strategy.addNotification({
                message,
                recommendation,
                confidence: parseInt(confidence),
                priceAtRecommendation: parseFloat(priceAtRecommendation) || 0,
            });

            res.status(201).json({
                success: true,
                message: "Notification added successfully",
                data: strategy.latestNotification,
            });
        } catch (error) {
            console.error("Add notification error:", error);
            res.status(500).json({
                success: false,
                message: "Error adding notification",
            });
        }
    }
);

// @route   POST /api/strategies/:id/notifications/:notificationId/respond
// @desc    Respond to a notification (obeyed/ignored)
// @access  Private
router.post(
    "/:id/notifications/:notificationId/respond",
    [
        authenticateToken,
        body("response")
            .isIn(["obeyed", "ignored"])
            .withMessage("Invalid response"),
        body("amountChange")
            .optional()
            .isNumeric()
            .withMessage("Amount change must be a number"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
            }

            const strategy = await Strategy.findOne({
                _id: req.params.id,
                user: req.user._id,
            });

            if (!strategy) {
                return res.status(404).json({
                    success: false,
                    message: "Strategy not found",
                });
            }

            const { response, amountChange } = req.body;

            await strategy.respondToNotification(
                req.params.notificationId,
                response,
                parseFloat(amountChange) || 0
            );

            res.json({
                success: true,
                message: `Notification marked as ${response}`,
                data: strategy,
            });
        } catch (error) {
            console.error("Respond to notification error:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error responding to notification",
            });
        }
    }
);

module.exports = router;
