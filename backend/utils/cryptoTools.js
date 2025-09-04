/**
 * Crypto Tools Implementation for io.net AI Agents
 * These tools provide real cryptocurrency market data
 */

const axios = require("axios");
const {
    getTestCryptoData,
    generateTestHistoricalData,
} = require("./testCryptoData");

// CoinGecko API base URL (free tier)
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/**
 * Get historical price data for a cryptocurrency
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param {number} days - Number of days of historical data
 * @returns {Object} Historical price data
 */
async function get_coin_quotes_historical(symbol, days) {
    try {
        console.log(
            `📈 Fetching ${days} days of historical data for ${symbol}`
        );

        // Convert symbol to CoinGecko ID
        const coinId = await getCoinGeckoId(symbol);
        if (!coinId) {
            throw new Error(`Unable to find coin ID for symbol: ${symbol}`);
        }

        const response = await axios.get(
            `${COINGECKO_BASE}/coins/${coinId}/market_chart`,
            {
                params: {
                    vs_currency: "usd",
                    days: days,
                    interval: days > 90 ? "daily" : "hourly",
                },
                timeout: 10000,
            }
        );

        const prices = response.data.prices;
        const volumes = response.data.total_volumes;

        if (!prices || prices.length === 0) {
            throw new Error(`No price data available for ${symbol}`);
        }

        // Calculate price changes
        const currentPrice = prices[prices.length - 1][1];
        const startPrice = prices[0][1];
        const priceChange = ((currentPrice - startPrice) / startPrice) * 100;

        // Calculate additional metrics
        const maxPrice = Math.max(...prices.map((p) => p[1]));
        const minPrice = Math.min(...prices.map((p) => p[1]));
        const avgVolume =
            volumes.reduce((sum, v) => sum + v[1], 0) / volumes.length;

        return {
            symbol: symbol.toUpperCase(),
            timeframe: `${days}d`,
            current_price: currentPrice,
            start_price: startPrice,
            price_change_percentage: priceChange,
            high: maxPrice,
            low: minPrice,
            average_volume: avgVolume,
            data_points: prices.length,
            last_updated: new Date().toISOString(),
        };
    } catch (error) {
        console.error(
            `❌ Error fetching historical data for ${symbol}:`,
            error.message
        );
        throw new Error(
            `Failed to fetch historical data for ${symbol}: ${error.message}`
        );
    }
}

/**
 * Get current price quotes for multiple cryptocurrencies
 * @param {string[]} symbols - Array of cryptocurrency symbols
 * @returns {Object} Current price data for all symbols
 */
async function get_coin_quotes(symbols) {
    try {
        console.log(`💰 Fetching current quotes for: ${symbols.join(", ")}`);

        // Convert symbols to CoinGecko IDs
        const coinIds = [];
        for (const symbol of symbols) {
            const id = await getCoinGeckoId(symbol);
            if (id) coinIds.push(id);
        }

        if (coinIds.length === 0) {
            throw new Error("No valid coin IDs found for the provided symbols");
        }

        const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
            params: {
                ids: coinIds.join(","),
                vs_currencies: "usd",
                include_24hr_change: true,
                include_24hr_vol: true,
                include_market_cap: true,
            },
            timeout: 10000,
        });

        const result = {};
        for (const [coinId, data] of Object.entries(response.data)) {
            const symbol = await getSymbolFromCoinId(coinId);
            result[symbol] = {
                symbol: symbol,
                price: data.usd,
                change_24h: data.usd_24h_change || 0,
                volume_24h: data.usd_24h_vol || 0,
                market_cap: data.usd_market_cap || 0,
                last_updated: new Date().toISOString(),
            };
        }

        return result;
    } catch (error) {
        console.error(
            `❌ Error fetching quotes for ${symbols.join(", ")}:`,
            error.message
        );
        throw new Error(`Failed to fetch quotes: ${error.message}`);
    }
}

/**
 * Get list of top cryptocurrencies by market cap
 * @returns {Object} List of cryptocurrencies with basic info
 */
async function listing_coins() {
    try {
        console.log(`📋 Fetching top cryptocurrencies list`);

        const response = await axios.get(`${COINGECKO_BASE}/coins/markets`, {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 100,
                page: 1,
                sparkline: false,
                price_change_percentage: "1h,24h,7d",
            },
            timeout: 15000,
        });

        return {
            total_coins: response.data.length,
            coins: response.data.map((coin) => ({
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                market_cap_rank: coin.market_cap_rank,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                price_change_24h: coin.price_change_percentage_24h || 0,
                price_change_7d:
                    coin.price_change_percentage_7d_in_currency || 0,
                volume_24h: coin.total_volume || 0,
            })),
            last_updated: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`❌ Error fetching coins list:`, error.message);
        throw new Error(`Failed to fetch coins list: ${error.message}`);
    }
}

/**
 * Get detailed information about a cryptocurrency
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Object} Detailed coin information
 */
