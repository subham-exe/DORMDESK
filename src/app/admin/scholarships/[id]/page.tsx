import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, FileText, IndianRupee } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminAPI, ScholarshipStatus } from "@/lib/admin/api";
import { ScholarshipActionsClient } from "./components/scholarship-actions-client";

export const dynamic = "force-dynamic";

function getStatusBadge(status: ScholarshipStatus) {
  switch (status) {
    case "SUBMITTED":
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

export default async function AdminScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await AdminAPI.getScholarshipApplication(id);

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Scholarships", href: "/admin/scholarships" }, { label: application?.applicationNumber || "Application Details" }]} />
      {/* Navigation */}
      <div>
        <Link href="/admin/scholarships" className="md:hidden inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Scholarships
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{application.applicationNumber}</h2>
            <p className="text-text-secondary">Scholarship Application for {application.programName}</p>
          </div>
          <ScholarshipActionsClient application={application} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-border bg-surface-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-text-secondary" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Status</p>
                  <div>{getStatusBadge(application.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Program</p>
                  <p className="font-medium">{application.programName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Amount Requested</p>
                  <p className="font-medium flex items-center">
                    <IndianRupee className="w-3.5 h-3.5 mr-1 text-text-secondary" />
                    {application.amountRequested ? application.amountRequested.toLocaleString() : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Submitted
                  </p>
                  <p className="font-medium">{new Date(application.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {application.notes && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Administrative Notes</p>
                  <p className="text-sm text-text-secondary bg-surface-muted p-4 rounded-md whitespace-pre-wrap">
                    {application.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border bg-surface-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-text-secondary" />
                Applicant
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Name</p>
                <p className="font-medium">{application.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Student ID</p>
                <p className="font-medium font-mono text-sm">{application.studentId}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
