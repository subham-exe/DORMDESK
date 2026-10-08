"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function FacultySchedulePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const fetchSchedules = () => {
    fetch("/api/faculty/schedules").then(res => res.json()).then(data => {
      if (data.success) setSchedules(data.schedules);
    });
  };

  useEffect(() => {
    fetch("/api/faculty/courses").then(res => res.json()).then(data => {
      if (data.success) setCourses(data.courses);
    });
    fetchSchedules();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      courseId: formData.get("courseId"),
      dayOfWeek: parseInt(formData.get("dayOfWeek") as string, 10),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      room: formData.get("room"),
    };

    try {
      const res = await fetch("/api/faculty/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Schedule added successfully", variant: "success" });
        fetchSchedules();
        (e.target as HTMLFormElement).reset();
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "default" });
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Schedule Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Class Session</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Select Course</label>
              <select name="courseId" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <option value="">Select a course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Day of Week</label>
              <select name="dayOfWeek" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room / Location (Optional)</label>
              <input type="text" name="room" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="e.g. Room 101" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time (HH:MM)</label>
              <input type="time" name="startTime" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time (HH:MM)</label>
              <input type="time" name="endTime" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 mt-4">
              <Button type="submit" className="w-full">Add to Schedule</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-text-secondary">No schedules have been defined yet.</p>
          ) : (
            <div className="space-y-4">
              {days.map((dayName, dayIndex) => {
                const daySchedules = schedules.filter(s => s.dayOfWeek === dayIndex);
                if (daySchedules.length === 0) return null;
                return (
                  <div key={dayIndex} className="border border-border rounded-lg p-4 bg-surface">
                    <h3 className="font-medium text-lg border-b border-border pb-2 mb-3">{dayName}</h3>
                    <div className="space-y-2">
                      {daySchedules.map(s => (
                        <div key={s.id} className="flex justify-between items-center text-sm p-2 bg-background rounded-md border border-border">
                          <div>
                            <span className="font-medium">{s.course.code}</span> - {s.course.name}
                            {s.room && <span className="ml-2 text-text-secondary">| {s.room}</span>}
                          </div>
                          <div className="font-mono text-xs bg-surface px-2 py-1 rounded">
                            {s.startTime} - {s.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
