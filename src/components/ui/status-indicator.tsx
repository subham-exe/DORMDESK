import React from "react";

export type StatusColor = "info" | "success" | "warning" | "error" | "default" | "offline";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusColor;
}

export function StatusIndicator({ status, className = "", ...props }: StatusIndicatorProps) {
  const colors = {
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
    default: "bg-text-secondary",
    offline: "bg-offline",
  };

  return (
    <div
      className={`inline-block h-2 w-2 rounded-full ${colors[status]} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}
