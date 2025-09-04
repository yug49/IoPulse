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

        const sampleNotifications = [
            {
                message:
                    "AI analysis suggests strong bullish momentum. Consider increasing position.",
                recommendation: "buy",
                confidence: 85,
                priceAtRecommendation: 45000,
            },
            {
                message:
                    "Market volatility detected. Recommend reducing exposure to minimize risk.",
                recommendation: "sell",
                confidence: 78,
                priceAtRecommendation: 46000,
            },
            {
                message:
                    "Current position is optimal. Maintain holdings for next 24 hours.",
                recommendation: "hold",
                confidence: 92,
                priceAtRecommendation: 45500,
            },
        ];

        const randomNotification =
            sampleNotifications[
                Math.floor(Math.random() * sampleNotifications.length)
            ];

        await strategy.addNotification(randomNotification);

        res.json({
            message: "Test notification added successfully",
            notification: strategy.latestNotification,
        });
    } catch (error) {
        console.error("Error adding test notification:", error);
        res.status(500).json({
            message: "Error adding test notification",
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
