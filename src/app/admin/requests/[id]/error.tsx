"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function RequestError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto pt-10">
      <ErrorState
        title="Failed to Load Request"
        description={error.message || "An unexpected error occurred while loading this request."}
        onRetry={() => reset()}
      />
    </div>
  );
}
