import React, { useState, useEffect, useRef } from "react";
import { authAPI, tokenManager, userManager } from "../services/api";

const LoginPage = ({ onLogin, onSwitchToSignup }) => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showError, setShowError] = useState(false);
    const errorTimeoutRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Don't clear error immediately when typing
        // Only clear after a significant delay
    };

    const clearError = () => {
        setError("");
        setShowError(false);
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
    };

    const showErrorMessage = (message) => {
        setError(message);
        setShowError(true);

        // Clear any existing timeout
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }

        // Auto-clear after 15 seconds
        errorTimeoutRef.current = setTimeout(() => {
            clearError();
        }, 15000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear any existing error first
        clearError();
        setLoading(true);

        try {
            const response = await authAPI.login(formData);

            if (response.success) {
                // Store token and user data
                tokenManager.setToken(response.token);
                userManager.setUser(response.user);

                // Call parent callback
                onLogin(response.user);
            }
        } catch (error) {
            console.error("Login error:", error);
            const errorMessage =
                error.message || "Invalid email or password. Please try again.";

            // Show persistent error
            showErrorMessage(errorMessage);

            // Clear only password field, keep email
            setFormData((prev) => ({
                ...prev,
                password: "",
            }));
        } finally {
            setLoading(false);
        }
    };

    // Clear timeout on component unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>IoPulse</h1>
                    <p>DeFi Investment Monitor powered by io.net AI</p>
                </div>

                {showError && error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "2px solid rgba(239, 68, 68, 0.4)",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "20px",
                            color: "#ffffff",
                            fontSize: "0.95rem",
                            position: "relative",
                            animation: "fadeIn 0.3s ease-in",
                            fontWeight: "500",
                        }}
                    >
                        <div style={{ paddingRight: "30px" }}>⚠️ {error}</div>
                        <button
                            onClick={clearError}
                            style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                background: "rgba(255, 255, 255, 0.2)",
                                border: "none",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "18px",
                                fontWeight: "bold",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onMouseOver={(e) =>
                                (e.target.style.background =
                                    "rgba(255, 255, 255, 0.3)")
                            }
                            onMouseOut={(e) =>
                                (e.target.style.background =
                                    "rgba(255, 255, 255, 0.2)")
                            }
                            title="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            style={{
                                borderColor: showError
                                    ? "rgba(239, 68, 68, 0.4)"
                                    : undefined,
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            style={{
                                borderColor: showError
                                    ? "rgba(239, 68, 68, 0.4)"
                                    : undefined,
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "20px",
                        color: "#a0a0a0",
                    }}
                >
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToSignup}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#667eea",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontSize: "inherit",
                        }}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
