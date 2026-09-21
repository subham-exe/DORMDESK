"use client";

import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notices</h1>
        <p className="text-gray-500">Important updates and announcements.</p>
      </div>
      <EmptyState
        icon={<Bell className="h-6 w-6" />}
        title="No new notices"
        description="You're all caught up! Check back later for updates."
      />
    </div>
  );
}
