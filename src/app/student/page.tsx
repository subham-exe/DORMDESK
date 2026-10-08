import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { CourseService } from '@/lib/services/course';
import { FeeService } from '@/lib/services/fee';
import { redirect } from 'next/navigation';
import StudentDashboardClient from './StudentDashboardClient';

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all schedules for the student to find "Upcoming" if today is empty
  const allSchedules = await prisma.classSchedule.findMany({
    where: {
      course: { enrollments: { some: { studentId: user.id } } }
    },
    include: { course: true },
    orderBy: { startTime: 'asc' }
  });

  const [
    dashboardData,
    fees,
    requests,
    scholarship,
    announcements,
    messMenus
  ] = await Promise.all([
    CourseService.getStudentDashboard(user.id),
    FeeService.getStudentFees(user.id),
    prisma.request.findMany({
      where: { requesterId: user.id },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.scholarship.findFirst({
      where: { studentId: user.id },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.messMenu.findMany({
      where: {
        date: { gte: today }
      },
      orderBy: { date: 'asc' },
      take: 4
    })
  ]);

  // Today's mess menu items, or the nearest available menu
  const todaysMess = messMenus.filter(
    (m) => new Date(m.date).setHours(0,0,0,0) === today.getTime()
  );
  const nextMess = todaysMess.length > 0 ? todaysMess : messMenus.slice(0, 1);

  // Determine current/next schedule
  const currentDayOfWeek = today.getDay();
  let activeSchedules = dashboardData?.schedules || [];
  let isUpcomingSchedule = false;

  if (activeSchedules.length === 0 && allSchedules.length > 0) {
    // Find the next day with classes
    for (let offset = 1; offset <= 7; offset++) {
      const targetDay = (currentDayOfWeek + offset) % 7;
      const nextDaySchedules = allSchedules.filter(s => s.dayOfWeek === targetDay);
      if (nextDaySchedules.length > 0) {
        activeSchedules = nextDaySchedules;
        isUpcomingSchedule = true;
        break;
      }
    }
  }

  return (
    <StudentDashboardClient 
      user={fullUser}
      schedules={activeSchedules}
      isUpcomingSchedule={isUpcomingSchedule}
      attendance={dashboardData?.attendance || []}
      assignments={dashboardData?.assignments || []}
      fees={fees || []}
      requests={requests || []}
      scholarship={scholarship}
      announcements={announcements || []}
      todaysMess={nextMess}
    />
  );
}
