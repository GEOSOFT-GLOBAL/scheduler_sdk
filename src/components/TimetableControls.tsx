import * as React from "react";
import type { IGridState, IGridActions } from "../types/grid";
import type { ITimetableDatabase } from "../types/database";
import { generateAutomatedTimetable, extractTimetableData } from "../lib/timetable";
import { canMergeCells } from "../lib/temputils";
import { Button } from "./primitives/Button";

export interface TimetableControlsProps {
    gridState: IGridState & IGridActions;
    database?: ITimetableDatabase;
    /** The session/class ID to generate the timetable for (optional) */
    selectedSessionId?: string;
    onGenerate?: () => void;
    onClear?: () => void;
    onExport?: (data: ReturnType<typeof extractTimetableData>) => void;
}

// Inline SVG icons
const MergeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" /><rect x="8" y="18" width="8" height="4" rx="1" />
        <path d="M4 6v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6" /><path d="M4 18v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    </svg>
);
const GenerateIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M14 2.6A2 2 0 1 1 17.4 6L8.5 14.9l-3.5.6.6-3.5Z" />
    </svg>
);
const ClearIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);
const ExportIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

export const TimetableControls: React.FC<TimetableControlsProps> = ({
    gridState,
    database,
    selectedSessionId,
    onGenerate,
    onClear,
    onExport,
}) => {
    const canMerge = canMergeCells(gridState.selectedCells);

    const handleMerge = () => {
        if (canMerge) gridState.mergeCells();
    };

    const handleGenerate = () => {
        if (!database) {
            console.warn("TimetableControls: no database provided");
            return;
        }
        const newContents = generateAutomatedTimetable(
            database,
            gridState.columnCount,
            gridState.cellContents,
            gridState.hiddenCells,
            selectedSessionId,
        );
        gridState.setAllCellContents(newContents);
        onGenerate?.();
    };

    const handleClear = () => {
        gridState.resetGrid();
        onClear?.();
    };

    const handleExport = () => {
        const data = extractTimetableData(
            gridState.cellContents,
            gridState.hiddenCells,
            gridState.columnCount,
            gridState.columnDurations,
            gridState.defaultSlotDuration,
            gridState.mergedCells,
        );
        onExport?.(data);
    };

    return (
        <div className="ttly-controls">
            <div className="ttly-controls__group">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMerge}
                    disabled={!canMerge}
                    className="ttly-controls__btn"
                    title={
                        canMerge
                            ? "Merge selected cells"
                            : "Select 2+ adjacent cells to merge"
                    }
                >
                    <MergeIcon />
                    <span>Merge Cells</span>
                </Button>

                {database && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleGenerate}
                        className="ttly-controls__btn"
                        title="Auto-generate timetable from database"
                    >
                        <GenerateIcon />
                        <span>Auto-Generate</span>
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="ttly-controls__btn ttly-controls__btn--danger"
                    title="Clear all timetable data"
                >
                    <ClearIcon />
                    <span>Clear</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    className="ttly-controls__btn"
                    title="Export timetable as JSON"
                >
                    <ExportIcon />
                    <span>Export JSON</span>
                </Button>
            </div>

            {gridState.selectedCells.size > 0 && (
                <div className="ttly-controls__selection-info">
                    {gridState.selectedCells.size} cell{gridState.selectedCells.size > 1 ? "s" : ""} selected
                    {canMerge ? " — ready to merge" : ""}
                </div>
            )}
        </div>
    );
};
