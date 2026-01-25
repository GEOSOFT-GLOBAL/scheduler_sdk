import React from "react";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableCell as TimetableCellComponent } from "./TimetableCell";

export interface TimetableGridProps {
  className?: string;
  cellClassName?: string;
  onCellClick?: (cellId: string) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  className = "",
  cellClassName = "",
  onCellClick,
}) => {
  const { timetable, isLoading, error } = useTimetable();

  if (isLoading) {
    return <div className={className}>Loading timetable...</div>;
  }

  if (error) {
    return <div className={className}>Error: {error}</div>;
  }

  if (!timetable) {
    return <div className={className}>No timetable data</div>;
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const maxRow = Math.max(...timetable.cells.map((c) => c.row), 0);

  return (
    <div className={`timetable-grid ${className}`}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Time</th>
            {days.map((day, idx) => (
              <th
                key={idx}
                style={{ border: "1px solid #ddd", padding: "8px" }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRow + 1 }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                Period {rowIdx + 1}
              </td>
              {days.map((_, colIdx) => {
                const cell = timetable.cells.find(
                  (c) => c.row === rowIdx && c.col === colIdx
                );
                return (
                  <TimetableCellComponent
                    key={`${rowIdx}-${colIdx}`}
                    cell={cell}
                    className={cellClassName}
                    onClick={onCellClick}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
