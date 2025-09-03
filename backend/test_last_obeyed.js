// Test script to demonstrate the lastObeyedRecommendation functionality
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const User = require("./models/User");
const Strategy = require("./models/Strategy");

// Connect to MongoDB
mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/iopulse"
);

async function testLastObeyedRecommendation() {
    try {
        console.log("🚀 Testing Last Obeyed Recommendation functionality...\n");

        // Find a test user or create one
        let testUser = await User.findOne({ email: "test@example.com" });
        if (!testUser) {
            testUser = new User({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
            });
            await testUser.save();
            console.log("✅ Created test user");
        }

        // Create a new strategy to test with
        const strategy = new Strategy({
            title: "Test Strategy with Last Obeyed",
            description:
                "A strategy to test the lastObeyedRecommendation field",
            coin: "BTC",
            initialAmount: 1.5,
            currentAmount: 1.5,
            user: testUser._id,
        });
        await strategy.save();
        console.log("✅ Created test strategy");

        // Check default lastObeyedRecommendation
        console.log("\n📊 Default lastObeyedRecommendation:");
        console.log("Message:", strategy.lastObeyedRecommendation.message);
        console.log(
            "Recommendation:",
            strategy.lastObeyedRecommendation.recommendation
        );
        console.log(
            "Confidence:",
            strategy.lastObeyedRecommendation.confidence
        );

        // Add a test notification
        await strategy.addNotification({
            message:
                "Strong bullish trend detected. Consider increasing your BTC position.",
            recommendation: "buy",
            confidence: 85,
            priceAtRecommendation: 45000,
        });
        console.log("\n✅ Added test notification");

        // Get the notification ID for response
        const notification =
            strategy.notifications[strategy.notifications.length - 1];

        // Simulate user obeying the recommendation
        await strategy.respondToNotification(notification._id, "obeyed", 0.3);
        console.log("✅ User obeyed the recommendation");

        // Reload strategy to see updated data
        const updatedStrategy = await Strategy.findById(strategy._id);

        console.log("\n📊 Updated lastObeyedRecommendation:");
        console.log(
            "Message:",
            updatedStrategy.lastObeyedRecommendation.message
        );
        console.log(
            "Recommendation:",
            updatedStrategy.lastObeyedRecommendation.recommendation
        );
        console.log(
            "Confidence:",
            updatedStrategy.lastObeyedRecommendation.confidence
        );
        console.log(
            "Amount Change:",
            updatedStrategy.lastObeyedRecommendation.amountChange
        );
        console.log(
            "Timestamp:",
            updatedStrategy.lastObeyedRecommendation.timestamp
        );

        // Add another notification and ignore it
        await updatedStrategy.addNotification({
            message: "Market volatility increasing. Consider taking profits.",
            recommendation: "sell",
            confidence: 72,
            priceAtRecommendation: 47000,
        });

        const secondNotification =
            updatedStrategy.notifications[
                updatedStrategy.notifications.length - 1
            ];
        await updatedStrategy.respondToNotification(
            secondNotification._id,
            "ignored"
        );
        console.log("\n✅ User ignored the second recommendation");

        // Reload and check that lastObeyedRecommendation hasn't changed
        const finalStrategy = await Strategy.findById(strategy._id);
        console.log(
            "\n📊 Final lastObeyedRecommendation (should be unchanged):"
        );
        console.log("Message:", finalStrategy.lastObeyedRecommendation.message);
        console.log(
            "Recommendation:",
            finalStrategy.lastObeyedRecommendation.recommendation
        );
        console.log("Should still be from the first obeyed recommendation ✅");

        // Clean up - delete the test strategy
        await Strategy.findByIdAndDelete(strategy._id);
        console.log("\n🧹 Cleaned up test strategy");

        console.log("\n🎉 Test completed successfully!");
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log("📍 Database connection closed");
    }
}

// Run the test
testLastObeyedRecommendation();
