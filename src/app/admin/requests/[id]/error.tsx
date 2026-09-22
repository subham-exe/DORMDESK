"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RequestError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto pt-10">
      <EmptyState
        title="Failed to Load Request"
        description={error.message || "An unexpected error occurred while loading this request."}
        icon={<AlertTriangle className="h-6 w-6 text-error" />}
        action={
          <Button variant="outline" onClick={() => reset()}>
            Try Again
          </Button>
        }
      />
    </div>
  );
}
