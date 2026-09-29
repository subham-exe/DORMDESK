'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AlertCircle, ShieldAlert, Activity, Users, User, ArrowRight, XCircle, CheckCircle } from 'lucide-react';
import { AdminSLACheckButton } from '../components/admin-sla-check-button';

export default function CommandCenterPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/command-center')
      .then(res => res.json())
      .then(resData => {
        if (resData.error) throw new Error(resData.error);
        setData(resData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-text-secondary">Loading Command Center...</div>;
  }

  if (error) {
    return <div className="p-8 text-error font-medium">Error loading Command Center: {error}</div>;
  }

  // Type assertions for rendering
  const summary = data?.summary as Record<string, number>;
  const incidents = data?.incidents as Record<string, unknown>[];
  const sla = data?.sla as Record<string, unknown>[];
  const escalations = data?.escalations as Record<string, unknown>[];
  const unassigned = data?.unassigned as Record<string, unknown>[];
  const stale = data?.stale as Record<string, unknown>[];
  const staffWorkload = data?.staffWorkload as Record<string, unknown>[];
  const activity = data?.activity as Record<string, unknown>[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Operations Command Center</h1>
          <p className="text-text-secondary mt-1 text-sm">Real-time overview of urgent tasks, SLAs, and active incidents.</p>
        </div>
        <div>
          <AdminSLACheckButton />
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard title="Active Requests" value={summary.activeRequests} icon={Activity} />
        <SummaryCard title="Critical Issues" value={summary.criticalIssues} icon={ShieldAlert} alert={summary.criticalIssues > 0} />
        <SummaryCard title="Breached SLA" value={summary.breachedSla} icon={XCircle} alert={summary.breachedSla > 0} />
        <SummaryCard title="Unassigned" value={summary.unassigned} icon={User} alert={summary.unassigned > 0} />
        <SummaryCard title="Active Incidents" value={summary.activeIncidents} icon={AlertCircle} alert={summary.activeIncidents > 0} />
        <SummaryCard title="Escalations" value={summary.escalations} icon={Users} alert={summary.escalations > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Urgent Issues (SLA + Incidents) */}
        <div className="xl:col-span-2 space-y-8">
          
          <Section title="Active Incidents" count={incidents.length} alert>
            {incidents.length === 0 ? <EmptyState msg="No active incidents." /> : (
              <div className="grid gap-3">
                {incidents.map((inc) => (
                  <Link key={inc.id as string} href={`/admin/incidents/${inc.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
                    <Card className="hover:border-error border-error/30 bg-error/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <ShieldAlert className="w-4 h-4 text-error" />
                              <span className="font-bold text-error">{inc.identifier as string}</span>
                              <Badge variant="error">Impact: {inc.impactScore as number}</Badge>
                            </div>
                            <h4 className="font-semibold text-text-primary">{inc.title as string}</h4>
                            <p className="text-sm text-text-secondary mt-1">{inc.groupingReason as string}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-4 text-xs text-text-secondary">
                          <span>{inc.requestCount as number} requests</span>
                          <span>{inc.userCount as number} users affected</span>
                          <span>Age: {Math.floor((inc.ageMs as number) / 3600000)}h</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="SLA Issues" count={sla.length} alert>
            {sla.length === 0 ? <EmptyState msg="All requests within SLA targets." /> : (
              <div className="grid gap-3">
                {sla.map((s) => (
                  <Link key={s.id as string} href={`/admin/requests/${s.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
                    <Card className={`hover:border-text-secondary transition-colors ${s.severity === 'BREACH' ? 'border-error/30 bg-error/5' : 'border-warning/30 bg-warning/5'}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary">{s.identifier as string}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.severity === 'BREACH' ? 'bg-error text-white' : 'bg-warning text-warning-foreground'}`}>
                              {s.reason as string}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{s.description as string}</p>
                          <div className="text-xs text-text-secondary mt-2 flex gap-3">
                            <span>Status: {s.status as string}</span>
                            <span>Assigned: {(s.assignedStaff as string) || 'None'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="Active Escalations" count={escalations.length}>
            {escalations.length === 0 ? <EmptyState msg="No active escalations." /> : (
              <div className="grid gap-3">
                {escalations.map((e) => (
                  <Link key={e.id as string} href={`/admin/requests/${e.requestId}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
                    <Card className="hover:border-primary transition-colors border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-semibold">{e.identifier as string}</span> - <span className="text-sm">Level {e.level as number}</span>
                            <p className="text-sm text-text-secondary mt-1">{e.description as string}</p>
                          </div>
                          <span className="text-xs font-bold text-primary">Age: {Math.floor((e.ageMs as number) / 3600000)}h</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Section>

        </div>

        {/* Right Column: Workload, Stale, Unassigned, Activity */}
        <div className="space-y-8">
          
          <Section title="Unassigned Requests" count={unassigned.length}>
            {unassigned.length === 0 ? <EmptyState msg="All requests assigned." /> : (
              <div className="grid gap-2">
                {unassigned.slice(0, 5).map((u) => (
                  <Link key={u.id as string} href={`/admin/requests/${u.id}`} className="flex items-center justify-between p-3 bg-surface-muted rounded hover:bg-border/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
                    <div>
                      <span className="font-medium">{u.identifier as string}</span>
                      <div className="text-xs text-text-secondary">{u.location as string}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-secondary" />
                  </Link>
                ))}
                {unassigned.length > 5 && (
                  <div className="text-xs text-center text-text-secondary pt-2">+{unassigned.length - 5} more</div>
                )}
              </div>
            )}
          </Section>

          <Section title="Stale Requests" count={stale.length}>
            {stale.length === 0 ? <EmptyState msg="No stale requests." /> : (
              <div className="grid gap-2">
                {stale.slice(0, 5).map((s) => (
                  <Link key={s.id as string} href={`/admin/requests/${s.id}`} className="p-3 bg-surface-muted rounded hover:bg-border/50 text-sm flex justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
                    <div>
                      <div className="font-medium">{s.identifier as string}</div>
                      <div className="text-xs text-text-secondary">{s.reason as string}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="Staff Workload">
            {staffWorkload.length === 0 ? <EmptyState msg="No active staff assignments." /> : (
              <div className="space-y-3">
                {staffWorkload.map((staff) => (
                  <div key={staff.id as string} className="flex justify-between items-center p-3 bg-white border rounded">
                    <div>
                      <div className="font-medium text-sm">{staff.name as string}</div>
                      <div className="text-xs text-text-secondary">{staff.recentlyResolved as number} resolved recently</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{staff.active as number} active</div>
                      {(staff.overdue as number) > 0 && <div className="text-xs text-error font-bold">{staff.overdue as number} overdue</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recent Activity">
            <div className="space-y-4">
              {activity.slice(0, 6).map((a) => (
                <div key={a.id as string} className="flex gap-3 text-sm">
                  <div className="mt-0.5"><CheckCircle className="w-4 h-4 text-text-secondary" /></div>
                  <div>
                    <div><span className="font-medium">{a.actorName as string}</span> ({a.actorRole as string})</div>
                    <div className="text-text-secondary">{a.action as string} on {a.entity as string}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{new Date(a.timestamp as string).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, alert = false }: { title: string; value: number; icon: React.ElementType; alert?: boolean }) {
  return (
    <Card className={alert ? 'bg-error/5 border-error/30' : ''}>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
        <Icon className={`w-6 h-6 mb-2 ${alert ? 'text-error' : 'text-primary'}`} />
        <div className="text-2xl font-bold">{value}</div>
        <div className={`text-xs mt-1 ${alert ? 'text-error font-medium' : 'text-text-secondary'}`}>{title}</div>
      </CardContent>
    </Card>
  );
}

function Section({ title, count, alert, children }: { title: string; count?: number; alert?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
        {title}
        {count !== undefined && count > 0 && (
          <Badge variant={alert ? "error" : "secondary"} className="rounded-full px-2 py-0.5">{count}</Badge>
        )}
      </h3>
      {children}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <Card className="bg-surface-muted/50 border-dashed">
      <CardContent className="py-6 text-center text-sm text-text-secondary">
        {msg}
      </CardContent>
    </Card>
  );
}
