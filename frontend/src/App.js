import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import Dashboard from "./components/Dashboard";
import { authAPI, tokenManager, userManager } from "./services/api";
import "./styles/App.css";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
    const [loading, setLoading] = useState(true);

    // Check for existing authentication on app load
    useEffect(() => {
        const checkAuth = async () => {
            const token = tokenManager.getToken();
            const storedUser = userManager.getUser();

            if (token && storedUser) {
                try {
                    // Verify token with backend
                    const response = await authAPI.verifyToken();
                    if (response.success) {
                        setUser(response.user);
                        setIsLoggedIn(true);
                    } else {
                        // Token invalid, clear storage
                        tokenManager.removeToken();
                        userManager.removeUser();
                    }
                } catch (error) {
                    console.error("Token verification failed:", error);
                    // Token invalid, clear storage
                    tokenManager.removeToken();
                    userManager.removeUser();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
    };

    const handleSignup = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        // Clear tokens and user data
        tokenManager.removeToken();
        userManager.removeUser();
        setUser(null);
        setIsLoggedIn(false);
        setAuthMode("login");
    };

    const switchToSignup = () => {
        setAuthMode("signup");
    };

    const switchToLogin = () => {
        setAuthMode("login");
    };

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div
                className="app"
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <div
                    style={{
                        color: "#667eea",
                        fontSize: "1.2rem",
                        fontWeight: "600",
                    }}
                >
                    Loading IoPulse...
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            {!isLoggedIn ? (
                authMode === "login" ? (
                    <LoginPage
                        onLogin={handleLogin}
                        onSwitchToSignup={switchToSignup}
                    />
                ) : (
                    <SignupPage
                        onSignup={handleSignup}
                        onSwitchToLogin={switchToLogin}
                    />
                )
            ) : (
                <Dashboard user={user} onLogout={handleLogout} />
            )}
        </div>
    );
}

export default App;
