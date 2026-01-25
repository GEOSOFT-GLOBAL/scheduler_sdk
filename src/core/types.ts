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
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  tutorId: string;
  periodsPerWeek: number;
  priority: "high" | "medium" | "low";
  color?: string;
}

export interface Tutor {
  id: string;
  name: string;
  email?: string;
  maxPeriodsPerDay: number;
  availability: Array<{ day: number; slot: number; available: boolean }>;
  color?: string;
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
}

export interface TimetableContextValue {
  config: TimetableConfig;
  timetable: TimetableData | null;
  courses: Course[];
  tutors: Tutor[];
  isLoading: boolean;
  error: string | null;
  fetchTimetable: () => Promise<void>;
  updateCell: (cellId: string, updates: Partial<ITimetableCell>) => Promise<void>;
  generateTimetable: (type: "standard" | "ai") => Promise<void>;
}
