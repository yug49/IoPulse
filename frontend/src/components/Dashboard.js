import React, { useState, useEffect } from "react";
import StrategyCard from "./StrategyCard";
import NotificationCard from "./NotificationCard";
import CreateStrategyModal from "./CreateStrategyModal";
import NotificationModal from "./NotificationModal";
import { strategyAPI } from "../services/api";
import { Plus, LogOut } from "lucide-react";

const Dashboard = ({ user, onLogout }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load strategies from MongoDB
    useEffect(() => {
        loadStrategies();
    }, []);

    const loadStrategies = async () => {
        try {
            setLoading(true);
            const response = await strategyAPI.getStrategies();
            if (response.success) {
                setStrategies(response.data);
            }
        } catch (error) {
            setError("Failed to load strategies");
            console.error("Load strategies error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStrategy = async (newStrategy) => {
        try {
            const response = await strategyAPI.createStrategy(newStrategy);
            if (response.success) {
                setStrategies([response.data, ...strategies]);
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error("Create strategy error:", error);
            // You might want to show an error message to the user here
        }
    };

    const handleNotificationResponse = async (updatedStrategy) => {
        // Update the strategy in the list
        setStrategies(
            strategies.map((s) =>
                s._id === updatedStrategy._id ? updatedStrategy : s
            )
        );
        setSelectedNotification(null);
    };

    // Get all pending notifications from all strategies
    const getPendingNotifications = () => {
        const notifications = [];
        strategies.forEach((strategy) => {
            if (
                strategy.latestNotification &&
                strategy.latestNotification.userResponse === "pending"
            ) {
                notifications.push({
                    ...strategy.latestNotification,
                    strategyId: strategy._id,
                    strategyTitle: strategy.title || "Untitled Strategy",
                    coin: strategy.coin || "N/A",
                });
            }
        });
        return notifications.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    };

    const pendingNotifications = getPendingNotifications();

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <div className="user-info">
                    <div className="user-avatar">{user.avatar}</div>
                    <span>Welcome, {user.name}</span>
                    <button className="logout-button" onClick={onLogout}>
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {error && (
                <div
                    className="error-message"
                    style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Notifications Section */}
            <div className="notifications-section">
                <div className="notifications-header">
                    <h2>AI Recommendations</h2>
                </div>
                {pendingNotifications.map((notification) => (
                    <div
                        key={`${notification.strategyId}-${notification.timestamp}`}
                        className="notification-item"
                        style={{
                            backgroundColor: "#374151",
                            border: "1px solid #4b5563",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "12px",
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            setSelectedNotification({
                                ...notification,
                                strategyId: notification.strategyId,
                            })
                        }
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                            }}
                        >
                            <div>
                                <h4
                                    style={{
                                        color: "#f9fafb",
                                        marginBottom: "8px",
                                    }}
                                >
                                    {notification.strategyTitle} -{" "}
                                    {notification.coin}
                                </h4>
                                <p
                                    style={{
                                        color: "#d1d5db",
                                        marginBottom: "8px",
                                    }}
                                >
                                    {notification.message}
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "16px",
                                        fontSize: "14px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color:
                                                notification.recommendation ===
                                                "buy"
                                                    ? "#10b981"
                                                    : notification.recommendation ===
                                                      "sell"
                                                    ? "#ef4444"
                                                    : "#f59e0b",
                                        }}
                                    >
                                        Recommendation:{" "}
                                        {(
                                            notification.recommendation ||
                                            "unknown"
                                        ).toUpperCase()}
                                    </span>
                                    <span style={{ color: "#9ca3af" }}>
                                        Confidence:{" "}
                                        {notification.confidence || 0}%
                                    </span>
                                </div>
                            </div>
                            <span
                                style={{ color: "#9ca3af", fontSize: "12px" }}
                            >
                                {new Date(
                                    notification.timestamp
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
                {pendingNotifications.length === 0 && (
                    <p
                        style={{
                            color: "#a0a0a0",
                            textAlign: "center",
                            padding: "20px",
                        }}
                    >
                        No pending recommendations at the moment.
                    </p>
                )}
            </div>

            {/* Strategies Section */}
            <div className="strategies-section">
                <div className="strategies-header">
                    <h2>Your Investment Strategies</h2>
                    <button
                        className="new-strategy-button"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={16} />
                        New Strategy
                    </button>
                </div>

                {loading ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#a0a0a0",
                        }}
                    >
                        Loading strategies...
                    </div>
                ) : (
                    <div className="strategies-grid">
                        {strategies.map((strategy) => (
                            <StrategyCard
                                key={strategy._id}
                                strategy={strategy}
                                onUpdate={loadStrategies}
                            />
                        ))}
                    </div>
                )}

                {!loading && strategies.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#a0a0a0",
                        }}
                    >
                        <p>No strategies created yet.</p>
                        <p>Click "New Strategy" to get started!</p>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateStrategyModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateStrategy}
                />
            )}

            {selectedNotification && (
                <NotificationModal
                    notification={selectedNotification}
                    strategyId={selectedNotification.strategyId}
                    onClose={() => setSelectedNotification(null)}
                    onResponse={handleNotificationResponse}
                />
            )}
        </div>
    );
};

export default Dashboard;
