import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimetablelyScheduler } from "../src/hooks/useTimetablelyScheduler";
import type { ITimetableDatabase } from "../src/types/database";
import { PRIORITY } from "../src/types/enums";

const makeDatabase = (overrides: Partial<ITimetableDatabase> = {}): ITimetableDatabase => ({
    tutors: [
        { id: "t1", name: "Mr. Jones", subjects: ["c1"], maxPeriodsPerDay: 3 },
    ],
    courses: [
        { id: "c1", name: "Math", teacherId: "t1", periodsPerWeek: 3, priority: PRIORITY.HIGH },
    ],
    sessions: [
        { id: "s1", name: "Class 1A", subjects: ["c1"] },
    ],
    blockedSlots: [],
    blockedTexts: [],
    ...overrides,
});

describe("useTimetablelyScheduler — initial state", () => {
    it("exposes gridState and the three action functions", () => {
        const { result } = renderHook(() => useTimetablelyScheduler());
        expect(result.current.gridState).toBeDefined();
        expect(typeof result.current.generateTimetable).toBe("function");
        expect(typeof result.current.clearTimetable).toBe("function");
        expect(typeof result.current.exportData).toBe("function");
    });
});

describe("useTimetablelyScheduler — generateTimetable", () => {
    it("warns and does nothing when no database is provided", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { result } = renderHook(() => useTimetablelyScheduler());
        act(() => result.current.generateTimetable());
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("no database provided"));
        expect(result.current.gridState.cellContents.size).toBe(0);
        warn.mockRestore();
    });

    it("warns and does nothing when database has no courses", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const db = makeDatabase({ courses: [] });
        const { result } = renderHook(() => useTimetablelyScheduler(db));
        act(() => result.current.generateTimetable());
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("no courses"));
        warn.mockRestore();
    });

    it("populates cellContents when a valid database is provided", () => {
        const db = makeDatabase();
        const { result } = renderHook(() => useTimetablelyScheduler(db));
        act(() => result.current.generateTimetable());
        expect(result.current.gridState.cellContents.size).toBeGreaterThan(0);
    });
});

describe("useTimetablelyScheduler — clearTimetable", () => {
    it("empties cellContents after generation", () => {
        const db = makeDatabase();
        const { result } = renderHook(() => useTimetablelyScheduler(db));
        act(() => result.current.generateTimetable());
        expect(result.current.gridState.cellContents.size).toBeGreaterThan(0);
        act(() => result.current.clearTimetable());
        expect(result.current.gridState.cellContents.size).toBe(0);
    });
});

describe("useTimetablelyScheduler — exportData", () => {
    it("returns an array with 5 * columnCount entries on empty grid", () => {
        const { result } = renderHook(() => useTimetablelyScheduler());
        let entries: ReturnType<typeof result.current.exportData>;
        act(() => { entries = result.current.exportData(); });
        const expected = 5 * result.current.gridState.columnCount;
        expect(entries!).toHaveLength(expected);
    });

    it("exported entries have correct day labels", () => {
        const { result } = renderHook(() => useTimetablelyScheduler());
        let entries: ReturnType<typeof result.current.exportData>;
        act(() => { entries = result.current.exportData(); });
        const days = [...new Set(entries!.map((e) => e.day))];
        expect(days).toEqual(
            expect.arrayContaining(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
        );
    });
});
