import React from "react";
import { FolderX } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action, className = "", ...props }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center animate-in fade-in-50 ${className}`} {...props}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-secondary mb-4">
        {icon || <FolderX className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
