import React, { useState } from "react";
import { recommendationAPI } from "../services/api";

const RecommendationModal = ({ recommendation, onClose, onResponse }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (action) => {
        setLoading(true);
        setError("");

        try {
            if (action === "ignore") {
                // Reject the recommendation
                await recommendationAPI.respondToRecommendation(
                    recommendation._id,
                    "rejected",
                    "User chose to ignore the recommendation"
                );
                onResponse("ignored");
            } else if (action === "obey") {
                // Accept the recommendation
                await recommendationAPI.respondToRecommendation(
                    recommendation._id,
                    "accepted",
                    "User chose to follow the recommendation"
                );
                onResponse("obeyed");
            }
            onClose();
        } catch (error) {
            setError(error.message || "Failed to respond to recommendation");
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action?.toLowerCase()) {
            case "buy":
            case "swap":
                return "text-green-400";
            case "sell":
                return "text-red-400";
            case "hold":
                return "text-yellow-400";
            default:
                return "text-gray-400";
        }
    };

    const getActionIcon = (action) => {
        const iconStyle = { width: "20px", height: "20px" };

        switch (action?.toLowerCase()) {
            case "buy":
            case "swap":
                return (
                    <svg
                        style={iconStyle}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case "sell":
                return (
                    <svg
                        style={iconStyle}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case "hold":
                return (
                    <svg
                        style={iconStyle}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const parseRecommendationText = (text) => {
        if (!text)
            return {
                action: "HOLD",
                currentToken: "",
                newToken: "",
                period: "",
            };

        // Parse "Swap ETH for PEPE and hold for 2-4 weeks" or "Don't swap anything and hold ETH for more 1-2 weeks"
        if (text.toLowerCase().includes("don't swap anything")) {
            const holdMatch = text.match(/hold (\w+) for (?:more )?(.+)/i);
            return {
                action: "HOLD",
                currentToken: holdMatch?.[1] || "",
                newToken: holdMatch?.[1] || "",
                period: holdMatch?.[2] || "",
            };
        } else if (text.toLowerCase().includes("swap")) {
            const swapMatch = text.match(
                /swap (\w+) for (\w+) and hold for (.+)/i
            );
            return {
                action: "SWAP",
                currentToken: swapMatch?.[1] || "",
                newToken: swapMatch?.[2] || "",
                period: swapMatch?.[3] || "",
            };
        }

        return { action: "HOLD", currentToken: "", newToken: "", period: "" };
    };

    const parsedRec = parseRecommendationText(recommendation.recommendation);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "#1f2937",
                    borderRadius: "8px",
                    padding: "24px",
                    width: "100%",
                    maxWidth: "500px",
                    margin: "16px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#ffffff",
                            margin: 0,
                        }}
                    >
                        AI Recommendation
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#9ca3af",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            transition: "color 0.2s",
                        }}
                        onMouseOver={(e) => (e.target.style.color = "#ffffff")}
                        onMouseOut={(e) => (e.target.style.color = "#9ca3af")}
                    >
                        <svg
                            style={{ width: "24px", height: "24px" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    {/* Strategy Info */}
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#374151",
                            borderRadius: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <h3
                            style={{
                                color: "#ffffff",
                                fontWeight: "600",
                                marginBottom: "8px",
                                margin: 0,
                            }}
                        >
                            {recommendation.strategy.title}
                        </h3>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#d1d5db",
                                marginBottom: "4px",
                            }}
                        >
                            Current Holdings: {recommendation.strategy.coin}
                        </div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                            }}
                        >
                            {new Date(
                                recommendation.createdAt
                            ).toLocaleString()}
                        </div>
                    </div>

                    {/* Recommendation Details */}
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#374151",
                            borderRadius: "8px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "12px",
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color:
                                        parsedRec.action === "SWAP"
                                            ? "#10b981"
                                            : "#f59e0b",
                                    fontWeight: "600",
                                }}
                            >
                                {getActionIcon(parsedRec.action)}
                                {parsedRec.action === "SWAP" ? "SWAP" : "HOLD"}
                            </span>
                            <span style={{ color: "#d1d5db" }}>•</span>
                            <span style={{ color: "#ffffff" }}>
                                Confidence: {recommendation.confidence}%
                            </span>
                        </div>

                        {parsedRec.action === "SWAP" && (
                            <div
                                style={{
                                    backgroundColor: "#4b5563",
                                    borderRadius: "6px",
                                    padding: "12px",
                                    marginBottom: "12px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <span style={{ color: "#d1d5db" }}>
                                        From:
                                    </span>
                                    <span
                                        style={{
                                            color: "#ffffff",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {parsedRec.currentToken}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "8px 0",
                                    }}
                                >
                                    <svg
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            color: "#9ca3af",
                                        }}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                        />
                                    </svg>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span style={{ color: "#d1d5db" }}>
                                        To:
                                    </span>
                                    <span
                                        style={{
                                            color: "#10b981",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {parsedRec.newToken}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                fontSize: "14px",
                                color: "#d1d5db",
                                marginBottom: "8px",
                            }}
                        >
                            <span style={{ fontWeight: "500" }}>
                                Hold Period:
                            </span>{" "}
                            {parsedRec.period}
                        </div>

                        <div
                            style={{
                                fontSize: "14px",
                                color: "#d1d5db",
                                marginBottom: "4px",
                            }}
                        >
                            <span style={{ fontWeight: "500" }}>Analysis:</span>
                        </div>
                        <p
                            style={{
                                color: "#ffffff",
                                fontSize: "14px",
                                margin: 0,
                                lineHeight: "1.5",
                            }}
                        >
                            {recommendation.explanation}
                        </p>
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid #ef4444",
                                borderRadius: "8px",
                                color: "#fecaca",
                                fontSize: "14px",
                                marginTop: "16px",
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={() => handleSubmit("ignore")}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            backgroundColor: "#dc2626",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) =>
                            !loading &&
                            (e.target.style.backgroundColor = "#b91c1c")
                        }
                        onMouseOut={(e) =>
                            !loading &&
                            (e.target.style.backgroundColor = "#dc2626")
                        }
                    >
                        <svg
                            style={{ width: "16px", height: "16px" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        <span>{loading ? "Processing..." : "Ignore"}</span>
                    </button>
                    <button
                        onClick={() => handleSubmit("obey")}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            backgroundColor: "#059669",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) =>
                            !loading &&
                            (e.target.style.backgroundColor = "#047857")
                        }
                        onMouseOut={(e) =>
                            !loading &&
                            (e.target.style.backgroundColor = "#059669")
                        }
                    >
                        <svg
                            style={{ width: "16px", height: "16px" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>{loading ? "Processing..." : "I Obey"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecommendationModal;
