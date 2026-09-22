"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminIncident } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

export function IncidentActionsClient({ incident }: { incident: AdminIncident }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState("");

  if (incident.status === "RESOLVED") {
    return (
      <div className="bg-success-bg border border-success/20 p-4 rounded-md">
        <h4 className="font-semibold text-sm text-success">Incident Resolved</h4>
        <p className="text-xs text-success/80 mt-1">This incident has been resolved and cascaded to related requests.</p>
      </div>
    );
  }

  const handleResolve = async () => {
    setIsResolving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/incidents/${incident.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) throw new Error("Failed to resolve incident");
      
      setIsModalOpen(false);
      setNotes("");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border p-4 rounded-md space-y-3">
        <h4 className="font-semibold text-sm">Incident Actions</h4>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          Resolve Incident
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { if (!isResolving) setIsModalOpen(false); }}
        title="Resolve Incident"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isResolving}>Cancel</Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving ? "Resolving..." : "Confirm & Cascade"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-text-secondary">
            You are about to resolve <strong>{incident.incidentNumber}</strong>. 
            This will cascade the resolution to all {incident.affectedStudentCount} affected active requests.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Resolution Notes (Optional)</label>
            <Input 
              placeholder="e.g. Network switch replaced" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isResolving}
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
