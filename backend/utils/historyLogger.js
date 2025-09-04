const History = require("../models/History");

/**
 * Utility class for logging strategy history events
 */
class HistoryLogger {
    /**
     * Log strategy creation
     */
    static async logStrategyCreated(strategy, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "STRATEGY_CREATED",
            title: "Strategy Created",
            description: `New strategy "${strategy.title}" was created`,
            data: {
                newValues: {
                    title: strategy.title,
                    description: strategy.description,
                    coin: strategy.coin,
                    initialAmount: strategy.initialAmount,
                    status: strategy.status,
                },
            },
            severity: "MEDIUM",
        });
    }

    /**
     * Log strategy updates
     */
    static async logStrategyUpdated(strategy, oldValues, newValues, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "STRATEGY_UPDATED",
            title: "Strategy Updated",
            description: `Strategy "${strategy.title}" was modified`,
            data: {
                oldValues,
                newValues,
            },
            severity: "LOW",
        });
    }

    /**
     * Log strategy deletion
     */
    static async logStrategyDeleted(strategy, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "STRATEGY_DELETED",
            title: "Strategy Deleted",
            description: `Strategy "${strategy.title}" was permanently deleted`,
            data: {
                oldValues: {
                    title: strategy.title,
                    description: strategy.description,
                    coin: strategy.coin,
                    currentAmount: strategy.currentAmount,
                    status: strategy.status,
                },
            },
            severity: "HIGH",
        });
    }

    /**
     * Log AI workflow start
     */
    static async logAIWorkflowStarted(strategy, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "AI_WORKFLOW_STARTED",
            title: "AI Analysis Started",
            description: `AI recommendation workflow initiated for "${strategy.title}"`,
            data: {
                metadata: {
                    currentCoin: strategy.coin,
                    currentAmount: strategy.currentAmount,
                },
            },
            severity: "MEDIUM",
        });
    }

    /**
     * Log AI workflow completion with recommendation
     */
    static async logAIWorkflowCompleted(
        strategy,
        recommendation,
        analysisData,
        user
    ) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "AI_WORKFLOW_COMPLETED",
            title: "AI Recommendation Generated",
            description: `AI analysis completed with recommendation: ${recommendation.recommendation}`,
            data: {
                recommendation: {
                    action: recommendation.action,
                    confidence: recommendation.confidence,
                    explanation: recommendation.explanation,
                    recommendation: recommendation.recommendation,
                },
                agentData: analysisData,
                metadata: {
                    executionTime: analysisData.totalTime,
                    agentsUsed: analysisData.agentsUsed?.length || 0,
                },
            },
            severity: "HIGH",
        });
    }

    /**
     * Log AI workflow failure
     */
    static async logAIWorkflowFailed(strategy, error, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "AI_WORKFLOW_FAILED",
            title: "AI Analysis Failed",
            description: `AI recommendation workflow failed for "${strategy.title}"`,
            data: {
                metadata: {
                    error: error.message || error,
                    timestamp: new Date(),
                },
            },
            severity: "CRITICAL",
        });
    }

    /**
     * Log recommendation acceptance
     */
    static async logRecommendationAccepted(strategy, recommendation, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "RECOMMENDATION_ACCEPTED",
            title: "Recommendation Accepted",
            description: `User accepted AI recommendation: ${recommendation.recommendation}`,
            data: {
                recommendation: {
                    action: recommendation.action,
                    confidence: recommendation.confidence,
                    explanation: recommendation.explanation,
                    recommendation: recommendation.recommendation,
                },
                userResponse: "accepted",
                metadata: {
                    responseTime: new Date(),
                },
            },
            severity: "HIGH",
        });
    }

    /**
     * Log recommendation rejection
     */
    static async logRecommendationRejected(strategy, recommendation, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "RECOMMENDATION_REJECTED",
            title: "Recommendation Rejected",
            description: `User rejected AI recommendation: ${recommendation.recommendation}`,
            data: {
                recommendation: {
                    action: recommendation.action,
                    confidence: recommendation.confidence,
                    explanation: recommendation.explanation,
                    recommendation: recommendation.recommendation,
                },
                userResponse: "rejected",
                metadata: {
                    responseTime: new Date(),
                },
            },
            severity: "MEDIUM",
        });
    }

    /**
     * Log holding updates (when user accepts a swap recommendation)
     */
    static async logHoldingUpdated(strategy, oldCoin, newCoin, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "HOLDING_UPDATED",
            title: "Holdings Updated",
            description: `Strategy holdings changed from ${oldCoin} to ${newCoin}`,
            data: {
                oldValues: { coin: oldCoin },
                newValues: { coin: newCoin },
                metadata: {
                    updateReason: "AI recommendation accepted",
                },
            },
            severity: "HIGH",
        });
    }

    /**
     * Log status changes
     */
    static async logStatusChanged(strategy, oldStatus, newStatus, user) {
        return await History.createEntry({
            strategy: strategy._id,
            user: user._id || user,
            eventType: "STATUS_CHANGED",
            title: "Status Changed",
            description: `Strategy status changed from ${oldStatus} to ${newStatus}`,
            data: {
                oldValues: { status: oldStatus },
                newValues: { status: newStatus },
            },
            severity: "MEDIUM",
        });
    }
}

module.exports = HistoryLogger;
