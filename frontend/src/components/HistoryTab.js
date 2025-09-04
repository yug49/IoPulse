import React from "react";

const HistoryTab = ({ history, loading, onLoadMore, hasMore }) => {
    const getEventIcon = (eventType) => {
        const iconStyle = { width: "16px", height: "16px" };

        switch (eventType) {
            case "STRATEGY_CREATED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#10b981" }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case "STRATEGY_UPDATED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#3b82f6" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                );
            case "STRATEGY_DELETED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#ef4444" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                );
            case "AI_WORKFLOW_STARTED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#8b5cf6" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                );
            case "AI_WORKFLOW_COMPLETED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#10b981" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                );
            case "AI_WORKFLOW_FAILED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#ef4444" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case "RECOMMENDATION_ACCEPTED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#10b981" }}
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
                );
            case "RECOMMENDATION_REJECTED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#ef4444" }}
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
                );
            case "HOLDING_UPDATED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#f59e0b" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                );
            case "STATUS_CHANGED":
                return (
                    <svg
                        style={{ ...iconStyle, color: "#6b7280" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        />
                    </svg>
                );
            default:
                return (
                    <svg
                        style={{ ...iconStyle, color: "#6b7280" }}
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
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "CRITICAL":
                return "#dc2626";
            case "HIGH":
                return "#ea580c";
            case "MEDIUM":
                return "#2563eb";
            case "LOW":
                return "#16a34a";
            default:
                return "#6b7280";
        }
    };

    const formatEventData = (eventType, data) => {
        if (!data) return null;

        switch (eventType) {
            case "STRATEGY_CREATED":
                return (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginTop: "4px",
                        }}
                    >
                        <div>
                            Coin: {data.newValues?.coin}, Amount:{" "}
                            {data.newValues?.initialAmount}
                        </div>
                        <div>Status: {data.newValues?.status}</div>
                    </div>
                );
            case "STRATEGY_UPDATED":
                return (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginTop: "4px",
                        }}
                    >
                        {data.oldValues && data.newValues && (
                            <div>
                                {Object.keys(data.newValues).map((key) =>
                                    data.oldValues[key] !==
                                    data.newValues[key] ? (
                                        <div key={key}>
                                            {key}: {data.oldValues[key]} →{" "}
                                            {data.newValues[key]}
                                        </div>
                                    ) : null
                                )}
                            </div>
                        )}
                    </div>
                );
            case "AI_WORKFLOW_COMPLETED":
                return (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginTop: "4px",
                        }}
                    >
                        <div style={{ color: "#d1d5db", marginBottom: "2px" }}>
                            {data.recommendation?.recommendation}
                        </div>
                        <div>
                            Confidence: {data.recommendation?.confidence}%
                        </div>
                        {data.metadata?.executionTime && (
                            <div>
                                Execution:{" "}
                                {Math.round(data.metadata.executionTime / 1000)}
                                s
                            </div>
                        )}
                    </div>
                );
            case "RECOMMENDATION_ACCEPTED":
            case "RECOMMENDATION_REJECTED":
                return (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginTop: "4px",
                        }}
                    >
                        <div style={{ color: "#d1d5db", marginBottom: "2px" }}>
                            {data.recommendation?.recommendation}
                        </div>
                        <div>
                            Confidence: {data.recommendation?.confidence}%
                        </div>
                    </div>
                );
            case "HOLDING_UPDATED":
                return (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginTop: "4px",
                        }}
                    >
                        <div>
                            {data.oldValues?.coin} → {data.newValues?.coin}
                        </div>
                        {data.metadata?.updateReason && (
                            <div>Reason: {data.metadata.updateReason}</div>
                        )}
                    </div>
                );
            case "AI_WORKFLOW_FAILED":
                return (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#ef4444",
                            marginTop: "4px",
                        }}
                    >
                        {data.metadata?.error && (
                            <div>Error: {data.metadata.error}</div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading && history.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                    color: "#9ca3af",
                }}
            >
                Loading history...
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "200px",
                    color: "#9ca3af",
                    textAlign: "center",
                }}
            >
                <svg
                    style={{
                        width: "48px",
                        height: "48px",
                        marginBottom: "16px",
                        color: "#4b5563",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h3 style={{ margin: "0 0 8px 0", color: "#d1d5db" }}>
                    No History Yet
                </h3>
                <p style={{ margin: 0, fontSize: "14px" }}>
                    Strategy activity will appear here as you use the app
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: "16px" }}>
            <div style={{ marginBottom: "16px" }}>
                <h3
                    style={{
                        color: "#f9fafb",
                        margin: "0 0 8px 0",
                        fontSize: "18px",
                    }}
                >
                    Strategy History
                </h3>
                <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
                    Complete timeline of all strategy activities and AI
                    recommendations
                </p>
            </div>

            <div style={{ position: "relative" }}>
                {/* Timeline line */}
                <div
                    style={{
                        position: "absolute",
                        left: "12px",
                        top: "0",
                        bottom: "0",
                        width: "2px",
                        backgroundColor: "#374151",
                    }}
                />

                {history.map((entry, index) => (
                    <div
                        key={entry._id || index}
                        style={{
                            position: "relative",
                            paddingLeft: "40px",
                            paddingBottom: "24px",
                        }}
                    >
                        {/* Timeline dot */}
                        <div
                            style={{
                                position: "absolute",
                                left: "5px",
                                top: "4px",
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                backgroundColor: getSeverityColor(
                                    entry.severity
                                ),
                                border: "2px solid #1f2937",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div style={{ fontSize: "8px", color: "white" }}>
                                {getEventIcon(entry.eventType)}
                            </div>
                        </div>

                        {/* Content */}
                        <div
                            style={{
                                backgroundColor: "#1f2937",
                                borderRadius: "8px",
                                padding: "12px",
                                border: "1px solid #374151",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "8px",
                                }}
                            >
                                <div>
                                    <h4
                                        style={{
                                            color: "#f9fafb",
                                            margin: "0 0 4px 0",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {entry.title}
                                    </h4>
                                    <p
                                        style={{
                                            color: "#d1d5db",
                                            margin: 0,
                                            fontSize: "13px",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        {entry.description}
                                    </p>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginLeft: "12px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            color: "#9ca3af",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {entry.timeAgo ||
                                            new Date(
                                                entry.timestamp
                                            ).toLocaleString()}
                                    </span>
                                    {getEventIcon(entry.eventType)}
                                </div>
                            </div>

                            {formatEventData(entry.eventType, entry.data)}
                        </div>
                    </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                        <button
                            onClick={onLoadMore}
                            disabled={loading}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#374151",
                                color: "#d1d5db",
                                border: "1px solid #4b5563",
                                borderRadius: "6px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                opacity: loading ? 0.5 : 1,
                            }}
                        >
                            {loading ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryTab;
