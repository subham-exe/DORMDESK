"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRequestDetail } from "@/lib/admin/api";
import { RequestStatus } from "@/lib/types/request";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['ASSIGNED', 'REJECTED', 'CLOSED', 'APPROVED'],
  ASSIGNED: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['PROCESSING', 'RESOLVED'],
  PROCESSING: ['RESOLVED', 'ASSIGNED'],
  RESOLVED: ['VERIFIED', 'PROCESSING'],
  VERIFIED: ['CLOSED'],
  APPROVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

const STAFF_LIST = [
  { id: "stf-201", name: "Ramesh Electrician", department: "Maintenance" },
  { id: "wrd-001", name: "Warden Sharma", department: "Hostel Admin" },
  { id: "stf-301", name: "Plumber Singh", department: "Maintenance" },
  { id: "stf-401", name: "Network Admin", department: "IT" },
];

export function RequestActionsClient({ request }: { request: AdminRequestDetail }) {
  const router = useRouter();
  
  // Assignment State
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [assignError, setAssignError] = useState("");

  // Status State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<RequestStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const availableNextStatuses = VALID_TRANSITIONS[request.status as RequestStatus] || [];
  
  const handleAssign = async () => {
    if (!selectedStaff) return;
    setIsAssigning(true);
    setAssignError("");

    try {
      const staff = STAFF_LIST.find(s => s.id === selectedStaff);
      
      const res = await fetch(`/api/admin/requests/${request.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: selectedStaff,
          department: staff?.department || "General"
        })
      });

      if (!res.ok) throw new Error("Failed to assign request");

      setSelectedStaff("");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAssignError(err.message || "Something went wrong.");
      } else {
        setAssignError("Something went wrong.");
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async () => {
    if (!targetStatus) return;
    setIsUpdatingStatus(true);
    setStatusError("");

    try {
      const res = await fetch(`/api/admin/requests/${request.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes: statusNotes
        })
      });

      if (!res.ok) throw new Error("Failed to update status");

      setIsStatusModalOpen(false);
      setTargetStatus("");
      setStatusNotes("");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatusError(err.message || "Something went wrong.");
      } else {
        setStatusError("Something went wrong.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Assignment Control */}
      <div className="bg-surface border border-border p-4 rounded-md space-y-3">
        <h4 className="font-semibold text-sm">Assignment</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={selectedStaff} 
            onChange={(e) => setSelectedStaff(e.target.value)}
            disabled={isAssigning}
            aria-label="Select staff"
          >
            <option value="">Select Staff...</option>
            {STAFF_LIST.map(staff => (
              <option key={staff.id} value={staff.id}>{staff.name} ({staff.department})</option>
            ))}
          </Select>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedStaff || isAssigning}
            className="shrink-0"
          >
            {isAssigning ? "Assigning..." : "Assign"}
          </Button>
        </div>
        {assignError && <p className="text-sm text-error">{assignError}</p>}
      </div>

      {/* Status Control */}
      {availableNextStatuses.length > 0 && (
        <div className="bg-surface border border-border p-4 rounded-md space-y-3">
          <h4 className="font-semibold text-sm">Update Status</h4>
          <div className="flex flex-wrap gap-2">
            {availableNextStatuses.map(status => (
              <Button 
                key={status} 
                variant="outline" 
                onClick={() => {
                  setTargetStatus(status as RequestStatus);
                  setIsStatusModalOpen(true);
                }}
              >
                Mark as {status}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          if (!isUpdatingStatus) setIsStatusModalOpen(false);
        }}
        title={`Confirm Status Change to ${targetStatus}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsStatusModalOpen(false)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Updating..." : "Confirm"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-text-secondary">
            You are about to change this request&apos;s status from <strong>{request.status}</strong> to <strong>{targetStatus}</strong>.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="statusNotes">Resolution Notes / Comments (Optional)</Label>
            <Input 
              id="statusNotes"
              placeholder="Add details about this transition..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              disabled={isUpdatingStatus}
            />
          </div>

          {statusError && <p className="text-sm text-error bg-error-bg p-2 rounded">{statusError}</p>}
        </div>
      </Modal>

    </div>
  );
}
