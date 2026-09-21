import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    const baseClass = "flex min-h-[80px] w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
    const borderClass = error ? "border-error focus-visible:ring-error" : "border-border";
    
    return (
      <textarea
        className={`${baseClass} ${borderClass} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
