import React from "react";
import type { ITimetableCell as TimetableCellType } from "../core/types";

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
    return <td className={`border border-gray-300 p-2 ${className}`} />;
  }

  const handleClick = () => {
    if (onClick && cell.id) {
      onClick(cell.id);
    }
  };

  const textAlignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[cell.textAlign || "left"];

  return (
    <td
      style={{
        backgroundColor: cell.backgroundColor || "transparent",
      }}
      className={`border border-gray-300 p-2 ${textAlignClass} ${onClick ? "cursor-pointer hover:bg-gray-50" : ""} timetable-cell ${className}`}
      onClick={handleClick}
      rowSpan={cell.isMerged ? cell.mergeSpan?.rows : 1}
      colSpan={cell.isMerged ? cell.mergeSpan?.cols : 1}
    >
      {cell.content}
    </td>
  );
};
