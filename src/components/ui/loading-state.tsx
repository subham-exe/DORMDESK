import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function LoadingState({ text = "Loading...", className = "", ...props }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center text-text-secondary ${className}`} {...props}>
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
