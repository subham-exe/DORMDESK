"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export default function FacultyAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faculty/assignments");
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const viewSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/faculty/assignments/${assignment.id}/submissions`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "default" });
    }
    setSubmissionsLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Manage Assignments</h1>
        <Link href="/faculty/assignments/new">
          <Button className="bg-primary text-text-inverse hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> New Assignment
          </Button>
        </Link>
      </div>

      {loading ? (
        <div>Loading assignments...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map(a => (
            <Card key={a.id}>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <p className="text-sm text-text-secondary">{a.course?.code} - {a.course?.name}</p>
                  <p className="text-sm mt-2 text-text-secondary line-clamp-2">{a.description}</p>
                  <p className="text-sm font-medium mt-4">Due: {new Date(a.dueDate).toLocaleString()}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <div className="flex items-center text-sm text-text-secondary">
                    <Users className="w-4 h-4 mr-1" />
                    {a._count?.submissions || 0} Submissions
                  </div>
                  <Button variant="outline" onClick={() => viewSubmissions(a)}>
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {assignments.length === 0 && <div className="text-text-secondary p-4">No assignments created yet.</div>}
        </div>
      )}

      <Modal 
        isOpen={!!selectedAssignment} 
        onClose={() => setSelectedAssignment(null)}
        title={`Submissions: ${selectedAssignment?.title}`}
      >
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4 pr-2">
          {submissionsLoading ? (
            <p>Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-text-secondary">No submissions yet.</p>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="p-4 rounded-lg bg-surface-muted border border-border">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-text-primary">{sub.student?.name}</div>
                  <div className="text-xs text-text-secondary">{new Date(sub.submittedAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-text-secondary bg-surface p-3 rounded border border-border mt-2 whitespace-pre-wrap">
                  {sub.content}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
