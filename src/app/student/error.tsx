"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Student portal rendering error:", error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-6 min-h-[50vh]">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load this part of DORMDESK."
        onRetry={() => reset()}
      />
    </div>
  );
}
