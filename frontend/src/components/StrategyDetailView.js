import React, { useState } from "react";
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
import HistoryTab from "./HistoryTab";
import { historyAPI } from "../services/api";

const API_BASE_URL = "http://localhost:5001";

const StrategyDetailView = ({
    strategy,
    onBack,
    onRequestRecommendation,
    addNotification,
}) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [processSteps, setProcessSteps] = useState([
        {
            id: 1,
            name: "Investor Profile Agent",
            status: "pending",
            description:
                "Analyzes strategy and converts to structured investment profile",
            timestamp: null,
        },
        {
            id: 2,
            name: "Market Screener Agent",
            status: "pending",
            description:
                "Screens market for investment candidates based on profile",
            timestamp: null,
        },
        {
            id: 3,
            name: "Quantitative Analysis Agent",
            status: "pending",
            description: "Mathematical models and quantitative scoring",
            timestamp: null,
        },
        {
            id: 4,
            name: "Qualitative Due Diligence Agent",
            status: "pending",
            description: "Fundamental analysis and risk assessment",
            timestamp: null,
        },
        {
            id: 5,
            name: "Investment Committee Agent",
            status: "pending",
            description: "Final investment decision and recommendation",
            timestamp: null,
        },
    ]);

    const [agentOutputs, setAgentOutputs] = useState([
        {
            id: 1,
            name: "Investor Profile Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 2,
            name: "Market Screener Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 3,
            name: "Quantitative Analysis Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 4,
            name: "Qualitative Due Diligence Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 5,
            name: "Investment Committee Agent",
            status: "pending",
            output: "",
            timestamp: null,
        },
    ]);

    const [finalRecommendation, setFinalRecommendation] = useState(null);

    // Load strategy history
    const loadHistory = async (page = 1, reset = false) => {
        try {
            setHistoryLoading(true);
            const response = await historyAPI.getStrategyHistory(
                strategy._id || strategy.id,
                page,
                20 // limit
            );

            if (response.success) {
                if (reset) {
                    setHistory(response.data);
                } else {
                    setHistory((prev) => [...prev, ...response.data]);
                }

                setHasMoreHistory(
                    response.pagination.currentPage <
                        response.pagination.totalPages
                );
                setHistoryPage(page);
            }
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Load more history entries
    const loadMoreHistory = () => {
        if (!historyLoading && hasMoreHistory) {
            loadHistory(historyPage + 1, false);
        }
    };

    // Load history when tab is opened for the first time
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === "history" && history.length === 0) {
            loadHistory(1, true);
        }
    };

    const handleRequestRecommendation = async () => {
        setIsProcessing(true);
        setFinalRecommendation(null);
        setError(null);

        // Reset all agents to pending
        setProcessSteps((prev) =>
            prev.map((step) => ({
                ...step,
                status: "pending",
            }))
        );

        setAgentOutputs((prev) =>
            prev.map((agent) => ({
                ...agent,
                status: "pending",
                output: "",
                timestamp: null,
            }))
        );

        try {
            // Create EventSource for real-time updates with token in query params
            const token = localStorage.getItem("token");
            const eventSource = new EventSource(
                `${API_BASE_URL}/api/ai-recommendations/${
                    strategy._id || strategy.id
                }/request-stream?token=${encodeURIComponent(token)}`
            );

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case "init":
                        console.log("Workflow initialized:", data.message);
                        break;

                    case "agent_start":
                        console.log(`Agent starting: ${data.agent}`);
                        // Find and update the specific agent that's starting
                        setProcessSteps((prev) =>
                            prev.map((step, index) => {
                                if (step.name === data.agent) {
                                    return {
                                        ...step,
                                        status: "processing",
                                        timestamp: new Date().toISOString(),
                                    };
                                }
                                return step;
                            })
                        );

                        setAgentOutputs((prev) =>
                            prev.map((agent, index) => {
                                if (agent.name === data.agent) {
                                    return {
                                        ...agent,
                                        status: "processing",
                                        output: data.message,
                                        timestamp: new Date().toISOString(),
                                    };
                                }
                                return agent;
                            })
                        );
                        break;

                    case "agent_complete":
                        console.log(`Agent completed: ${data.agent}`);
                        // Update the completed agent
                        setProcessSteps((prev) =>
                            prev.map((step, index) => {
                                if (step.name === data.agent) {
                                    return {
                                        ...step,
                                        status: "completed",
                                    };
                                }
                                return step;
                            })
                        );

                        setAgentOutputs((prev) =>
                            prev.map((agent, index) => {
                                if (agent.name === data.agent) {
                                    // Create detailed output based on agent type and actual data
                                    let detailedOutput = `✅ ${data.message}\n\nExecution time: ${data.time}ms`;

                                    // Add specific output based on agent type
                                    if (data.output) {
                                        switch (data.agent) {
                                            case "Investor Profile Agent":
                                                if (
                                                    data.output
                                                        .risk_tolerance &&
                                                    data.output
                                                        .investment_timeframe
                                                ) {
                                                    detailedOutput += `\n\n🎯 Profile Created:
• Risk Tolerance: ${data.output.risk_tolerance}
• Investment Timeframe: ${data.output.investment_timeframe}
• Focus Area: ${data.output.focus_area || "General Investment"}
• Investment Goal: ${data.output.investment_goal || "Growth"}`;
                                                }
                                                break;

                                            case "Market Screener Agent":
                                                if (
                                                    Array.isArray(data.output)
                                                ) {
                                                    detailedOutput += `\n\n🔍 Market Screening Results:
• Total Candidates Found: ${data.output.length}
• Top Candidates: ${data.output.slice(0, 5).join(", ")}
• Screening Criteria: Risk-adjusted performance`;
                                                }
                                                break;

                                            case "Quantitative Analysis Agent":
                                                if (
                                                    Array.isArray(data.output)
                                                ) {
                                                    const topCandidates =
                                                        data.output
                                                            .filter(
                                                                (coin) =>
                                                                    coin.quant_score !==
                                                                    undefined
                                                            )
                                                            .slice(0, 3);
                                                    if (
                                                        topCandidates.length > 0
                                                    ) {
                                                        detailedOutput += `\n\n📊 Quantitative Analysis:
${topCandidates
    .map(
        (coin, idx) =>
            `${idx + 1}. ${coin.symbol}: Score ${coin.quant_score}/10 (24h: ${
                coin["24h_change"] || "N/A"
            }%)`
    )
    .join("\n")}

📈 Analysis Methods:
• Historical performance metrics
• Volatility assessment
• Risk-adjusted returns`;
                                                    }
                                                }
                                                break;

                                            case "Qualitative Due Diligence Agent":
                                                if (
                                                    Array.isArray(data.output)
                                                ) {
                                                    const qualCandidates =
                                                        data.output
                                                            .filter(
                                                                (coin) =>
                                                                    coin.qualitative_score !==
                                                                    undefined
                                                            )
                                                            .slice(0, 3);
                                                    if (
                                                        qualCandidates.length >
                                                        0
                                                    ) {
                                                        detailedOutput += `\n\n🔍 Due Diligence Assessment:
${qualCandidates
    .map(
        (coin, idx) =>
            `${idx + 1}. ${coin.symbol}: Qual Score ${
                coin.qualitative_score
            }/10`
    )
    .join("\n")}

🛡️ Assessment Areas:
• Fundamental analysis
• Risk evaluation
• Market sentiment
• Technology assessment`;
                                                    }
                                                }
                                                break;
                                        }
                                    }

                                    return {
                                        ...agent,
                                        status: "completed",
                                        output: detailedOutput,
                                        timestamp: new Date().toISOString(),
                                    };
                                }
                                return agent;
                            })
                        );
                        break;

                    case "complete":
                        console.log("Workflow completed:", data);
                        // Handle final completion
                        const finalRec = data.data.recommendation;

                        // Update final recommendation
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
                            confidence: 85,
                            summary: finalRec.explanation,
                            timestamp: new Date().toISOString(),
                            executionTime: data.data.executionTime,
                            agentsUsed: data.data.agentsExecuted,
                        });

                        // Update the final agent with real output
                        setAgentOutputs((prev) =>
                            prev.map((agent) => {
                                if (
                                    agent.name === "Investment Committee Agent"
                                ) {
                                    return {
                                        ...agent,
                                        status: "completed",
                                        output: `🏛️ Investment Committee Analysis:

📊 Final Recommendation: ${finalRec.recommendation}

💡 Investment Decision Summary:
${finalRec.explanation}

⏱️ Analysis completed in ${data.data.executionTime}ms using ${data.data.agentsExecuted} AI agents.`,
                                    };
                                }
                                return agent;
                            })
                        );

                        addNotification(
                            `New recommendation generated for ${strategy.name}`,
                            "success"
                        );
                        break;

                    case "error":
                        console.error("Workflow error:", data);
                        setError(data.message);

                        // Mark all processing agents as failed
                        setProcessSteps((prev) =>
                            prev.map((step) => ({
                                ...step,
                                status:
                                    step.status === "processing"
                                        ? "error"
                                        : step.status,
                            }))
                        );

                        setAgentOutputs((prev) =>
                            prev.map((agent) => ({
                                ...agent,
                                status:
                                    agent.status === "processing"
                                        ? "error"
                                        : agent.status,
                                output:
                                    agent.status === "processing"
                                        ? `❌ ${data.message}`
                                        : agent.output,
                            }))
                        );
                        break;

                    case "end":
                        console.log("Workflow stream ended");
                        eventSource.close();
                        setIsProcessing(false);
                        break;

                    default:
                        console.log("Unknown message type:", data.type);
                        break;
                }
            };

            eventSource.onerror = (error) => {
                console.error("EventSource error:", error);
                eventSource.close();
                setIsProcessing(false);
                setError("Connection to server lost. Please try again.");

                // Mark all processing agents as failed
                setProcessSteps((prev) =>
                    prev.map((step) => ({
                        ...step,
                        status:
                            step.status === "processing"
                                ? "connectivity_error"
                                : step.status,
                    }))
                );

                setAgentOutputs((prev) =>
                    prev.map((agent) => ({
                        ...agent,
                        status:
                            agent.status === "processing"
                                ? "connectivity_error"
                                : agent.status,
                        output:
                            agent.status === "processing"
                                ? "🌐 Connection lost during processing"
                                : agent.output,
                    }))
                );
            };
        } catch (error) {
            console.error("Error setting up real-time connection:", error);
            setError("Failed to connect to AI service");
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

            {/* Tab Navigation */}
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid #374151",
                    marginBottom: "24px",
                }}
            >
                {[
                    {
                        id: "overview",
                        label: "Overview",
                        icon: <Activity size={16} />,
                    },
                    {
                        id: "history",
                        label: "History",
                        icon: <Clock size={16} />,
                    },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            backgroundColor: "transparent",
                            border: "none",
                            borderBottom:
                                activeTab === tab.id
                                    ? "2px solid #3b82f6"
                                    : "2px solid transparent",
                            color: activeTab === tab.id ? "#3b82f6" : "#9ca3af",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: activeTab === tab.id ? "600" : "400",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== tab.id) {
                                e.target.style.color = "#d1d5db";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== tab.id) {
                                e.target.style.color = "#9ca3af";
                            }
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div>
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
                                        <div
                                            key={step.id}
                                            className="process-step"
                                        >
                                            <div className="process-step-indicator">
                                                <div
                                                    className="step-number"
                                                    style={{
                                                        backgroundColor:
                                                            getStatusColor(
                                                                step.status
                                                            ),
                                                        color:
                                                            step.status ===
                                                            "pending"
                                                                ? "#6b7280"
                                                                : "white",
                                                    }}
                                                >
                                                    {step.status === "pending"
                                                        ? step.id
                                                        : getStatusIcon(
                                                              step.status
                                                          )}
                                                </div>
                                                {index <
                                                    processSteps.length - 1 && (
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
                                                        {step.status ===
                                                        "processing"
                                                            ? "Started: "
                                                            : "Completed: "}
                                                        {formatDate(
                                                            step.timestamp
                                                        )}
                                                    </span>
                                                )}
                                                {step.status ===
                                                    "processing" && (
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
                                                    {getStatusIcon(
                                                        agent.status
                                                    )}
                                                    {agent.name}
                                                </h4>
                                                <span
                                                    className={`agent-status-badge ${agent.status}`}
                                                >
                                                    {agent.status}
                                                </span>
                                            </div>

                                            <div className="agent-output-content">
                                                {agent.status ===
                                                "processing" ? (
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
                                                            whiteSpace:
                                                                "pre-wrap",
                                                            fontFamily:
                                                                "inherit",
                                                            margin: 0,
                                                            fontSize: "13px",
                                                            lineHeight: "1.4",
                                                        }}
                                                    >
                                                        {agent.output}
                                                    </pre>
                                                ) : (
                                                    <div className="agent-output-content empty">
                                                        Waiting for analysis to
                                                        begin...
                                                    </div>
                                                )}
                                            </div>

                                            {agent.timestamp && (
                                                <div className="agent-output-timestamp">
                                                    {agent.status ===
                                                    "processing"
                                                        ? "Started: "
                                                        : "Completed: "}
                                                    {formatDate(
                                                        agent.timestamp
                                                    )}
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
                                                {strategy.currentAmount}{" "}
                                                {strategy.coin}
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
                                                            strategy.status ===
                                                            "active"
                                                                ? "#10b981"
                                                                : strategy.status ===
                                                                  "paused"
                                                                ? "#f59e0b"
                                                                : "#ef4444",
                                                        color: "white",
                                                        padding: "4px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "12px",
                                                        textTransform:
                                                            "capitalize",
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
                                        strategy.lastObeyedRecommendation
                                            .message !==
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
                                            finalRecommendation
                                                ? "ready"
                                                : "waiting"
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
                                                        {
                                                            finalRecommendation.confidence
                                                        }
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
                                                Click "Request Recommendation"
                                                to start the analysis process.
                                                The final recommendation will
                                                appear here once all agents
                                                complete their analysis.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {finalRecommendation && (
                                    <div className="final-output-timestamp">
                                        Analysis completed on{" "}
                                        {formatDate(
                                            finalRecommendation.timestamp
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab Content */}
            {activeTab === "history" && (
                <HistoryTab
                    history={history}
                    loading={historyLoading}
                    onLoadMore={loadMoreHistory}
                    hasMore={hasMoreHistory}
                />
            )}
        </div>
    );
};

export default StrategyDetailView;
