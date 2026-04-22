import { describe, it, expect } from "vitest";
import { isCellBlocked, extractTimetableData } from "./timetable";
import type { ICellContent } from "../types/grid";

describe("isCellBlocked", () => {
    it("returns false when cellContent is undefined", () => {
        expect(isCellBlocked(undefined, ["break"])).toBe(false);
    });

    it("returns false when cellContent has no text", () => {
        const cell = {} as ICellContent;
        expect(isCellBlocked(cell, ["break"])).toBe(false);
    });

    it("returns true when text matches a blocked word (case-insensitive)", () => {
        const cell = { text: "BREAK" } as ICellContent;
        expect(isCellBlocked(cell, ["break"])).toBe(true);
    });

    it("returns true when text contains a blocked phrase", () => {
        const cell = { text: "Morning Devotion Time" } as ICellContent;
        expect(isCellBlocked(cell, ["morning devotion"])).toBe(true);
    });

    it("returns false when text does not match any blocked word", () => {
        const cell = { text: "Mathematics" } as ICellContent;
        expect(isCellBlocked(cell, ["break", "lunch"])).toBe(false);
    });
});

describe("extractTimetableData", () => {
    const columnCount = 2;
    const columnDurations = {};
    const defaultSlotDuration = 45;

    it("returns entries for all 5 rows × columnCount cols", () => {
        const entries = extractTimetableData(
            new Map(),
            new Set(),
            columnCount,
            columnDurations,
            defaultSlotDuration,
        );
        expect(entries).toHaveLength(5 * columnCount);
    });

    it("skips hidden cells", () => {
        const hiddenCells = new Set(["0-0"]);
        const entries = extractTimetableData(
            new Map(),
            hiddenCells,
            columnCount,
            columnDurations,
            defaultSlotDuration,
        );
        expect(entries).toHaveLength(5 * columnCount - 1);
        expect(entries.find((e) => e.cellKey === "0-0")).toBeUndefined();
    });

    it("includes correct day labels", () => {
        const entries = extractTimetableData(
            new Map(),
            new Set(),
            1,
            columnDurations,
            defaultSlotDuration,
        );
        const days = entries.map((e) => e.day);
        expect(days).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    });

    it("includes customText from cellContents", () => {
        const cellContents = new Map<string, ICellContent>([
            ["2-0", { text: "Math" } as ICellContent],
        ]);
        const entries = extractTimetableData(
            cellContents,
            new Set(),
            1,
            columnDurations,
            defaultSlotDuration,
        );
        const wednesdayEntry = entries.find((e) => e.cellKey === "2-0");
        expect(wednesdayEntry?.customText).toBe("Math");
    });

    it("entry cellKey matches row-col format", () => {
        const entries = extractTimetableData(
            new Map(),
            new Set(),
            columnCount,
            columnDurations,
            defaultSlotDuration,
        );
        entries.forEach((e) => {
            expect(e.cellKey).toBe(`${e.row}-${e.col}`);
        });
    });
});
