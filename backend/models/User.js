const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [50, "Name cannot be more than 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Don't include password in queries by default
        },
        avatar: {
            type: String,
            default: function () {
                return this.name ? this.name.charAt(0).toUpperCase() : "U";
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
        strategies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Strategy",
            },
        ],
        holdings: [
            {
                coin: {
                    type: String,
                    required: true,
                    trim: true,
                },
                amount: {
                    type: Number,
                    required: true,
                    default: 0,
                    min: [0, "Amount cannot be negative"],
                },
                averagePrice: {
                    type: Number,
                    default: 0,
                    min: [0, "Price cannot be negative"],
                },
                lastUpdated: {
                    type: Date,
                    default: Date.now,
                },
                strategy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Strategy",
                },
            },
        ],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster queries
userSchema.index({ email: 1 });

// Virtual for user's full name display
userSchema.virtual("displayName").get(function () {
    return this.name || "User";
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
    // Only hash password if it's modified (or new)
    if (!this.isModified("password")) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    // Select password field for comparison since it's excluded by default
    const user = await this.constructor.findById(this._id).select("+password");
    return bcrypt.compare(candidatePassword, user.password);
};

// Instance method to generate avatar
userSchema.methods.generateAvatar = function () {
    return this.name ? this.name.charAt(0).toUpperCase() : "U";
};

// Static method to find user by email (including password for auth)
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() }).select("+password");
};

// Update last login
userSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save({ validateBeforeSave: false });
};

// Method to add or update holdings
userSchema.methods.updateHolding = function (
    coin,
    amount,
    strategyId,
    averagePrice = 0
) {
    const existingHolding = this.holdings.find(
        (h) =>
            h.coin === coin && h.strategy.toString() === strategyId.toString()
    );

    if (existingHolding) {
        existingHolding.amount = amount;
        existingHolding.averagePrice = averagePrice;
        existingHolding.lastUpdated = new Date();
    } else {
        this.holdings.push({
            coin,
            amount,
            averagePrice,
            strategy: strategyId,
            lastUpdated: new Date(),
        });
    }

    return this.save();
};

// Method to get total holdings for a coin
userSchema.methods.getTotalHolding = function (coin) {
    return this.holdings
        .filter((h) => h.coin === coin)
        .reduce((total, holding) => total + holding.amount, 0);
};

// Method to get holdings by strategy
userSchema.methods.getHoldingsByStrategy = function (strategyId) {
    return this.holdings.filter(
        (h) => h.strategy.toString() === strategyId.toString()
    );
};

module.exports = mongoose.model("User", userSchema);
