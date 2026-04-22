import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridState } from "../src/hooks/useGridState";
import { DEFAULT_COLUMN_COUNT, DEFAULT_SLOT_DURATION } from "../src/lib/constants";

describe("useGridState — initial state", () => {
    it("starts with empty selections and default column count", () => {
        const { result } = renderHook(() => useGridState());
        expect(result.current.selectedCells.size).toBe(0);
        expect(result.current.columnCount).toBe(DEFAULT_COLUMN_COUNT);
        expect(result.current.defaultSlotDuration).toBe(DEFAULT_SLOT_DURATION);
        expect(result.current.cellContents.size).toBe(0);
        expect(result.current.mergedCells.size).toBe(0);
        expect(result.current.hiddenCells.size).toBe(0);
    });
});

describe("useGridState — handleCellClick", () => {
    it("selects a cell on first click", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellClick(0, 0));
        expect(result.current.selectedCells.has("0-0")).toBe(true);
    });

    it("deselects an already-selected cell", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellClick(0, 0));
        act(() => result.current.handleCellClick(0, 0));
        expect(result.current.selectedCells.has("0-0")).toBe(false);
    });

    it("does not select a hidden cell", () => {
        const { result } = renderHook(() => useGridState());
        // hide cell 0-0 by merging 0-0 and 0-1 then checking 0-1 is hidden
        act(() => {
            result.current.handleCellClick(0, 0);
            result.current.handleCellClick(0, 1);
        });
        act(() => result.current.mergeCells());
        // 0-1 is now hidden; clicking it should not add it to selected
        act(() => result.current.handleCellClick(0, 1));
        expect(result.current.selectedCells.has("0-1")).toBe(false);
    });
});

describe("useGridState — handleCellDoubleClick", () => {
    it("enters editing mode for a cell", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellDoubleClick(1, 2));
        expect(result.current.editingCell).toBe("1-2");
    });

    it("does not enter editing mode for a hidden cell", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellClick(0, 0));
        act(() => result.current.handleCellClick(0, 1));
        act(() => result.current.mergeCells());
        act(() => result.current.handleCellDoubleClick(0, 1));
        expect(result.current.editingCell).toBeNull();
    });
});

describe("useGridState — mergeCells", () => {
    it("merges two horizontally adjacent selected cells", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellClick(0, 0));
        act(() => result.current.handleCellClick(0, 1));
        act(() => result.current.mergeCells());
        expect(result.current.mergedCells.has("0-0")).toBe(true);
        expect(result.current.mergedCells.get("0-0")).toEqual({ rowSpan: 1, colSpan: 2 });
        expect(result.current.hiddenCells.has("0-1")).toBe(true);
        expect(result.current.selectedCells.size).toBe(0);
    });

    it("does nothing when fewer than 2 cells are selected", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellClick(0, 0));
        act(() => result.current.mergeCells());
        expect(result.current.mergedCells.size).toBe(0);
    });

    it("does nothing for a non-rectangular selection", () => {
        const { result } = renderHook(() => useGridState());
        // Select an L-shape: (0,0), (0,1), (1,0) — missing (1,1)
        act(() => result.current.handleCellClick(0, 0));
        act(() => result.current.handleCellClick(0, 1));
        act(() => result.current.handleCellClick(1, 0));
        act(() => result.current.mergeCells());
        expect(result.current.mergedCells.size).toBe(0);
    });
});

describe("useGridState — addColumnAfter / deleteColumn", () => {
    it("increments column count when adding a column", () => {
        const { result } = renderHook(() => useGridState());
        const before = result.current.columnCount;
        act(() => result.current.addColumnAfter(0));
        expect(result.current.columnCount).toBe(before + 1);
    });

    it("decrements column count when deleting a column", () => {
        const { result } = renderHook(() => useGridState());
        const before = result.current.columnCount;
        act(() => result.current.deleteColumn(0));
        expect(result.current.columnCount).toBe(before - 1);
    });

    it("does not delete when only one column remains", () => {
        const { result } = renderHook(() => useGridState());
        // reduce to 1 column
        for (let i = 0; i < DEFAULT_COLUMN_COUNT - 1; i++) {
            act(() => result.current.deleteColumn(0));
        }
        expect(result.current.columnCount).toBe(1);
        act(() => result.current.deleteColumn(0));
        expect(result.current.columnCount).toBe(1);
    });
});

describe("useGridState — cell editing", () => {
    it("saves non-empty cell text", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellDoubleClick(0, 0));
        act(() => result.current.setTempCellText("Math"));
        act(() => result.current.saveCellEdit());
        expect(result.current.cellContents.get("0-0")?.text).toBe("Math");
        expect(result.current.editingCell).toBeNull();
    });

    it("removes cell content when saving empty text", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellDoubleClick(0, 0));
        act(() => result.current.setTempCellText("Math"));
        act(() => result.current.saveCellEdit());
        // Now edit again and clear
        act(() => result.current.handleCellDoubleClick(0, 0));
        act(() => result.current.setTempCellText("   "));
        act(() => result.current.saveCellEdit());
        expect(result.current.cellContents.has("0-0")).toBe(false);
    });

    it("cancels cell edit without changing content", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.handleCellDoubleClick(0, 0));
        act(() => result.current.setTempCellText("Physics"));
        act(() => result.current.cancelCellEdit());
        expect(result.current.cellContents.has("0-0")).toBe(false);
        expect(result.current.editingCell).toBeNull();
    });
});

describe("useGridState — resetGrid", () => {
    it("resets all state to defaults", () => {
        const { result } = renderHook(() => useGridState());
        act(() => {
            result.current.handleCellClick(0, 0);
            result.current.handleCellDoubleClick(1, 1);
        });
        act(() => result.current.resetGrid());
        expect(result.current.selectedCells.size).toBe(0);
        expect(result.current.columnCount).toBe(DEFAULT_COLUMN_COUNT);
        expect(result.current.cellContents.size).toBe(0);
        expect(result.current.editingCell).toBeNull();
    });
});

describe("useGridState — setCellAlignment / toggleCellVertical", () => {
    it("sets cell alignment", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.setCellAlignment("0-0", "right"));
        expect(result.current.cellContents.get("0-0")?.alignment).toBe("right");
    });

    it("toggles cell vertical", () => {
        const { result } = renderHook(() => useGridState());
        act(() => result.current.toggleCellVertical("0-0"));
        expect(result.current.cellContents.get("0-0")?.isVertical).toBe(true);
        act(() => result.current.toggleCellVertical("0-0"));
        expect(result.current.cellContents.get("0-0")?.isVertical).toBe(false);
    });
});
