import Link from "next/link";
import { Search, Eye, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminAPI, ScholarshipStatus } from "@/lib/admin/api";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

function getStatusBadge(status: ScholarshipStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return <Badge variant="warning">Pending Review</Badge>;
    case "UNDER_VERIFICATION":
      return <Badge variant="info">Under Verification</Badge>;
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>;
    case "DISBURSED":
      return <Badge variant="secondary">Disbursed</Badge>;
    case "REJECTED":
      return <Badge variant="error">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function AdminScholarshipsPage() {
  const [stats, applications] = await Promise.all([
    AdminAPI.getScholarshipStats(new Date().getFullYear().toString()),
    AdminAPI.listScholarshipApplications()
  ]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Scholarships</h2>
        <p className="text-text-secondary">Scholarship administration visibility and workflows.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.underVerification}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-secondary">{stats.disbursed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border bg-surface-muted/50 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <CardTitle className="text-lg">Applications</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-secondary" />
                <Input placeholder="Search student or ID..." className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                title="No Applications Found" 
                description="There are currently no scholarship applications in the system." 
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map(app => (
                    <TableRow key={app.id} className="hover:bg-surface-muted/50">
                      <TableCell className="font-medium text-xs font-mono">{app.applicationNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{app.studentName}</div>
                        <div className="text-xs text-text-secondary">{app.studentId}</div>
                      </TableCell>
                      <TableCell>{app.programName}</TableCell>
                      <TableCell>
                        {app.amountRequested ? `₹${app.amountRequested.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm text-text-secondary">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/scholarships/${app.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
