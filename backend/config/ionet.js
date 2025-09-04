const OpenAI = require("openai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// IO.net API Configuration
const IONET_CONFIG = {
    baseURL: "https://api.intelligence.io.solutions/api/v1/",
    apiKey: process.env.IONET_API_KEY,
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    maxTokens: 4000,
    temperature: 0.1,
};

// Validate API key
if (!IONET_CONFIG.apiKey) {
    throw new Error("IONET_API_KEY environment variable is required");
}

// Create OpenAI client configured for io.net
const ionetClient = new OpenAI({
    apiKey: IONET_CONFIG.apiKey,
    baseURL: IONET_CONFIG.baseURL,
});

// Available models for different use cases
const MODELS = {
    // Fast, efficient models for quick responses
    FAST: "meta-llama/Llama-3.3-70B-Instruct",
    // Large models for complex analysis
    LARGE: "Qwen3-235B-A22B-Thinking-2507",
    // Coding/technical analysis
    CODE: "Qwen3-Coder-480B-A35B-Instruct-int4-mixed-ar",
    // Reasoning models
    REASONING: "DeepSeek-R1-0528",
};

// Tool definitions for crypto analysis
const CRYPTO_TOOLS = [
    {
        type: "function",
        function: {
            name: "get_coin_quotes_historical",
            description:
                "Get historical price data for a cryptocurrency symbol for the specified number of days",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description:
                            "The cryptocurrency symbol (e.g., BTC, ETH, SOL)",
                    },
                    days: {
                        type: "integer",
                        description:
                            "Number of days of historical data to retrieve (e.g., 90, 30, 7)",
                    },
                },
                required: ["symbol", "days"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_coin_quotes",
            description:
                "Get current price quotes and 24h data for cryptocurrency symbols",
            parameters: {
                type: "object",
                properties: {
                    symbols: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                        description:
                            "Array of cryptocurrency symbols to get quotes for",
                    },
                },
                required: ["symbols"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "listing_coins",
            description:
                "Get a comprehensive list of available cryptocurrencies with market cap rankings",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_coin_info",
            description:
                "Get detailed information about a cryptocurrency including description, website, and market data",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description:
                            "The cryptocurrency symbol to get information for",
                    },
                },
                required: ["symbol"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_the_web",
            description:
                "Search the web for recent news and information about a cryptocurrency or topic",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query for web search",
                    },
                    timeframe: {
                        type: "string",
                        description:
                            "Time range for search results (e.g., '7 days', '30 days', '90 days')",
                    },
                },
                required: ["query"],
            },
        },
    },
];

module.exports = {
    ionetClient,
    IONET_CONFIG,
    MODELS,
    CRYPTO_TOOLS,
};
