const mongoose = require("mongoose");

const strategySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Strategy title is required"],
            trim: true,
            maxlength: [100, "Title cannot be more than 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Strategy description is required"],
            maxlength: [
                1000,
                "Description cannot be more than 1000 characters",
            ],
        },
        coin: {
            type: String,
            required: [true, "Investment coin is required"],
            trim: true,
        },
        initialAmount: {
            type: Number,
            required: [true, "Initial amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        currentAmount: {
            type: Number,
            default: function () {
                return this.initialAmount;
            },
            min: [0, "Amount cannot be negative"],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "paused", "stopped"],
            default: "active",
        },
        notifications: [
            {
                message: {
                    type: String,
                    required: true,
                },
                recommendation: {
                    type: String,
                    enum: ["buy", "sell", "hold", "swap"],
                    required: true,
                },
                confidence: {
                    type: Number,
                    min: 0,
                    max: 100,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                userResponse: {
                    type: String,
                    enum: ["obeyed", "ignored", "pending"],
                    default: "pending",
                },
                responseTimestamp: {
                    type: Date,
                },
                amountChange: {
                    type: Number,
                    default: 0,
                },
                priceAtRecommendation: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        latestNotification: {
            message: String,
            recommendation: {
                type: String,
                enum: ["buy", "sell", "hold", "swap"],
            },
            confidence: Number,
            timestamp: Date,
            userResponse: {
                type: String,
                enum: ["obeyed", "ignored", "pending"],
                default: "pending",
            },
        },
        lastObeyedRecommendation: {
            message: {
                type: String,
                default: "No recommendations followed yet",
            },
            recommendation: {
                type: String,
                enum: ["buy", "sell", "hold", "swap"],
                default: "hold",
            },
            confidence: {
                type: Number,
                default: 0,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            amountChange: {
                type: Number,
                default: 0,
            },
            priceAtRecommendation: {
                type: Number,
                default: 0,
            },
        },
        latestRecommendation: {
            recommendation: {
                type: String,
                enum: ["BUY", "SELL", "HOLD", "SWAP"],
            },
            confidence: {
                type: Number,
                min: 0,
                max: 100,
            },
            reasoning: {
                type: String,
            },
            timestamp: {
                type: Date,
            },
            agentOutputs: {
                investmentCommittee: {
                    decision: String,
                    confidence: Number,
                    reasoning: String,
                    currentHoldingsAnalysis: String,
                },
                quantitativeAnalysis: {
                    score: Number,
                    analysis: String,
                    metrics: String,
                    riskAdjustedReturn: String,
                    volatility: String,
                },
                qualitativeDueDiligence: {
                    score: Number,
                    analysis: String,
                    keyFactors: [String],
                    currentHoldingsAnalysis: String,
                },
                riskAssessment: {
                    riskLevel: String,
                    score: Number,
                    keyRisks: [String],
                },
            },
        },
        performance: {
            totalReturns: { type: Number, default: 0 },
            winRate: { type: Number, default: 0 },
            lastUpdate: { type: Date, default: Date.now },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster queries
strategySchema.index({ user: 1, status: 1 });
strategySchema.index({ createdAt: -1 });

// Virtual for strategy age
strategySchema.virtual("age").get(function () {
    return Date.now() - this.createdAt;
});

// Method to add a new notification
strategySchema.methods.addNotification = function (notificationData) {
    const notification = {
        message: notificationData.message,
        recommendation: notificationData.recommendation,
        confidence: notificationData.confidence,
        priceAtRecommendation: notificationData.priceAtRecommendation || 0,
        timestamp: new Date(),
    };

    this.notifications.push(notification);
    this.latestNotification = notification;

    return this.save();
};

// Method to respond to a notification
strategySchema.methods.respondToNotification = async function (
    notificationId,
    response,
    amountChange = 0
) {
    const notification = this.notifications.id(notificationId);
    if (!notification) {
        throw new Error("Notification not found");
    }

    notification.userResponse = response;
    notification.responseTimestamp = new Date();
    notification.amountChange = amountChange;

    // Update latest notification if it's the same one
    if (
        this.latestNotification &&
        this.latestNotification.timestamp.getTime() ===
            notification.timestamp.getTime()
    ) {
        this.latestNotification.userResponse = response;
    }

    // If user obeyed, update the strategy's current amount
    if (response === "obeyed") {
        this.currentAmount += amountChange;

        // Update last obeyed recommendation
        this.lastObeyedRecommendation = {
            message: notification.message,
            recommendation: notification.recommendation,
            confidence: notification.confidence,
            timestamp: new Date(),
            amountChange: amountChange,
            priceAtRecommendation: notification.priceAtRecommendation,
        };

        // Also update user's holdings
        const User = mongoose.model("User");
        const user = await User.findById(this.user);
        if (user) {
            const holding = user.holdings.find(
                (h) =>
                    h.coin === this.coin &&
                    h.strategy.toString() === this._id.toString()
            );
            if (holding) {
                holding.amount = this.currentAmount;
                holding.lastUpdated = new Date();
                await user.save();
            }
        }
    }

    return this.save();
};

// Method to get pending notifications
strategySchema.methods.getPendingNotifications = function () {
    return this.notifications.filter((n) => n.userResponse === "pending");
};

// Post-save hook to log strategy creation
strategySchema.post("save", async function (doc, next) {
    // Only log on creation (when isNew was true)
    if (this.wasNew) {
        try {
            const HistoryLogger = require("../utils/historyLogger");
            await HistoryLogger.logStrategyCreated(doc, doc.user);
        } catch (error) {
            console.error("❌ Error logging strategy creation:", error);
            // Don't fail the save operation if history logging fails
        }
    }
    next();
});

// Pre-save hook to track if this is a new document
strategySchema.pre("save", function (next) {
    this.wasNew = this.isNew;
    next();
});

module.exports = mongoose.model("Strategy", strategySchema);
