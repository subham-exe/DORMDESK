import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyAdminAuthority } from "@/lib/admin/api";
import { prisma } from "@/lib/db/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, AlertCircle, Users, FileText, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifyAdminAuthority();
  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      requests: {
        include: {
          requester: { select: { id: true, name: true } },
          assignedAuthority: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!incident) {
    notFound();
  }

  const userIds = new Set(incident.requests.map(r => r.requesterId));

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin" 
          className="p-2 hover:bg-surface rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {incident.title}
            <Badge variant="info">INC-{incident.id.substring(0, 5).toUpperCase()}</Badge>
          </h2>
          <p className="text-text-secondary text-sm mt-1 flex items-center gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <StatusBadge status={incident.status as any} />
            <span>•</span>
            {incident.category} {incident.location ? `• ${incident.location}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Incident Intelligence Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-1">Reason for Grouping</h4>
              <p className="text-sm bg-surface-muted p-3 rounded-md border border-border">
                {incident.groupingReason || "Manually grouped by administration."}
              </p>
            </div>
            
            <div className="flex gap-6 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-info-bg rounded-lg">
                  <FileText className="w-5 h-5 text-info" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{incident.requests.length}</div>
                  <div className="text-xs text-text-secondary">Related Requests</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{userIds.size}</div>
                  <div className="text-xs text-text-secondary">Unique Users</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${(incident.impactScore || 0) >= 30 ? 'bg-error/10' : 'bg-warning/10'}`}>
                  <AlertCircle className={`w-5 h-5 ${(incident.impactScore || 0) >= 30 ? 'text-error' : 'text-warning'}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${(incident.impactScore || 0) >= 30 ? 'text-error' : 'text-warning'}`}>
                    {incident.impactScore || 0}
                  </div>
                  <div className="text-xs text-text-secondary">Impact Score</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-text-secondary pt-2">
              Impact is a deterministic score calculating affected users, total requests, and cascading priority weights.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.status === 'OPEN' ? (
              <form action={async () => {
                'use server';
                const { AdminAPI } = await import('@/lib/admin/api');
                await AdminAPI.resolveIncident(incident.id, "Resolved from Command Center");
              }}>
                <button 
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Resolve Incident
                </button>
              </form>
            ) : (
              <div className="text-sm text-text-secondary italic text-center p-2 bg-surface-muted rounded-md">
                This incident is resolved.
              </div>
            )}
            <p className="text-xs text-text-secondary text-center">
              Resolving the incident automatically updates all non-terminal associated requests.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight border-b border-border pb-2">Affected Requests</h3>
        
        <div className="grid gap-3">
          {incident.requests.map(req => (
            <Link 
              key={req.id} 
              href={`/admin/requests/${req.id}`}
              className="block group"
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{req.ticketNumber}</span>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <StatusBadge status={req.status as any} />
                      {req.priority === 'CRITICAL' && <Badge variant="error" className="py-0">CRITICAL</Badge>}
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-1">{req.description}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      By: {req.requester.name}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
