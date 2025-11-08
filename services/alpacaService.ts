import type { AlpacaCreds } from '../types';

const API_URL = 'https://paper-api.alpaca.markets';
const NEWS_API_URL = 'https://data.alpaca.markets/v1beta1/news';
const DATA_API_URL = 'https://data.alpaca.markets/v2';

const getAuthHeaders = (creds: AlpacaCreds) => {
    return {
        'APCA-API-KEY-ID': creds.key,
        'APCA-API-SECRET-KEY': creds.secret,
        'Content-Type': 'application/json',
    };
};

export const getAlpacaAccount = async (creds: AlpacaCreds): Promise<{ equity: number }> => {
    const response = await fetch(`${API_URL}/v2/account`, {
        headers: getAuthHeaders(creds),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch Alpaca account: ${await response.text()}`);
    }
    const data = await response.json();
    return { equity: parseFloat(data.equity) };
};

export const placeAlpacaOrder = async (symbol: string, qty: number, side: 'buy' | 'sell', creds: AlpacaCreds): Promise<any> => {
    const order = {
        symbol,
        qty,
        side,
        type: 'market',
        time_in_force: 'day',
    };
    const response = await fetch(`${API_URL}/v2/orders`, {
        method: 'POST',
        headers: getAuthHeaders(creds),
        body: JSON.stringify(order),
    });
    if (!response.ok) {
        throw new Error(`Failed to place Alpaca order: ${await response.text()}`);
    }
    return await response.json();
};

export const closeAllPositions = async (creds: AlpacaCreds): Promise<any> => {
    const response = await fetch(`${API_URL}/v2/positions`, {
        method: 'DELETE',
        headers: getAuthHeaders(creds),
        // Adding `close_orders: true` would also cancel open orders, but we only have market orders.
    });
    if (!response.ok) {
        throw new Error(`Failed to close all positions: ${await response.text()}`);
    }
    return await response.json();
}

// Fetches the most recent news article for a given symbol
export const getRecentNewsForSymbol = async (symbol: string, creds: AlpacaCreds): Promise<{ headline: string; source: string; url: string; }> => {
    // Alpaca API uses a slash for crypto pairs, but needs just the base for news
    const newsSymbol = symbol.includes('/') ? symbol.split('/')[0] : symbol;
    
    const response = await fetch(`${NEWS_API_URL}?symbols=${newsSymbol}&limit=1`, {
        headers: getAuthHeaders(creds),
    });

    if (!response.ok) {
        console.error("Failed to fetch news from Alpaca:", await response.text());
        // Return a generic headline if the API fails
        return { headline: `Market data is showing movement for ${symbol}.`, source: "Generic Feed", url: "" };
    }

    const data = await response.json();
    const article = data.news?.[0];

    if (article) {
        return {
            headline: article.headline,
            source: article.source,
            url: article.url,
        };
    } else {
        // Return a generic headline if no news is found
        return { headline: `Market data is showing movement for ${symbol}.`, source: "Generic Feed", url: "" };
    }
};

// Fetches the last 15 minutes of price data to populate the chart
export const getInitialPriceHistory = async (symbol: string, creds: AlpacaCreds): Promise<{ time: number; price: number; }[]> => {
    const isCrypto = symbol.includes('/');
    const endpoint = isCrypto ? 'crypto' : 'stocks';
    const url = `${DATA_API_URL}/${endpoint}/${symbol}/bars?timeframe=1Min&limit=15`;
    
    try {
        const response = await fetch(url, {
            headers: getAuthHeaders(creds),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch historical bars: ${await response.text()}`);
        }

        const data = await response.json();
        const bars = data.bars;

        if (!bars || bars.length === 0) return [];
        
        return bars.map((bar: any, index: number) => ({
            time: index,
            price: bar.c, // Close price
        }));
    } catch (error) {
        console.error("Error fetching price history:", error);
        return []; // Return empty array on failure
    }
};