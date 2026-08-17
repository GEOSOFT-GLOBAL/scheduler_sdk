import { useTimetablelyContext } from "../core/TimetablelyProvider";

/**
 * Everything that changes something: cell formatting, merging, and — in API
 * mode — writing the database back to the server.
 */
export const useTimetableActions = () => {
  const { gridState, save } = useTimetablelyContext();

  return {
    resetGrid: gridState.resetGrid,
    mergeCells: gridState.mergeCells,
    setCellAlignment: gridState.setCellAlignment,
    toggleCellVertical: gridState.toggleCellVertical,
    setCellBackgroundColor: gridState.setCellBackgroundColor,
    /** Needs API mode and a key with the `write` scope. */
    save,
  };
};
