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
    console.log("Fetching API", url, options);
    const { skipCache, ...fetchOptions } = options || {};
    const cacheKey = `${url}-${JSON.stringify(fetchOptions)}`;
    
    // Check cache if not skipping
    if (!skipCache) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log("Cache hit for", url);
            return cached.data;
        }
    }

    // Check if there's an ongoing request for the same URL
    if (requestQueue.has(cacheKey)) {
        console.log("Request queue hit for", url);
        return requestQueue.get(cacheKey);
    }

    // Create new request
    const request = (async () => {
        try {
            const headers: Record<string, string> = {
                'Cache-Control': 'max-age=300', // 5 minutes cache
            };

            // Add Content-Type header for JSON requests with body
            if (fetchOptions.body && typeof fetchOptions.body === 'string') {
                try {
                    JSON.parse(fetchOptions.body);
                    headers['Content-Type'] = 'application/json';
                } catch (e) {
                    // Not JSON, don't add Content-Type
                }
            }

            const response = await fetch(`${BACKEND_URL}${url}`, {
                ...fetchOptions,
                headers: {
                    ...headers,
                    ...fetchOptions?.headers,
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
                // Always cache the result, regardless of skipCache flag
                // skipCache only affects whether we check the cache, not whether we store the result
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
