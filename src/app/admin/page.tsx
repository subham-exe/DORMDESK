import Link from "next/link";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminAPI } from "@/lib/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [kpis, attentionRequests, allIncidents] = await Promise.all([
    AdminAPI.getDashboardKPIs(),
    AdminAPI.getAttentionRequests(),
    AdminAPI.listIncidents()
  ]);

  const activeIncidents = allIncidents.filter(i => i.status === "OPEN");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
        <p className="text-text-secondary mt-1">What needs your attention right now?</p>
      </div>
      
      {/* KPI Layer */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/requests" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
          <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{kpis.pendingRequests}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/requests" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
          <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue (Breached)</CardTitle>
              <AlertCircle className="w-4 h-4 text-error" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-error">{kpis.overdueRequests}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/incidents" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
          <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{kpis.activeIncidents}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/requests" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
          <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{kpis.unassignedRequests}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Needs Attention Queue */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Needs Attention</h3>
            <Link href="/admin/requests" className="text-sm text-primary hover:underline">View All Active</Link>
          </div>
          
          {attentionRequests.length === 0 ? (
            <Card className="bg-surface-muted/50 border-dashed">
              <CardContent className="pt-6">
                <EmptyState 
                  title="All Caught Up"
                  description="There are no active requests requiring immediate attention."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {attentionRequests.slice(0, 10).map(req => (
                <Link 
                  key={req.id} 
                  href={`/admin/requests/${req.id}`}
                  className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-text-primary">{req.ticketNumber}</span>
                          <span className="text-sm text-text-primary font-medium">{req.requestType}</span>
                          {req.incidentId && (
                            <Badge variant="info" className="text-[10px] py-0 leading-tight border-none">INCIDENT</Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-1">{req.description}</p>
                        
                        <div className="flex items-center gap-3 pt-1">
                          <StatusBadge status={req.status} />
                          <span className="text-text-secondary text-xs">•</span>
                          {req.assignedAuthorityName ? (
                            <span className="text-xs text-text-secondary">Assigned: {req.assignedAuthorityName}</span>
                          ) : (
                            <span className="text-xs text-text-secondary italic">Unassigned</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {req.slaStatus === "BREACHED" ? (
                          <div className="flex items-center text-error font-bold text-sm">
                            <AlertCircle className="w-4 h-4 mr-1.5" />
                            BREACHED
                          </div>
                        ) : (
                          <div className="flex items-center text-warning font-bold text-sm">
                            <Clock className="w-4 h-4 mr-1.5" />
                            WARNING
                          </div>
                        )}
                        <div className="text-xs text-text-secondary font-medium">Age: {req.ageingHours}h</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Incidents & SLA Summary */}
        <div className="space-y-8">
          
          {/* Active Incidents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Active Incidents
                {activeIncidents.length > 0 && (
                  <Badge variant="warning" className="rounded-full px-2 py-0.5">{activeIncidents.length}</Badge>
                )}
              </h3>
            </div>
            
            {activeIncidents.length === 0 ? (
              <Card className="bg-surface-muted/50 border-dashed">
                <CardContent className="py-6 text-center text-sm text-text-secondary">
                  No active incidents.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {activeIncidents.map(inc => (
                  <Link 
                    key={inc.id}
                    href={`/admin/incidents/${inc.id}`}
                    className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  >
                    <Card className="transition-colors hover:border-text-secondary border-2 border-border bg-surface-muted">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-text-primary line-clamp-1">{inc.title}</h4>
                          <ChevronRight className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary">{inc.affectedStudentCount} affected requests</span>
                          <span className="font-medium text-warning">OPEN</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* SLA Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">SLA Overview</h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <AlertCircle className="w-4 h-4 text-error" />
                    Breached
                  </div>
                  <span className="font-bold text-error">{kpis.overdueRequests}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Clock className="w-4 h-4 text-warning" />
                    At Risk (Warning)
                  </div>
                  <span className="font-bold text-warning">
                    {attentionRequests.filter(r => r.slaStatus === 'WARNING').length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    Total Under 24h Age
                  </div>
                  <span className="font-medium">{kpis.ageingBuckets.under24h}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    Total 24h - 48h Age
                  </div>
                  <span className="font-medium">{kpis.ageingBuckets.hours24to48}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    Total Over 48h Age
                  </div>
                  <span className="font-medium">{kpis.ageingBuckets.over48h}</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
