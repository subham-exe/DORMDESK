import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, type, ...props }, ref) => {
    // h-11 = 44px min touch target
    const baseClass = "flex h-11 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
    const borderClass = error ? "border-error focus-visible:ring-error" : "border-border";
    
    return (
      <input
        type={type}
        className={`${baseClass} ${borderClass} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
