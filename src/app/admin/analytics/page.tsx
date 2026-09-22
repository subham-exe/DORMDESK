import Link from "next/link";
import { Calendar, Repeat, Activity, Tag, Flag } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AdminAPI } from "@/lib/admin/api";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [analytics, recurringIssues] = await Promise.all([
    AdminAPI.getAnalytics(),
    AdminAPI.getRecurringIssues()
  ]);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics & Recurring Issues</h2>
        <p className="text-text-secondary mt-1">Historical patterns, workload views, and repeated operational issues.</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Requests</CardTitle>
            <Activity className="w-4 h-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRequests}</div>
            <p className="text-xs text-text-secondary mt-1">Available history</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Resolved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{analytics.resolvedRequests}</div>
            <p className="text-xs text-text-secondary mt-1">Closed or verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Recurring Patterns</CardTitle>
            <Repeat className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{recurringIssues.length}</div>
            <p className="text-xs text-text-secondary mt-1">Repeated ≥2 times</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Categories</CardTitle>
            <Tag className="w-4 h-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.byCategory.length}</div>
            <p className="text-xs text-text-secondary mt-1">Unique active categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column: Recurring Issues */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">Recurring Issues</h3>
          <p className="text-sm text-text-secondary">
            Patterns matching the same Category and Location repeatedly.
          </p>
          
          {recurringIssues.length === 0 ? (
            <Card className="bg-surface-muted/50 border-dashed">
              <CardContent className="pt-6">
                <EmptyState 
                  title="No Recurring Issues" 
                  description="No patterns met the recurrence threshold." 
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recurringIssues.map(issue => (
                <Card key={issue.id} className="overflow-hidden border border-border">
                  <CardHeader className="bg-surface-muted pb-4 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge variant="warning" className="mb-2"><Repeat className="w-3 h-3 mr-1" /> {issue.occurrences} Occurrences</Badge>
                        <CardTitle className="text-base text-text-primary">{issue.pattern}</CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> First: {new Date(issue.firstSeen).toLocaleDateString()}</span>
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Latest: {new Date(issue.lastSeen).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {issue.relatedRequestIds.map(reqId => (
                          <TableRow key={reqId} className="hover:bg-surface-muted/50">
                            <TableCell className="font-medium text-sm w-32">
                              <Link href={`/admin/requests/${reqId}`} className="text-primary hover:underline">
                                View Request
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-text-secondary text-right">
                              ID: {reqId}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Historical Distribution */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold tracking-tight">Distribution Analysis</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4" /> By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.byCategory.map(c => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.category}</span>
                    <Badge variant="secondary">{c.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.byStatus.map(s => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.status}</span>
                    <Badge variant="outline">{s.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Flag className="w-4 h-4" /> By Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.byPriority.map(p => (
                  <div key={p.priority} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.priority}</span>
                    <Badge variant="secondary">{p.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" /> Current SLA State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-secondary mb-4 italic">
                Note: SLA distribution updates according to current simulated time.
              </p>
              <div className="space-y-3">
                {analytics.bySlaStatus.map(s => (
                  <div key={s.slaStatus} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.slaStatus}</span>
                    <Badge variant={s.slaStatus === 'BREACHED' ? 'error' : s.slaStatus === 'WARNING' ? 'warning' : 'success'}>
                      {s.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
