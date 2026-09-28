import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "An error occurred while loading this content.", 
  onRetry,
  retryLabel = "Try again",
  className = "", 
  ...props 
}: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center animate-in fade-in-50 bg-error-bg/30 ${className}`} {...props}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-bg text-error mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-1 max-w-sm">{description}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" onClick={onRetry}>{retryLabel}</Button>
        </div>
      )}
    </div>
  );
}

