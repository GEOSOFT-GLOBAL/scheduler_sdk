// CSS is imported at the package level — consumers import '@geo-soft/timetablely-sdk/styles'
// Do NOT import CSS here; let the consumer's bundler handle it.

// ─── Core ────────────────────────────────────────────────────────────────────
export {
    TimetablelyProvider,
    useTimetablelyContext,
} from "./core/TimetablelyProvider";
export type {
    TimetablelyProviderProps,
    TimetablelyProviderLocalProps,
    TimetablelyProviderApiProps,
    TimetablelyContextValue,
} from "./core/TimetablelyProvider";

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useGridState } from "./hooks/useGridState";
export { useTimetablelyScheduler } from "./hooks/useTimetablelyScheduler";
export { useApiTimetable } from "./hooks/useApiTimetable";
export type { ApiTimetableState } from "./hooks/useApiTimetable";

// ─── Components ──────────────────────────────────────────────────────────────
export { TimetableGrid } from "./components/TimetableGrid";
export type { TimetableGridProps } from "./components/TimetableGrid";

export { TimetableControls } from "./components/TimetableControls";
export type { TimetableControlsProps } from "./components/TimetableControls";

export { GridCell } from "./components/GridCell";
export type { GridCellProps } from "./components/GridCell";

export { default as GridHeader } from "./components/GridHeader";
export type { GridHeaderProps } from "./components/GridHeader";

// Primitives (for advanced customization)
export { Popover, PopoverTrigger, PopoverContent } from "./components/primitives/Popover";
export { Button } from "./components/primitives/Button";
export { Input } from "./components/primitives/Input";

// ─── Library Utilities ────────────────────────────────────────────────────────
export {
    generateAutomatedTimetable,
    extractTimetableData,
    isCellBlocked,
} from "./lib/timetable";

export {
    generateTimeLabels,
    getCellKey,
    canMergeCells,
    minutesToTimeString,
    getColumnTimes,
} from "./lib/temputils";

export { getAlignmentClass } from "./lib/grid-helper";

export {
    dayLabels,
    GRID_SIZE,
    DEFAULT_SLOT_DURATION,
    DEFAULT_COLUMN_COUNT,
    defaultBlockedTexts,
} from "./lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
    PRIORITY,
    ALIGNMENT,
    STATUS,
} from "./types/enums";

export type {
    IMergeInfo,
    IColumnTimes,
    ICellContent,
    ICellPosition,
    IGridState,
    IGridActions,
} from "./types/grid";

export type {
    ITutor,
    ICourse,
    ISession,
    ITimetableEntry,
    ITimetableTemplate,
    ITimetableDatabase,
} from "./types/database";

export type {
    TimetableConfig,
    TimetableApiConfig,
    TimetableLocalConfig,
    SchedulerMode,
} from "./types/config";
