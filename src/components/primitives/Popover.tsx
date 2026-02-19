import React, { useState, useRef, useEffect } from "react";

export interface PopoverProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export interface PopoverTriggerProps {
    asChild?: boolean;
    children: React.ReactElement;
    onClick?: (e: React.MouseEvent) => void;
}

export interface PopoverContentProps {
    children: React.ReactNode;
    className?: string;
    align?: "start" | "center" | "end";
    sideOffset?: number;
    style?: React.CSSProperties;
}

const PopoverContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLElement | null>;
} | null>(null);

export const Popover: React.FC<PopoverProps> = ({ open: controlledOpen, onOpenChange, children }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const triggerRef = useRef<HTMLElement | null>(null);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        setInternalOpen(val);
        onOpenChange?.(val);
    };

    return (
        <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
            <div style={{ position: "relative", display: "inline-block" }}>
                {children}
            </div>
        </PopoverContext.Provider>
    );
};

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, asChild }) => {
    const ctx = React.useContext(PopoverContext);
    if (!ctx) return children;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        ctx.setOpen(!ctx.open);
        children.props.onClick?.(e);
    };

    if (asChild) {
        return React.cloneElement(children, {
            ref: ctx.triggerRef,
            onClick: handleClick,
        });
    }

    return (
        <button ref={ctx.triggerRef as React.RefObject<HTMLButtonElement>} onClick={handleClick}>
            {children}
        </button>
    );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({
    children,
    className = "",
    align = "center",
    sideOffset = 4,
    style,
}) => {
    const ctx = React.useContext(PopoverContext);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ctx?.open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                contentRef.current &&
                !contentRef.current.contains(event.target as Node) &&
                ctx.triggerRef.current &&
                !ctx.triggerRef.current.contains(event.target as Node)
            ) {
                ctx.setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ctx]);

    if (!ctx?.open) return null;

    const translateX =
        align === "start" ? "0%" : align === "end" ? "-100%" : "-50%";
    const leftPosition = align === "start" ? "0" : align === "end" ? "100%" : "50%";

    return (
        <div
            ref={contentRef}
            className={`ttly-popover-content ${className}`}
            style={{
                position: "absolute",
                top: `calc(100% + ${sideOffset}px)`,
                left: leftPosition,
                transform: `translateX(${translateX})`,
                zIndex: 9999,
                ...style,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    );
};