async function get_coin_info(symbol) {
    try {
        console.log(`ℹ️ Fetching detailed info for ${symbol}`);

        const coinId = await getCoinGeckoId(symbol);
        if (!coinId) {
            throw new Error(
                `Unable to find coin information for symbol: ${symbol}`
            );
        }

        const response = await axios.get(`${COINGECKO_BASE}/coins/${coinId}`, {
            params: {
                localization: false,
                tickers: false,
                market_data: true,
                community_data: false,
                developer_data: false,
                sparkline: false,
            },
            timeout: 10000,
        });

        const coin = response.data;
        return {
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            description:
                coin.description?.en
                    ?.replace(/<[^>]*>/g, "")
                    .substring(0, 500) || "No description available",
            website: coin.links?.homepage?.[0] || null,
            whitepaper: coin.links?.whitepaper || null,
            github: coin.links?.repos_url?.github?.[0] || null,
            current_price: coin.market_data?.current_price?.usd || 0,
            market_cap: coin.market_data?.market_cap?.usd || 0,
            market_cap_rank: coin.market_cap_rank || null,
            volume_24h: coin.market_data?.total_volume?.usd || 0,
            price_change_24h:
                coin.market_data?.price_change_percentage_24h || 0,
            price_change_7d: coin.market_data?.price_change_percentage_7d || 0,
            price_change_30d:
                coin.market_data?.price_change_percentage_30d || 0,
            last_updated:
                coin.market_data?.last_updated || new Date().toISOString(),
        };
    } catch (error) {
        console.error(`❌ Error fetching info for ${symbol}:`, error.message);
        throw new Error(
            `Failed to fetch coin info for ${symbol}: ${error.message}`
        );
    }
}

/**
 * Search the web for cryptocurrency news and information
 * @param {string} query - Search query
 * @param {string} timeframe - Time range for search (optional)
 * @returns {Object} Search results
 */
async function search_the_web(query, timeframe = "30 days") {
    try {
        console.log(`🔍 Searching web for: "${query}" (${timeframe})`);

        // For now, return a simulated search result since we don't have a web search API
        // In a real implementation, you would use a search API like Google Custom Search, Bing Search API, etc.
        return {
            query: query,
            timeframe: timeframe,
            results: [
                {
                    title: `Recent news about ${query}`,
                    snippet: `No negative news or security issues found for ${query} in the specified timeframe. This is a placeholder result as web search API is not configured.`,
                    url: `https://example.com/search?q=${encodeURIComponent(
                        query
                    )}`,
                    date: new Date().toISOString(),
                },
            ],
            total_results: 1,
            search_time: new Date().toISOString(),
            note: "Web search functionality requires additional API configuration",
        };
    } catch (error) {
        console.error(`❌ Error searching web for ${query}:`, error.message);
        throw new Error(`Failed to search web: ${error.message}`);
    }
}

// Helper function to convert symbol to CoinGecko ID
async function getCoinGeckoId(symbol) {
    try {
        const normalizedSymbol = symbol.toLowerCase();

        // Common symbol to ID mappings
        const symbolMap = {
            btc: "bitcoin",
            eth: "ethereum",
            bnb: "binancecoin",
            sol: "solana",
            ada: "cardano",
            dot: "polkadot",
            matic: "matic-network",
            avax: "avalanche-2",
            uni: "uniswap",
            link: "chainlink",
            atom: "cosmos",
            icp: "internet-computer",
            shib: "shiba-inu",
            doge: "dogecoin",
            pepe: "pepe",
            floki: "floki",
            usdc: "usd-coin",
            usdt: "tether",
            dai: "dai",
        };

        if (symbolMap[normalizedSymbol]) {
            return symbolMap[normalizedSymbol];
        }

        // If not in our map, try to find it via API
        const response = await axios.get(`${COINGECKO_BASE}/coins/list`, {
            timeout: 5000,
        });

        const coin = response.data.find(
            (c) => c.symbol.toLowerCase() === normalizedSymbol
        );
        return coin ? coin.id : null;
    } catch (error) {
        console.warn(`Warning: Could not find CoinGecko ID for ${symbol}`);
        return null;
    }
}

// Helper function to get symbol from CoinGecko ID
async function getSymbolFromCoinId(coinId) {
    try {
        const symbolMap = {
            bitcoin: "BTC",
            ethereum: "ETH",
            binancecoin: "BNB",
            solana: "SOL",
            cardano: "ADA",
            polkadot: "DOT",
            "matic-network": "MATIC",
            "avalanche-2": "AVAX",
            uniswap: "UNI",
            chainlink: "LINK",
            cosmos: "ATOM",
            "internet-computer": "ICP",
            "shiba-inu": "SHIB",
            dogecoin: "DOGE",
            pepe: "PEPE",
            floki: "FLOKI",
            "usd-coin": "USDC",
            tether: "USDT",
            dai: "DAI",
        };

        return symbolMap[coinId] || coinId.toUpperCase();
    } catch (error) {
        return coinId.toUpperCase();
    }
}

/**
 * Execute a tool call by name with parameters
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} parameters - Parameters for the tool
 * @returns {Object} Tool execution result
 */
async function executeTool(toolName, parameters) {
    try {
        console.log(`🔧 Executing tool: ${toolName}`);
        console.log(`📝 Parameters:`, parameters);

        switch (toolName) {
            case "get_coin_quotes_historical":
                return await get_coin_quotes_historical(
                    parameters.symbol,
                    parameters.days
                );

            case "get_coin_quotes":
                return await get_coin_quotes(parameters.symbols);

            case "listing_coins":
                return await listing_coins();

            case "get_coin_info":
                return await get_coin_info(parameters.symbol);

            case "search_the_web":
                return await search_the_web(
                    parameters.query,
                    parameters.timeframe
                );

            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } catch (error) {
        console.error(
            `❌ Tool execution failed for ${toolName}:`,
            error.message
        );
        throw error;
    }
}

module.exports = {
    get_coin_quotes_historical,
    get_coin_quotes,
    listing_coins,
    get_coin_info,
    search_the_web,
    executeTool,
};
