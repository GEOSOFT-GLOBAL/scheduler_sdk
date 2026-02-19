import * as React from "react";
import type { IGridState, IGridActions } from "../types/grid";
import { generateTimeLabels } from "../lib/temputils";
import { dayLabels, GRID_SIZE } from "../lib/constants";
import { GridCell } from "./GridCell";
import GridHeader from "./GridHeader";

export interface TimetableGridProps {
  /** If provided, uses this grid state instead of consuming from context */
  gridState: IGridState & IGridActions;
  /** Optional title shown in the grid header bar */
  title?: string;
  className?: string;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  gridState,
  title = "Master Timetable",
  className = "",
}) => {
  const {
    selectedCells,
    mergedCells,
    hiddenCells,
    columnCount,
    hoveredColumn,
    openPopover,
    editingDuration,
    tempDuration,
    defaultSlotDuration,
    columnDurations,
    cellContents,
    editingCell,
    tempCellText,
    handleCellClick,
    handleCellDoubleClick,
    addColumnAfter,
    deleteColumn,
    startEditingDuration,
    saveDurationEdit,
    cancelDurationEdit,
    setHoveredColumn,
    setOpenPopover,
    setTempDuration,
    setTempCellText,
    toggleCellVertical,
    setCellAlignment,
    setCellBackgroundColor,
    saveCellEdit,
    cancelCellEdit,
  } = gridState;

  const timeLabels = generateTimeLabels(columnCount, columnDurations, defaultSlotDuration);

  const handleDurationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveDurationEdit();
    if (e.key === "Escape") cancelDurationEdit();
  };

  const renderHeader = (time: string, index: number) => (
    <GridHeader
      key={index}
      time={time}
      index={index}
      hoveredColumn={hoveredColumn}
      editingDuration={editingDuration}
      openPopover={openPopover}
      tempDuration={tempDuration}
      columnCount={columnCount}
      onMouseEnter={() => setHoveredColumn(index)}
      onMouseLeave={() => setHoveredColumn(null)}
      onTempDurationChange={setTempDuration}
      onKeyDown={handleDurationKeyDown}
      onBlur={saveDurationEdit}
      onOpenPopoverChange={(open) => setOpenPopover(open ? index : null)}
      onStartEditingDuration={() => startEditingDuration(index)}
      onAddColumnAfter={() => addColumnAfter(index)}
      onDeleteColumn={() => deleteColumn(index)}
    />
  );

  const renderCell = (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    const isSelected = selectedCells.has(cellKey);
    const mergeInfo = mergedCells.get(cellKey);
    const isColumnHovered = hoveredColumn === col;
    const cellContent = cellContents.get(cellKey);

    return (
      <GridCell
        key={cellKey}
        row={row}
        col={col}
        cellKey={cellKey}
        isSelected={isSelected}
        isColumnHovered={isColumnHovered}
        mergeInfo={mergeInfo}
        hiddenCells={hiddenCells}
        cellContent={cellContent}
        editingCell={editingCell}
        tempCellText={tempCellText}
        onCellClick={handleCellClick}
        onCellDoubleClick={handleCellDoubleClick}
        onTempCellTextChange={setTempCellText}
        onSaveCellEdit={saveCellEdit}
        onCancelCellEdit={cancelCellEdit}
        onToggleCellVertical={toggleCellVertical}
        onSetCellAlignment={setCellAlignment}
        onSetCellBackgroundColor={setCellBackgroundColor}
      />
    );
  };

  return (
    <div className={`ttly-grid-wrapper ${className}`}>
      <div className="ttly-grid-container">
        <div className="ttly-grid-title-bar">
          {title}
        </div>
        <div className="ttly-grid-scroll">
          <table className="ttly-table">
            <caption className="ttly-table__caption">Weekly class schedule for all subjects</caption>
            <thead>
              <tr>
                <th className="ttly-day-label-header">Time / Day</th>
                {timeLabels.map(renderHeader)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: GRID_SIZE }, (_, row) => (
                <tr key={row}>
                  <td className="ttly-day-label">
                    <div className="ttly-day-label__inner">
                      {dayLabels[row]}
                    </div>
                  </td>
                  {Array.from({ length: columnCount }, (_, col) => renderCell(row, col))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
