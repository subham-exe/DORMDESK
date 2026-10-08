"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Clock, BookOpen, Calendar, Utensils, CreditCard,
  MapPin, Megaphone, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOfflineMutations, deleteOfflineMutation } from "@/lib/services/offline-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StudentDashboardClient({ user, schedules, isUpcomingSchedule, attendance, assignments, fees, requests: initialRequests, scholarship, announcements, todaysMess }: any) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dormdesk_dismissed_announcements");
        if (stored) return new Set(JSON.parse(stored));
      } catch {
        // ignore error
      }
    }
    return new Set();
  });

  useEffect(() => {
    async function syncOffline() {
      try {
        const offlineRequests = await getOfflineMutations(user.id);
        const pending = offlineRequests.filter(r => r.type === "CREATE_REQUEST" && r.userId === user.id);
        
        if (pending.length > 0) {
          const merged = [
            ...pending.map(r => ({ ...r.payload, id: `offline-${r.idempotencyKey}`, title: r.payload.requestType, status: 'PENDING_SYNC' })),
            ...initialRequests
          ];
          setRequests(merged);

          if (navigator.onLine) {
            for (const offReq of pending) {
              try {
                const payload = offReq.payload;
                const syncRes = await fetch("/api/requests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (syncRes.ok) {
                  await deleteOfflineMutation(offReq.idempotencyKey);
                }
              } catch { }
            }
            // Refresh requests
            const newReqsRes = await fetch("/api/requests");
            if (newReqsRes.ok) setRequests(await newReqsRes.json());
          }
        }
      } catch { }
    }
    syncOffline();
  }, [user.id, initialRequests]);

  const recentRequests = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);

  const activeAnnouncements = announcements.filter((a: any) => !dismissedAnnouncements.has(a.id));

  // Compute attendance stats
  const totalSessions = attendance.reduce((acc: number, curr: any) => acc + curr._count, 0);
  const presentSessions = attendance.find((a: any) => a.status === 'PRESENT')?._count || 0;
  const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;
  
  const overdueFees = fees.filter((f: any) => f.status !== 'PAID' && new Date(f.dueDate) < new Date());
  
  const now = new Date();

  // Create readable display ID
  const displayId = user.id.startsWith('sim-stu-') 
    ? `STU-${user.id.replace('sim-stu-', '').padStart(4, '0')}` 
    : user.id.startsWith('demo-stu-')
    ? `STU-${user.id.replace('demo-stu-', '').padStart(4, '0')}`
    : `STU-${user.id.substring(0,6).toUpperCase()}`;

  return (
    <div className="pb-16 md:pb-8">
      
      {/* 1. STUDENT IDENTITY HEADER (Borderless Banner) */}
      <div className="bg-surface-muted border-b border-border p-6 sm:px-8 sm:py-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Good morning, {user.name?.split(' ')[0] || 'Student'}</h1>
            <div className="flex flex-wrap items-center text-sm text-text-secondary mt-1 gap-x-2 gap-y-1">
              <span className="font-semibold text-text-primary">{displayId}</span>
              <span className="opacity-50">•</span>
              <span>{user.department || 'Undecided'} {user.year ? `(Yr ${user.year})` : ''}</span>
              {user.isResident && user.hostel && (
                <>
                  <span className="hidden sm:inline opacity-50">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {user.hostel} {user.room ? `- Room ${user.room}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* QUICK ACTIONS IN HEADER */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto mt-2 md:mt-0">
          <Button size="sm" asChild>
            <Link href="/student/requests/new">
              <Plus className="w-4 h-4 mr-1" /> New Request
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/requests">
              <FileText className="w-4 h-4 mr-1" /> Request Leave
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: ACADEMICS TIMELINE */}
          <div className="xl:col-span-7 space-y-10">
            
            {/* SCHEDULE TIMELINE */}
            <section>
              <div className="flex items-center justify-between mb-5 border-b border-border pb-2">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> 
                  {isUpcomingSchedule ? "Upcoming Schedule" : "Today's Schedule"}
                </h2>
                <Link href="/student/academics/timetable" className="text-sm text-info font-medium hover:underline">Full Timetable</Link>
              </div>
              
              {schedules.length > 0 ? (
                <div className="relative border-l-2 border-border/60 ml-2.5 space-y-6 mt-4">
                  {schedules.map((s: any) => {
                    let isCurrentOrNext = false;
                    let isPast = false;
                    
                    if (!isUpcomingSchedule) {
                      const [sh, sm] = s.startTime.split(':').map(Number);
                      const [eh, em] = s.endTime.split(':').map(Number);
                      const start = new Date(now).setHours(sh, sm, 0, 0);
                      const end = new Date(now).setHours(eh, em, 0, 0);
                      const currentTime = now.getTime();
                      
                      if (currentTime >= start && currentTime <= end) isCurrentOrNext = true;
                      else if (currentTime > end) isPast = true;
                      else if (currentTime < start && !schedules.some((other:any) => {
                        const [oh, om] = other.endTime.split(':').map(Number);
                        const oEnd = new Date(now).setHours(oh, om, 0, 0);
                        return oEnd > currentTime && oEnd < end;
                      })) {
                        isCurrentOrNext = true;
                      }
                    } else if (s === schedules[0]) {
                      isCurrentOrNext = true; // Highlight first upcoming if it's tomorrow
                    }

                    return (
                      <div key={s.id} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-surface ${isCurrentOrNext ? 'bg-primary ring-2 ring-primary/20' : isPast ? 'bg-border' : 'bg-surface-muted border-border'}`} />
                        <div className="flex items-start justify-between">
                          <div className={isPast ? 'opacity-60' : ''}>
                            <p className={`font-semibold ${isCurrentOrNext ? 'text-primary' : 'text-text-primary'}`}>{s.startTime} - {s.endTime}</p>
                            <p className="text-sm font-medium mt-0.5">{s.course.name}</p>
                            <p className="text-xs text-text-secondary">{s.course.code} • {s.room || 'TBA'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-2">No classes scheduled.</p>
              )}
            </section>

            {/* ASSIGNMENTS LIST */}
            <section>
              <div className="flex items-center justify-between mb-5 border-b border-border pb-2">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Assignments
                </h2>
                <Link href="/student/resources/assignments" className="text-sm text-info font-medium hover:underline">View all</Link>
              </div>
              
              {assignments.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {assignments.slice(0, 4).map((a:any) => {
                     const dueDate = new Date(a.dueDate);
                     const isDueToday = dueDate.toDateString() === now.toDateString();
                     
                     return (
                       <div key={a.id} className="flex justify-between items-center py-3">
                          <div className="min-w-0 pr-4">
                            <p className="text-sm font-semibold truncate">{a.title}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{a.course.code}</p>
                          </div>
                          <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-md ${isDueToday ? 'bg-error/10 text-error' : 'bg-surface-muted text-text-secondary'}`}>
                            {isDueToday ? 'Due Today' : dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                          </span>
                       </div>
                     )
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-2">No upcoming assignments.</p>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: METRICS & CAMPUS */}
          <div className="xl:col-span-5 space-y-10">
            
            {/* ACADEMIC METRICS */}
            <section>
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Academic Metrics</h2>
              
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-semibold text-text-primary text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-secondary"/> Attendance
                  </span>
                  <span className={`font-bold ${attendancePercentage < 75 ? 'text-error' : 'text-success'}`}>{attendancePercentage}%</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-2.5 border border-border/50">
                  <div className={`h-full rounded-full transition-all ${attendancePercentage < 75 ? 'bg-error' : 'bg-success'}`} style={{ width: `${Math.min(100, attendancePercentage)}%` }} />
                </div>
                <p className="text-xs text-text-secondary mt-1.5 text-right font-medium">{totalSessions > 0 ? `${presentSessions}/${totalSessions} sessions` : 'No records yet'}</p>
              </div>
            </section>

            {/* CAMPUS SNAPSHOT */}
            <section>
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Campus Services</h2>
              
              <div className="space-y-4">
                {/* Mess Menu Compact */}
                <div className="bg-surface-muted/50 border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Utensils className="w-4 h-4 text-primary"/> 
                    {todaysMess.length > 0 && new Date(todaysMess[0].date).toDateString() === now.toDateString() ? "Today's Menu" : "Next Available Menu"}
                  </h3>
                  {todaysMess.length > 0 ? (
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{todaysMess[0].items}</p>
                  ) : (
                    <p className="text-sm text-text-secondary italic">Menu hasn't been published yet.</p>
                  )}
                </div>

                {/* Overdue Fees Highlight */}
                {overdueFees.length > 0 && (
                  <div className="bg-error/5 border border-error/20 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-error flex items-center gap-2"><CreditCard className="w-4 h-4"/> Outstanding Fees</h3>
                      <p className="text-xs text-error/80 mt-0.5">{overdueFees[0].description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-error">₹{overdueFees[0].amount}</p>
                      <Link href="/student/campus/fees" className="text-xs font-semibold text-error hover:underline">Pay Now</Link>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* NOTICES FEED */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" /> Campus Notices
                </h2>
                <Link href="/student/notices" className="text-sm text-info font-medium hover:underline">View all</Link>
              </div>
              
              {activeAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {activeAnnouncements.slice(0, 2).map((announcement: any) => (
                    <div key={announcement.id} className="bg-info/5 border border-info/20 rounded-lg p-3 flex gap-3 relative">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-text-primary truncate">{announcement.title}</h3>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{announcement.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-2">No recent notices.</p>
              )}
            </section>

            {/* COMPACT SUPPORT STATUS */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h2 className="text-lg font-bold text-text-primary">Support Requests</h2>
                <Link href="/student/requests" className="text-sm text-info font-medium hover:underline">Track</Link>
              </div>
              
              {recentRequests.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentRequests.map(req => (
                    <div key={req.id} className="flex justify-between items-center py-2.5">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium truncate">{req.title || req.type}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-2">No recent requests.</p>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
