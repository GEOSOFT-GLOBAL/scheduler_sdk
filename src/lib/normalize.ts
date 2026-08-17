import { PRIORITY } from "../types/enums";
import { defaultBlockedTexts, GRID_SIZE } from "./constants";
import type {
    ICourse,
    ISession,
    ITutor,
    ITimetableDatabase,
    ITimetableEntry,
    ITimetableTemplate,
} from "../types/database";

/**
 * Server records into SDK records.
 *
 * Mongo hands back `_id`, lowercase enums, and references that are sometimes
 * populated documents and sometimes bare id strings depending on the query.
 * The SDK's types predate all of that and are what the grid, the generator,
 * and every consumer already read. Rather than leak Mongo's shape into public
 * types, this file is the one place the two meet.
 */

/** What `GET /timetablely/sync/data` returns, before any of this runs. */
export interface ServerTimetableData {
    timetables?: ServerTimetable[];
    templates?: ServerTemplate[];
    tutors?: ServerTutor[];
    courses?: ServerCourse[];
    sessions?: ServerSession[];
    specialBlocks?: ServerSpecialBlock[];
}

export interface ServerAvailability {
    day: number;
    slot: number;
    available: boolean;
}

export interface ServerTutor {
    _id: string;
    name: string;
    email?: string;
    maxPeriodsPerDay?: number;
    availability?: ServerAvailability[];
    preferredSlots?: number[];
    color?: string;
}

/** `tutorId` is a populated tutor when the query asked for one, else an id. */
export type ServerRef<T> = string | ({ _id: string } & Partial<T>);

export interface ServerCourse {
    _id: string;
    name: string;
    code?: string;
    tutorId: ServerRef<ServerTutor>;
    periodsPerWeek: number;
    priority?: "high" | "medium" | "low";
    color?: string;
    requiresLab?: boolean;
    notes?: string;
}

export interface ServerSession {
    _id: string;
    name: string;
    description?: string;
    studentCount?: number;
    room?: string;
    subjects?: ServerRef<ServerCourse>[];
}

export interface ServerCell {
    row: number;
    col: number;
    content: string;
    backgroundColor?: string;
    textAlign?: "left" | "center" | "right";
    textOrientation?: "horizontal" | "vertical";
    isMerged?: boolean;
    mergeSpan?: { rows: number; cols: number };
    isHidden?: boolean;
}

export interface ServerColumn {
    index: number;
    duration: number;
}

export interface ServerTemplate {
    _id: string;
    name: string;
    description?: string;
    columnCount: number;
    defaultSlotDuration: number;
    columns?: ServerColumn[];
    cells?: ServerCell[];
    createdAt?: string;
}

export interface ServerTimetable extends ServerTemplate {
    sessionId?: ServerRef<ServerSession>;
    startTime?: string;
    isGenerated?: boolean;
    generatedAt?: string;
    generationType?: "standard" | "ai";
}

export interface ServerSpecialBlock {
    _id: string;
    name: string;
    type?: string;
    /** Absent means the block repeats on every day of the week. */
    day?: number;
    slot: number;
    duration?: number;
    color?: string;
}

/** Unwraps a reference whether the server populated it or not. */
export const refId = <T>(ref: ServerRef<T> | undefined | null): string => {
    if (!ref) return "";
    return typeof ref === "string" ? ref : ref._id;
};

const toPriority = (value: ServerCourse["priority"]): PRIORITY => {
    switch (value) {
        case "high":
            return PRIORITY.HIGH;
        case "low":
            return PRIORITY.LOW;
        default:
            return PRIORITY.MEDIUM;
    }
};

const cellKey = (row: number, col: number) => `${row}-${col}`;

/**
 * A tutor's unavailability, as cell keys.
 *
 * The server stores availability positively — a row per slot, with a flag.
 * The generator asks the opposite question ("where can this tutor not go"), so
 * only the false entries survive the trip.
 */
const unavailableSlotsFrom = (availability?: ServerAvailability[]): string[] =>
    (availability ?? [])
        .filter((entry) => entry.available === false)
        .map((entry) => cellKey(entry.day, entry.slot));

export const normalizeTutor = (
    tutor: ServerTutor,
    courses: ServerCourse[] = [],
): ITutor => ({
    id: tutor._id,
    name: tutor.name,
    email: tutor.email,
    // The server models this edge only from the course side, so the tutor's
    // list is derived rather than stored — otherwise the two could disagree.
    subjects: courses
        .filter((course) => refId(course.tutorId) === tutor._id)
        .map((course) => course._id),
    maxPeriodsPerDay: tutor.maxPeriodsPerDay,
    unavailableSlots: unavailableSlotsFrom(tutor.availability),
});

export const normalizeCourse = (course: ServerCourse): ICourse => ({
    id: course._id,
    name: course.name,
    teacherId: refId(course.tutorId),
    periodsPerWeek: course.periodsPerWeek,
    priority: toPriority(course.priority),
});

