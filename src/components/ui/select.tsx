import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, ...props }, ref) => {
    // Native select for accessibility and mobile support per components.md
    const baseClass = "flex h-11 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none";
    const borderClass = error ? "border-error focus-visible:ring-error" : "border-border";
    
    return (
      <div className="relative">
        <select
          className={`${baseClass} ${borderClass} ${className}`}
          ref={ref}
          {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
