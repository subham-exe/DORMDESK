"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function NewMaterialPage() {
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
      type: formData.get("type"),
      fileUrl: formData.get("fileUrl"),
    };

    try {
      const res = await fetch("/api/faculty/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Material published successfully", variant: "success" });
        router.push("/faculty");
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "default" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Publish Material</h1>
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
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" name="title" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Material Type</label>
              <select name="type" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <option value="DOCUMENT">Document</option>
                <option value="VIDEO">Video Link</option>
                <option value="LINK">External Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resource URL (Optional)</label>
              <input type="url" name="fileUrl" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="https://..." />
              <p className="text-xs text-text-secondary mt-1">Provide a link to an external resource, drive, or video.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <textarea name="description" rows={4} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"></textarea>
            </div>
            <Button type="submit" className="w-full">Publish</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
