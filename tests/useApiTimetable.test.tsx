import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useApiTimetable } from "../src/hooks/useApiTimetable";
import { PRIORITY } from "../src/types/enums";
import type { TimetableApiConfig } from "../src/types/config";
import type { ServerTimetableData } from "../src/lib/normalize";

const API_URL = "https://api.example.com/api/v1";
const BASE = `${API_URL}/timetablely/sync`;

let fetchMock: ReturnType<typeof vi.fn>;

const config = (): TimetableApiConfig => ({
    mode: "api",
    apiKey: "ttly_key_test",
    apiSecret: "ttly_sec_test",
    apiUrl: API_URL,
    fetchImpl: fetchMock as unknown as typeof fetch,
});

/** The envelope every route on the service replies with. */
const envelope = (data: unknown, success = true) => ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ status: 200, success, message: "ok", data }),
});

const failure = (status: number, message: string, code?: string) => ({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ status, success: false, message, data: null, code }),
});

const serverData: ServerTimetableData = {
    tutors: [
        {
            _id: "tutor-1",
            name: "Mr. Smith",
            email: "smith@example.com",
            maxPeriodsPerDay: 4,
            availability: [
                { day: 0, slot: 0, available: true },
                { day: 1, slot: 3, available: false },
            ],
        },
    ],
    courses: [
        {
            _id: "course-1",
            name: "Math",
            tutorId: { _id: "tutor-1", name: "Mr. Smith" },
            periodsPerWeek: 5,
            priority: "high",
        },
    ],
    sessions: [{ _id: "session-1", name: "Class 1A", subjects: ["course-1"] }],
    specialBlocks: [{ _id: "block-1", name: "Lunch", slot: 4, duration: 30 }],
    templates: [],
};

beforeEach(() => {
    fetchMock = vi.fn();
});

describe("useApiTimetable — loading server data", () => {
    it("reads the database on mount", async () => {
        fetchMock.mockResolvedValue(envelope(serverData));

        const { result } = renderHook(() => useApiTimetable(config()));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBeNull();
        expect(result.current.database?.courses).toEqual([
            {
                id: "course-1",
                name: "Math",
                teacherId: "tutor-1",
                periodsPerWeek: 5,
                priority: PRIORITY.HIGH,
            },
        ]);
    });

    it("calls the real sync endpoint with key-pair headers", async () => {
        fetchMock.mockResolvedValue(envelope(serverData));

        renderHook(() => useApiTimetable(config()));

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        expect(fetchMock).toHaveBeenCalledWith(
            `${BASE}/data`,
            expect.objectContaining({
                method: "GET",
                headers: expect.objectContaining({
                    "X-API-Key": "ttly_key_test",
                    "X-API-Secret": "ttly_sec_test",
                    "X-App-Source": "timetablely",
                }),
            }),
        );
    });

    it("scopes the read to a session when one is given", async () => {
        fetchMock.mockResolvedValue(envelope(serverData));

        renderHook(() =>
            useApiTimetable({ ...config(), sessionId: "session-1" }),
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/data?sessionId=session-1`);
    });

    it("defaults to the hosted service when no apiUrl is given", async () => {
        fetchMock.mockResolvedValue(envelope({}));

        const { fetchImpl } = config();
        renderHook(() =>
            useApiTimetable({
                mode: "api",
                apiKey: "k",
                apiSecret: "s",
                fetchImpl,
            }),
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(fetchMock.mock.calls[0][0]).toBe(
            "https://geosoft-service.onrender.com/api/v1/timetablely/sync/data",
        );
    });
});

describe("useApiTimetable — failures", () => {
    it("surfaces the server's message and status", async () => {
        fetchMock.mockResolvedValue(failure(401, "Invalid API credentials.", "INVALID_API_KEY"));

        const { result } = renderHook(() => useApiTimetable(config()));

        await waitFor(() => expect(result.current.error).not.toBeNull());

        expect(result.current.error).toBe("Invalid API credentials.");
        expect(result.current.database).toBeNull();
        expect(
            (result.current.lastError as { status?: number })?.status,
        ).toBe(401);
        expect((result.current.lastError as { code?: string })?.code).toBe(
            "INVALID_API_KEY",
        );
    });

    it("treats a 200 carrying success:false as a failure", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => ({
                status: 200,
                success: false,
                message: "Could not read that.",
                data: null,
            }),
        });

        const { result } = renderHook(() => useApiTimetable(config()));

        await waitFor(() => expect(result.current.error).not.toBeNull());
        expect(result.current.error).toBe("Could not read that.");
    });

    it("reports a network failure", async () => {
        fetchMock.mockRejectedValue(new Error("Network down"));

        const { result } = renderHook(() => useApiTimetable(config()));

        await waitFor(() => expect(result.current.error).not.toBeNull());
        expect(result.current.error).toBe("Network down");
    });
});

describe("useApiTimetable — save", () => {
    it("posts the sync payload and re-reads the result", async () => {
        fetchMock.mockResolvedValue(envelope(serverData));

        const { result } = renderHook(() => useApiTimetable(config()));
        await waitFor(() => expect(result.current.database).not.toBeNull());

        fetchMock.mockClear();
        fetchMock.mockResolvedValue(envelope(serverData));

        let saved: boolean | undefined;
        await act(async () => {
            saved = await result.current.save(result.current.database!);
        });

        expect(saved).toBe(true);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${BASE}/sync`);
        expect(init.method).toBe("POST");

        const body = JSON.parse(init.body as string);
        expect(body.courses[0]).toMatchObject({
            _id: "course-1",
            tutorId: "tutor-1",
            priority: "high",
        });

        // The server assigns ids, so a save is followed by a read.
        expect(fetchMock.mock.calls[1][0]).toBe(`${BASE}/data`);
    });

    it("returns false when a read-only key is refused", async () => {
        fetchMock.mockResolvedValue(envelope(serverData));

        const { result } = renderHook(() => useApiTimetable(config()));
        await waitFor(() => expect(result.current.database).not.toBeNull());

        fetchMock.mockResolvedValue(
            failure(403, 'This API key does not have the "write" scope.', "API_KEY_SCOPE_REQUIRED"),
        );

        let saved: boolean | undefined;
        await act(async () => {
            saved = await result.current.save(result.current.database!);
        });

        expect(saved).toBe(false);
        expect(result.current.error).toBe(
            'This API key does not have the "write" scope.',
        );
    });
});
