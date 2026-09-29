"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type SessionInfo = {
  id: string;
  scheduledAt: string;
  status: string;
  cancellationReason?: string;
  attendanceStatus: string | null;
};

type CourseAttendance = {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalSessions: number;
  recordedSessions: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
  sessions: SessionInfo[];
};

export default function StudentAttendance() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch('/api/student/attendance');
        const data = await res.json();
        if (data.success) {
          setCourses(data.attendance);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">{t("attendance.title")}</h1>

      {courses.length === 0 ? (
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border text-center">
          <p className="text-text-secondary">{t("attendance.no_enrollment")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {courses.map(course => (
            <div key={course.courseId} className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">{course.courseCode}: {course.courseName}</h2>
                  <p className="text-sm text-text-secondary mt-1">{t("attendance.total_sessions")}: {course.totalSessions}</p>
                </div>
                
                <div className="flex gap-4 text-center">
                  <div className="bg-success-bg p-3 rounded-md min-w-[80px]">
                    <div className="text-success font-bold text-xl">{course.presentCount}</div>
                    <div className="text-xs text-success">{t("attendance.present")}</div>
                  </div>
                  <div className="bg-danger-bg p-3 rounded-md min-w-[80px]">
                    <div className="text-danger font-bold text-xl">{course.absentCount}</div>
                    <div className="text-xs text-danger">{t("attendance.absent")}</div>
                  </div>
                  <div className="bg-info-bg p-3 rounded-md min-w-[80px]">
                    <div className="text-info font-bold text-xl">{course.percentage}%</div>
                    <div className="text-xs text-info">{t("nav.attendance")}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 bg-surface-muted">
                <h3 className="font-semibold text-text-primary mb-4">{t("attendance.history")}</h3>
                
                {course.sessions.length === 0 ? (
                  <p className="text-sm text-text-secondary">{t("attendance.no_sessions")}</p>
                ) : (
                  <div className="space-y-3">
                    {course.sessions.map(session => (
                      <div key={session.id} className="flex justify-between items-center bg-surface p-3 rounded-md border border-border">
                        <div>
                          <p className="font-medium text-text-primary">{new Date().toLocaleString()}</p>
                          {session.status === 'CANCELLED' && (
                            <p className="text-xs text-danger mt-1">
                              {t("attendance.cancelled")} {session.cancellationReason && `- ${session.cancellationReason}`}
                            </p>
                          )}
                        </div>
                        <div>
                          {session.status === 'CANCELLED' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-danger-bg text-danger font-medium">{t("attendance.cancelled")}</span>
                          ) : session.status === 'SCHEDULED' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-warning-bg text-warning font-medium">{t("attendance.upcoming")}</span>
                          ) : session.attendanceStatus === 'PRESENT' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-success-bg text-success font-medium">{t("attendance.present")}</span>
                          ) : session.attendanceStatus === 'ABSENT' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-danger-bg text-danger font-medium">{t("attendance.absent")}</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-surface-muted border border-border text-text-secondary font-medium">{t("attendance.not_marked")}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
