import { describe, it, expect } from "vitest";
import {
    getCellKey,
    minutesToTimeString,
    getColumnDuration,
    getColumnTimes,
    generateTimeLabels,
    canMergeCells,
} from "./temputils";

describe("getCellKey", () => {
    it("formats row and col as a dash-separated string", () => {
        expect(getCellKey(0, 0)).toBe("0-0");
        expect(getCellKey(2, 5)).toBe("2-5");
        expect(getCellKey(4, 11)).toBe("4-11");
    });
});

describe("minutesToTimeString", () => {
    it("converts whole-hour AM times", () => {
        expect(minutesToTimeString(8 * 60)).toBe("8:00 AM");
        expect(minutesToTimeString(11 * 60)).toBe("11:00 AM");
    });

    it("converts midnight (0 min) as 12:00 AM", () => {
        expect(minutesToTimeString(0)).toBe("12:00 AM");
    });

    it("converts noon as 12:00 PM", () => {
        expect(minutesToTimeString(12 * 60)).toBe("12:00 PM");
    });

    it("converts PM hours correctly", () => {
        expect(minutesToTimeString(13 * 60)).toBe("1:00 PM");
        expect(minutesToTimeString(17 * 60 + 30)).toBe("5:30 PM");
    });

    it("pads minutes with leading zero", () => {
        expect(minutesToTimeString(8 * 60 + 5)).toBe("8:05 AM");
    });
});

describe("getColumnDuration", () => {
    it("returns the override duration for a given column", () => {
        expect(getColumnDuration(2, { 2: 60 }, 45)).toBe(60);
    });

    it("falls back to defaultSlotDuration when no override exists", () => {
        expect(getColumnDuration(3, {}, 45)).toBe(45);
        expect(getColumnDuration(3, { 2: 60 }, 45)).toBe(45);
    });
});

describe("getColumnTimes", () => {
    const durations = {};
    const defaultDuration = 45;
    const base = 8 * 60; // 480

    it("first column starts at base time", () => {
        const times = getColumnTimes(0, durations, defaultDuration, base);
        expect(times.start).toBe(480);
        expect(times.end).toBe(525);
        expect(times.duration).toBe(45);
    });

    it("second column starts after first column duration", () => {
        const times = getColumnTimes(1, durations, defaultDuration, base);
        expect(times.start).toBe(525);
        expect(times.end).toBe(570);
    });

    it("respects column duration overrides for prior columns", () => {
        const times = getColumnTimes(1, { 0: 60 }, defaultDuration, base);
        expect(times.start).toBe(540); // 480 + 60
    });
});

describe("generateTimeLabels", () => {
    it("generates the correct number of labels", () => {
        const labels = generateTimeLabels(3, {}, 45, 8 * 60);
        expect(labels).toHaveLength(3);
    });

    it("first label starts at the base time", () => {
        const labels = generateTimeLabels(1, {}, 45, 8 * 60);
        expect(labels[0]).toBe("8:00 AM - 8:45 AM");
    });

    it("consecutive labels are contiguous", () => {
        const labels = generateTimeLabels(2, {}, 60, 8 * 60);
        expect(labels[0]).toBe("8:00 AM - 9:00 AM");
        expect(labels[1]).toBe("9:00 AM - 10:00 AM");
    });
});

describe("canMergeCells", () => {
    it("returns false for fewer than 2 cells", () => {
        expect(canMergeCells(new Set(["0-0"]))).toBe(false);
        expect(canMergeCells(new Set())).toBe(false);
    });

    it("returns true for two adjacent horizontal cells", () => {
        expect(canMergeCells(new Set(["0-0", "0-1"]))).toBe(true);
    });

    it("returns true for a 2x2 rectangular block", () => {
        expect(canMergeCells(new Set(["0-0", "0-1", "1-0", "1-1"]))).toBe(true);
    });

    it("returns false for non-rectangular selection", () => {
        // L-shape: (0,0), (0,1), (1,0) — missing (1,1)
        expect(canMergeCells(new Set(["0-0", "0-1", "1-0"]))).toBe(false);
    });

    it("returns false for diagonal cells", () => {
        expect(canMergeCells(new Set(["0-0", "1-1"]))).toBe(false);
    });
});
