import { useTimetableContext } from "../core/TimetablelyProvider";
import type { ITimetableCell } from "../core/types";

export const useTimetableActions = () => {
  const context = useTimetableContext();

  return {
    updateCell: (cellId: string, updates: Partial<ITimetableCell>) =>
      context.updateCell(cellId, updates),
    generateTimetable: (type: "standard" | "ai" = "standard") =>
      context.generateTimetable(type),
    isLoading: context.isLoading,
    error: context.error,
  };
};
