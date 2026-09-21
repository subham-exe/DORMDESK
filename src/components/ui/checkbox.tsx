import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", error, ...props }, ref) => {
    const baseClass = "h-5 w-5 rounded border bg-surface text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none flex items-center justify-center checked:bg-primary checked:border-primary transition-colors";
    const borderClass = error ? "border-error focus-visible:ring-error" : "border-border";
    
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={`${baseClass} ${borderClass} ${className}`}
          ref={ref}
          {...props}
        />
        {/* Custom checkmark using SVG overlay for checked state via sibling selector would typically go here, but for simplicity we rely on standard styling or a wrapper. Native appearance-none requires custom check icon. */}
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-inverse opacity-0 peer-checked:opacity-100 hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
