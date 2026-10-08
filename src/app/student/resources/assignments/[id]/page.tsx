"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { use } from "react";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/student/assignments").then(res => res.json()).then(data => {
      if (data.success) {
        const found = data.assignments.find((a: any) => a.id === resolvedParams.id);
        setAssignment(found);
      }
      setLoading(false);
    });
  }, [resolvedParams.id]);

  if (loading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found or unauthorized.</div>;

  const submission = assignment.submissions?.[0];
  const isOverdue = !submission && new Date(assignment.dueDate) < new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Assignment submitted successfully", variant: "success" });
        window.location.reload(); 
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "default" });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/student/resources/assignments" className="hover:text-info">Assignments</Link>
        <span>/</span>
        <span className="text-text-primary font-medium truncate">{assignment.title}</span>
      </div>

      <Card>
        <CardHeader className="border-b border-border bg-surface-muted">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <p className="text-sm text-text-secondary mt-1">{assignment.course?.code} - {assignment.course?.name}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center text-sm font-medium text-text-secondary mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Due: {new Date(assignment.dueDate).toLocaleString()}
              </div>
              {submission ? (
                <div className="flex items-center text-success bg-success-bg px-3 py-1 rounded-full text-sm font-medium border border-success/20">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submitted
                </div>
              ) : isOverdue ? (
                <div className="flex items-center text-error bg-error-bg px-3 py-1 rounded-full text-sm font-medium border border-error/20">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Overdue
                </div>
              ) : (
                <div className="flex items-center text-warning bg-warning-bg px-3 py-1 rounded-full text-sm font-medium border border-warning/20">
                  <FileText className="w-4 h-4 mr-2" />
                  Pending
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none mb-8 text-text-primary">
            {assignment.description.split('\n').map((para: string, idx: number) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Your Submission</h3>
            
            {submission ? (
              <div className="space-y-4">
                <div className="p-4 bg-surface-muted rounded-lg border border-border">
                  <p className="text-sm text-text-secondary mb-2">
                    Submitted on {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                  <div className="whitespace-pre-wrap text-sm text-text-primary">
                    {submission.content}
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {submission ? 'Update Submission Content' : 'Submission Content'}
                </label>
                <textarea 
                  name="content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  rows={6} 
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  placeholder="Type your answer or paste a link to your work..."
                ></textarea>
              </div>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Submitting...' : (submission ? 'Update Submission' : 'Submit Assignment')}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
