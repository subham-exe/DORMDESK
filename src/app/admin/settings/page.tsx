import { EmptyState } from "@/components/ui/empty-state";
import { Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-text-secondary">Platform configuration and user preferences.</p>
      </div>
      <EmptyState 
        title="Settings Unavailable" 
        description="Settings management is not available in this version." 
        icon={<Settings2 className="h-6 w-6" />} 
        action={
          <Button variant="outline" asChild>
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
