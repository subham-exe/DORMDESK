import { AdminAPI } from "@/lib/admin/api";
import { RequestQueueClient } from "./components/request-queue-client";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await AdminAPI.listRequests();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Requests</h2>
        <p className="text-text-secondary">Review and manage active campus requests.</p>
      </div>
      
      <RequestQueueClient initialRequests={requests} />
    </div>
  );
}
