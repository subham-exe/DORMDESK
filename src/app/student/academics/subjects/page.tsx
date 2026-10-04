import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, User } from 'lucide-react';
import Link from 'next/link';

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: { 
      course: { 
        include: { 
          user: true,
          _count: { select: { materials: true, assignments: true } }
        } 
      } 
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Subjects</h1>
        <p className="text-sm text-text-secondary">Currently enrolled courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {enrollments.map(e => (
          <Card key={e.courseId} className="flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-info-bg flex items-center justify-center text-info">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-surface-muted rounded">{e.course.code}</span>
              </div>
              <h2 className="text-lg font-bold mb-1">{e.course.name}</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                <User className="w-4 h-4" />
                <span>{e.course.user.name}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border flex justify-between">
                <Link href="/student/resources/materials" className="text-sm text-info hover:underline">
                  {e.course._count.materials} Materials
                </Link>
                <Link href="/student/resources/assignments" className="text-sm text-info hover:underline">
                  {e.course._count.assignments} Assignments
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

