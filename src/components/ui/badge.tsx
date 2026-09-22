import React from "react";

export type BadgeVariant = "default" | "secondary" | "outline" | "info" | "success" | "warning" | "error" | "offline";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  // Base styles: pill shape, small text (12px), medium weight, inline-flex
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
  
  const variants = {
    default: "bg-primary text-text-inverse",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "text-text-primary border border-border",
    info: "bg-info-bg text-info",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    error: "bg-error-bg text-error",
    offline: "bg-surface-muted text-offline border border-border border-dashed",
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`.trim();

  return (
    <div className={classes} {...props} />
  );
}
