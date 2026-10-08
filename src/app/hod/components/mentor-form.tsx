"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function MentorAssignmentForm({ faculties, students }: { faculties: any[], students: any[] }) {
  const [mentorId, setMentorId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/hod/mentors/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, studentId })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Mentor assigned successfully", variant: "success" });
        setMentorId("");
        setStudentId("");
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "default" });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Select Faculty (Mentor)</label>
        <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <option value="" disabled>Select Faculty</option>
          {faculties.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Select Student</label>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <option value="" disabled>Select Student</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.branch} - Yr {s.year})</option>)}
        </select>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Assigning..." : "Assign Mentor"}</Button>
    </form>
  );
}
