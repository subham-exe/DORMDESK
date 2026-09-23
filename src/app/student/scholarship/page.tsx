"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Calendar, Clock, CheckCircle, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const LIFECYCLE = [
  { status: "ELIGIBLE", label: "Eligible" },
  { status: "APPLIED", label: "Applied" },
  { status: "SUBMITTED", label: "Submitted" },
  { status: "UNDER_VERIFICATION", label: "Under Verification" },
  { status: "APPROVED", label: "Approved" },
  { status: "SANCTIONED", label: "Sanctioned" },
  { status: "DISBURSED", label: "Disbursed" },
];

export default function ScholarshipDetailsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scholarship, setScholarship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScholarship() {
      try {
        const response = await fetch("/api/scholarships?studentId=mock-user-123");
        if (!response.ok) throw new Error("Failed to load scholarship.");
        const data = await response.json();
        if (data.success && data.data) {
          setScholarship(data.data);
        } else {
          setScholarship(null);
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
    fetchScholarship();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ESCALATED":
      case "REJECTED":
      case "CANCELLED":
        return <Badge variant="error">{status}</Badge>;
      case "DISBURSED":
      case "SANCTIONED":
      case "APPROVED":
        return <Badge variant="success">{status}</Badge>;
      case "UNDER_VERIFICATION":
        return <Badge variant="warning">{status}</Badge>;
      case "ELIGIBLE":
      case "APPLIED":
      case "SUBMITTED":
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTimelineSteps = () => {
    if (!scholarship) return [];
    
    const isException = ["REJECTED", "CANCELLED"].includes(scholarship.status);
    
    const steps = [];
    let currentIdx = LIFECYCLE.findIndex(s => s.status === scholarship.status);
    
    if (currentIdx === -1) {
      if (isException) currentIdx = 3; // Roughly after submitted/verification
      else currentIdx = 0;
    }
    
    for (let i = 0; i < LIFECYCLE.length; i++) {
      const step = LIFECYCLE[i];
      const isCompleted = isException ? (i <= currentIdx) : (i < currentIdx);
      const isCurrent = i === currentIdx && !isException;
      
      steps.push({
        ...step,
        state: isCurrent ? 'CURRENT' : (isCompleted ? 'COMPLETED' : 'UPCOMING'),
        timestamp: isCompleted || isCurrent ? scholarship.updatedAt : null
      });
      
      if (i === currentIdx && isException) {
         steps.push({
           status: scholarship.status,
           label: scholarship.status === "REJECTED" ? "Rejected" : "Cancelled",
           state: 'EXCEPTION',
           timestamp: scholarship.updatedAt
         });
      }
    }
    return steps;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/student" passHref>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Scholarship Details</h1>
        </div>
        
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title="No Scholarship Found"
          description="We could not locate any active scholarship records for your account."
          action={<Link href="/student" passHref><Button>Back to Dashboard</Button></Link>}
        />
      </div>
    );
  }

  const timelineSteps = getTimelineSteps();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student" passHref>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Merit Scholarship {scholarship.academicYear}</h1>
            {getStatusBadge(scholarship.status)}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-surface-muted border-b border-border">
          <CardTitle className="text-lg">Application Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Application ID</p>
                <p className="font-mono font-medium">{scholarship.id.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Academic Year</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <p className="font-medium">{scholarship.academicYear}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Student ID</p>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <p className="font-medium">{scholarship.studentId}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-secondary" />
                  <p className="font-medium">{new Date(scholarship.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Amount</p>
                <p className="font-medium text-success text-lg">Subject to Approval</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processing Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 
                    ${step.state === 'COMPLETED' ? 'bg-success border-success text-white' : 
                      step.state === 'CURRENT' ? 'border-info text-info bg-info-bg' : 
                      step.state === 'EXCEPTION' ? 'bg-error border-error text-white' :
                      'border-border text-text-secondary bg-surface-muted'}`}
                  >
                    {step.state === 'COMPLETED' ? <Check className="w-4 h-4" /> : 
                     step.state === 'EXCEPTION' ? <X className="w-4 h-4" /> :
                     <span className="text-sm font-medium">{idx + 1}</span>}
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div className={`w-0.5 h-full my-1 ${step.state === 'COMPLETED' ? 'bg-success' : 'bg-border'}`} />
                  )}
                </div>
                <div className="pt-1 pb-4 flex-1">
                  <p className={`font-medium ${
                    step.state === 'COMPLETED' ? 'text-success' : 
                    step.state === 'CURRENT' ? 'text-info' : 
                    step.state === 'EXCEPTION' ? 'text-error' :
                    'text-text-secondary'
                  }`}>
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-text-secondary mt-1">
                      {new Date(step.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Needs Action Banner */}
      {scholarship.status === 'ELIGIBLE' && (
        <Card className="border-info bg-info-bg shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-info shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-info">Action Required</h3>
              <p className="text-sm text-info mt-1">
                You are eligible to apply for this scholarship. Please submit your application documents to proceed.
              </p>
            </div>
            <Link href="/student/requests/new?type=OTHER&category=SCHOLARSHIP" passHref>
              <Button size="sm">Submit Documents</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
