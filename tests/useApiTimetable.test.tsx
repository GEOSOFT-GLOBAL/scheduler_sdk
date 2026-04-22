import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useApiTimetable } from "../src/hooks/useApiTimetable";
import type { TimetableApiConfig } from "../src/types/config";

const config: TimetableApiConfig = {
    mode: "api",
    apiKey: "test-key",
    apiSecret: "test-secret",
    apiUrl: "https://api.example.com/v1",
};

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
    vi.restoreAllMocks();
});

const mockFetch = (body: unknown, ok = true) => {
    vi.mocked(fetch).mockResolvedValue({
        ok,
        json: async () => body,
    } as Response);
};

describe("useApiTimetable — initial state", () => {
    it("starts with null data, not loading, no error", () => {
        const { result } = renderHook(() => useApiTimetable(config));
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });
});

describe("useApiTimetable — fetchTimetable", () => {
    it("sets data on success", async () => {
        mockFetch({ data: [{ id: "1" }] });
        const { result } = renderHook(() => useApiTimetable(config));
        act(() => { result.current.fetchTimetable(); });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data).toEqual([{ id: "1" }]);
        expect(result.current.error).toBeNull();
    });

    it("sets error on non-ok response", async () => {
        mockFetch({}, false);
        const { result } = renderHook(() => useApiTimetable(config));
        act(() => { result.current.fetchTimetable(); });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.error).toBe("Failed to fetch timetable");
        expect(result.current.data).toBeNull();
    });

    it("sets error on network failure", async () => {
        vi.mocked(fetch).mockRejectedValue(new Error("Network down"));
        const { result } = renderHook(() => useApiTimetable(config));
        act(() => { result.current.fetchTimetable(); });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.error).toBe("Network down");
    });

    it("sends the correct auth headers", async () => {
        mockFetch({ data: [] });
        const { result } = renderHook(() => useApiTimetable(config));
        await act(() => result.current.fetchTimetable());
        expect(fetch).toHaveBeenCalledWith(
            "https://api.example.com/v1/timetables",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "X-API-Key": "test-key",
                    "X-API-Secret": "test-secret",
                }),
            }),
        );
    });
});

describe("useApiTimetable — fetchCourses", () => {
    it("returns course data on success", async () => {
        mockFetch({ data: [{ id: "c1", name: "Math" }] });
        const { result } = renderHook(() => useApiTimetable(config));
        let courses: unknown;
        await act(async () => { courses = await result.current.fetchCourses(); });
        expect(courses).toEqual([{ id: "c1", name: "Math" }]);
    });

    it("returns empty array on failure", async () => {
        mockFetch({}, false);
        const { result } = renderHook(() => useApiTimetable(config));
        let courses: unknown;
        await act(async () => { courses = await result.current.fetchCourses(); });
        expect(courses).toEqual([]);
        expect(result.current.error).toBe("Failed to fetch courses");
    });
});

describe("useApiTimetable — fetchTutors", () => {
    it("returns tutor data on success", async () => {
        mockFetch({ data: [{ id: "t1", name: "Mr. Smith" }] });
        const { result } = renderHook(() => useApiTimetable(config));
        let tutors: unknown;
        await act(async () => { tutors = await result.current.fetchTutors(); });
        expect(tutors).toEqual([{ id: "t1", name: "Mr. Smith" }]);
    });

    it("returns empty array on failure", async () => {
        mockFetch({}, false);
        const { result } = renderHook(() => useApiTimetable(config));
        let tutors: unknown;
        await act(async () => { tutors = await result.current.fetchTutors(); });
        expect(tutors).toEqual([]);
    });
});

describe("useApiTimetable — fetchSessions", () => {
    it("returns session data on success", async () => {
        mockFetch({ data: [{ id: "s1", name: "Class 1A" }] });
        const { result } = renderHook(() => useApiTimetable(config));
        let sessions: unknown;
        await act(async () => { sessions = await result.current.fetchSessions(); });
        expect(sessions).toEqual([{ id: "s1", name: "Class 1A" }]);
    });
});

describe("useApiTimetable — saveTimetable", () => {
    it("POSTs payload and updates data on success", async () => {
        mockFetch({ data: { saved: true } });
        const { result } = renderHook(() => useApiTimetable(config));
        await act(async () => { await result.current.saveTimetable({ entries: [] }); });
        expect(fetch).toHaveBeenCalledWith(
            "https://api.example.com/v1/timetables",
            expect.objectContaining({ method: "POST" }),
        );
        expect(result.current.data).toEqual({ saved: true });
    });

    it("sets error when save fails", async () => {
        mockFetch({}, false);
        const { result } = renderHook(() => useApiTimetable(config));
        await act(async () => { await result.current.saveTimetable({}); });
        expect(result.current.error).toBe("Failed to save timetable");
    });
});

describe("useApiTimetable — defaults apiUrl", () => {
    it("uses the default API URL when apiUrl is omitted", async () => {
        mockFetch({ data: [] });
        const cfg: TimetableApiConfig = { mode: "api", apiKey: "k", apiSecret: "s" };
        const { result } = renderHook(() => useApiTimetable(cfg));
        await act(() => result.current.fetchTimetable());
        expect(fetch).toHaveBeenCalledWith(
            "https://api.timetablely.com/v1/timetables",
            expect.anything(),
        );
    });
});
