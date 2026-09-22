import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "default" | "success" | "error";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  const variants = {
    default: "bg-surface border-border text-text-primary",
    success: "bg-success-bg border-success/20 text-success",
    error: "bg-error-bg border-error/20 text-error",
  };

  const icons = {
    default: <Info className="h-5 w-5" />,
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
  };

  return (
    <div className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border p-4 shadow-lg transition-all ${variants[variant]}`}>
      <div className="shrink-0">{icons[variant]}</div>
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 p-1 rounded-md hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

// A simple Toast Region container (to be rendered at root)
export function ToastRegion({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none">
      {children}
    </div>
  );
}
