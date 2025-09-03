import React, { useState, useEffect, useRef } from "react";
import { authAPI, tokenManager, userManager } from "../services/api";

const SignupPage = ({ onSignup, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [errorDisplayTime, setErrorDisplayTime] = useState(null);
    const errorTimeoutRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Only clear error if it's been displayed for at least 5 seconds and user is actively typing
        if (error && errorDisplayTime && Date.now() - errorDisplayTime > 5000) {
            setError("");
            setErrorDisplayTime(null);
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Don't clear error or form data immediately

        // Clear any existing timeout
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }

        // Validation
        if (formData.password !== formData.confirmPassword) {
            const errorMessage = "Passwords do not match";
            setError(errorMessage);
            setErrorDisplayTime(Date.now());

            // Clear password fields for security
            setFormData((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));

            errorTimeoutRef.current = setTimeout(() => {
                setError("");
                setErrorDisplayTime(null);
            }, 8000);
            return;
        }

        if (formData.password.length < 6) {
            const errorMessage = "Password must be at least 6 characters long";
            setError(errorMessage);
            setErrorDisplayTime(Date.now());

            // Clear password fields for security
            setFormData((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));

            errorTimeoutRef.current = setTimeout(() => {
                setError("");
                setErrorDisplayTime(null);
            }, 8000);
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            if (response.success) {
                // Store token and user data
                tokenManager.setToken(response.token);
                userManager.setUser(response.user);

                // Call parent callback
                onSignup(response.user);
            }
        } catch (error) {
            console.error("Signup error:", error);
            const errorMessage =
                error.message || "Failed to create account. Please try again.";
            setError(errorMessage);
            setErrorDisplayTime(Date.now());

            // Clear password fields for security
            setFormData((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));

            // Auto-clear error after 10 seconds
            errorTimeoutRef.current = setTimeout(() => {
                setError("");
                setErrorDisplayTime(null);
            }, 10000);
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

    const handleErrorDismiss = () => {
        setError("");
        setErrorDisplayTime(null);
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Join IoPulse</h1>
                    <p>
                        Create your account to start monitoring DeFi investments
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "8px",
                            padding: "12px",
                            marginBottom: "20px",
                            color: "#ef4444",
                            fontSize: "0.9rem",
                            position: "relative",
                            animation: "fadeIn 0.3s ease-in",
                        }}
                    >
                        <div style={{ paddingRight: "30px" }}>{error}</div>
                        <button
                            onClick={handleErrorDismiss}
                            style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                                padding: "4px",
                                borderRadius: "4px",
                                opacity: 0.7,
                            }}
                            onMouseOver={(e) => (e.target.style.opacity = "1")}
                            onMouseOut={(e) => (e.target.style.opacity = "0.7")}
                            title="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Create a password (min. 6 characters)"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "20px",
                        color: "#a0a0a0",
                    }}
                >
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#667eea",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontSize: "inherit",
                        }}
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
