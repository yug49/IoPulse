import React, { useState } from "react";
import {
    TrendingUp,
    Clock,
    Coins,
    DollarSign,
    Edit2,
    Trash2,
} from "lucide-react";
import { strategyAPI } from "../services/api";
import ConfirmationModal from "./ConfirmationModal";

const StrategyCard = ({ strategy, onUpdate, onCardClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editData, setEditData] = useState({
        title: strategy.title,
        description: strategy.description,
        initialAmount: strategy.initialAmount,
    });
    const [loading, setLoading] = useState(false);

    const handleEdit = async () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        try {
            setLoading(true);
            await strategyAPI.updateStrategy(strategy._id, editData);
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error("Update strategy error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await strategyAPI.deleteStrategy(strategy._id);
            onUpdate();
        } catch (error) {
            console.error("Delete strategy error:", error);
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "#10b981";
            case "paused":
                return "#f59e0b";
            case "stopped":
                return "#ef4444";
            default:
                return "#6b7280";
        }
    };

    const handleCardClick = (e) => {
        // Don't trigger card click when clicking on edit/delete buttons or input fields
        if (
            e.target.closest("button") ||
            e.target.closest("input") ||
            e.target.closest("textarea") ||
            isEditing
        ) {
            return;
        }
        if (onCardClick) {
            onCardClick(strategy);
        }
    };

    return (
        <div
            className="strategy-card"
            style={{
                position: "relative",
                cursor: isEditing ? "default" : "pointer",
            }}
            onClick={handleCardClick}
        >
            <div className="strategy-header">
                {isEditing ? (
                    <input
                        type="text"
                        value={editData.title}
                        onChange={(e) =>
                            setEditData({ ...editData, title: e.target.value })
                        }
                        className="strategy-title-edit"
                        style={{
                            background: "transparent",
                            border: "1px solid #4b5563",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            color: "white",
                            fontSize: "18px",
                            fontWeight: "bold",
                        }}
                    />
                ) : (
                    <h3 className="strategy-title">{strategy.title}</h3>
                )}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span
                        className="strategy-status"
                        style={{
                            backgroundColor: getStatusColor(strategy.status),
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            textTransform: "capitalize",
                        }}
                    >
                        {strategy.status}
                    </span>
                    <button
                        onClick={handleEdit}
                        disabled={loading}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#9ca3af",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="strategy-details">
                <div className="strategy-detail">
                    <span>
                        <Coins size={16} /> Current Asset:
                    </span>
                    <span>{strategy.coin}</span>
                </div>
                <div className="strategy-detail">
                    <span>
                        <DollarSign size={16} /> Amount:
                    </span>
                    <span>
                        {isEditing ? (
                            <input
                                type="number"
                                value={editData.initialAmount}
                                onChange={(e) =>
                                    setEditData({
                                        ...editData,
                                        initialAmount: e.target.value,
                                    })
                                }
                                step="0.0001"
                                style={{
                                    background: "transparent",
                                    border: "1px solid #4b5563",
                                    borderRadius: "4px",
                                    padding: "2px 6px",
                                    color: "white",
                                    width: "100px",
                                }}
                            />
                        ) : (
                            `${strategy.currentAmount} ${strategy.coin}`
                        )}
                    </span>
                </div>
                <div className="strategy-detail">
                    <span>
                        <Clock size={16} /> Created:
                    </span>
                    <span>{formatDate(strategy.createdAt)}</span>
                </div>
                <div className="strategy-detail">
                    <span>
                        <TrendingUp size={16} /> Last Update:
                    </span>
                    <span>{formatDate(strategy.updatedAt)}</span>
                </div>
            </div>

            <div className="strategy-description">
                {isEditing ? (
                    <textarea
                        value={editData.description}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                description: e.target.value,
                            })
                        }
                        style={{
                            width: "100%",
                            background: "transparent",
                            border: "1px solid #4b5563",
                            borderRadius: "4px",
                            padding: "8px",
                            color: "white",
                            resize: "vertical",
                            minHeight: "60px",
                        }}
                    />
                ) : (
                    strategy.description
                )}
            </div>

            {/* Last Obeyed Recommendation */}
            {strategy.lastObeyedRecommendation &&
                strategy.lastObeyedRecommendation.message !==
                    "No recommendations followed yet" && (
                    <div
                        style={{
                            marginTop: "12px",
                            padding: "8px",
                            backgroundColor: "#374151",
                            borderRadius: "6px",
                            fontSize: "12px",
                        }}
                    >
                        <div
                            style={{
                                color: "#9ca3af",
                                marginBottom: "4px",
                                fontWeight: "bold",
                            }}
                        >
                            Last Obeyed Recommendation:
                        </div>
                        <div style={{ color: "#d1d5db", marginBottom: "4px" }}>
                            {strategy.lastObeyedRecommendation.message}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "#9ca3af",
                            }}
                        >
                            <span
                                style={{
                                    color:
                                        strategy.lastObeyedRecommendation
                                            .recommendation === "buy"
                                            ? "#10b981"
                                            : strategy.lastObeyedRecommendation
                                                  .recommendation === "sell"
                                            ? "#ef4444"
                                            : "#f59e0b",
                                }}
                            >
                                {(
                                    strategy.lastObeyedRecommendation
                                        .recommendation || ""
                                ).toUpperCase()}
                            </span>
                            <span>
                                {new Date(
                                    strategy.lastObeyedRecommendation.timestamp
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}

            {/* Notification indicator */}
            {strategy.latestNotification &&
                strategy.latestNotification.userResponse === "pending" && (
                    <div
                        style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#ef4444",
                            borderRadius: "50%",
                            border: "2px solid #1f2937",
                        }}
                    />
                )}

            {isEditing && (
                <div
                    style={{
                        marginTop: "12px",
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                        style={{
                            padding: "6px 12px",
                            background: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEdit}
                        disabled={loading}
                        style={{
                            padding: "6px 12px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Strategy"
                message={`Are you sure you want to delete "${strategy.title}"? This action cannot be undone and will remove all associated data including recommendations and notifications.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={loading}
                type="danger"
            />
        </div>
    );
};

export default StrategyCard;
