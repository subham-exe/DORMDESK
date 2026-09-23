/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, CheckCircle, AlertTriangle, ChevronRight, FileText, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function StudentDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch("/api/requests?requesterId=mock-user-123");
        if (!response.ok) throw new Error("Failed to load requests.");
        const data = await response.json();
        setRequests(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const activeRequests = requests.filter(r => !["CLOSED", "REJECTED", "CANCELLED"].includes(r.status));
  const verificationRequired = requests.filter(r => r.status === "RESOLVED");
  const recentRequests = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
      case "SUBMITTED":
      case "CLASSIFIED":
      case "ROUTED":
        return <Badge variant="info">{status}</Badge>;
      case "ASSIGNED":
      case "ACKNOWLEDGED":
      case "PROCESSING":
        return <Badge variant="warning">{status}</Badge>;
      case "RESOLVED":
      case "VERIFIED":
      case "CLOSED":
        return <Badge variant="success">{status}</Badge>;
      case "ESCALATED":
      case "REJECTED":
        return <Badge variant="error">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Recent Requests */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Requests</h2>
          <Link href="/student/requests" className="text-sm text-info font-medium hover:underline">
            View All
          </Link>
        </div>

        {error ? (
          <div className="p-4 bg-error-bg text-error rounded-lg">{error}</div>
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
                        {getStatusBadge(request.status)}
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
