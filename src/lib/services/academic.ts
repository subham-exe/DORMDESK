import { prisma } from '../db/prisma';

export class AcademicService {
  /**
   * Get courses owned by a specific faculty
   */
  static async getFacultyCourses(facultyId: string) {
    return prisma.course.findMany({
      where: { facultyId },
      include: {
        _count: {
          select: { sessions: true, enrollments: true },
        },
        sessions: {
          orderBy: { scheduledAt: 'desc' }
        }
      },
    });
  }

  /**
   * Get a specific session for a faculty, with enrolled students and attendance
   */
  static async getFacultySession(facultyId: string, sessionId: string) {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: {
                  select: { id: true, name: true, email: true, role: true }
                }
              }
            }
          }
        },
        attendances: true
      }
    });

    if (!session || session.course.facultyId !== facultyId) {
      throw new Error('Unauthorized or session not found');
    }

    return session;
  }

  /**
   * Update attendance for a session
   */
  static async updateAttendance(facultyId: string, sessionId: string, attendanceData: { studentId: string, status: string }[]) {
    // Verify ownership
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    });

    if (!session || session.course.facultyId !== facultyId) {
      throw new Error('Unauthorized or session not found');
    }

    if (session.status === 'CANCELLED') {
      throw new Error('Cannot update attendance for a cancelled session');
    }

    // Process attendance using transaction
    const results = await prisma.$transaction(async (tx) => {
      // Create or update each attendance record
      const ops = attendanceData.map(data => 
        tx.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: data.studentId
            }
          },
          update: { status: data.status },
          create: {
            sessionId,
            studentId: data.studentId,
            status: data.status
          }
        })
      );

      const records = await Promise.all(ops);
      
      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: facultyId,
          action: 'ATTENDANCE_UPDATED',
          entity: 'ClassSession',
          entityId: sessionId,
          metadata: JSON.stringify({ updatedCount: records.length })
        }
      });
      
      return records;
    });

    return results;
  }

  /**
   * Cancel a class session
   */
  static async cancelSession(facultyId: string, sessionId: string, reason?: string) {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { 
        course: {
          include: {
            enrollments: true
          }
        }
      }
    });

    if (!session || session.course.facultyId !== facultyId) {
      throw new Error('Unauthorized or session not found');
    }

    if (session.status === 'CANCELLED') {
      return session; // Idempotent
    }

    const updatedSession = await prisma.$transaction(async (tx) => {
      const updated = await tx.classSession.update({
        where: { id: sessionId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason
        }
      });

      // Notify enrolled students
      for (const enrollment of session.course.enrollments) {
        await tx.notification.create({
          data: {
            recipientId: enrollment.studentId,
            title: 'Class Cancelled',
            message: `The class session for ${session.course.code} scheduled on ${new Date(session.scheduledAt).toLocaleDateString()} has been cancelled.${reason ? ' Reason: ' + reason : ''}`,
            type: 'SYSTEM_ALERT'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: facultyId,
          action: 'CLASS_CANCELLED',
          entity: 'ClassSession',
          entityId: sessionId,
          metadata: JSON.stringify({ reason })
        }
      });

      return updated;
    });

    return updatedSession;
  }

  /**
   * Get attendance summary and detailed list for a student
   */
  static async getStudentAttendance(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            sessions: {
              include: {
                attendances: {
                  where: { studentId }
                }
              },
              orderBy: { scheduledAt: 'desc' }
            }
          }
        }
      }
    });

    const coursesSummary = enrollments.map(enrollment => {
      const allSessions = enrollment.course.sessions;
      const validSessions = allSessions.filter(s => s.status !== 'CANCELLED');
      const presentCount = validSessions.reduce((count, session) => {
        const att = session.attendances[0];
        return count + (att?.status === 'PRESENT' ? 1 : 0);
      }, 0);
      const absentCount = validSessions.reduce((count, session) => {
        const att = session.attendances[0];
        return count + (att?.status === 'ABSENT' ? 1 : 0);
      }, 0);
      const totalRecorded = presentCount + absentCount;

      const percentage = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0;

      return {
        courseId: enrollment.course.id,
        courseCode: enrollment.course.code,
        courseName: enrollment.course.name,
        totalSessions: validSessions.length,
        recordedSessions: totalRecorded,
        presentCount,
        absentCount,
        percentage,
        sessions: allSessions.map(s => ({
          id: s.id,
          scheduledAt: s.scheduledAt,
          status: s.status,
          cancellationReason: s.cancellationReason,
          attendanceStatus: s.attendances[0]?.status || null
        }))
      };
    });

    return coursesSummary;
  }
}
