import React from "react";

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Yes",
    cancelText = "Cancel",
    loading = false,
    type = "danger", // "danger", "warning", "info"
}) => {
    if (!isOpen) return null;

    const getTypeColors = () => {
        switch (type) {
            case "danger":
                return {
                    confirmBg: "#ef4444",
                    confirmHover: "#dc2626",
                    iconColor: "#ef4444",
                };
            case "warning":
                return {
                    confirmBg: "#f59e0b",
                    confirmHover: "#d97706",
                    iconColor: "#f59e0b",
                };
            case "info":
                return {
                    confirmBg: "#3b82f6",
                    confirmHover: "#2563eb",
                    iconColor: "#3b82f6",
                };
            default:
                return {
                    confirmBg: "#ef4444",
                    confirmHover: "#dc2626",
                    iconColor: "#ef4444",
                };
        }
    };

    const colors = getTypeColors();

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
            }}
        >
            <div
                style={{
                    backgroundColor: "#1f2937",
                    borderRadius: "8px",
                    padding: "24px",
                    width: "100%",
                    maxWidth: "400px",
                    margin: "16px",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "16px",
                    }}
                >
                    {type === "danger" && (
                        <svg
                            style={{
                                width: "24px",
                                height: "24px",
                                color: colors.iconColor,
                                marginRight: "12px",
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    )}
                    <h3
                        style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#f9fafb",
                            margin: 0,
                        }}
                    >
                        {title}
                    </h3>
                </div>

                {/* Message */}
                <p
                    style={{
                        color: "#d1d5db",
                        marginBottom: "24px",
                        lineHeight: "1.5",
                    }}
                >
                    {message}
                </p>

                {/* Buttons */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.5 : 1,
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = "#4b5563";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = "#6b7280";
                            }
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: colors.confirmBg,
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.5 : 1,
                            transition: "background-color 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor =
                                    colors.confirmHover;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor =
                                    colors.confirmBg;
                            }
                        }}
                    >
                        {loading && (
                            <svg
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    animation: "spin 1s linear infinite",
                                }}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    style={{ opacity: 0.25 }}
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    style={{ opacity: 0.75 }}
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        )}
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>

            {/* Add keyframe animation for loading spinner */}
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default ConfirmationModal;
