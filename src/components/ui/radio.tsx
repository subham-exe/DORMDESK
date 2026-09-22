import React from "react";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = "", error, ...props }, ref) => {
    const baseClass = "h-5 w-5 rounded-full border bg-surface text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:border-primary transition-colors";
    const borderClass = error ? "border-error focus-visible:ring-error" : "border-border";
    
    return (
      <div className="relative inline-flex items-center">
        <input
          type="radio"
          className={`${baseClass} ${borderClass} ${className}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Radio.displayName = "Radio";
