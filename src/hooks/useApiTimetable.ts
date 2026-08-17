import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimetableApiConfig } from "../types/config";
import type { ITimetableDatabase } from "../types/database";
import { createApiClient, TimetablelyApiError } from "../lib/api-client";
import {
    normalizeDatabase,
    toSyncPayload,
    type ServerTimetableData,
} from "../lib/normalize";

export interface ApiTimetableState {
    /** The user's records, in the shape the grid and generator read. */
    database: ITimetableDatabase | null;
    isLoading: boolean;
    error: string | null;
    /** The failure itself, when a caller needs the status or code. */
    lastError: TimetablelyApiError | Error | null;
}

const emptyState: ApiTimetableState = {
    database: null,
    isLoading: false,
    error: null,
    lastError: null,
};

/** An aborted request is the caller changing their mind, not a failure. */
const isAbort = (error: unknown): boolean =>
    error instanceof Error && error.name === "AbortError";

const messageFor = (error: unknown): string =>
    error instanceof Error ? error.message : "Unknown error";

/**
 * Reads and writes a user's timetable data through the Timetablely service.
 *
 * `refresh` is called once on mount and whenever the credentials or the
 * session change, so a mounted grid has server data without the host wiring
 * up an effect of its own.
 */
export const useApiTimetable = (config: TimetableApiConfig) => {
    const [state, setState] = useState<ApiTimetableState>(emptyState);

    const { apiKey, apiSecret, apiUrl, sessionId, fetchImpl } = config;

    const client = useMemo(
        () =>
            createApiClient({
                mode: "api",
                apiKey,
                apiSecret,
                apiUrl,
                fetchImpl,
            }),
        [apiKey, apiSecret, apiUrl, fetchImpl],
    );

    /**
     * The in-flight load. A second refresh cancels the first so a slow early
     * response cannot land after a fast later one and show stale data.
     */
    const inFlight = useRef<AbortController | null>(null);

    const run = useCallback(
        async <T>(work: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
            inFlight.current?.abort();
            const controller = new AbortController();
            inFlight.current = controller;

            setState((current) => ({ ...current, isLoading: true, error: null }));

            try {
                const result = await work(controller.signal);
                setState((current) => ({ ...current, isLoading: false }));
                return result;
            } catch (error) {
                if (isAbort(error)) return null;
                setState((current) => ({
                    ...current,
                    isLoading: false,
                    error: messageFor(error),
                    lastError: error instanceof Error ? error : new Error(messageFor(error)),
                }));
                return null;
            } finally {
                if (inFlight.current === controller) inFlight.current = null;
            }
        },
        [],
    );

    /** Loads everything: tutors, courses, sessions, templates, special blocks. */
    const refresh = useCallback(async (): Promise<ITimetableDatabase | null> => {
        const database = await run(async (signal) => {
            const data = await client.get<ServerTimetableData>("/data", {
                signal,
                query: { sessionId },
            });
            return normalizeDatabase(data ?? {});
        });

        if (database) setState((current) => ({ ...current, database }));
        return database;
    }, [client, run, sessionId]);

    /**
     * Pushes the database back.
     *
     * Needs a key with the `write` scope; a read-only key gets a 403 carrying
     * `API_KEY_SCOPE_REQUIRED`.
     */
    const save = useCallback(
        async (database: ITimetableDatabase): Promise<boolean> => {
            // Returns a sentinel rather than the response body: `run` reports
            // failure as null, and the body could legitimately be null too.
            const result = await run(async (signal) => {
                await client.post<unknown>("/sync", toSyncPayload(database), { signal });
                return true as const;
            });

            if (result !== true) return false;

            // The server assigns ids to anything newly created, so the local
            // copy is only correct again after reading it back.
            await refresh();
            return true;
        },
        [client, refresh, run],
    );

    const fetchTutors = useCallback(
        () => refresh().then((database) => database?.tutors ?? []),
        [refresh],
    );

    const fetchCourses = useCallback(
        () => refresh().then((database) => database?.courses ?? []),
        [refresh],
    );

    const fetchSessions = useCallback(
        () => refresh().then((database) => database?.sessions ?? []),
        [refresh],
    );

    const fetchTemplates = useCallback(
        () => refresh().then((database) => database?.templates ?? []),
        [refresh],
    );

    useEffect(() => {
        void refresh();
        return () => inFlight.current?.abort();
    }, [refresh]);

    return {
        ...state,
        refresh,
        save,
        fetchTutors,
        fetchCourses,
        fetchSessions,
        fetchTemplates,
    };
};
