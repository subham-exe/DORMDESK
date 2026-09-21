"use client";

import { User } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-500">Manage your student details and preferences.</p>
      </div>
      <EmptyState
        icon={<User className="h-6 w-6" />}
        title="Profile coming soon"
        description="Your student profile settings will be available here soon."
      />
    </div>
  );
}
