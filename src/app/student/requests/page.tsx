/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight, AlertCircle, Clock, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { getOfflineMutations, getCachedRequests, cacheRequests } from "@/lib/services/offline-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RequestListPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      try {
        let fetchedRequests: any[] = [];
        let networkError = false;
        try {
          const response = await fetch('/api/requests');
          if (!response.ok) throw new Error("Failed to load requests.");
          fetchedRequests = await response.json(); const userId = localStorage.getItem("dormdesk_user_id"); if (userId) { await cacheRequests(userId, fetchedRequests); }
        } catch (e) {
          networkError = true; const userId = localStorage.getItem("dormdesk_user_id"); if (userId) { fetchedRequests = await getCachedRequests(userId); }
        }

        let offlineRequests: any[] = [];
        try {
          const userId = localStorage.getItem("dormdesk_user_id") || ""; if (userId) { offlineRequests = await getOfflineMutations(userId); offlineRequests = offlineRequests.filter(m => m.type === "CREATE_REQUEST").map(m => m.payload); }
        } catch {}

        const allRequests = [
          ...offlineRequests.map(r => ({ ...r, id: "offline-" + r.idempotencyKey, ticketNumber: "PENDING-SYNC", status: "PENDING_SYNC", createdAt: new Date().toISOString() })),
          ...fetchedRequests
        ];

        setRequests(allRequests);

        if (networkError && allRequests.length === 0) {
          setError("Failed to load requests. You are offline and have no saved requests.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(req => 
    req.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());



  const getSlaIndicator = (req: any) => {
    if (!req.dueAt || ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED"].includes(req.status)) return null;
    
    const now = new Date();
    const due = new Date(req.dueAt);
    const isBreached = now > due;
    
    if (isBreached) {
      return (
        <div className="flex items-center text-xs text-error gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>SLA Breached</span>
        </div>
      );
    }
    
    // Check if within 2 hours of breach
    const hoursRemaining = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursRemaining < 2) {
      return (
        <div className="flex items-center text-xs text-warning gap-1 mt-1">
          <Clock className="w-3 h-3" />
          <span>SLA Approaching</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("requests.title")}</h1>
          <p className="text-text-secondary">Track and manage your requests.</p>
        </div>
        <Link href="/student/requests/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary h-5 w-5" />
        <Input 
          className="pl-10" 
          placeholder="Search by ticket number, type or category..." 
          aria-label="Search requests"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error ? (
        <ErrorState title="Failed to load requests" description={error} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title={searchTerm ? "No results found" : "No requests found"}
          description={searchTerm ? "Try adjusting your search query." : "You haven't made any requests yet."}
          action={!searchTerm ? <Link href="/student/requests/new" passHref><Button>Create Request</Button></Link> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(request => (
            <Link key={request.id} href={`/student/requests/${request.id}`} className="block">
              <Card className="hover:border-info transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-medium text-text-secondary">{request.ticketNumber}</span>
                        <StatusBadge status={request.status} />
                        {request.incidentId && (
                          <Badge variant="info" className="border-none text-[10px]">INCIDENT</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-text-primary truncate">{request.requestType}</h3>
                      <p className="text-sm text-text-secondary mt-1 truncate">{request.category}</p>
                      <div className="mt-2 text-xs text-text-secondary flex items-center gap-4">
                        <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                        {getSlaIndicator(request)}
                      </div>
                    </div>
                    <div className="flex items-center h-full text-text-secondary mt-4">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}




