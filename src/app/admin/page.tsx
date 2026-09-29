import Link from "next/link";
import { AlertCircle, Clock, ChevronRight, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { verifyAdminAuthority } from "@/lib/admin/api";
import { CommandCenterService } from "@/lib/services/command-center";
import { AdminSLACheckButton } from "./components/admin-sla-check-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await verifyAdminAuthority();
  const dashboard = await CommandCenterService.getDashboard(admin.id);
  const { needsAttention, incidents, workload, staffWorkload } = dashboard;

  const totalActiveRequests = 
    workload.PENDING + workload.ASSIGNED + workload.ACKNOWLEDGED + workload.PROCESSING;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operations Command Center</h2>
        <p className="text-text-secondary mt-1">Real-time operational intelligence and workload overview.</p>
      </div>
      
      {/* KPI Layer */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-surface-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{totalActiveRequests}</div>
            <p className="text-xs text-text-secondary">{workload.PENDING} pending, {workload.PROCESSING} processing</p>
          </CardContent>
        </Card>
        
        <Card className="bg-surface-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-error flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Breached SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{workload.BREACHED}</div>
            <p className="text-xs text-text-secondary">Requires immediate escalation</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{workload.UNASSIGNED}</div>
            <p className="text-xs text-text-secondary">Awaiting dispatch</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Verify
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workload.RESOLVED_AWAITING_VERIFICATION}</div>
            <p className="text-xs text-text-secondary">Awaiting student verification</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Needs Attention */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            Needs Attention
            {needsAttention.length > 0 && (
              <Badge variant="error" className="rounded-full px-2 py-0.5">{needsAttention.length}</Badge>
            )}
          </h3>
          
          {needsAttention.length === 0 ? (
            <Card className="bg-surface-muted/50 border-dashed">
              <CardContent className="pt-6">
                <EmptyState 
                  title="All Caught Up"
                  description="There are no active issues requiring immediate attention."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {// eslint-disable-next-line @typescript-eslint/no-explicit-any
              needsAttention.map((item: any, idx: number) => (
                <Link 
                  key={`${item.id}-${idx}`} 
                  href={item.type === 'INCIDENT' ? `/admin/incidents/${item.id}` : `/admin/requests/${item.id}`}
                  className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <Card className={`transition-colors hover:border-primary/50 ${item.priority === 'CRITICAL' ? 'border-error/50 bg-error/5' : ''}`}>
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-text-primary">{item.identifier}</span>
                          {item.type === 'INCIDENT' && <Badge variant="error" className="text-[10px] py-0 border-none">INCIDENT</Badge>}
                          <span className="text-xs font-medium px-2 py-0.5 bg-surface-muted rounded-full text-text-secondary">
                            {item.location}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary font-medium line-clamp-1">{item.reason}</p>
                        <p className="text-sm text-text-secondary line-clamp-1">{item.description}</p>
                        
                        <div className="flex items-center gap-3 pt-1">
                          <StatusBadge status={item.status} />
                          {item.assignedStaff ? (
                            <span className="text-xs text-text-secondary">Assigned: {item.assignedStaff}</span>
                          ) : (
                            <span className="text-xs text-text-secondary italic">Unassigned</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {item.priority === 'CRITICAL' ? (
                          <div className="flex items-center text-error font-bold text-sm">
                            <AlertCircle className="w-4 h-4 mr-1.5" />
                            CRITICAL
                          </div>
                        ) : item.reason.includes('Warning') ? (
                          <div className="flex items-center text-warning font-bold text-sm">
                            <Clock className="w-4 h-4 mr-1.5" />
                            WARNING
                          </div>
                        ) : null}
                        <div className="text-xs text-text-secondary font-medium whitespace-nowrap">
                          {Math.floor(item.ageMs / 3600000)}h age
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Incidents & Staff Workload */}
        <div className="space-y-8">
          
          {/* Active Incidents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              Active Incidents
              {incidents.length > 0 && (
                <Badge variant="warning" className="rounded-full px-2 py-0.5">{incidents.length}</Badge>
              )}
            </h3>
            
            {incidents.length === 0 ? (
              <Card className="bg-surface-muted/50 border-dashed">
                <CardContent className="py-6 text-center text-sm text-text-secondary">
                  No active incidents.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                incidents.map((inc: any) => (
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
                        <div className="text-xs text-text-secondary mb-2 line-clamp-2">
                          {inc.groupingReason}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                          <span className="text-text-secondary">{inc.requestCount} requests • {inc.userCount} users</span>
                          <span className={`font-medium ${inc.impactScore >= 30 ? 'text-error' : 'text-warning'}`}>Impact: {inc.impactScore}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Staff Workload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Staff Workload</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {staffWorkload.length === 0 && (
                    <div className="p-4 text-center text-sm text-text-secondary">No active staff assignments.</div>
                  )}
                  {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                  staffWorkload.map((staff: any) => (
                    <div key={staff.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-text-secondary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{staff.name}</div>
                          <div className="text-xs text-text-secondary">{staff.recentlyResolved} resolved recently</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{staff.active} active</div>
                        {staff.overdue > 0 && (
                          <div className="text-xs font-bold text-error">{staff.overdue} overdue</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-2">
            <AdminSLACheckButton />
          </div>

        </div>
      </div>
    </div>
  );
}
