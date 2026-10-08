"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function NewAssignmentPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    fetch("/api/faculty/courses").then(res => res.json()).then(data => {
      if (data.success) setCourses(data.courses);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      courseId: formData.get("courseId"),
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
    };

    try {
      const res = await fetch("/api/faculty/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Assignment created successfully", variant: "success" });
        router.push("/faculty/assignments");
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "default" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Create Assignment</h1>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Course</label>
              <select name="courseId" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <option value="">Select a course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignment Title</label>
              <input type="text" name="title" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="datetime-local" name="dueDate" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" rows={5} required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="Instructions for students..."></textarea>
            </div>
            <Button type="submit" className="w-full">Create Assignment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
