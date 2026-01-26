// Enums
export enum ALIGNMENT {
  LEFT = "LEFT",
  CENTER = "CENTER",
  RIGHT = "RIGHT",
}

export enum PRIORITY {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum STATUS {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

// Core Interfaces
export interface ITutor {
  id: string;
  name: string;
  email?: string;
  subjects: string[];
  maxPeriodsPerDay?: number;
  unavailableSlots?: string[]; // cellKeys like "1-3" (row-col)
}

export interface ICourse {
  id: string;
  name: string;
  teacherId: string;
  periodsPerWeek: number;
  priority: PRIORITY;
  duration?: number; // in minutes, if different from default
  preferredSlots?: string[]; // preferred time slots
  avoidConsecutive?: boolean; // avoid back-to-back periods
}

export interface ISession {
  id: string;
  name: string; // e.g., "Class 1A", "Grade 10B"
  subjects: string[]; // IDs of subjects assigned to this class
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

export interface ITimetableCell {
  id: string;
  row: number;
  col: number;
  content: string;
  courseId?: string;
  tutorId?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  isMerged?: boolean;
  mergeSpan?: { rows: number; cols: number };
  isHidden?: boolean;
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
  blockedSlots: string[]; // for breaks, devotion, etc.
  blockedTexts: string[]; // texts to avoid when auto-generating
  templates?: ITimetableTemplate[]; // saved timetable templates
}

// SDK Configuration
export interface TimetableConfig {
  apiUrl: string;
  apiKey?: string;
  sessionId: string;
}

export interface TimeSlot {
  id: string;
  day: number; // 0-4 (Mon-Fri)
  period: number;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

export interface TimetableData {
  id: string;
  sessionId: string;
  name: string;
  columnCount: number;
  defaultSlotDuration: number;
  startTime: string;
  cells: ITimetableCell[];
  columns: Array<{ index: number; duration: number }>;
  isGenerated?: boolean;
  generatedAt?: Date;
  generationType?: "standard" | "ai";
}

// Context Value
export interface TimetableContextValue {
  config: TimetableConfig;
  timetable: TimetableData | null;
  courses: ICourse[];
  tutors: ITutor[];
  sessions: ISession[];
  isLoading: boolean;
  error: string | null;
  fetchTimetable: () => Promise<void>;
  updateCell: (cellId: string, updates: Partial<ITimetableCell>) => Promise<void>;
  generateTimetable: (type: "standard" | "ai") => Promise<void>;
  fetchCourses: () => Promise<void>;
  fetchTutors: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

// Backward compatibility aliases
export type TimetableCell = ITimetableCell;
export type Course = ICourse;
export type Tutor = ITutor;
export type Session = ISession;
