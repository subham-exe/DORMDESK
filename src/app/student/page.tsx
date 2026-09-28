/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, CheckCircle, AlertTriangle, ChevronRight, FileText, ListTodo, GraduationCap, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getOfflineRequests, deleteOfflineRequest } from "@/lib/services/offline-store";

export default function StudentDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [scholarship, setScholarship] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dormdesk_dismissed_announcements");
        if (stored) return new Set(JSON.parse(stored));
      } catch {
        // ignore error
      }
    }
    return new Set();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqsRes, scholRes, anncRes] = await Promise.all([
          fetch("/api/requests").catch(() => null),
          fetch("/api/scholarships?").catch(() => null),
          fetch("/api/announcements").catch(() => null)
        ]);
        
        let fetchedRequests: any[] = [];
        let networkError = false;
        if (reqsRes) {
          if (reqsRes.ok) {
            fetchedRequests = await reqsRes.json();
          } else {
            networkError = true;
          }
        } else {
          networkError = true;
        }

        // Get offline pending requests
        let offlineRequests: any[] = [];
        try {
          offlineRequests = await getOfflineRequests();
        } catch { }
        
        // Merge offline requests
        const allRequests = [
          ...offlineRequests.map(r => ({ ...r, id: `offline-${r.localId}`, title: r.requestType, status: 'PENDING_SYNC' })),
          ...fetchedRequests
        ];
        
        setRequests(allRequests);
        
        if (networkError && allRequests.length === 0) {
          throw new Error("Network error and no offline requests available.");
        }

        if (scholRes && scholRes.ok) {
          const scholData = await scholRes.json();
          if (scholData.success) {
            setScholarship(scholData.data);
          }
        }

        if (anncRes && anncRes.ok) {
          const anncData = await anncRes.json();
          if (anncData.success) {
            setAnnouncements(anncData.data);
          }
        }

        // Attempt Sync
        if (navigator.onLine && offlineRequests.length > 0) {
           for (const offReq of offlineRequests) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { localId, _status, _timestamp, ...payload } = offReq;
                const syncRes = await fetch("/api/requests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (syncRes.ok) {
                  await deleteOfflineRequest(localId);
                }
              } catch { }
           }
           // Refresh after sync
           const newReqsRes = await fetch("/api/requests");
           if (newReqsRes.ok) setRequests(await newReqsRes.json());
        }

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeRequests = requests.filter(r => !["CLOSED", "REJECTED", "CANCELLED"].includes(r.status));
  const verificationRequired = requests.filter(r => r.status === "RESOLVED");
  const recentRequests = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);



  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("dormdesk_dismissed_announcements", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const activeAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a.id));

  return (
    <div className="space-y-6 pb-8">
      {/* Announcements */}
      {!loading && activeAnnouncements.length > 0 && (
        <div className="space-y-3 mb-6">
          {activeAnnouncements.map(announcement => (
            <div key={announcement.id} className="bg-info-bg border border-info rounded-lg p-4 flex gap-3 relative">
              <Megaphone className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <div className="flex-1 pr-6">
                <h3 className="font-semibold text-info">{announcement.title}</h3>
                <p className="text-sm text-info/90 mt-1">{announcement.message}</p>
                <p className="text-xs text-info/70 mt-2 font-medium">
                  {new Date(announcement.date).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => dismissAnnouncement(announcement.id)}
                className="absolute top-3 right-3 text-info hover:bg-info/10 p-1 rounded-md transition-colors"
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary">Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/student/requests/new?type=COMPLAINT" passHref>
            <Button size="lg" variant="outline" className="w-full sm:w-auto shadow-sm border-warning text-warning hover:bg-warning-bg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Report Complaint
            </Button>
          </Link>
          <Link href="/student/requests/new?type=LEAVE" passHref>
            <Button size="lg" variant="outline" className="w-full sm:w-auto shadow-sm border-info text-info hover:bg-info-bg">
              <FileText className="mr-2 h-5 w-5" />
              Request Leave
            </Button>
          </Link>
          <Link href="/student/requests/new?type=CERTIFICATE" passHref>
            <Button size="lg" variant="outline" className="w-full sm:w-auto shadow-sm border-success text-success hover:bg-success-bg">
              <FileText className="mr-2 h-5 w-5" />
              Request Certificate
            </Button>
          </Link>
          <Link href="/student/requests/new" passHref>
            <Button size="lg" className="w-full sm:w-auto shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              Create Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Clock className="h-8 w-8 text-info mb-2" />
            <p className="text-sm font-medium text-text-secondary">Active Requests</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-8 mx-auto" /> : activeRequests.length}</p>
          </CardContent>
        </Card>
        <Card className={verificationRequired.length > 0 ? "border-success bg-success-bg" : ""}>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CheckCircle className="h-8 w-8 text-success mb-2" />
            <p className="text-sm font-medium text-text-secondary">Verification Needed</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-8 mx-auto" /> : verificationRequired.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <FileText className="h-8 w-8 text-text-secondary mb-2" />
            <p className="text-sm font-medium text-text-secondary">Total Created</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-8 mx-auto" /> : requests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <AlertTriangle className="h-8 w-8 text-warning mb-2" />
            <p className="text-sm font-medium text-text-secondary">Escalated</p>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-8 mx-auto" /> : requests.filter(r => r.status === "ESCALATED").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scholarship Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Scholarship Status</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : scholarship ? (
          <Card className="border-info shadow-sm overflow-hidden">
            <div className="bg-info-bg border-b border-info px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-info" />
                <h3 className="font-semibold text-info">Merit Scholarship {scholarship.academicYear}</h3>
              </div>
              <StatusBadge status={scholarship.status} overrideLabel={scholarship.status === "SUBMITTED" ? "Pending Review" : undefined} />
            </div>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div>
                <p className="text-sm text-text-secondary">Application ID</p>
                <p className="font-medium font-mono text-sm">{scholarship.id.split('-')[0].toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Last Updated</p>
                <p className="font-medium text-sm">{new Date(scholarship.updatedAt).toLocaleDateString()}</p>
              </div>
              <Link href="/student/scholarship" passHref>
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-surface-muted border-dashed shadow-none">
            <CardContent className="p-6 text-center">
              <GraduationCap className="w-8 h-8 mx-auto text-text-secondary mb-2" />
              <p className="font-medium">No Active Scholarships</p>
              <p className="text-sm text-text-secondary mb-4">You have not applied for or been awarded any scholarships yet.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/scholarship">Apply Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Requests */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Requests</h2>
          <Link href="/student/requests" className="text-sm text-info font-medium hover:underline">
            View All
          </Link>
        </div>

        {error ? (
          <ErrorState title="Failed to load requests" description={error} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : recentRequests.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="h-6 w-6" />}
            title="No recent requests"
            description="You haven't made any requests recently. Need help? Create a new one."
            action={<Link href="/student/requests/new" passHref><Button>Create Request</Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {recentRequests.map(request => (
              <Link key={request.id} href={`/student/requests/${request.id}`} className="block">
                <Card className="hover:border-info transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-text-secondary">{request.ticketNumber}</span>
                        <StatusBadge status={request.status} />
                      </div>
                      <h3 className="font-medium text-text-primary truncate">{request.title || request.requestType}</h3>
                      <p className="text-xs text-text-secondary mt-1 truncate">{request.category}</p>
                    </div>
                    <div className="ml-4 flex items-center text-text-secondary">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


