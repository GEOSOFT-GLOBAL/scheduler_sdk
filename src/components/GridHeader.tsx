import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./primitives/Popover";
import { Button } from "./primitives/Button";
import { Input } from "./primitives/Input";

export interface GridHeaderProps {
    time: string;
    index: number;
    hoveredColumn: number | null;
    editingDuration: number | null;
    openPopover: number | null;
    tempDuration: string;
    columnCount: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onTempDurationChange: (val: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onBlur: () => void;
    onOpenPopoverChange: (open: boolean) => void;
    onStartEditingDuration: () => void;
    onAddColumnAfter: () => void;
    onDeleteColumn: () => void;
}

// Inline SVG icons
const MoreVerticalIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
);

const GridHeader: React.FC<GridHeaderProps> = ({
    time,
    index,
    hoveredColumn,
    editingDuration,
    openPopover,
    tempDuration,
    columnCount,
    onMouseEnter,
    onMouseLeave,
    onTempDurationChange,
    onKeyDown,
    onBlur,
    onOpenPopoverChange,
    onStartEditingDuration,
    onAddColumnAfter,
    onDeleteColumn,
}) => {
    return (
        <th
            className={`ttly-header${hoveredColumn === index ? " ttly-header--hovered" : ""}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {editingDuration === index ? (
                <div className="ttly-header__editing">
                    <Input
                        type="number"
                        value={tempDuration}
                        onChange={(e) => onTempDurationChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        onBlur={onBlur}
                        className="ttly-header__duration-input"
                        autoFocus
                        placeholder="minutes"
                        min="5"
                        max="480"
                    />
                </div>
            ) : (
                <div className="ttly-header__time">
                    <div className="ttly-header__time-label">
                        {time.includes("-") ? (
                            <>
                                <span>{time.split("-")[0]}-</span>
                                <wbr />
                                <span>{time.split("-")[1]}</span>
                            </>
                        ) : (
                            <span>{time}</span>
                        )}
                    </div>
                </div>
            )}

            {hoveredColumn === index && editingDuration === null && (
                <div className="ttly-header__menu-trigger">
                    <Popover open={openPopover === index} onOpenChange={onOpenPopoverChange}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="ttly-header__menu-btn">
                                <MoreVerticalIcon />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="ttly-header-menu" align="center" sideOffset={5}>
                            <div className="ttly-header-menu__list">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onStartEditingDuration}
                                    className="ttly-header-menu__item"
                                >
                                    <span>✏️</span> Edit Duration
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onAddColumnAfter}
                                    className="ttly-header-menu__item"
                                >
                                    <span>➕</span> Add Column
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDeleteColumn}
                                    disabled={columnCount <= 1}
                                    className={`ttly-header-menu__item${columnCount > 1 ? " ttly-header-menu__item--destructive" : ""}`}
                                >
                                    <span>🗑️</span> Delete Column
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </th>
    );
};

export default GridHeader;
