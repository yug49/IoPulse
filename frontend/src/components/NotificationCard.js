import React from "react";
import { Brain, Clock, TrendingUp } from "lucide-react";

const NotificationCard = ({ notification, onResponse }) => {
    const handleResponse = (response) => {
        onResponse(notification.id, response);
    };

    return (
        <div className="notification-card">
            <div className="notification-header">
                <div className="notification-title">
                    <Brain
                        size={16}
                        style={{ marginRight: "8px", color: "#667eea" }}
                    />
                    {notification.title}
                </div>
                <div className="notification-time">
                    <Clock size={14} style={{ marginRight: "4px" }} />
                    {notification.timestamp}
                </div>
            </div>

            <div className="notification-message">{notification.message}</div>

            <div className="strategy-detail" style={{ marginBottom: "16px" }}>
                <span>
                    <TrendingUp size={16} /> AI Confidence:
                </span>
                <span
                    style={{
                        color:
                            notification.confidence > 80
                                ? "#22c55e"
                                : notification.confidence > 60
                                ? "#f59e0b"
                                : "#ef4444",
                    }}
                >
                    {notification.confidence}%
                </span>
            </div>

            <div className="notification-actions">
                <button
                    className="action-button action-obeyed"
                    onClick={() => handleResponse("obeyed")}
                >
                    I Obeyed
                </button>
                <button
                    className="action-button action-ignore"
                    onClick={() => handleResponse("ignored")}
                >
                    Ignore
                </button>
            </div>
        </div>
    );
};

export default NotificationCard;
