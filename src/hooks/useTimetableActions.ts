import { useTimetablelyContext } from "../core/TimetablelyProvider";

export const useTimetableActions = () => {
  const { gridState } = useTimetablelyContext();

  return {
    resetGrid: gridState.resetGrid,
    mergeCells: gridState.mergeCells,
    setCellAlignment: gridState.setCellAlignment,
    toggleCellVertical: gridState.toggleCellVertical,
    setCellBackgroundColor: gridState.setCellBackgroundColor,
  };
};
