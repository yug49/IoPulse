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

    // The rest of the component continues with the same UI rendering logic...
    // (I'll continue in the next part to avoid making this too long)

    const getStepIcon = (status) => {
        switch (status) {
            case "pending":
                return <Clock className="w-5 h-5 text-gray-500" />;
            case "processing":
                return (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                );
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "error":
            case "connectivity_error":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStepColor = (status) => {
        switch (status) {
            case "pending":
                return "text-gray-600";
            case "processing":
                return "text-blue-600";
            case "completed":
                return "text-green-600";
            case "error":
            case "connectivity_error":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        <span>2-Agent AI System</span>
                    </div>
                </div>
            </div>

            {/* Strategy Title */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {strategy.title || strategy.name}
                        </h1>
                        <p className="text-gray-600 mb-4">
                            {strategy.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                                <Coins className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">
                                    {strategy.coin}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="font-medium">
                                    ${strategy.currentAmount}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRequestRecommendation}
                        disabled={isProcessing}
                        className={`
                            px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                            ${
                                isProcessing
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                            }
                        `}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {[
                        { id: "overview", label: "Overview", icon: Activity },
                        { id: "agents", label: "AI Agent Flow", icon: Zap },
                        { id: "output", label: "Agent Outputs", icon: Target },
                        { id: "history", label: "History", icon: Clock },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
                                ${
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }
                            `}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Strategy Details */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Strategy Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Current Holding:
                                    </span>
                                    <span className="font-medium">
                                        {strategy.coin}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Amount:
                                    </span>
                                    <span className="font-medium">
                                        ${strategy.currentAmount}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Created:
                                    </span>
                                    <span className="font-medium">
                                        {new Date(
                                            strategy.createdAt
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* AI System Info */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                AI System Overview
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div>
                                        <div className="font-medium">
                                            Analysis Agent
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Comprehensive market analysis and
                                            opportunity identification
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <div className="font-medium">
                                            Decision Agent
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Final investment decision and
                                            recommendation generation
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm text-blue-700">
                                    <strong>Model:</strong>{" "}
                                    Llama-3.3-70B-Instruct
                                    <br />
                                    <strong>Data Source:</strong> AI Model
                                    Knowledge (No external APIs)
                                </div>
                            </div>
                        </div>

                        {/* Current Recommendation */}
                        {finalRecommendation && (
                            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Latest AI Recommendation
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`
                                                px-3 py-1 rounded-full text-sm font-medium
                                                ${
                                                    finalRecommendation.action ===
                                                    "SWAP"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-green-100 text-green-700"
                                                }
                                            `}
                                        >
                                            {finalRecommendation.action}
                                        </div>
                                        <span className="text-gray-500 text-sm">
                                            {new Date(
                                                finalRecommendation.timestamp
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="font-medium text-gray-900 mb-2">
                                            {
                                                finalRecommendation.fullRecommendation
                                            }
                                        </div>
                                        <p className="text-gray-700">
                                            {finalRecommendation.summary}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>
                                            Execution time:{" "}
                                            {finalRecommendation.executionTime}
                                            ms
                                        </span>
                                        <span>
                                            Agents used:{" "}
                                            {finalRecommendation.agentsUsed}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Agent Flow Tab */}
                {activeTab === "agents" && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">
                            Simplified 2-Agent AI Workflow
                        </h3>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="text-red-700 font-medium">
                                        Error
                                    </span>
                                </div>
                                <p className="text-red-600 mt-1">{error}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {processSteps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className="flex items-start space-x-4"
                                >
                                    <div className="flex-shrink-0">
                                        {getStepIcon(step.status)}
                                    </div>
                                    <div className="flex-grow">
                                        <div
                                            className={`font-medium ${getStepColor(
                                                step.status
                                            )}`}
                                        >
                                            {step.name}
                                        </div>
                                        <div className="text-gray-600 text-sm mt-1">
                                            {step.description}
                                        </div>
                                        {step.timestamp && (
                                            <div className="text-gray-500 text-xs mt-1">
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
                                    {index < processSteps.length - 1 && (
                                        <div className="absolute left-7 mt-8 w-px h-6 bg-gray-300"></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isProcessing && (
                            <div className="mt-6 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-blue-700 font-medium">
                                        AI workflow in progress...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Agent Outputs Tab */}
                {activeTab === "output" && (
                    <div className="space-y-6">
                        {agentOutputs.map((agent) => (
                            <div
                                key={agent.id}
                                className="bg-white rounded-lg shadow-sm border"
                            >
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {getStepIcon(agent.status)}
                                            <h3
                                                className={`font-medium ${getStepColor(
                                                    agent.status
                                                )}`}
                                            >
                                                {agent.name}
                                            </h3>
                                        </div>
                                        {agent.timestamp && (
                                            <span className="text-sm text-gray-500">
                                                {new Date(
                                                    agent.timestamp
                                                ).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4">
                                    {agent.output ? (
                                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                            {agent.output}
                                        </pre>
                                    ) : (
                                        <div className="text-gray-500 italic">
                                            No output yet. Run the AI workflow
                                            to see results.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === "history" && (
                    <HistoryTab
                        history={history}
                        loading={historyLoading}
                        hasMore={hasMoreHistory}
                        onLoadMore={loadMoreHistory}
                    />
                )}
            </div>
        </div>
    );
};

export default StrategyDetailView;
