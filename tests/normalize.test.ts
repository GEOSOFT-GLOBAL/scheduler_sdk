import { describe, it, expect } from "vitest";
import {
    normalizeDatabase,
    normalizeSession,
    normalizeTemplate,
    normalizeTutor,
    refId,
    toSyncPayload,
} from "../src/lib/normalize";
import { PRIORITY } from "../src/types/enums";
import { defaultBlockedTexts } from "../src/lib/constants";
import type { ServerCourse, ServerTimetableData } from "../src/lib/normalize";

describe("refId", () => {
    it("reads an id whether the reference was populated or not", () => {
        expect(refId("abc")).toBe("abc");
        expect(refId({ _id: "abc", name: "Populated" })).toBe("abc");
    });

    it("is empty for a missing reference rather than throwing", () => {
        expect(refId(undefined)).toBe("");
        expect(refId(null)).toBe("");
    });
});

describe("normalizeTutor", () => {
    const courses: ServerCourse[] = [
        { _id: "c1", name: "Math", tutorId: "t1", periodsPerWeek: 4 },
        { _id: "c2", name: "Art", tutorId: { _id: "t2" }, periodsPerWeek: 2 },
        { _id: "c3", name: "Physics", tutorId: "t1", periodsPerWeek: 3 },
    ];

    it("derives the tutor's courses from the course side of the edge", () => {
        const tutor = normalizeTutor({ _id: "t1", name: "Smith" }, courses);
        expect(tutor.subjects).toEqual(["c1", "c3"]);
    });

    it("keeps only the slots the tutor is unavailable for", () => {
        const tutor = normalizeTutor(
            {
                _id: "t1",
                name: "Smith",
                availability: [
                    { day: 0, slot: 1, available: true },
                    { day: 2, slot: 3, available: false },
                    { day: 4, slot: 0, available: false },
                ],
            },
            [],
        );

        expect(tutor.unavailableSlots).toEqual(["2-3", "4-0"]);
    });
});

describe("normalizeSession", () => {
    it("always produces an array of subjects", () => {
        // The generator calls .includes on this, so an absent field would be a
        // crash rather than an empty result.
        expect(normalizeSession({ _id: "s1", name: "1A" }).subjects).toEqual([]);
    });

    it("flattens populated course references", () => {
        const session = normalizeSession({
            _id: "s1",
            name: "1A",
            subjects: ["c1", { _id: "c2", name: "Art" }],
        });
        expect(session.subjects).toEqual(["c1", "c2"]);
    });
});

describe("normalizeDatabase — priorities", () => {
    it("maps the server's lowercase priorities onto the enum", () => {
        const database = normalizeDatabase({
            courses: [
                { _id: "c1", name: "A", tutorId: "t1", periodsPerWeek: 1, priority: "high" },
                { _id: "c2", name: "B", tutorId: "t1", periodsPerWeek: 1, priority: "low" },
                { _id: "c3", name: "C", tutorId: "t1", periodsPerWeek: 1 },
            ],
        });

        expect(database.courses.map((course) => course.priority)).toEqual([
            PRIORITY.HIGH,
            PRIORITY.LOW,
            PRIORITY.MEDIUM,
        ]);
    });
});

describe("normalizeDatabase — special blocks", () => {
    it("expands a day-less block across the whole week", () => {
        const database = normalizeDatabase({
            specialBlocks: [{ _id: "b1", name: "Lunch", slot: 4 }],
        });

        expect(database.blockedSlots).toEqual(["0-4", "1-4", "2-4", "3-4", "4-4"]);
    });

    it("pins a block with a day to that day alone", () => {
        const database = normalizeDatabase({
            specialBlocks: [{ _id: "b1", name: "Assembly", day: 0, slot: 0 }],
        });

        expect(database.blockedSlots).toEqual(["0-0"]);
    });

    it("adds block names to the blocked texts without losing the defaults", () => {
        const database = normalizeDatabase({
            specialBlocks: [{ _id: "b1", name: "Silent Reading", slot: 2 }],
        });

        expect(database.blockedTexts).toContain("silent reading");
        for (const text of defaultBlockedTexts) {
            expect(database.blockedTexts).toContain(text);
        }
    });
});

describe("normalizeTemplate", () => {
    it("turns columns into durations keyed by index", () => {
        const template = normalizeTemplate({
            _id: "tpl1",
            name: "Standard",
            columnCount: 2,
            defaultSlotDuration: 45,
            columns: [
                { index: 0, duration: 30 },
                { index: 1, duration: 60 },
            ],
        });

        expect(template.columnDurations).toEqual({ 0: 30, 1: 60 });
    });

    it("separates hidden and merged cells out of the cell list", () => {
        const template = normalizeTemplate({
            _id: "tpl1",
            name: "Standard",
            columnCount: 3,
            defaultSlotDuration: 45,
            cells: [
                { row: 0, col: 0, content: "Math", isMerged: true, mergeSpan: { rows: 1, cols: 2 } },
                { row: 0, col: 1, content: "", isHidden: true },
                { row: 1, col: 0, content: "Art", textOrientation: "vertical" },
            ],
        });

        expect(template.hiddenCellsArray).toEqual(["0-1"]);
        expect(template.mergedCellsData).toEqual({
            "0-0": { rowSpan: 1, colSpan: 2 },
        });
        expect(template.entries[2]).toMatchObject({
            cellKey: "1-0",
            customText: "Art",
            isVertical: true,
        });
    });
});

describe("normalizeDatabase — empty payload", () => {
    it("produces a usable database rather than undefined fields", () => {
        const database = normalizeDatabase({} as ServerTimetableData);

        expect(database.tutors).toEqual([]);
        expect(database.courses).toEqual([]);
        expect(database.sessions).toEqual([]);
        expect(database.templates).toEqual([]);
        expect(database.blockedSlots).toEqual([]);
        expect(database.blockedTexts).toEqual(defaultBlockedTexts);
    });
});

describe("toSyncPayload", () => {
    it("sends back what the server owns, in the server's shape", () => {
        const payload = toSyncPayload({
            tutors: [
                {
                    id: "t1",
                    name: "Smith",
                    subjects: ["c1"],
                    maxPeriodsPerDay: 4,
                    unavailableSlots: ["2-3"],
                },
            ],
            courses: [
                {
                    id: "c1",
                    name: "Math",
                    teacherId: "t1",
                    periodsPerWeek: 5,
                    priority: PRIORITY.HIGH,
                },
            ],
            sessions: [{ id: "s1", name: "1A", subjects: ["c1"] }],
            blockedSlots: [],
            blockedTexts: [],
        });

        expect(payload.tutors[0]).toEqual({
            _id: "t1",
            name: "Smith",
            email: undefined,
            maxPeriodsPerDay: 4,
            availability: [{ day: 2, slot: 3, available: false }],
        });
        expect(payload.courses[0]).toMatchObject({
            tutorId: "t1",
            priority: "high",
        });
        expect(payload.sessions[0].subjects).toEqual(["c1"]);
    });

    it("omits ids for records the server has not seen yet", () => {
        const payload = toSyncPayload({
            tutors: [{ id: "", name: "New", subjects: [] }],
            courses: [],
            sessions: [],
            blockedSlots: [],
            blockedTexts: [],
        });

        expect(payload.tutors[0]._id).toBeUndefined();
    });
});
