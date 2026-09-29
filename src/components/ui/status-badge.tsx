"use client";

import React from "react";
import { RequestStatus } from "@/lib/types/request";
import { Badge } from "./badge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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
  const { t } = useLanguage();
  const getStatusConfig = (s: RequestStatus) => {
    switch (s) {
      case "PENDING":
        return { variant: "info" as const, icon: CircleDashed, label: t("status.PENDING") };
      case "ASSIGNED":
        return { variant: "info" as const, icon: UserPlus, label: t("status.ASSIGNED") };
      case "ACKNOWLEDGED":
        return { variant: "warning" as const, icon: ThumbsUp, label: t("status.ACKNOWLEDGED") };
      case "PROCESSING":
        return { variant: "warning" as const, icon: Clock, label: t("status.PROCESSING") };
      case "RESOLVED":
        return { variant: "success" as const, icon: CheckCircle2, label: t("status.RESOLVED") };
      case "VERIFIED":
        return { variant: "success" as const, icon: ShieldCheck, label: t("status.VERIFIED") };
      case "CLOSED":
        return { variant: "default" as const, icon: CheckCheck, label: t("status.CLOSED") };
      case "APPROVED":
        return { variant: "success" as const, icon: Check, label: t("status.APPROVED") };
      case "REJECTED":
        return { variant: "error" as const, icon: XCircle, label: t("status.REJECTED") };
      case "CANCELLED":
        return { variant: "default" as const, icon: Ban, label: t("status.CANCELLED") };
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
