"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScholarshipApplication, ScholarshipStatus } from "@/lib/admin/api";

export function ScholarshipActionsClient({ application }: { application: ScholarshipApplication }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (newStatus: ScholarshipStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/scholarships/${application.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to update status");
      }
    } catch {
      setError("Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = () => {
    switch (application.status) {
      case "SUBMITTED":
        return (
          <Button variant="primary" onClick={() => handleUpdate("UNDER_VERIFICATION")} disabled={loading}>
            Start Verification
          </Button>
        );
      case "UNDER_VERIFICATION":
        return (
          <>
            <Button variant="primary" onClick={() => handleUpdate("APPROVED")} disabled={loading}>
              Approve
            </Button>
            <Button variant="outline" onClick={() => handleUpdate("REJECTED")} disabled={loading} className="text-error border-error hover:bg-error-bg">
              Reject
            </Button>
          </>
        );
      case "APPROVED":
        return (
          <Button variant="primary" onClick={() => handleUpdate("DISBURSED")} disabled={loading}>
            Mark Disbursed
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {getAvailableActions()}
      </div>
      {error && <div className="text-sm text-error">{error}</div>}
    </div>
  );
}
