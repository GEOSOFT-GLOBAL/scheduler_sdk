import * as React from "react";
import type { ICellContent, IMergeInfo } from "../types/grid";
import { getAlignmentClass } from "../lib/grid-helper";
import { Popover, PopoverContent, PopoverTrigger } from "./primitives/Popover";

export interface GridCellProps {
    row: number;
    col: number;
    cellKey: string;
    isSelected: boolean;
    isColumnHovered: boolean;
    mergeInfo?: IMergeInfo;
    hiddenCells: Set<string>;
    cellContent?: ICellContent;
    editingCell: string | null;
    tempCellText: string;
    onCellClick: (row: number, col: number) => void;
    onCellDoubleClick: (row: number, col: number) => void;
    onTempCellTextChange: (text: string) => void;
    onSaveCellEdit: () => void;
    onCancelCellEdit: () => void;
    onToggleCellVertical: (cellKey: string) => void;
    onSetCellAlignment: (cellKey: string, alignment: "left" | "center" | "right") => void;
    onSetCellBackgroundColor: (cellKey: string, color: string) => void;
}

// Inline SVG icons (no lucide-react dependency)
const MoreVerticalIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
);
const RotateCcwIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
);
const AlignLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line x1="17" x2="3" y1="18" y2="18" />
    </svg>
);
const AlignCenterIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" x2="3" y1="6" y2="6" /><line x1="17" x2="7" y1="12" y2="12" /><line x1="19" x2="5" y1="18" y2="18" />
    </svg>
);
const AlignRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" x2="3" y1="6" y2="6" /><line x1="21" x2="9" y1="12" y2="12" /><line x1="21" x2="7" y1="18" y2="18" />
    </svg>
);
const PaletteIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.477-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
);

const PRESET_COLORS = [
    "#ffffff", "#f3f4f6", "#fef3c7", "#fecaca", "#fed7aa",
    "#d1fae5", "#bfdbfe", "#ddd6fe", "#fbcfe8", "#fce7f3",
];

