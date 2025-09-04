/**
 * Simple crypto data provider for testing purposes
 * This provides basic sample data when external APIs are rate-limited
 * In production, this would be replaced with proper API keys and rate limiting
 */

/**
 * Simple test data provider when external APIs are unavailable
 */
function getTestCryptoData() {
    const testCoins = [
        {
            symbol: "BTC",
            name: "Bitcoin",
            price: 95000,
            change_24h: 2.5,
            market_cap: 1800000000000,
        },
        {
            symbol: "ETH",
            name: "Ethereum",
            price: 3200,
            change_24h: 3.2,
            market_cap: 380000000000,
        },
        {
            symbol: "SOL",
            name: "Solana",
            price: 180,
            change_24h: 8.1,
            market_cap: 80000000000,
        },
        {
            symbol: "ADA",
            name: "Cardano",
            price: 0.85,
            change_24h: -1.2,
            market_cap: 30000000000,
        },
        {
            symbol: "DOT",
            name: "Polkadot",
            price: 7.5,
            change_24h: 4.3,
            market_cap: 9000000000,
        },
        {
            symbol: "MATIC",
            name: "Polygon",
            price: 0.95,
            change_24h: 6.7,
            market_cap: 8500000000,
        },
        {
            symbol: "AVAX",
            name: "Avalanche",
            price: 35,
            change_24h: -2.1,
            market_cap: 14000000000,
        },
        {
            symbol: "UNI",
            name: "Uniswap",
            price: 12,
            change_24h: 1.8,
            market_cap: 7200000000,
        },
        {
            symbol: "LINK",
            name: "Chainlink",
            price: 22,
            change_24h: 5.2,
            market_cap: 13000000000,
        },
        {
            symbol: "DOGE",
            name: "Dogecoin",
            price: 0.08,
            change_24h: 12.3,
            market_cap: 11500000000,
        },
    ];

    return testCoins;
}

/**
 * Generate test historical data for a symbol
 */
function generateTestHistoricalData(symbol, days) {
    const basePrice =
        getTestCryptoData().find((coin) => coin.symbol === symbol)?.price ||
        100;
    const data = [];

    for (let i = days; i >= 0; i--) {
        const variance = (Math.random() - 0.5) * 0.1; // ±5% daily variance
        const price = basePrice * (1 + variance * (i / days));
        data.push({
            timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
            price: price,
        });
    }

    const currentPrice = data[data.length - 1].price;
    const startPrice = data[0].price;
    const priceChange = ((currentPrice - startPrice) / startPrice) * 100;

    return {
        symbol: symbol,
        timeframe: `${days}d`,
        current_price: currentPrice,
        start_price: startPrice,
        price_change_percentage: priceChange,
        high: Math.max(...data.map((d) => d.price)),
        low: Math.min(...data.map((d) => d.price)),
        data_points: data.length,
        last_updated: new Date().toISOString(),
        note: "Test data - replace with real API in production",
    };
}

module.exports = {
    getTestCryptoData,
    generateTestHistoricalData,
};
