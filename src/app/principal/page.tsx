import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, BookOpen } from 'lucide-react';

export default async function PrincipalDashboard() {
  const user = await getCurrentUser();
  if (!user || (user as any).authority?.name !== 'PRINCIPAL') redirect('/login');

  const collegeId = user.collegeId;
  if (!collegeId) throw new Error('Principal must be bound to a college');

  const departments = await prisma.department.findMany({
    where: { collegeId },
    include: {
      _count: { select: { users: true } }
    }
  });

  const studentCount = await prisma.user.count({ where: { collegeId, role: 'Student' } });
  const facultyCount = await prisma.user.count({ where: { collegeId, role: { in: ['Faculty', 'HOD'] } } });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Principal Dashboard</h1>
          <p className="text-sm text-text-secondary">College-wide Overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-info-bg text-info flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Students</p>
              <p className="text-2xl font-bold">{studentCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success-bg text-success flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Faculty & HODs</p>
              <p className="text-2xl font-bold">{facultyCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Departments</p>
              <p className="text-2xl font-bold">{departments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departments Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(d => (
              <div key={d.id} className="p-4 border border-border rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{d.name}</h3>
                  <p className="text-xs text-text-secondary">ID: {d.id}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-surface-muted rounded text-sm font-semibold">
                    {d._count.users} Users
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
