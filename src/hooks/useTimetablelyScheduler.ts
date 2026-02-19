import { useCallback } from "react";
import { useGridState } from "./useGridState";
import type { ITimetableDatabase } from "../types/database";
import type { ICellContent } from "../types/grid";
import { generateAutomatedTimetable, extractTimetableData } from "../lib/timetable";

export const useTimetablelyScheduler = (database?: ITimetableDatabase) => {
    const gridState = useGridState();

    const generateTimetable = useCallback(
        (sessionId?: string) => {
            if (!database) {
                console.warn("useTimetablelyScheduler: no database provided — cannot auto-generate");
                return;
            }
            if (database.courses.length === 0) {
                console.warn("useTimetablelyScheduler: database has no courses");
                return;
            }
            const newCellContents = generateAutomatedTimetable(
                database,
                gridState.columnCount,
                gridState.cellContents,
                gridState.hiddenCells,
                sessionId,
            );
            gridState.setAllCellContents(newCellContents);
        },
        [database, gridState],
    );

    const clearTimetable = useCallback(() => {
        gridState.setAllCellContents(new Map<string, ICellContent>());
    }, [gridState]);

    const exportData = useCallback(() => {
        return extractTimetableData(
            gridState.cellContents,
            gridState.hiddenCells,
            gridState.columnCount,
            gridState.columnDurations,
            gridState.defaultSlotDuration,
            gridState.mergedCells,
        );
    }, [gridState]);

    return {
        gridState,
        generateTimetable,
        clearTimetable,
        exportData,
    };
};
