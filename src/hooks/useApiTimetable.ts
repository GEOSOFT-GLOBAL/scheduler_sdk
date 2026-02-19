import { useState, useCallback } from "react";
import type { TimetableApiConfig } from "../types/config";

export interface ApiTimetableState {
    data: unknown | null;
    isLoading: boolean;
    error: string | null;
}

/** Hook for interacting with the Timetablely API (API mode) */
export const useApiTimetable = (config: TimetableApiConfig) => {
    const [state, setState] = useState<ApiTimetableState>({
        data: null,
        isLoading: false,
        error: null,
    });

    const apiUrl = config.apiUrl || "https://api.timetablely.com/v1";

    const getAuthHeaders = useCallback(
        (): HeadersInit => ({
            "Content-Type": "application/json",
            "X-API-Key": config.apiKey,
            "X-API-Secret": config.apiSecret,
        }),
        [config.apiKey, config.apiSecret],
    );

    const fetchTimetable = useCallback(async () => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const response = await fetch(`${apiUrl}/timetables`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Failed to fetch timetable");
            const data = await response.json();
            setState({ data: data.data, isLoading: false, error: null });
        } catch (err) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            }));
        }
    }, [apiUrl, getAuthHeaders]);

    const fetchCourses = useCallback(async () => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const response = await fetch(`${apiUrl}/courses`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Failed to fetch courses");
            const data = await response.json();
            return data.data;
        } catch (err) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            }));
            return [];
        }
    }, [apiUrl, getAuthHeaders]);

    const fetchTutors = useCallback(async () => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const response = await fetch(`${apiUrl}/tutors`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Failed to fetch tutors");
            const data = await response.json();
            return data.data;
        } catch (err) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            }));
            return [];
        }
    }, [apiUrl, getAuthHeaders]);

    const fetchSessions = useCallback(async () => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const response = await fetch(`${apiUrl}/sessions`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Failed to fetch sessions");
            const data = await response.json();
            return data.data;
        } catch (err) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            }));
            return [];
        }
    }, [apiUrl, getAuthHeaders]);

    const saveTimetable = useCallback(
        async (payload: unknown) => {
            setState((s) => ({ ...s, isLoading: true, error: null }));
            try {
                const response = await fetch(`${apiUrl}/timetables`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error("Failed to save timetable");
                const data = await response.json();
                setState({ data: data.data, isLoading: false, error: null });
            } catch (err) {
                setState((s) => ({
                    ...s,
                    isLoading: false,
                    error: err instanceof Error ? err.message : "Unknown error",
                }));
            }
        },
        [apiUrl, getAuthHeaders],
    );

    return {
        ...state,
        fetchTimetable,
        fetchCourses,
        fetchTutors,
        fetchSessions,
        saveTimetable,
    };
};
