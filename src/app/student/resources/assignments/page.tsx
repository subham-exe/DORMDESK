import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function AssignmentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const assignments = await prisma.academicAssignment.findMany({
    where: { course: { enrollments: { some: { studentId: user.id } } } },
    include: { 
      course: true,
      submissions: { where: { studentId: user.id } }
    },
    orderBy: { dueDate: 'asc' }
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Assignments</h1>
        <p className="text-sm text-text-secondary">Manage your coursework and deadlines</p>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="p-4 md:p-8 text-center text-text-secondary bg-surface rounded-lg border border-border">
            No assignments found.
          </div>
        ) : (
          assignments.map(a => {
            const isSubmitted = a.submissions.length > 0;
            const isOverdue = !isSubmitted && new Date(a.dueDate) < now;
            
            return (
              <Link key={a.id} href={`/student/resources/assignments/${a.id}`} className="block">
                <Card className={`hover:border-info transition-colors ${isOverdue ? 'border-error/50' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSubmitted ? 'bg-success-bg text-success' : isOverdue ? 'bg-error-bg text-error' : 'bg-warning-bg text-warning'}`}>
                        {isSubmitted ? <CheckCircle className="w-5 h-5" /> : isOverdue ? <Clock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">{a.title}</h2>
                        <p className="text-sm text-text-secondary">{a.course.code} â¢ {a.course.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isOverdue ? 'text-error' : ''}`}>
                        {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Due ' + new Date(a.dueDate).toLocaleDateString()}
                      </p>
                      {!isSubmitted && !isOverdue && (
                        <p className="text-xs text-text-secondary mt-1">
                          {Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 3600 * 24))} days left
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
