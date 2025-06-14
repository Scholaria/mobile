import { useCallback, useEffect, useState } from "react";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Batch requests
const requestQueue = new Map<string, Promise<any>>();

export const fetchAPI = async (url: string, options?: RequestInit) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    // Check if there's an ongoing request for the same URL
    if (requestQueue.has(cacheKey)) {
        return requestQueue.get(cacheKey);
    }

    // Create new request
    const request = (async () => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options?.headers,
                    'Cache-Control': 'max-age=300', // 5 minutes cache
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                return null;
            }

            try {
                const data = JSON.parse(text);
                // Cache the result
                cache.set(cacheKey, { data, timestamp: Date.now() });
                return data;
            } catch (e) {
                console.error("JSON Parse error:", e);
                console.error("Response text:", text);
                throw new Error(`Invalid JSON response: ${text}`);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        } finally {
            requestQueue.delete(cacheKey);
        }
    })();

    requestQueue.set(cacheKey, request);
    return request;
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchAPI(url, options);
            setData(result.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [url, options]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};