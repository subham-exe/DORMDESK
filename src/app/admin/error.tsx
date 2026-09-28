"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <div className="rounded-full bg-error-bg p-4">
        <AlertCircle className="h-8 w-8 text-error" />
      </div>
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-text-secondary text-sm max-w-md text-center">
        An error occurred while loading the admin dashboard.
      </p>
      <Button onClick={() => reset()} variant="primary">
        Try again
      </Button>
    </div>
  );
}
