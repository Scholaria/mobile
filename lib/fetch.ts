import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/constants";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Batch requests
const requestQueue = new Map<string, Promise<any>>();

export const clearCache = () => {
    cache.clear();
    requestQueue.clear();
};

export const fetchAPI = async (url: string, options?: RequestInit & { skipCache?: boolean }) => {
    const { skipCache, ...fetchOptions } = options || {};
    const cacheKey = `${url}-${JSON.stringify(fetchOptions)}`;
    
    // Check cache if not skipping
    if (!skipCache) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
    }

    // Check if there's an ongoing request for the same URL
    if (requestQueue.has(cacheKey)) {
        return requestQueue.get(cacheKey);
    }

    // Create new request
    const request = (async () => {
        try {
            const response = await fetch(`${BACKEND_URL}${url}`, {
                ...fetchOptions,
                headers: {
                    ...fetchOptions?.headers,
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
                // Cache the result if not skipping cache
                if (!skipCache) {
                    cache.set(cacheKey, { data, timestamp: Date.now() });
                }
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

export const useFetch = <T>(url: string, options?: RequestInit & { skipCache?: boolean }) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (skipCache = false) => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchAPI(url, { ...options, skipCache });
            setData(result.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [url, options]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData(true);
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refreshing, refetch: fetchData, refresh };
};