import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title: string;
  children?: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", variant = "info", title, children, ...props }, ref) => {
    const variants = {
      info: "bg-info-bg text-info border-info/20",
      success: "bg-success-bg text-success border-success/20",
      warning: "bg-warning-bg text-warning border-warning/20",
      error: "bg-error-bg text-error border-error/20",
    };

    const icons = {
      info: <Info className="h-5 w-5" />,
      success: <CheckCircle2 className="h-5 w-5" />,
      warning: <AlertTriangle className="h-5 w-5" />,
      error: <AlertCircle className="h-5 w-5" />,
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 flex gap-3 ${variants[variant]} ${className}`}
        {...props}
      >
        <div className="shrink-0">{icons[variant]}</div>
        <div className="flex flex-col gap-1">
          <h5 className="font-medium leading-none tracking-tight">{title}</h5>
          {children && <div className="text-sm opacity-90">{children}</div>}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";
