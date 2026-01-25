import { useTimetableContext } from "../core/TimetablelyProvider";
import type { TimetableCell } from "../core/types";

export const useTimetableActions = () => {
  const context = useTimetableContext();

  return {
    updateCell: (cellId: string, updates: Partial<TimetableCell>) =>
      context.updateCell(cellId, updates),
    generateTimetable: (type: "standard" | "ai" = "standard") =>
      context.generateTimetable(type),
    isLoading: context.isLoading,
    error: context.error,
  };
};
