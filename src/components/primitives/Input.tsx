import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`ttly-input ${className}`}
                {...props}
            />
        );
    },
);

Input.displayName = "Input";
