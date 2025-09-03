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
    const [workflowStatus, setWorkflowStatus] = useState(null);
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
        setWorkflowStatus("processing");

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

            // Call the actual AI recommendation API
            const result = await aiRecommendationAPI.requestRecommendation(
                strategy.id
            );

            console.log("AI Recommendation Result:", result);

            // Process the real results from the backend
            if (result && result.success) {
                const {
                    recommendation,
                    reasoning,
                    confidence,
                    agentOutputs: backendOutputs,
                } = result;

                // Update all steps to completed
                setProcessSteps((prev) =>
                    prev.map((step) => ({
                        ...step,
                        status: "completed",
                    }))
                );

                // Update agent outputs with real data
                const realAgentOutputs = [
                    {
                        name: "Investment Committee Agent",
                        output: backendOutputs?.investmentCommittee
                            ? `🏛️ Investment Committee Analysis:

• Decision: ${backendOutputs.investmentCommittee.decision}
• Confidence: ${backendOutputs.investmentCommittee.confidence}%

📊 Key Findings:
${backendOutputs.investmentCommittee.reasoning}`
                            : "Investment Committee analysis completed successfully.",
                    },
                    {
                        name: "Quantitative Analysis Agent",
                        output: backendOutputs?.quantitativeAnalysis
                            ? `🧮 Quantitative Analysis Results:

• Overall Score: ${backendOutputs.quantitativeAnalysis.score}/10

📊 Financial Metrics:
${backendOutputs.quantitativeAnalysis.metrics}

🔍 Detailed Analysis:
${backendOutputs.quantitativeAnalysis.analysis}`
                            : "Quantitative analysis completed with comprehensive metrics evaluation.",
                    },
                    {
                        name: "Qualitative Due Diligence Agent",
                        output: backendOutputs?.qualitativeDueDiligence
                            ? `📋 Qualitative Due Diligence Review:

• Overall Score: ${backendOutputs.qualitativeDueDiligence.score}/10

🔍 Key Factors Analyzed:
${
    backendOutputs.qualitativeDueDiligence.keyFactors?.join(", ") ||
    "Multiple factors assessed"
}

📊 Fundamental Analysis:
${backendOutputs.qualitativeDueDiligence.analysis}`
                            : "Qualitative due diligence completed with thorough fundamental analysis.",
                    },
                    {
                        name: "Risk Assessment Agent",
                        output: backendOutputs?.riskAssessment
                            ? `⚠️ Risk Assessment Report:

• Risk Level: ${backendOutputs.riskAssessment.riskLevel}
• Risk Score: ${backendOutputs.riskAssessment.score}/10

🎯 Key Risk Factors:
${
    backendOutputs.riskAssessment.keyRisks?.join(", ") ||
    "Multiple risk factors evaluated"
}`
                            : "Risk assessment completed with comprehensive risk factor analysis.",
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
                    action: recommendation || "HOLD",
                    confidence: confidence || 75,
                    summary:
                        reasoning ||
                        "Analysis completed based on current market conditions and portfolio holdings.",
                    timestamp: new Date().toISOString(),
                });

                setWorkflowStatus("completed");
            } else {
                throw new Error("Failed to get recommendation from backend");
            }
        } catch (err) {
            // Log the full error object for debugging
            console.error("AI Recommendation Error:", err);

            let errorMsg = "Failed to generate AI recommendation.";
            if (err && err.response) {
                errorMsg += ` Status: ${err.response.status}`;
                if (err.response.data && err.response.data.message) {
                    errorMsg += ` - ${err.response.data.message}`;
                }
            } else if (err && err.message) {
                errorMsg += ` - ${err.message}`;
            }

            setError(errorMsg);
            setWorkflowStatus("error");

            // Mark all steps as error state
            setProcessSteps((prev) =>
                prev.map((step) => ({
                    ...step,
                    status: "error",
                }))
            );

            setAgentOutputs((prev) =>
                prev.map((agent) => ({
                    ...agent,
                    status: "error",
                    output: errorMsg,
                }))
            );

            // If authentication error, delay redirect so user can see the error
            if (
                (err && err.response && err.response.status === 401) ||
                (err &&
                    err.message &&
                    err.message.toLowerCase().includes("auth"))
            ) {
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
                        backgroundColor: "#ef4444",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        margin: "16px 0",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {error}
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
