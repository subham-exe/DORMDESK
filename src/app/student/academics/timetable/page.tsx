import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const schedules = await prisma.classSchedule.findMany({
    where: { course: { enrollments: { some: { studentId: user.id } } } },
    include: { course: { include: { user: true } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Weekly Timetable</h1>
        <p className="text-sm text-text-secondary">Your standard class schedule</p>
      </div>

      <div className="space-y-8">
        {days.map((dayName, dayIndex) => {
          const daySchedules = schedules.filter(s => s.dayOfWeek === dayIndex);
          if (daySchedules.length === 0) return null;

          return (
            <div key={dayIndex} className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2">{dayName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-4">
                {daySchedules.map(sch => (
                  <Card key={sch.id} className="hover:border-info transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-primary">{sch.course.code}</p>
                          <p className="text-sm font-medium line-clamp-1">{sch.course.name}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-surface-muted">THEORY</span>
                      </div>
                      <div className="text-sm text-text-secondary flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(sch.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(sch.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        <p>Room: {sch.room || 'TBA'}</p>
                        <p className="line-clamp-1">Faculty: {sch.course.user.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

