const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
    {
        strategy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Strategy",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        eventType: {
            type: String,
            enum: [
                "STRATEGY_CREATED",
                "STRATEGY_UPDATED",
                "STRATEGY_DELETED",
                "RECOMMENDATION_GENERATED",
                "RECOMMENDATION_ACCEPTED",
                "RECOMMENDATION_REJECTED",
                "HOLDING_UPDATED",
                "STATUS_CHANGED",
                "AI_WORKFLOW_STARTED",
                "AI_WORKFLOW_COMPLETED",
                "AI_WORKFLOW_FAILED",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        data: {
            // Flexible object to store event-specific data
            oldValues: mongoose.Schema.Types.Mixed,
            newValues: mongoose.Schema.Types.Mixed,
            recommendation: {
                action: String,
                confidence: Number,
                explanation: String,
                recommendation: String,
            },
            agentData: mongoose.Schema.Types.Mixed,
            userResponse: String,
            metadata: mongoose.Schema.Types.Mixed,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster queries
historySchema.index({ strategy: 1, timestamp: -1 });
historySchema.index({ user: 1, timestamp: -1 });
historySchema.index({ eventType: 1, timestamp: -1 });

// Virtual for time since event
historySchema.virtual("timeAgo").get(function () {
    const now = new Date();
    const diff = now - this.timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
});

// Static method to create a history entry
historySchema.statics.createEntry = async function (entryData) {
    const entry = new this(entryData);
    return await entry.save();
};

// Static method to get history for a strategy
historySchema.statics.getStrategyHistory = function (strategyId, limit = 50) {
    return this.find({ strategy: strategyId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("user", "username email")
        .populate("strategy", "title coin");
};

// Static method to get recent history for a user
historySchema.statics.getUserHistory = function (userId, limit = 100) {
    return this.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("strategy", "title coin")
        .populate("user", "username email");
};

module.exports = mongoose.model("History", historySchema);
