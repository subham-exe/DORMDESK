"use client";

import { useEffect, useState } from "react";

type SessionInfo = {
  id: string;
  scheduledAt: string;
  status: string;
  cancellationReason?: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  _count: { sessions: number, enrollments: number };
  sessions: SessionInfo[];
};

type DetailedSession = {
  id: string;
  scheduledAt: string;
  status: string;
  cancellationReason?: string;
  attendances: { studentId: string, status: string }[];
  course: {
    enrollments: { student: { id: string, name: string, email: string, role: string } }[];
  }
};

export default function FacultyAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailedSession, setDetailedSession] = useState<DetailedSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [attendanceChanges, setAttendanceChanges] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faculty/courses');
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchSession = async (sessionId: string) => {
    setSessionLoading(true);
    setDetailedSession(null);
    setAttendanceChanges({});
    try {
      const res = await fetch(`/api/faculty/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setDetailedSession(data.session);
        // Pre-fill existing attendance
        const initialChanges: Record<string, string> = {};
        data.session.attendances.forEach((att: { studentId: string, status: string }) => {
          initialChanges[att.studentId] = att.status;
        });
        setAttendanceChanges(initialChanges);
      }
    } catch (e) {
      console.error(e);
    }
    setSessionLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchCourses();
  }, []);

  const handleSelectSession = (course: Course, session: SessionInfo) => {
    setSelectedCourse(course);
    setSelectedSessionId(session.id);
    fetchSession(session.id);
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceChanges(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!detailedSession) return;
    setSaving(true);
    try {
      const payload = Object.entries(attendanceChanges).map(([studentId, status]) => ({ studentId, status }));
      const res = await fetch(`/api/faculty/sessions/${detailedSession.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceData: payload })
      });
      const data = await res.json();
      if (data.success) {
        alert("Attendance saved successfully");
        fetchSession(detailedSession.id);
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Failed to save");
    }
    setSaving(false);
  };

  const cancelSession = async () => {
    if (!detailedSession) return;
    if (!confirm("Are you sure you want to cancel this class session? This will notify all enrolled students.")) return;
    
    setCancelling(true);
    try {
      const res = await fetch(`/api/faculty/sessions/${detailedSession.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (data.success) {
        alert("Session cancelled successfully");
        setCancelReason("");
        fetchSession(detailedSession.id);
        fetchCourses(); // refresh sessions list
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Failed to cancel session");
    }
    setCancelling(false);
  };

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Faculty Attendance & Sessions</h1>
      
      {!selectedSessionId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <div key={course.id} className="bg-surface border border-border rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-bold text-primary">{course.code}: {course.name}</h2>
              <p className="text-sm text-text-secondary mt-1">{course._count.enrollments} Students Enrolled</p>
              
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold text-text-primary">Sessions</h3>
                {course.sessions.length === 0 ? (
                  <p className="text-sm text-text-secondary">No sessions scheduled.</p>
                ) : (
                  <ul className="space-y-2">
                    {course.sessions.map(s => (
                      <li key={s.id} className="flex justify-between items-center bg-surface-muted p-2 rounded-md">
                        <div>
                          <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'CANCELLED' ? 'bg-danger-bg text-danger' : s.status === 'COMPLETED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                            {s.status}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleSelectSession(course, s)}
                          className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Manage
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <button 
            onClick={() => setSelectedSessionId(null)}
            className="text-primary hover:underline text-sm mb-4 inline-block"
          >
            &larr; Back to Courses
          </button>
          
          {sessionLoading ? (
            <p>Loading session details...</p>
          ) : detailedSession ? (
            <div>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-primary">{selectedCourse?.code} Session</h2>
                  <p className="text-text-secondary">{new Date().toLocaleString()}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-sm rounded-full ${detailedSession.status === 'CANCELLED' ? 'bg-danger-bg text-danger' : detailedSession.status === 'COMPLETED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                      {detailedSession.status}
                    </span>
                  </div>
                </div>
                
                {detailedSession.status !== 'CANCELLED' && (
                  <div className="flex flex-col gap-2 items-end">
                    <input 
                      type="text" 
                      placeholder="Cancellation Reason (optional)" 
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      className="text-sm px-2 py-1 border border-border rounded-md"
                    />
                    <button 
                      onClick={cancelSession}
                      disabled={cancelling}
                      className="px-3 py-1.5 bg-danger text-white text-sm rounded-md hover:bg-danger/90 disabled:opacity-50 transition-colors"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Session'}
                    </button>
                  </div>
                )}
              </div>
              
              {detailedSession.status === 'CANCELLED' ? (
                <div className="p-4 bg-danger-bg text-danger rounded-md mb-6">
                  <p className="font-semibold">This session was cancelled.</p>
                  {detailedSession.cancellationReason && <p>Reason: {detailedSession.cancellationReason}</p>}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-secondary">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedSession.course.enrollments.map((en, idx) => {
                          const status = attendanceChanges[en.student.id];
                          return (
                            <tr key={en.student.id} className={idx % 2 === 0 ? "bg-surface" : "bg-surface-muted"}>
                              <td className="py-3 px-4">
                                <div className="font-medium text-text-primary">{en.student.name}</div>
                                <div className="text-xs text-text-secondary">{en.student.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleAttendanceChange(en.student.id, 'PRESENT')}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${status === 'PRESENT' ? 'bg-success text-white' : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted'}`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    onClick={() => handleAttendanceChange(en.student.id, 'ABSENT')}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${status === 'ABSENT' ? 'bg-danger text-white' : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted'}`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={saveAttendance}
                      disabled={saving}
                      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p>Session not found.</p>
          )}
        </div>
      )}
    </div>
  );
}
