import { EmptyState } from "@/components/ui/empty-state";
import { BellOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <p className="text-text-secondary">System alerts and notification preferences.</p>
      </div>
      <EmptyState 
        title="Notifications Unavailable" 
        description="Notification management is not available in this version." 
        icon={<BellOff className="h-6 w-6" />} 
        action={
          <Button variant="outline" asChild>
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
