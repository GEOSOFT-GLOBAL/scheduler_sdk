import { useTimetablelyContext } from "../core/TimetablelyProvider";

export const useTimetable = () => {
  const { gridState, database, config } = useTimetablelyContext();

  return {
    gridState,
    database,
    config,
  };
};
