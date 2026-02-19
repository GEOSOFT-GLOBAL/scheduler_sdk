import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "destructive";
    size?: "default" | "sm" | "icon";
    children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
        const variantClass = `ttly-btn-${variant}`;
        const sizeClass = `ttly-btn-${size}`;
        return (
            <button
                ref={ref}
                className={`ttly-btn ${variantClass} ${sizeClass} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";