export const normalizeSession = (session: ServerSession): ISession => ({
    id: session._id,
    name: session.name,
    // Always an array. The generator calls `.includes` on it, so an absent
    // field here would be a crash at generation time rather than a gap.
    subjects: (session.subjects ?? []).map(refId).filter(Boolean),
});

/**
 * Template cells back into timetable entries.
 *
 * `day` and `timeSlot` are labels the SDK computes from the grid rather than
 * values the server stores, so they stay empty here and are filled in when a
 * template is applied to a grid that knows its own durations.
 */
const entriesFrom = (cells: ServerCell[] = []): ITimetableEntry[] =>
    cells.map((cell) => ({
        row: cell.row,
        col: cell.col,
        day: "",
        timeSlot: "",
        cellKey: cellKey(cell.row, cell.col),
        customText: cell.content,
        isVertical: cell.textOrientation === "vertical",
        alignment: cell.textAlign,
    }));

const columnDurationsFrom = (
    columns: ServerColumn[] = [],
): { [key: number]: number } =>
    columns.reduce<{ [key: number]: number }>((durations, column) => {
        durations[column.index] = column.duration;
        return durations;
    }, {});

export const normalizeTemplate = (
    template: ServerTemplate,
): ITimetableTemplate => ({
    id: template._id,
    name: template.name,
    description: template.description,
    createdAt: template.createdAt,
    columnCount: template.columnCount,
    defaultSlotDuration: template.defaultSlotDuration,
    columnDurations: columnDurationsFrom(template.columns),
    entries: entriesFrom(template.cells),
    hiddenCellsArray: (template.cells ?? [])
        .filter((cell) => cell.isHidden)
        .map((cell) => cellKey(cell.row, cell.col)),
    mergedCellsData: (template.cells ?? [])
        .filter((cell) => cell.isMerged && cell.mergeSpan)
        .reduce<{ [key: string]: unknown }>((merged, cell) => {
            merged[cellKey(cell.row, cell.col)] = {
                rowSpan: cell.mergeSpan!.rows,
                colSpan: cell.mergeSpan!.cols,
            };
            return merged;
        }, {}),
});

/**
 * Special blocks into the two things generation needs from them.
 *
 * A block with no `day` repeats across the week, so it expands to one key per
 * day. The names join the blocked-text list so a cell a person typed "Lunch"
 * into is respected the same way a configured block is.
 */
const blockedFrom = (
    blocks: ServerSpecialBlock[] = [],
): { blockedSlots: string[]; blockedTexts: string[] } => {
    const blockedSlots: string[] = [];

    for (const block of blocks) {
        const days =
            block.day === undefined
                ? Array.from({ length: GRID_SIZE }, (_, day) => day)
                : [block.day];

        for (const day of days) blockedSlots.push(cellKey(day, block.slot));
    }

    const names = blocks.map((block) => block.name.toLowerCase().trim());

    return {
        blockedSlots: Array.from(new Set(blockedSlots)),
        blockedTexts: Array.from(new Set([...defaultBlockedTexts, ...names])),
    };
};

/** The whole payload, in the shape the grid and generator already read. */
export const normalizeDatabase = (
    data: ServerTimetableData,
): ITimetableDatabase => {
    const courses = data.courses ?? [];
    const { blockedSlots, blockedTexts } = blockedFrom(data.specialBlocks);

    return {
        tutors: (data.tutors ?? []).map((tutor) => normalizeTutor(tutor, courses)),
        courses: courses.map(normalizeCourse),
        sessions: (data.sessions ?? []).map(normalizeSession),
        blockedSlots,
        blockedTexts,
        templates: (data.templates ?? []).map(normalizeTemplate),
    };
};

/**
 * SDK records back into what `POST /timetablely/sync` accepts.
 *
 * Only the fields the server owns are sent. Derived ones — a tutor's course
 * list, a template's day labels — are left out rather than sent back as
 * though the client were authoritative about them.
 */
export const toSyncPayload = (database: ITimetableDatabase) => ({
    tutors: database.tutors.map((tutor) => ({
        _id: tutor.id || undefined,
        name: tutor.name,
        email: tutor.email,
        maxPeriodsPerDay: tutor.maxPeriodsPerDay ?? 6,
        availability: (tutor.unavailableSlots ?? []).map((key) => {
            const [day, slot] = key.split("-").map(Number);
            return { day, slot, available: false };
        }),
    })),
    courses: database.courses.map((course) => ({
        _id: course.id || undefined,
        name: course.name,
        tutorId: course.teacherId,
        periodsPerWeek: course.periodsPerWeek,
        priority: course.priority.toLowerCase() as "high" | "medium" | "low",
    })),
    sessions: database.sessions.map((session) => ({
        _id: session.id || undefined,
        name: session.name,
        subjects: session.subjects,
    })),
});
