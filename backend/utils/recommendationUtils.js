const Recommendation = require("../models/Recommendation");

/**
 * Save or update a recommendation based on AI workflow results
 * @param {Object} strategy - The strategy object
 * @param {Object} finalRecommendation - The final recommendation from AI workflow
 * @param {Object} analysisData - The analysis data from the workflow
 * @param {Number} executionTime - Workflow execution time in ms
 * @param {Number} agentsUsed - Number of agents used
 */
async function saveRecommendationToDatabase(
    strategy,
    finalRecommendation,
    analysisData,
    executionTime = 0,
    agentsUsed = 5
) {
    try {
        console.log(
            "🔄 Attempting to save recommendation for strategy",
            strategy._id
        );
        console.log("📊 Final recommendation:", finalRecommendation);

        // Determine the recommendation action based on the text
        let recommendationAction = "HOLD";
        const recText = finalRecommendation.recommendation.toLowerCase();

        if (recText.includes("swap") && !recText.includes("don't swap")) {
            recommendationAction = "SWAP";
        } else if (recText.includes("don't swap") || recText.includes("hold")) {
            recommendationAction = "HOLD";
        }

        console.log(
            "📊 Recommendation action determined:",
            recommendationAction
        );

        // Check if recommendation already exists for this strategy
        const existingRecommendation = await Recommendation.findOne({
            strategy: strategy._id,
            isActive: true,
        });

        const recommendationData = {
            strategy: strategy._id,
            user: strategy.user,
            recommendation: finalRecommendation.recommendation, // The full recommendation text
            action: recommendationAction,
            confidence: 85, // Default confidence value for AI analysis
            explanation: finalRecommendation.explanation,
            executionTime: executionTime,
            agentsUsed: agentsUsed,
            analysisData: analysisData,
            status: "pending",
        };

        if (existingRecommendation) {
            // Update existing recommendation (overwrite logic)
            Object.assign(existingRecommendation, recommendationData);
            existingRecommendation.createdAt = new Date();
            await existingRecommendation.save();
            console.log(
                `✅ Updated existing recommendation for strategy ${strategy._id}`
            );
            return existingRecommendation;
        } else {
            // Create new recommendation
            const newRecommendation = new Recommendation(recommendationData);
            await newRecommendation.save();
            console.log(
                `✅ Created new recommendation for strategy ${strategy._id}`
            );
            return newRecommendation;
        }
    } catch (error) {
        console.error("❌ Error saving recommendation to database:", error);
        throw error;
    }
}

module.exports = {
    saveRecommendationToDatabase,
};
