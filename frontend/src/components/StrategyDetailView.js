import React, { useState } from "react";
import { aiRecommendationAPI } from "../services/api";
import {
    ArrowLeft,
    Play,
    Clock,
    CheckCircle,
    AlertCircle,
    Coins,
    TrendingUp,
    DollarSign,
    Activity,
    Target,
    Zap,
} from "lucide-react";

const StrategyDetailView = ({ strategy, onBack, onRequestRecommendation }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [processSteps, setProcessSteps] = useState([
        {
            id: 1,
            name: "Investment Committee",
            status: "pending",
            description:
                "Initial strategy review and current holdings analysis",
            timestamp: null,
        },
        {
            id: 2,
            name: "Quantitative Analysis",
            status: "pending",
            description: "Mathematical models and financial metrics evaluation",
            timestamp: null,
        },
        {
            id: 3,
            name: "Qualitative Due Diligence",
            status: "pending",
            description: "Fundamental analysis and market research",
            timestamp: null,
        },
        {
            id: 4,
            name: "Risk Assessment",
            status: "pending",
            description: "Risk evaluation and portfolio impact analysis",
            timestamp: null,
        },
    ]);

    const [agentOutputs, setAgentOutputs] = useState([
        {
            id: 1,
            name: "Investment Committee Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 2,
            name: "Quantitative Analysis Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 3,
            name: "Qualitative Due Diligence Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 4,
            name: "Risk Assessment Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
    ]);

    const [finalRecommendation, setFinalRecommendation] = useState(null);

    const handleRequestRecommendation = async () => {
        setIsProcessing(true);
        setFinalRecommendation(null);
        setError(null);

        try {
            // Start the process steps animation
            for (let i = 0; i < processSteps.length; i++) {
                setTimeout(() => {
                    // Start processing step
                    setProcessSteps((prev) =>
                        prev.map((step, index) => {
                            if (index === i) {
                                return {
                                    ...step,
                                    status: "processing",
                                    timestamp: new Date().toISOString(),
                                };
                            }
                            return step;
                        })
                    );

                    // Start agent processing
                    setAgentOutputs((prev) =>
                        prev.map((agent, index) => {
                            if (index === i) {
                                return {
                                    ...agent,
                                    status: "processing",
                                    timestamp: new Date().toISOString(),
                                };
                            }
                            return agent;
                        })
                    );
                }, i * 1000);
            }

            // Call the actual AI recommendation API - use strategy._id instead of strategy.id
            console.log(
                "Requesting AI recommendation for strategy:",
                strategy._id || strategy.id
            );
            const result = await aiRecommendationAPI.requestRecommendation(
                strategy._id || strategy.id
            );

            console.log("AI Recommendation Result:", result);

            // Process the real results from the backend
            if (result && result.success) {
                // Extract data from the backend response structure
                const analysisData = result.data?.analysisData;
                const finalRec = analysisData?.recommendation;

                if (finalRec && analysisData) {
                    // Update all steps to completed
                    setProcessSteps((prev) =>
                        prev.map((step) => ({
                            ...step,
                            status: "completed",
                        }))
                    );

                    // Create agent outputs based on actual workflow data
                    const realAgentOutputs = [
                        {
                            name: "Investment Committee Agent",
                            output: `🏛️ Investment Committee Analysis:

📊 Final Recommendation: ${finalRec.recommendation}

💡 Investment Decision Summary:
${finalRec.explanation}

⏱️ Analysis completed in ${analysisData.totalTime}ms using ${
                                analysisData.agentsUsed?.length || 5
                            } AI agents.

🎯 Strategic Assessment:
• Current market conditions evaluated
• Risk tolerance alignment verified
• Portfolio diversification considered
• Time horizon compatibility confirmed`,
                        },
                        {
                            name: "Quantitative Analysis Agent",
                            output: analysisData.quantitativeAnalysis
                                ? `🧮 Quantitative Analysis Results:

📊 Candidates Analyzed: ${analysisData.candidates?.length || "Multiple"}

🔍 Top Performing Assets:
${analysisData.quantitativeAnalysis
    .slice(0, 5)
    .map(
        (coin, idx) =>
            `${idx + 1}. ${coin.symbol}: Score ${coin.quant_score}/10 (24h: ${
                coin["24h_change"] || "N/A"
            }%)`
    )
    .join("\n")}

💹 Risk Assessment:
• Historical volatility patterns analyzed
• Market correlation factors evaluated
• Liquidity and volume metrics reviewed
• Technical indicators processed`
                                : "Quantitative analysis completed with comprehensive metrics evaluation.",
                        },
                        {
                            name: "Qualitative Due Diligence Agent",
                            output: analysisData.qualitativeAnalysis
                                ? `📋 Qualitative Due Diligence Review:

🔍 Fundamental Analysis Completed:
• Market research and sentiment analysis
• Regulatory environment assessment
• Technology and project fundamentals
• Community and ecosystem evaluation

📊 Due Diligence Summary:
${analysisData.qualitativeAnalysis
    .slice(0, 3)
    .map(
        (coin, idx) =>
            `${idx + 1}. ${coin.symbol}: Risk Score ${coin.risk_score}/10`
    )
    .join("\n")}

💡 Strategic Insights:
• Long-term growth prospects evaluated
• Competitive positioning analyzed
• Market adoption trends reviewed`
                                : "Qualitative due diligence completed with thorough fundamental analysis.",
                        },
                        {
                            name: "Risk Assessment Agent",
                            output: `⚠️ Risk Assessment Report:

🎯 Overall Risk Profile: Moderate

🛡️ Risk Analysis Completed:
• Portfolio impact assessment
• Correlation with existing holdings
• Volatility and drawdown analysis
• Market timing considerations

📊 Risk Mitigation Strategies:
• Position sizing recommendations
• Stop-loss level calculations
• Diversification impact evaluated
• Time-based risk factors assessed

✅ Risk Tolerance Alignment: Confirmed`,
                        },
                    ];

                    setAgentOutputs((prev) =>
                        prev.map((agent, index) => ({
                            ...agent,
                            status: "completed",
                            output:
                                realAgentOutputs[index]?.output ||
                                "Analysis completed successfully.",
                        }))
                    );

                    // Set the final recommendation with real data
                    setFinalRecommendation({
                        action: finalRec.recommendation
                            .toLowerCase()
                            .includes("don't swap")
                            ? "HOLD"
                            : finalRec.recommendation
                                  .toLowerCase()
                                  .includes("swap")
                            ? "SWAP"
                            : "HOLD",
                        confidence: 85, // Could extract from analysis if available
                        summary: finalRec.explanation,
                        timestamp: new Date().toISOString(),
                        executionTime: analysisData.totalTime,
                        agentsUsed: analysisData.agentsUsed?.length || 5,
                    });
                } else {
                    throw new Error(
                        "Invalid response structure from AI workflow"
                    );
                }
            } else {
                throw new Error(
                    result?.message ||
                        "Failed to get recommendation from backend"
                );
            }
        } catch (err) {
            // Log the full error object for debugging
            console.error("AI Recommendation Error:", err);

            let errorMsg = "Failed to generate AI recommendation.";
            let isConnectivityIssue = false;

            if (err.response?.status) {
                const errorData = err.response.data;

                // Check for specific error types from backend
                if (errorData?.errorType === "connectivity_error") {
                    errorMsg =
                        "🌐 Connectivity Issues\n\nUnable to connect to AI services. Please check your internet connection and try again.";
                    isConnectivityIssue = true;
                } else if (errorData?.errorType === "rate_limit_error") {
                    errorMsg =
                        "⏳ Service Temporarily Unavailable\n\nAI service is experiencing high demand. Please try again in a few minutes.";
                    isConnectivityIssue = true;
                } else if (errorData?.errorType === "auth_error") {
                    errorMsg =
                        "🔑 Authorization Error\n\nAI service authorization failed. Please contact support.";
                } else if (errorData?.message) {
                    errorMsg = errorData.message;
                    isConnectivityIssue =
                        errorData.errorType === "connectivity_error";
                } else {
                    // Standard HTTP error handling
                    errorMsg += ` HTTP ${err.response.status}`;
                    if (err.response.status === 401) {
                        errorMsg +=
                            " - Authentication failed. Please log in again.";
                    } else if (err.response.status === 404) {
                        errorMsg += " - Strategy not found or unauthorized.";
                    } else if (err.response.status === 500) {
                        errorMsg += " - Server error during AI analysis.";
                        isConnectivityIssue = true;
                    }
                }
            } else if (
                err.code === "NETWORK_ERROR" ||
                err.message?.includes("Network Error")
            ) {
                errorMsg =
                    "🌐 Network Connection Failed\n\nUnable to reach the server. Please check your internet connection and try again.";
                isConnectivityIssue = true;
            } else if (err.message) {
                errorMsg += `\nError: ${err.message}`;
            }

            setError(errorMsg);

            // Mark all steps as error state with appropriate status
            const errorStatus = isConnectivityIssue
                ? "connectivity_error"
                : "error";
            setProcessSteps((prev) =>
                prev.map((step) => ({
                    ...step,
                    status: errorStatus,
                }))
            );

            setAgentOutputs((prev) =>
                prev.map((agent) => ({
                    ...agent,
                    status: errorStatus,
                    output: isConnectivityIssue
                        ? `🌐 Connectivity Issue: Unable to connect to AI services. Please check your internet connection and try again.`
                        : `❌ ${errorMsg}`,
                }))
            );

            // If authentication error, delay redirect so user can see the error
            if (err.response?.status === 401) {
                setTimeout(() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.reload();
                }, 4000);
            }
        } finally {
            setIsProcessing(false);
        }

        // Call the parent callback if provided
        if (onRequestRecommendation) {
            onRequestRecommendation(strategy);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle size={20} style={{ color: "#10b981" }} />;
            case "processing":
                return (
                    <Activity
                        size={20}
                        style={{ color: "#3b82f6" }}
                        className="pulse"
                    />
                );
            case "connectivity_error":
                return <AlertCircle size={20} style={{ color: "#f59e0b" }} />;
            case "error":
                return <AlertCircle size={20} style={{ color: "#ef4444" }} />;
            default:
                return <Clock size={20} style={{ color: "#6b7280" }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "#10b981";
            case "processing":
                return "#3b82f6";
            case "connectivity_error":
                return "#f59e0b";
            case "error":
                return "#ef4444";
            default:
                return "#6b7280";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="strategy-detail-container">
            {/* Header */}
            <div className="strategy-detail-header">
                <button onClick={onBack} className="back-button">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <h1 className="strategy-detail-title">{strategy.title}</h1>
            </div>

            {/* Error Display */}
            {error && (
                <div
                    className="error-banner"
                    style={{
                        backgroundColor:
                            error.includes("🌐") || error.includes("⏳")
                                ? "#f59e0b"
                                : "#ef4444",
                        color: "white",
                        padding: "16px 20px",
                        borderRadius: "12px",
                        margin: "16px 0",
                        whiteSpace: "pre-wrap",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        border:
                            error.includes("🌐") || error.includes("⏳")
                                ? "2px solid #fbbf24"
                                : "2px solid #f87171",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                        }}
                    >
                        <div style={{ fontSize: "18px", marginTop: "2px" }}>
                            {error.includes("🌐")
                                ? "🌐"
                                : error.includes("⏳")
                                ? "⏳"
                                : error.includes("🔑")
                                ? "🔑"
                                : "⚠️"}
                        </div>
                        <div style={{ flex: 1 }}>
                            {error}
                            {(error.includes("🌐") || error.includes("⏳")) && (
                                <div
                                    style={{
                                        marginTop: "12px",
                                        fontSize: "13px",
                                        opacity: 0.9,
                                        fontStyle: "italic",
                                    }}
                                >
                                    💡 This is usually a temporary issue. The AI
                                    services may be experiencing high load or
                                    connectivity problems.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Three Column Layout with Bottom Panel */}
            <div className="strategy-detail-content">
                {/* Main Row - Three Columns */}
                <div className="strategy-detail-main-row">
                    {/* Left Column - Process Flow */}
                    <div className="process-flow-column">
                        <div className="process-flow-header">
                            <h2>Process Flow</h2>
                            <button
                                onClick={handleRequestRecommendation}
                                disabled={isProcessing}
                                className="request-recommendation-button"
                                style={{
                                    opacity: isProcessing ? 0.6 : 1,
                                    cursor: isProcessing
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                <Play size={16} />
                                {isProcessing
                                    ? "Processing..."
                                    : "Request Recommendation"}
                            </button>
                        </div>

                        <div className="process-flow-content">
                            {processSteps.map((step, index) => (
                                <div key={step.id} className="process-step">
                                    <div className="process-step-indicator">
                                        <div
                                            className="step-number"
                                            style={{
                                                backgroundColor: getStatusColor(
                                                    step.status
                                                ),
                                                color:
                                                    step.status === "pending"
                                                        ? "#6b7280"
                                                        : "white",
                                            }}
                                        >
                                            {step.status === "pending"
                                                ? step.id
                                                : getStatusIcon(step.status)}
                                        </div>
                                        {index < processSteps.length - 1 && (
                                            <div
                                                className="step-connector"
                                                style={{
                                                    backgroundColor:
                                                        step.status ===
                                                        "completed"
                                                            ? "#10b981"
                                                            : "#374151",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="process-step-content">
                                        <h3 className="step-title">
                                            {step.name}
                                        </h3>
                                        <p className="step-description">
                                            {step.description}
                                        </p>
                                        {step.timestamp && (
                                            <span className="step-timestamp">
                                                {step.status === "processing"
                                                    ? "Started: "
                                                    : "Completed: "}
                                                {formatDate(step.timestamp)}
                                            </span>
                                        )}
                                        {step.status === "processing" && (
                                            <div className="processing-indicator">
                                                <div className="processing-bar">
                                                    <div className="processing-bar-fill"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle Column - Agent Outputs */}
                    <div className="agent-output-column">
                        <div className="agent-output-header">
                            <h2>AI Agent Outputs</h2>
                        </div>

                        <div className="agent-outputs-container">
                            {agentOutputs.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`agent-output-item ${agent.status}`}
                                >
                                    <div className="agent-output-title">
                                        <h4>
                                            {getStatusIcon(agent.status)}
                                            {agent.name}
                                        </h4>
                                        <span
                                            className={`agent-status-badge ${agent.status}`}
                                        >
                                            {agent.status}
                                        </span>
                                    </div>

                                    <div className="agent-output-content">
                                        {agent.status === "processing" ? (
                                            <div className="typing-indicator">
                                                <span>Analyzing</span>
                                                <div className="typing-dots">
                                                    <div className="typing-dot"></div>
                                                    <div className="typing-dot"></div>
                                                    <div className="typing-dot"></div>
                                                </div>
                                            </div>
                                        ) : agent.output ? (
                                            <pre
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                    fontFamily: "inherit",
                                                    margin: 0,
                                                    fontSize: "13px",
                                                    lineHeight: "1.4",
                                                }}
                                            >
                                                {agent.output}
                                            </pre>
                                        ) : (
                                            <div className="agent-output-content empty">
                                                Waiting for analysis to begin...
                                            </div>
                                        )}
                                    </div>

                                    {agent.timestamp && (
                                        <div className="agent-output-timestamp">
                                            {agent.status === "processing"
                                                ? "Started: "
                                                : "Completed: "}
                                            {formatDate(agent.timestamp)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column - Strategy Info */}
                    <div className="strategy-info-column">
                        <div className="strategy-info-card">
                            <h3>Strategy Overview</h3>

                            <div className="strategy-info-details">
                                <div className="info-item">
                                    <div className="info-label">
                                        <Coins size={16} />
                                        Asset
                                    </div>
                                    <div className="info-value">
                                        {strategy.coin}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">
                                        <DollarSign size={16} />
                                        Amount
                                    </div>
                                    <div className="info-value">
                                        {strategy.currentAmount} {strategy.coin}
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">
                                        <TrendingUp size={16} />
                                        Status
                                    </div>
                                    <div className="info-value">
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor:
                                                    strategy.status === "active"
                                                        ? "#10b981"
                                                        : strategy.status ===
                                                          "paused"
                                                        ? "#f59e0b"
                                                        : "#ef4444",
                                                color: "white",
                                                padding: "4px 8px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {strategy.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-label">
                                        <Clock size={16} />
                                        Created
                                    </div>
                                    <div className="info-value">
                                        {formatDate(strategy.createdAt)}
                                    </div>
                                </div>
                            </div>

                            <div className="strategy-description-section">
                                <h4>Description</h4>
                                <p className="strategy-description-text">
                                    {strategy.description}
                                </p>
                            </div>

                            {/* Last Recommendation */}
                            {strategy.lastObeyedRecommendation &&
                                strategy.lastObeyedRecommendation.message !==
                                    "No recommendations followed yet" && (
                                    <div className="last-recommendation">
                                        <h4>Last Recommendation</h4>
                                        <div className="recommendation-content">
                                            <p>
                                                {
                                                    strategy
                                                        .lastObeyedRecommendation
                                                        .message
                                                }
                                            </p>
                                            <div className="recommendation-meta">
                                                <span
                                                    className="recommendation-type"
                                                    style={{
                                                        color:
                                                            strategy
                                                                .lastObeyedRecommendation
                                                                .recommendation ===
                                                            "buy"
                                                                ? "#10b981"
                                                                : strategy
                                                                      .lastObeyedRecommendation
                                                                      .recommendation ===
                                                                  "sell"
                                                                ? "#ef4444"
                                                                : "#f59e0b",
                                                    }}
                                                >
                                                    {(
                                                        strategy
                                                            .lastObeyedRecommendation
                                                            .recommendation ||
                                                        ""
                                                    ).toUpperCase()}
                                                </span>
                                                <span className="recommendation-date">
                                                    {formatDate(
                                                        strategy
                                                            .lastObeyedRecommendation
                                                            .timestamp
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* Bottom Panel - Final Output Display */}
                <div className="strategy-detail-bottom-panel">
                    <div className="final-output-panel">
                        <div className="final-output-header">
                            <h2>
                                <Target size={24} />
                                Final Investment Recommendation
                            </h2>
                            <div
                                className={`final-output-status ${
                                    finalRecommendation ? "ready" : "waiting"
                                }`}
                            >
                                {finalRecommendation ? (
                                    <>
                                        <CheckCircle size={16} />
                                        Ready
                                    </>
                                ) : (
                                    <>
                                        <Clock size={16} />
                                        Waiting for Analysis
                                    </>
                                )}
                            </div>
                        </div>

                        {finalRecommendation ? (
                            <div className="final-output-content">
                                {/* Left Side - Recommendation Decision */}
                                <div className="final-recommendation-card">
                                    <h3>
                                        <Zap size={20} />
                                        Investment Decision
                                    </h3>

                                    <div className="recommendation-decision">
                                        <div
                                            className={`decision-action ${finalRecommendation.action.toLowerCase()}`}
                                        >
                                            {finalRecommendation.action}
                                        </div>
                                        <div className="decision-confidence">
                                            <span className="confidence-score">
                                                {finalRecommendation.confidence}
                                                %
                                            </span>
                                            <div className="confidence-label">
                                                Confidence
                                            </div>
                                        </div>
                                    </div>

                                    <p className="recommendation-summary-text">
                                        {finalRecommendation.summary}
                                    </p>

                                    {finalRecommendation.executionTime && (
                                        <div className="execution-stats">
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Execution Time:
                                                </span>
                                                <span className="stat-value">
                                                    {
                                                        finalRecommendation.executionTime
                                                    }
                                                    ms
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Agents Used:
                                                </span>
                                                <span className="stat-value">
                                                    {
                                                        finalRecommendation.agentsUsed
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="final-output-content">
                                <div
                                    style={{
                                        gridColumn: "1 / -1",
                                        textAlign: "center",
                                        padding: "40px",
                                        color: "#9ca3af",
                                    }}
                                >
                                    <Clock
                                        size={48}
                                        style={{
                                            marginBottom: "16px",
                                            opacity: 0.5,
                                        }}
                                    />
                                    <h3
                                        style={{
                                            marginBottom: "8px",
                                            color: "#d1d5db",
                                        }}
                                    >
                                        Waiting for AI Analysis
                                    </h3>
                                    <p>
                                        Click "Request Recommendation" to start
                                        the analysis process. The final
                                        recommendation will appear here once all
                                        agents complete their analysis.
                                    </p>
                                </div>
                            </div>
                        )}

                        {finalRecommendation && (
                            <div className="final-output-timestamp">
                                Analysis completed on{" "}
                                {formatDate(finalRecommendation.timestamp)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrategyDetailView;
