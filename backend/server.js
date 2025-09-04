const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/strategies", require("./routes/strategies"));
app.use("/api/ai-recommendations", require("./routes/ai-recommendations"));
app.use("/api/recommendations", require("./routes/recommendations"));
app.use("/api/history", require("./routes/history"));

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        message: "IoPulse Backend is running!",
        database: "MongoDB",
        timestamp: new Date().toISOString(),
    });
});

// Test endpoint to create a demo user (for development only)
app.post("/api/create-test-user", async (req, res) => {
    try {
        const User = require("./models/User");

        // Check if test user already exists
        const existingUser = await User.findOne({ email: "test@example.com" });
        if (existingUser) {
            return res.json({
                message: "Test user already exists",
                email: "test@example.com",
                password: "password123",
            });
        }

        const testUser = new User({
            name: "Test User",
            email: "test@example.com",
            password: "password123", // Will be hashed by pre-save middleware
        });

        await testUser.save();
        res.json({
            message: "Test user created successfully",
            email: "test@example.com",
            password: "password123",
        });
    } catch (error) {
        console.error("Error creating test user:", error);
        res.status(500).json({
            message: "Error creating test user",
            error: error.message,
        });
    }
});

// Test endpoint to add sample notification to a strategy (for development only)
app.post("/api/test-notification/:strategyId", async (req, res) => {
    try {
        const Strategy = require("./models/Strategy");
        const strategy = await Strategy.findById(req.params.strategyId);

        if (!strategy) {
            return res.status(404).json({ message: "Strategy not found" });
        }

        // Require real recommendation data instead of using mock values
        const { message, recommendation, confidence, priceAtRecommendation } =
            req.body;

        if (!message || !recommendation) {
            return res.status(400).json({
                message: "Missing required fields: message, recommendation",
                error: "Real notification data required - no mock values allowed",
            });
        }

        const notificationData = {
            message,
            recommendation,
            confidence: confidence || null,
            priceAtRecommendation: priceAtRecommendation || null,
        };

        await strategy.addNotification(notificationData);

        res.json({
            message: "Notification added successfully with real data",
            notification: strategy.latestNotification,
        });
    } catch (error) {
        console.error("Error adding notification:", error);
        res.status(500).json({
            message: "Error adding notification",
            error: error.message,
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error",
    });
});

// Handle 404 routes
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
