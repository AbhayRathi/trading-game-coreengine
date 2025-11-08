import type { AlpacaCreds } from '../types';

const NEWS_API_URL = 'https://data.alpaca.markets/v1beta1/news';
const DATA_API_URL = 'https://data.alpaca.markets/v2';

const getAuthHeaders = (creds: AlpacaCreds) => {
    return {
        'APCA-API-KEY-ID': creds.key,
        'APCA-API-SECRET-KEY': creds.secret,
    };
};

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