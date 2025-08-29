# PulseIO

## Abstract

PulseIO is an advanced DeFi Agent Monitor that provides intelligent, personalized oversight of the decentralized finance market. Instead of tracking generic, pre-defined metrics, PulseIO monitors the entire ecosystem relative to a user's unique investment strategy, which is defined in natural language. It leverages a sophisticated multi-agent AI system, built entirely on the io.net platform, to continuously watch for opportunities and threats. When it detects a significant opportunity to increase yield or a potential risk to the user's portfolio, it generates a detailed alert recommending specific, actionable changes to their fund allocation.

## Core Features

*   **Personalized Monitoring Profiles via Natural Language:** Users configure the monitor by describing their investment goals—such as "high-yield, medium-risk assets" or "stablecoin farming with a focus on established protocols." This creates a unique monitoring profile for the agent.
*   **Multi-Agent Monitoring Engine:** A series of specialized AI agents work in concert to monitor on-chain data, off-chain sentiment, and market risks, correlating all information against the user's profile.
*   **Intelligent Opportunity & Risk Alerts:** The system moves beyond simple threshold alerts (e.g., "price dropped 5%"). It produces rich, context-aware alerts that identify superior investment opportunities or potential threats, complete with a justification for the recommended action.
*   **On-Demand Monitoring Cycles:** Users can trigger a deep-dive monitoring cycle at any time via a manual sync button, ensuring they receive the most current analysis of the market relative to their strategy.

## The PulseIO Monitoring Engine: A Multi-Agent Workflow

PulseIO's backend is a dynamic, intelligent monitoring system orchestrated using the **io.net Agentic Workflow Editor**. This visual interface enables a collaborative workflow where specialized agents monitor different facets of the DeFi landscape.

The monitoring cycle is executed as follows:

1.  **Stage 1: Profile Configuration**
    *   **Agent:** `Profile Configuration Agent`
    *   **Model:** `Qwen3-235B-A22B-Thinking-2507`
    *   **Task:** This agent initializes the monitoring cycle. It takes the user's natural language strategy and translates it into a structured set of monitoring parameters (risk tolerance, preferred assets, target APY, etc.) that will guide the entire system.
    *   **Tool Used:** `search the web` to clarify any ambiguous DeFi terminology in the user's strategy.

2.  **Stage 2: On-Chain Market Monitoring**
    *   **Agent:** `Market Data Monitoring Agent`
    *   **Model:** A fast, task-oriented model suitable for data retrieval.
    *   **Task:** Guided by the monitoring parameters, this agent actively scans the market. It monitors a broad list of potential assets, gathering essential real-time and historical on-chain data to identify pools and tokens that meet the user's criteria.
    *   **Tools Used:** `listing coins`, `get coin info`, `get coin quotes`, `get coin quotes historical`.

3.  **Stage 3: Off-Chain Threat & Sentiment Monitoring**
    *   **Agent:** `Off-Chain Signal Monitor`
    *   **Model:** `meta-llama/Llama-3.3-70B-Instruct`
    *   **Task:** This agent monitors the crucial off-chain context. For each asset flagged by the on-chain monitor, it scans the web for recent news and social chatter to gauge market sentiment. It also queries a dedicated knowledge base for security audits or risk reports, monitoring for emerging threats.
    *   **Tools Used:** `search the web`, `r2r.rag search`.

4.  **Stage 4: Strategic Alert Synthesis**
    *   **Agent:** `Strategic Alert Synthesis Agent`
    *   **Model:** `Qwen3-235B-A22B-Thinking-2507`
    *   **Task:** The final agent in the workflow acts as the central intelligence hub. It receives and correlates the data from all other monitoring agents. It holistically analyzes the on-chain opportunities against the off-chain sentiment and risks, then synthesizes this information to generate a high-fidelity, actionable alert, recommending the top 3 strategic actions for the user.
    *   **Tools Used:** None. This agent's function is pure synthesis and reasoning based on the monitored data.

## Technology Stack and io.net Integrations

PulseIO is built almost exclusively on the io.net IO Intelligence platform, demonstrating a deep integration with its services.

*   **Orchestration:** The entire multi-agent monitoring engine is designed and executed within the **io.net Agentic Workflow Editor**. This visual builder replaces thousands of lines of traditional backend code, managing the execution flow, data passing, and state management between all components.
*   **AI Models:** The project leverages a diverse set of state-of-the-art models available through the IO Intelligence Model Marketplace to assign the best "brain" for each specific monitoring task.
    *   `Qwen3-235B-A22B-Thinking-2507`: Used for high-level reasoning and final alert synthesis.
    *   `meta-llama/Llama-3.3-70B-Instruct`: Used for robust off-chain signal analysis.
*   **Agentic Tools:** The workflow integrates pre-built, no-configuration tools that are essential for comprehensive market monitoring.
    *   **Cryptocurrency Data:** `listing coins`, `get coin info`, `get coin quotes`, `get coin quotes historical`.
    *   **Information Retrieval:** `search the web`, `r2r.rag search`.
*   **Knowledge Base:** The **io.net Retrieval Engine** powers the Off-Chain Signal Monitor. We can upload security audits and research papers, allowing the agent to perform Retrieval-Augmented Generation (RAG) searches. This grounds the agent's threat monitoring in expert knowledge.
*   **API Gateway:** The frontend application communicates with the deployed workflow via the **io.net Intelligence API**, triggering monitoring cycles and receiving the final alerts securely using a generated API key.

## Why io.net is the Foundation for a Next-Generation Monitor

Choosing io.net was a strategic decision that allows PulseIO to redefine what a "monitor" can be.

1.  **From Dumb Alerts to Intelligent Insights:** Traditional monitors use simple "if-then" logic. The Agentic Workflow Editor allows PulseIO to perform complex, multi-stage reasoning, enabling it to monitor for strategic opportunities, not just price changes.
2.  **No-Code Orchestration for Complex Monitoring:** The visual editor makes it possible to design a sophisticated, multi-agent monitoring system without writing complex orchestration code. This allows for rapid development and easy modification of the monitoring logic.
3.  **Holistic Monitoring with Integrated Tools:** The availability of pre-built tools for both on-chain (crypto prices) and off-chain (web search) data allows PulseIO to be a holistic monitor, providing a complete picture of an asset's health.
4.  **Context-Aware Monitoring with RAG:** The built-in Retrieval Engine elevates the monitor's capabilities. It can cross-reference market events with a curated knowledge base of security reports, enabling it to detect nuanced threats that other systems would miss.
5.  **Scalability and Management:** By building on the io.net platform, PulseIO's entire monitoring engine is managed, reliable, and observable without requiring dedicated DevOps resources.