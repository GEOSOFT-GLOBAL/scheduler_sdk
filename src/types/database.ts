import type { PRIORITY } from "./enums";

export interface ITutor {
    id: string;
    name: string;
    email?: string;
    subjects: string[];
    maxPeriodsPerDay?: number;
    /** Cell keys the tutor cannot be assigned to, e.g. "1-3" (row-col) */
    unavailableSlots?: string[];
}

export interface ICourse {
    id: string;
    name: string;
    teacherId: string;
    periodsPerWeek: number;
    priority: PRIORITY;
    /** Duration in minutes if different from default slot duration */
    duration?: number;
    /** Preferred time slot cell keys */
    preferredSlots?: string[];
    /** Avoid assigning back-to-back periods */
    avoidConsecutive?: boolean;
}

export interface ISession {
    id: string;
    /** e.g. "Class 1A", "Grade 10B" */
    name: string;
    /** IDs of courses assigned to this session/class */
    subjects: string[];
}

export interface ITimetableEntry {
    row: number;
    col: number;
    day: string;
    cellKey: string;
    teacher?: ITutor;
    subject?: ICourse;
    timeSlot: string;
    session?: ISession;
    customText?: string;
    isVertical?: boolean;
    alignment?: "left" | "center" | "right";
}

export interface ITimetableTemplate {
    id: string;
    name: string;
    createdAt?: string;
    columnCount: number;
    description?: string;
    entries: ITimetableEntry[];
    defaultSlotDuration: number;
    hiddenCellsArray?: string[];
    mergedCellsData?: { [key: string]: unknown };
    columnDurations: { [key: number]: number };
}

export interface ITimetableDatabase {
    tutors: ITutor[];
    courses: ICourse[];
    sessions: ISession[];
    /** Cell keys reserved for breaks / devotion / etc. */
    blockedSlots: string[];
    /** Text values that mark a cell as blocked during auto-generation */
    blockedTexts: string[];
    templates?: ITimetableTemplate[];
}
