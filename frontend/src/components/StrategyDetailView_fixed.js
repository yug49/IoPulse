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
            name: "Analysis Agent (Llama-3.3-70B-Instruct)",
            status: "pending",
            description:
                "Comprehensive cryptocurrency market analysis and opportunity identification",
            timestamp: null,
        },
        {
            id: 2,
            name: "Decision Agent (Llama-3.3-70B-Instruct)",
            status: "pending",
            description:
                "Final investment decision and recommendation generation",
            timestamp: null,
        },
    ]);

    const [agentOutputs, setAgentOutputs] = useState([
        {
            id: 1,
            name: "Analysis Agent (Llama-3.3-70B-Instruct)",
            status: "pending",
            output: "",
            timestamp: null,
        },
        {
            id: 2,
            name: "Decision Agent (Llama-3.3-70B-Instruct)",
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

    // Load history when tab changes to history
    React.useEffect(() => {
        if (activeTab === "history" && history.length === 0) {
            loadHistory(1, true);
        }
    }, [activeTab]);

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

                    case "workflow_start":
                        console.log("Workflow starting:", data.message);
                        break;

                    case "step_start":
                        console.log(
                            `Step ${data.step} starting: ${data.message}`
                        );
                        // Find and update the specific agent that's starting
                        setProcessSteps((prev) =>
                            prev.map((step, index) => {
                                if (index + 1 === data.step) {
                                    return {
                                        ...step,
                                        status: "processing",
                                        timestamp: data.timestamp,
                                    };
                                }
                                return step;
                            })
                        );

                        setAgentOutputs((prev) =>
                            prev.map((agent, index) => {
                                if (index + 1 === data.step) {
                                    return {
                                        ...agent,
                                        status: "processing",
                                        output: `🔄 ${
                                            data.message
                                        }\n\nStarted at: ${new Date(
                                            data.timestamp
                                        ).toLocaleTimeString()}`,
                                        timestamp: data.timestamp,
                                    };
                                }
                                return agent;
                            })
                        );
                        break;

                    case "step_complete":
                        console.log(
                            `Step ${data.step} completed: ${data.message}`
                        );
                        // Update the completed agent
                        setProcessSteps((prev) =>
                            prev.map((step, index) => {
                                if (index + 1 === data.step) {
                                    return {
                                        ...step,
                                        status: "completed",
                                        timestamp: data.timestamp,
                                    };
                                }
                                return step;
                            })
                        );

                        setAgentOutputs((prev) =>
                            prev.map((agent, index) => {
                                if (index + 1 === data.step) {
                                    // Create detailed output based on step
                                    let detailedOutput = `✅ ${
                                        data.message
                                    }\n\nExecution time: ${
                                        data.stepTime
                                    }ms\nCompleted at: ${new Date(
                                        data.timestamp
                                    ).toLocaleTimeString()}`;

                                    if (data.step === 1) {
                                        detailedOutput += `\n\n🔍 Analysis Agent Tasks Completed:
• Market overview and trend analysis
• Current holding performance evaluation  
• Alternative cryptocurrency identification
• Quantitative and qualitative scoring
• Risk assessment and market conditions`;
                                    } else if (data.step === 2) {
                                        detailedOutput += `\n\n🏛️ Decision Agent Tasks Completed:
• Investment decision synthesis
• Portfolio optimization analysis
• Risk-reward evaluation
• Final recommendation generation`;
                                    }

                                    return {
                                        ...agent,
                                        status: "completed",
                                        output: detailedOutput,
                                        timestamp: data.timestamp,
                                    };
                                }
                                return agent;
                            })
                        );
                        break;

                    case "workflow_complete":
                        console.log("Workflow completed:", data);
                        // Handle final completion
                        const finalRec = data.recommendation;

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
                            confidence: null, // No confidence available from real AI analysis
                            summary: finalRec.explanation,
                            timestamp: data.timestamp,
                            executionTime: data.totalTime,
                            agentsUsed: 2, // Simplified workflow uses 2 agents
                            fullRecommendation: finalRec.recommendation,
                        });

                        // Update the final agent with real output
                        setAgentOutputs((prev) =>
                            prev.map((agent, index) => {
                                if (index === 1) {
                                    // Decision agent is index 1
                                    return {
                                        ...agent,
                                        status: "completed",
                                        output: `🏛️ Decision Agent Final Analysis:

📊 Final Recommendation: ${finalRec.recommendation}

💡 Investment Decision Summary:
${finalRec.explanation}

⏱️ Total analysis completed in ${data.totalTime}ms using 2 AI agents.
🤖 Powered by Llama-3.3-70B-Instruct models`,
                                    };
                                }
                                return agent;
                            })
                        );

                        addNotification(
                            `New recommendation generated for ${strategy.name}`,
                            "success"
                        );
                        setIsProcessing(false);
                        eventSource.close();
                        break;

                    case "workflow_error":
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
                                        ? `❌ Agent Error: ${data.message}

🚨 The simplified 2-agent AI workflow encountered an issue.

This streamlined system uses:
• Analysis Agent (Llama-3.3-70B-Instruct) - Market analysis
• Decision Agent (Llama-3.3-70B-Instruct) - Investment decisions

No external data sources or mock data are used - the system relies entirely on AI model knowledge.`
                                        : agent.output,
                            }))
                        );

                        addNotification(
                            "Workflow failed due to an error",
                            "error"
                        );

                        setIsProcessing(false);
                        eventSource.close();
                        break;

                    default:
                        console.log("Unknown event type:", data.type);
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

    const getStepIcon = (status) => {
        switch (status) {
            case "pending":
                return (
                    <Clock className="w-5 h-5" style={{ color: "#6b7280" }} />
                );
            case "processing":
                return (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                );
            case "completed":
                return (
                    <CheckCircle
                        className="w-5 h-5"
                        style={{ color: "#10b981" }}
                    />
                );
            case "error":
            case "connectivity_error":
                return (
                    <AlertCircle
                        className="w-5 h-5"
                        style={{ color: "#ef4444" }}
                    />
                );
            default:
                return (
                    <Clock className="w-5 h-5" style={{ color: "#6b7280" }} />
                );
        }
    };

    return (
        <div className="strategy-detail-container">
            {/* Header */}
            <div className="strategy-detail-header">
                <button onClick={onBack} className="back-button">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>
                <div className="flex items-center justify-between">
                    <h1 className="strategy-detail-title">
                        {strategy.title || strategy.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div
                            className="flex items-center space-x-1 text-sm"
                            style={{ color: "#a0a0a0" }}
                        >
                            <Target className="w-4 h-4" />
                            <span>2-Agent AI System</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="strategy-detail-content">
                <div className="strategy-detail-main-row">
                    {/* Process Flow Column (Left) */}
                    <div className="process-flow-column">
                        <div className="process-flow-header">
                            <h2>AI Workflow</h2>
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
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        <span>Get AI Recommendation</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="process-flow-content">
                            {processSteps.map((step, index) => (
                                <div key={step.id} className="process-step">
                                    <div className="process-step-indicator">
                                        <div
                                            className={`step-number ${
                                                step.status === "pending"
                                                    ? "pending"
                                                    : step.status ===
                                                      "processing"
                                                    ? "processing"
                                                    : step.status ===
                                                      "completed"
                                                    ? "completed"
                                                    : "error"
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    step.status === "pending"
                                                        ? "rgba(107, 114, 128, 0.2)"
                                                        : step.status ===
                                                          "processing"
                                                        ? "rgba(59, 130, 246, 0.5)"
                                                        : step.status ===
                                                          "completed"
                                                        ? "rgba(16, 185, 129, 0.5)"
                                                        : "rgba(239, 68, 68, 0.5)",
                                                color: "#ffffff",
                                                border: "2px solid rgba(255, 255, 255, 0.1)",
                                            }}
                                        >
                                            {step.status === "processing" ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                getStepIcon(step.status)
                                            )}
                                        </div>
                                        {index < processSteps.length - 1 && (
                                            <div
                                                className="step-connector"
                                                style={{
                                                    backgroundColor:
                                                        step.status ===
                                                        "completed"
                                                            ? "rgba(16, 185, 129, 0.5)"
                                                            : "rgba(255, 255, 255, 0.1)",
                                                }}
                                            ></div>
                                        )}
                                    </div>
                                    <div className="process-step-content">
                                        <div className="step-title">
                                            {step.name}
                                        </div>
                                        <div className="step-description">
                                            {step.description}
                                        </div>
                                        {step.timestamp && (
                                            <div className="step-timestamp">
                                                {step.status === "processing"
                                                    ? "Started"
                                                    : "Completed"}{" "}
                                                at:{" "}
                                                {new Date(
                                                    step.timestamp
                                                ).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div
                                style={{
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    marginTop: "20px",
                                }}
                            >
                                <div className="flex items-center space-x-2">
                                    <AlertCircle
                                        className="w-5 h-5"
                                        style={{ color: "#ef4444" }}
                                    />
                                    <span
                                        style={{
                                            color: "#ef4444",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Error
                                    </span>
                                </div>
                                <p
                                    style={{
                                        color: "#f87171",
                                        marginTop: "8px",
                                    }}
                                >
                                    {error}
                                </p>
                            </div>
                        )}

                        {isProcessing && (
                            <div
                                style={{
                                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                                    border: "1px solid rgba(59, 130, 246, 0.3)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    marginTop: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span
                                        style={{
                                            color: "#60a5fa",
                                            fontWeight: "600",
                                        }}
                                    >
                                        AI workflow in progress...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Agent Output Column (Middle) */}
                    <div className="agent-output-column">
                        <div className="agent-output-header">
                            <h2>Agent Outputs</h2>
                        </div>
                        <div className="agent-outputs-container">
                            {agentOutputs.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`agent-output-item ${
                                        agent.status === "processing"
                                            ? "active"
                                            : agent.status === "completed"
                                            ? "completed"
                                            : ""
                                    }`}
                                >
                                    <div className="agent-output-title">
                                        <h4>
                                            {getStepIcon(agent.status)}
                                            {agent.name}
                                        </h4>
                                        <div
                                            className={`agent-status-badge ${agent.status}`}
                                        >
                                            {agent.status}
                                        </div>
                                    </div>
                                    <div
                                        className={`agent-output-content ${
                                            !agent.output ? "empty" : ""
                                        }`}
                                    >
                                        {agent.output ? (
                                            <pre
                                                style={{
                                                    color: "#d1d5db",
                                                    fontSize: "0.9rem",
                                                    lineHeight: "1.6",
                                                    whiteSpace: "pre-wrap",
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                {agent.output}
                                            </pre>
                                        ) : (
                                            <div
                                                style={{
                                                    color: "#9ca3af",
                                                    fontStyle: "italic",
                                                    textAlign: "center",
                                                    padding: "20px",
                                                }}
                                            >
                                                No output yet. Run the AI
                                                workflow to see results.
                                            </div>
                                        )}
                                    </div>
                                    {agent.timestamp && (
                                        <div className="agent-output-timestamp">
                                            {new Date(
                                                agent.timestamp
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strategy Info Column (Right) */}
                    <div className="strategy-info-column">
                        <div className="strategy-info-card">
                            <h3>Strategy Details</h3>
                            <div className="strategy-info-details">
                                <div className="info-item">
                                    <div className="info-label">
                                        <Coins className="w-4 h-4" />
                                        Current Holding:
                                    </div>
                                    <div className="info-value">
                                        {strategy.coin}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">
                                        <DollarSign className="w-4 h-4" />
                                        Amount:
                                    </div>
                                    <div className="info-value">
                                        ${strategy.currentAmount}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">
                                        <Clock className="w-4 h-4" />
                                        Created:
                                    </div>
                                    <div className="info-value">
                                        {new Date(
                                            strategy.createdAt
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="strategy-description-section">
                                <h4>Description</h4>
                                <p className="strategy-description-text">
                                    {strategy.description}
                                </p>
                            </div>

                            <div
                                style={{
                                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                                    border: "1px solid rgba(59, 130, 246, 0.3)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "#60a5fa",
                                        fontSize: "0.9rem",
                                        lineHeight: "1.5",
                                    }}
                                >
                                    <strong>Model:</strong>{" "}
                                    Llama-3.3-70B-Instruct
                                    <br />
                                    <strong>Data Source:</strong> AI Model
                                    Knowledge (No external APIs)
                                    <br />
                                    <strong>Agents:</strong> 2 (Analysis +
                                    Decision)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Recommendation Panel (Bottom) */}
                {finalRecommendation && (
                    <div className="final-output-panel">
                        <div className="final-output-header">
                            <h2>
                                <Target className="w-6 h-6" />
                                Final AI Recommendation
                            </h2>
                            <div className="final-output-status ready">
                                <CheckCircle className="w-4 h-4" />
                                Ready
                            </div>
                        </div>
                        <div className="final-output-content">
                            <div className="final-recommendation-card">
                                <h3>
                                    <TrendingUp className="w-5 h-5" />
                                    Investment Decision
                                </h3>
                                <div className="recommendation-decision">
                                    <div
                                        className={`decision-action ${finalRecommendation.action.toLowerCase()}`}
                                    >
                                        {finalRecommendation.action}
                                    </div>
                                </div>
                                <div className="recommendation-summary-text">
                                    <strong>Recommendation:</strong>{" "}
                                    {finalRecommendation.fullRecommendation}
                                </div>
                                <div className="recommendation-summary-text">
                                    {finalRecommendation.summary}
                                </div>
                                <div className="recommendation-metrics">
                                    <div className="metric-item">
                                        <div className="metric-label">
                                            Execution Time
                                        </div>
                                        <div className="metric-value">
                                            {finalRecommendation.executionTime}
                                            ms
                                        </div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-label">
                                            Agents Used
                                        </div>
                                        <div className="metric-value">
                                            {finalRecommendation.agentsUsed}
                                        </div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-label">
                                            Generated
                                        </div>
                                        <div className="metric-value">
                                            {new Date(
                                                finalRecommendation.timestamp
                                            ).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="final-output-timestamp">
                            Analysis completed at{" "}
                            {new Date(
                                finalRecommendation.timestamp
                            ).toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategyDetailView;
