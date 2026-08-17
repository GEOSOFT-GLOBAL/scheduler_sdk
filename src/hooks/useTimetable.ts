import { useTimetablelyContext } from "../core/TimetablelyProvider";

/**
 * The timetable the provider is holding, plus what it took to get it.
 *
 * In API mode `database` is the server's data and `isLoading` covers the first
 * read; in local mode it is whatever was passed to the provider and the
 * loading and error fields are inert.
 */
export const useTimetable = () => {
  const { gridState, database, config, isLoading, error, refresh } =
    useTimetablelyContext();

  return {
    gridState,
    database,
    config,
    isLoading,
    error,
    refresh,
  };
};
