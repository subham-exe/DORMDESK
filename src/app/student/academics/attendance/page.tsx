import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const attendances = await prisma.attendance.findMany({
    where: { studentId: user.id },
    include: { session: { include: { course: true } } }
  });

  const subjectMap = new Map();
  attendances.forEach(att => {
    const cid = att.session.courseId;
    if (!subjectMap.has(cid)) {
      subjectMap.set(cid, { course: att.session.course, present: 0, total: 0 });
    }
    const stat = subjectMap.get(cid);
    stat.total += 1;
    if (att.status === 'PRESENT') stat.present += 1;
  });

  let totalPresent = 0;
  let totalOverall = 0;
  const subjects = Array.from(subjectMap.values());
  subjects.forEach(s => {
    totalPresent += s.present;
    totalOverall += s.total;
  });

  const overallPct = totalOverall > 0 ? Math.round((totalPresent / totalOverall) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Attendance Overview</h1>
        <p className="text-sm text-text-secondary">Track your academic presence</p>
      </div>

      <Card className={`bg-surface border-b-4 ${overallPct >= 75 ? 'border-b-success' : 'border-b-error'}`}>
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6 justify-center sm:justify-start">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${overallPct >= 75 ? 'border-success text-success' : 'border-error text-error'}`}>
            <span className="text-2xl font-bold">{overallPct}%</span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold">Overall Attendance</h2>
            <p className="text-text-secondary">{totalPresent} out of {totalOverall} classes attended</p>
            {overallPct < 75 && <p className="text-error font-medium mt-1">Warning: Your overall attendance is below the 75% requirement.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Subject-wise Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map(s => {
            const pct = Math.round((s.present / s.total) * 100);
            return (
              <Card key={s.course.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold line-clamp-1">{s.course.code}</p>
                      <p className="text-sm text-text-secondary line-clamp-1">{s.course.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${pct >= 75 ? 'text-success' : 'text-error'}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-2">
                    <div className={`h-2 rounded-full ${pct >= 75 ? 'bg-success' : 'bg-error'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 text-right">{s.present} / {s.total} Classes</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