export const GridCell: React.FC<GridCellProps> = ({
    row,
    col,
    cellKey,
    isSelected,
    isColumnHovered,
    mergeInfo,
    hiddenCells,
    cellContent,
    editingCell,
    tempCellText,
    onCellClick,
    onCellDoubleClick,
    onTempCellTextChange,
    onSaveCellEdit,
    onCancelCellEdit,
    onToggleCellVertical,
    onSetCellAlignment,
    onSetCellBackgroundColor,
}) => {
    const [showCellMenu, setShowCellMenu] = React.useState(false);

    if (hiddenCells.has(cellKey)) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSaveCellEdit();
        }
        if (e.key === "Escape") onCancelCellEdit();
    };

    const hasContent = cellContent && cellContent.text.trim();
    const alignmentClass = getAlignmentClass(cellContent?.alignment || "center");
    const backgroundColor = cellContent?.backgroundColor;
    const isEditing = editingCell === cellKey;

    const getCellClass = () => {
        const classes = ["ttly-cell"];
        if (isEditing) classes.push("ttly-cell--editing");
        else if (isSelected) classes.push("ttly-cell--selected");
        else if (mergeInfo) classes.push("ttly-cell--merged");
        else if (isColumnHovered && !backgroundColor) classes.push("ttly-cell--hovered");
        if (!backgroundColor) classes.push("ttly-cell--no-bg");
        if (isSelected) classes.push("ttly-cell--selected-border");
        if (mergeInfo) classes.push("ttly-cell--merged-border");
        if (isEditing) classes.push("ttly-cell--editing-border");
        return classes.join(" ");
    };

    return (
        <td
            className={getCellClass()}
            style={{
                backgroundColor:
                    backgroundColor && !isEditing && !isSelected && !mergeInfo
                        ? backgroundColor
                        : undefined,
            }}
            rowSpan={mergeInfo?.rowSpan || 1}
            colSpan={mergeInfo?.colSpan || 1}
            onClick={() => onCellClick(row, col)}
            onDoubleClick={() => onCellDoubleClick(row, col)}
        >
            <div className="ttly-cell__inner">
                {isEditing ? (
                    <textarea
                        value={tempCellText}
                        onChange={(e) => onTempCellTextChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={onSaveCellEdit}
                        className="ttly-cell__textarea"
                        autoFocus
                        placeholder="Enter text..."
                    />
                ) : (
                    <>
                        {hasContent ? (
                            <div
                                className={`ttly-cell__content ${alignmentClass}`}
                                style={{
                                    transform: cellContent.isVertical ? "rotate(90deg)" : "none",
                                    transformOrigin: "center",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <div
                                    className="ttly-cell__text"
                                    style={{ maxWidth: cellContent.isVertical ? "20px" : "100%" }}
                                >
                                    {cellContent.text.split("\n").map((line, index) => {
                                        if (line.startsWith("(") && line.endsWith(")")) {
                                            return (
                                                <div key={index} className="ttly-cell__text--tutor">
                                                    {line}
                                                </div>
                                            );
                                        }
                                        return <div key={index}>{line}</div>;
                                    })}
                                </div>
                            </div>
                        ) : (
                            <span className="ttly-cell__placeholder">
                                {mergeInfo ? `${mergeInfo.rowSpan}×${mergeInfo.colSpan}` : `${row},${col}`}
                            </span>
                        )}

                        {(hasContent || isSelected) && (
                            <div className="ttly-cell__menu-trigger">
                                <Popover open={showCellMenu} onOpenChange={setShowCellMenu}>
                                    <PopoverTrigger asChild>
                                        <button
                                            className="ttly-cell__menu-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCellMenu(!showCellMenu);
                                            }}
                                        >
                                            <MoreVerticalIcon />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="ttly-cell-menu" align="center" sideOffset={5}>
                                        <div className="ttly-cell-menu__list">
                                            <button
                                                onClick={() => { onCellDoubleClick(row, col); setShowCellMenu(false); }}
                                                className="ttly-cell-menu__item"
                                            >
                                                <span>✏️</span> Edit Text
                                            </button>
                                            <button
                                                onClick={() => { onToggleCellVertical(cellKey); setShowCellMenu(false); }}
                                                className="ttly-cell-menu__item"
                                            >
                                                <RotateCcwIcon />
                                                {cellContent?.isVertical ? "Horizontal" : "Vertical"}
                                            </button>

                                            <div className="ttly-cell-menu__divider" />
                                            <div className="ttly-cell-menu__label">Alignment</div>

                                            {(["left", "center", "right"] as const).map((align) => (
                                                <button
                                                    key={align}
                                                    onClick={() => { onSetCellAlignment(cellKey, align); setShowCellMenu(false); }}
                                                    className={`ttly-cell-menu__item ${cellContent?.alignment === align ? "ttly-cell-menu__item--active" : ""}`}
                                                >
                                                    {align === "left" ? <AlignLeftIcon /> : align === "center" ? <AlignCenterIcon /> : <AlignRightIcon />}
                                                    {align.charAt(0).toUpperCase() + align.slice(1)}
                                                </button>
                                            ))}

                                            <div className="ttly-cell-menu__divider" />
                                            <div className="ttly-cell-menu__label">
                                                <PaletteIcon /> Background Color
                                            </div>
                                            <div className="ttly-cell-menu__colors">
                                                <div className="ttly-cell-menu__color-row">
                                                    <label className="ttly-cell-menu__color-label">Custom:</label>
                                                    <input
                                                        type="color"
                                                        value={cellContent?.backgroundColor || "#ffffff"}
                                                        onChange={(e) => { e.stopPropagation(); onSetCellBackgroundColor(cellKey, e.target.value); }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="ttly-cell-menu__color-input"
                                                    />
                                                </div>
                                                <div className="ttly-cell-menu__color-grid">
                                                    {PRESET_COLORS.map((color) => (
                                                        <button
                                                            key={color}
                                                            onClick={(e) => { e.stopPropagation(); onSetCellBackgroundColor(cellKey, color); }}
                                                            className="ttly-cell-menu__color-swatch"
                                                            style={{ backgroundColor: color }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSetCellBackgroundColor(cellKey, ""); setShowCellMenu(false); }}
                                                    className="ttly-cell-menu__clear-color"
                                                >
                                                    Clear Color
                                                </button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </>
                )}
            </div>
        </td>
    );
};
