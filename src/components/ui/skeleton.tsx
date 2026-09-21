import React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-muted border border-border/50 ${className}`}
      {...props}
    />
  );
}
