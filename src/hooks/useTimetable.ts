import { useEffect } from "react";
import { useTimetableContext } from "../core/TimetablelyProvider";

export const useTimetable = () => {
  const context = useTimetableContext();

  useEffect(() => {
    context.fetchTimetable();
  }, [context.fetchTimetable]);

  return {
    timetable: context.timetable,
    isLoading: context.isLoading,
    error: context.error,
    refresh: context.fetchTimetable,
  };
};
