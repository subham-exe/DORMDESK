import React from "react";

// Simplified uncontrolled tabs for the foundation layout.
export function Tabs({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`w-full ${className}`}>{children}</div>;
}

export function TabsList({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`inline-flex h-11 items-center justify-center rounded-md bg-surface-muted p-1 text-text-secondary ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ active, children, onClick, className = "" }: { active?: boolean; children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${active ? "bg-surface text-text-primary shadow-sm" : "hover:text-text-primary"} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ active, children, className = "" }: { active?: boolean; children: React.ReactNode; className?: string }) {
  if (!active) return null;
  return (
    <div role="tabpanel" className={`mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}
