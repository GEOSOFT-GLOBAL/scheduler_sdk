import React from "react";
import type { TimetableCell as TimetableCellType } from "../core/types";

export interface TimetableCellProps {
  cell?: TimetableCellType;
  className?: string;
  onClick?: (cellId: string) => void;
}

export const TimetableCell: React.FC<TimetableCellProps> = ({
  cell,
  className = "",
  onClick,
}) => {
  if (!cell) {
    return (
      <td
        style={{ border: "1px solid #ddd", padding: "8px" }}
        className={className}
      />
    );
  }

  const handleClick = () => {
    if (onClick && cell.id) {
      onClick(cell.id);
    }
  };

  return (
    <td
      style={{
        border: "1px solid #ddd",
        padding: "8px",
        backgroundColor: cell.backgroundColor || "transparent",
        textAlign: cell.textAlign || "left",
        cursor: onClick ? "pointer" : "default",
      }}
      className={`timetable-cell ${className}`}
      onClick={handleClick}
      rowSpan={cell.isMerged ? cell.mergeSpan?.rows : 1}
      colSpan={cell.isMerged ? cell.mergeSpan?.cols : 1}
    >
      {cell.content}
    </td>
  );
};
