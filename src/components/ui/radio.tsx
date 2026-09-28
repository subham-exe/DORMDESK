import React from "react";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = "", error, ...props }, ref) => {
    const baseClass = "h-5 w-5 rounded-full border bg-surface text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:border-primary transition-colors";
    const borderClass = error ? "border-error focus-visible:ring-error" : "border-border";
    
    return (
      <div className="relative inline-flex items-center justify-center h-11 w-11 -ml-3">
        <input
          type="radio"
          className={`peer ${baseClass} ${borderClass} ${className}`}
          ref={ref}
          {...props}
        />
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 text-text-inverse opacity-0 peer-checked:opacity-100"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" />
        </svg>
      </div>
    );
  }
);
Radio.displayName = "Radio";
