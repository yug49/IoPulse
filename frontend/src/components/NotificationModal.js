import React, { useState } from "react";
import { strategyAPI } from "../services/api";

const NotificationModal = ({
    notification,
    strategyId,
    onClose,
    onResponse,
}) => {
    const [response, setResponse] = useState("");
    const [amountChange, setAmountChange] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (responseType) => {
        setLoading(true);
        setError("");

        try {
            const responseData = {
                response: responseType,
                amountChange:
                    responseType === "obeyed"
                        ? parseFloat(amountChange) || 0
                        : 0,
            };

            const result = await strategyAPI.respondToNotification(
                strategyId,
                notification._id,
                responseData
            );

            if (result.success) {
                onResponse(result.data);
                onClose();
            }
        } catch (error) {
            setError(error.message || "Failed to respond to notification");
        } finally {
            setLoading(false);
        }
    };

    const getRecommendationColor = (recommendation) => {
        switch (recommendation) {
            case "buy":
                return "text-green-400";
            case "sell":
                return "text-red-400";
            case "hold":
                return "text-yellow-400";
            default:
                return "text-gray-400";
        }
    };

    const getRecommendationIcon = (recommendation) => {
        switch (recommendation) {
            case "buy":
                return (
                    <svg
                        className="w-5 h-5"
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
                        className="w-5 h-5"
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
                        className="w-5 h-5"
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">
                        Strategy Notification
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
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

                <div className="space-y-4 mb-6">
                    {/* Notification Message */}
                    <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-white mb-2">
                            {notification.message}
                        </p>
                        <div className="text-sm text-gray-400">
                            {new Date(notification.timestamp).toLocaleString()}
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className="flex items-center space-x-2 p-4 bg-gray-700 rounded-lg">
                        <span
                            className={`flex items-center space-x-2 ${getRecommendationColor(
                                notification.recommendation
                            )}`}
                        >
                            {getRecommendationIcon(notification.recommendation)}
                            <span className="font-semibold capitalize">
                                {notification.recommendation}
                            </span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-white">
                            Confidence: {notification.confidence}%
                        </span>
                    </div>

                    {/* Amount Change Input (only for 'obeyed' response) */}
                    {response === "obeyed" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Amount Change
                            </label>
                            <input
                                type="number"
                                value={amountChange}
                                onChange={(e) =>
                                    setAmountChange(e.target.value)
                                }
                                step="0.0001"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Enter ${
                                    notification.recommendation === "buy"
                                        ? "amount bought"
                                        : notification.recommendation === "sell"
                                        ? "amount sold (negative)"
                                        : "amount change"
                                }`}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {notification.recommendation === "buy"
                                    ? "Positive number for coins bought"
                                    : notification.recommendation === "sell"
                                    ? "Negative number for coins sold"
                                    : "Positive or negative for amount change"}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleSubmit("ignored")}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading && response === "ignored"
                            ? "Processing..."
                            : "Ignore"}
                    </button>
                    <button
                        onClick={() => {
                            if (response !== "obeyed") {
                                setResponse("obeyed");
                                return;
                            }
                            handleSubmit("obeyed");
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading && response === "obeyed"
                            ? "Processing..."
                            : response === "obeyed"
                            ? "Confirm I Obeyed"
                            : "I Obeyed"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
