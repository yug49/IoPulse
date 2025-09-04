const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
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
        recommendation: {
            type: String,
            required: true,
            trim: true,
        },
        action: {
            type: String,
            enum: ["HOLD", "SWAP", "BUY", "SELL"],
            required: true,
        },
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
        explanation: {
            type: String,
            required: true,
        },
        executionTime: {
            type: Number, // in milliseconds
            required: true,
        },
        agentsUsed: {
            type: Number,
            required: true,
        },
        analysisData: {
            profile: mongoose.Schema.Types.Mixed,
            candidates: [String],
            quantitativeAnalysis: [mongoose.Schema.Types.Mixed],
            qualitativeAnalysis: [mongoose.Schema.Types.Mixed],
            totalTime: Number,
            agentsExecuted: [mongoose.Schema.Types.Mixed],
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "expired"],
            default: "pending",
        },
        userResponse: {
            response: {
                type: String,
                enum: ["accepted", "rejected"],
            },
            timestamp: Date,
            notes: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster queries
recommendationSchema.index({ strategy: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, status: 1 });
recommendationSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for recommendation age
recommendationSchema.virtual("age").get(function () {
    return Date.now() - this.createdAt;
});

// Method to accept recommendation
recommendationSchema.methods.accept = async function (notes = "") {
    const Strategy = require("./Strategy");

    this.status = "accepted";
    this.userResponse = {
        response: "accepted",
        timestamp: new Date(),
        notes: notes,
    };

    // Update strategy based on recommendation
    const strategy = await Strategy.findById(this.strategy);
    if (strategy) {
        // Parse the recommendation text to determine the action
        const recText = this.recommendation || "";

        if (
            recText.toLowerCase().includes("swap") &&
            !recText.toLowerCase().includes("don't swap")
        ) {
            // Extract new token from recommendation text
            // Format: "Swap ETH for PEPE and hold for 2-4 weeks"
            const swapMatch = recText.match(/swap \w+ for (\w+)/i);
            if (swapMatch) {
                const newToken = swapMatch[1];
                console.log(
                    `💱 Updating strategy ${strategy._id} from ${strategy.coin} to ${newToken}`
                );
                strategy.coin = newToken;
            }
        }
        // If it's a hold recommendation, we don't change the coin

        // Store the recommendation details in strategy
        strategy.latestRecommendation = {
            recommendation: this.action,
            confidence: this.confidence,
            reasoning: this.explanation,
            timestamp: new Date(),
            agentOutputs: this.analysisData || {},
        };

        await strategy.save();
        console.log(
            `✅ Strategy ${strategy._id} updated with accepted recommendation`
        );
    }

    // Deactivate the recommendation (delete from active recommendations)
    this.isActive = false;

    return this.save();
};

// Method to reject recommendation
recommendationSchema.methods.reject = function (notes = "") {
    this.status = "rejected";
    this.userResponse = {
        response: "rejected",
        timestamp: new Date(),
        notes: notes,
    };

    // Deactivate the recommendation (delete from active recommendations)
    this.isActive = false;

    return this.save();
};

// Static method to get latest recommendation for a strategy
recommendationSchema.statics.getLatestForStrategy = function (strategyId) {
    return this.findOne({ strategy: strategyId, isActive: true })
        .sort({ createdAt: -1 })
        .populate("strategy", "title coin")
        .populate("user", "username email");
};

// Static method to get all recommendations for a user
recommendationSchema.statics.getForUser = function (userId, status = null) {
    const query = { user: userId, isActive: true };
    if (status) {
        query.status = status;
    }
    return this.find(query)
        .sort({ createdAt: -1 })
        .populate("strategy", "title coin currentAmount")
        .populate("user", "username email");
};

module.exports = mongoose.model("Recommendation", recommendationSchema);
