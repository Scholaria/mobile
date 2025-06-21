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

// Enhanced error logging function
const logDetailedError = (error: any, context: {
    url: string;
    method?: string;
    status?: number;
    statusText?: string;
    responseText?: string;
    requestBody?: any;
    headers?: Record<string, string>;
}) => {
    const timestamp = new Date().toISOString();
    const errorType = error.name || 'Unknown Error';
    const errorMessage = error.message || 'No error message';
    
    console.group(`🚨 API Error - ${timestamp}`);
    console.error(`Error Type: ${errorType}`);
    console.error(`Error Message: ${errorMessage}`);
    console.error(`Request URL: ${BACKEND_URL}${context.url}`);
    console.error(`Request Method: ${context.method || 'GET'}`);
    
    if (context.status) {
        console.error(`Response Status: ${context.status} ${context.statusText || ''}`);
    }
    
    if (context.requestBody) {
        console.error('Request Body:', context.requestBody);
    }
    
    if (context.headers) {
        console.error('Request Headers:', context.headers);
    }
    
    if (context.responseText) {
        console.error('Response Text:', context.responseText);
    }
    
    // Log the full error object for debugging
    console.error('Full Error Object:', error);
    console.error('Error Stack:', error.stack);
    console.groupEnd();
};

export const fetchAPI = async (url: string, options?: RequestInit & { skipCache?: boolean; timeout?: number }) => {
    console.log("Fetching API", url, options);
    const { skipCache, timeout = 30000, ...fetchOptions } = options || {}; // 30 second default timeout
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

            const fullUrl = `${BACKEND_URL}${url}`;
            console.log(`🌐 Making request to: ${fullUrl}`);
            console.log(`📤 Request method: ${fetchOptions.method || 'GET'}`);
            console.log(`⏱️ Timeout set to: ${timeout}ms`);
            
            if (fetchOptions.body) {
                console.log(`📦 Request body:`, fetchOptions.body);
            }

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`⏰ Request timeout after ${timeout}ms for ${url}`);
                controller.abort();
            }, timeout);

            const response = await fetch(fullUrl, {
                ...fetchOptions,
                signal: controller.signal,
                headers: {
                    ...headers,
                    ...fetchOptions?.headers,
                },
            });

            // Clear timeout since we got a response
            clearTimeout(timeoutId);
            console.log(`📥 Response status: ${response.status} ${response.statusText}`);
            console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let responseText = '';
                try {
                    responseText = await response.text();
                } catch (e) {
                    responseText = 'Unable to read response text';
                }

                const error = new Error(`HTTP ${response.status}: ${response.statusText || 'Unknown error'}`);
                error.name = 'HTTPError';
                
                logDetailedError(error, {
                    url,
                    method: fetchOptions.method,
                    status: response.status,
                    statusText: response.statusText,
                    responseText,
                    requestBody: fetchOptions.body,
                    headers: fetchOptions.headers as Record<string, string>
                });

                throw error;
            }

            const text = await response.text();
            console.log(`📄 Response text length: ${text.length} characters`);
            if (!text) {
                console.log(`✅ Empty response for ${url}`);
                return null;
            }

            try {
                const data = JSON.parse(text);
                console.log(`✅ Successfully parsed JSON response for ${url}:`, JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : ''));
                // Always cache the result, regardless of skipCache flag
                // skipCache only affects whether we check the cache, not whether we store the result
                cache.set(cacheKey, { data, timestamp: Date.now() });
                return data;
            } catch (parseError) {
                const error = new Error(`Invalid JSON response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
                error.name = 'JSONParseError';
                
                logDetailedError(parseError, {
                    url,
                    method: fetchOptions.method,
                    responseText: text,
                    requestBody: fetchOptions.body,
                    headers: fetchOptions.headers as Record<string, string>
                });

                throw error;
            }
        } catch (error: unknown) {
            // Handle timeout/abort errors
            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout: ${BACKEND_URL}${url} took longer than ${timeout}ms`);
                timeoutError.name = 'TimeoutError';
                
                logDetailedError(timeoutError, {
                    url,
                    method: fetchOptions.method,
                    requestBody: fetchOptions.body,
                    headers: fetchOptions.headers as Record<string, string>
                });
                
                throw timeoutError;
            }
            
            // Handle network errors and other fetch-related errors
            if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError = new Error(`Network error: Unable to reach ${BACKEND_URL}${url}`);
                networkError.name = 'NetworkError';
                
                logDetailedError(networkError, {
                    url,
                    method: fetchOptions.method,
                    requestBody: fetchOptions.body,
                    headers: fetchOptions.headers as Record<string, string>
                });
                
                throw networkError;
            }
            
            // If it's already a detailed error we logged, just re-throw
            if (error instanceof Error && (error.name === 'HTTPError' || error.name === 'JSONParseError' || error.name === 'NetworkError' || error.name === 'TimeoutError')) {
                throw error;
            }
            
            // For any other unexpected errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            const unexpectedError = new Error(`Unexpected error: ${errorMessage}`);
            unexpectedError.name = 'UnexpectedError';
            
            logDetailedError(unexpectedError, {
                url,
                method: fetchOptions.method,
                requestBody: fetchOptions.body,
                headers: fetchOptions.headers as Record<string, string>
            });
            
            throw unexpectedError;
        } finally {
            requestQueue.delete(cacheKey);
        }
    })();

    requestQueue.set(cacheKey, request);
    return request;
};
