import React from "react";
import { RequestStatus } from "@/lib/types/request";
import { Badge } from "./badge";
import {
  CircleDashed,
  UserPlus,
  ThumbsUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  CheckCheck,
  XCircle,
  Ban,
  Check
} from "lucide-react";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
  // Used to map SUBMITTED -> Pending Review for Scholarships without changing backend
  overrideLabel?: string;
}

export function StatusBadge({ status, className = "", overrideLabel }: StatusBadgeProps) {
  const getStatusConfig = (s: RequestStatus) => {
    switch (s) {
      case "PENDING":
        return { variant: "info" as const, icon: CircleDashed, label: "New" };
      case "ASSIGNED":
        return { variant: "info" as const, icon: UserPlus, label: "Assigned" };
      case "ACKNOWLEDGED":
        return { variant: "warning" as const, icon: ThumbsUp, label: "Acknowledged" };
      case "PROCESSING":
        return { variant: "warning" as const, icon: Clock, label: "In Progress" };
      case "RESOLVED":
        return { variant: "success" as const, icon: CheckCircle2, label: "Resolved" };
      case "VERIFIED":
        return { variant: "success" as const, icon: ShieldCheck, label: "Verified" };
      case "CLOSED":
        return { variant: "default" as const, icon: CheckCheck, label: "Closed" };
      case "APPROVED":
        return { variant: "success" as const, icon: Check, label: "Approved" };
      case "REJECTED":
        return { variant: "error" as const, icon: XCircle, label: "Rejected" };
      case "CANCELLED":
        return { variant: "default" as const, icon: Ban, label: "Cancelled" };
      default:
        // Handle unexpected status
        return { variant: "default" as const, icon: CircleDashed, label: s };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{overrideLabel || config.label}</span>
    </Badge>
  );
}
