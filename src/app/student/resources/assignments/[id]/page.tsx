import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { CourseService } from '@/lib/services/course';

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const assignment = await prisma.academicAssignment.findUnique({
    where: { id: params.id },
    include: { 
      course: true,
      submissions: { where: { studentId: user.id } }
    }
  });

  if (!assignment) notFound();

  const isEnrolled = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId: assignment.courseId, studentId: user.id } }
  });
  if (!isEnrolled) notFound();

  const submission = assignment.submissions[0];
  const isOverdue = !submission && new Date(assignment.dueDate) < new Date();

  async function submitAssignmentAction(formData: FormData) {
    'use server';
    const content = formData.get('content') as string;
    if (!content) return;
    
    const actionUser = await getCurrentUser();
    if (!actionUser || actionUser.role !== 'Student') throw new Error('Unauthorized');
    
    await CourseService.submitAssignment(params.id, actionUser.id, content);
    revalidatePath(`/student/resources/assignments/` + params.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/student/resources/assignments" className="hover:text-info">Assignments</Link>
        <span>/</span>
        <span className="text-text-primary font-medium truncate">{assignment.title}</span>
      </div>

      <Card>
        <CardHeader className="border-b border-border bg-surface-muted">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <p className="text-sm text-text-secondary mt-1">{assignment.course.code} � {assignment.course.name}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`flex items-center gap-1 text-sm font-bold ${isOverdue ? 'text-error' : 'text-warning'}`}>
                <Calendar className="w-4 h-4" /> {isOverdue ? 'Overdue:' : 'Due:'} {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{assignment.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Your Submission</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {submission ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-success bg-success-bg p-4 rounded-md border border-success/20">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-bold">Successfully Submitted</p>
                  <p className="text-sm">{new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-surface-muted rounded-md border border-border">
                <h3 className="text-sm font-medium text-text-secondary mb-2">Submission Content:</h3>
                <p className="whitespace-pre-wrap text-sm">{submission.content}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isOverdue && (
                <div className="flex items-center gap-2 text-error text-sm font-medium mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  This assignment is past its due date. Late submissions may be penalized.
                </div>
              )}
              <form action={submitAssignmentAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Submission Content</label>
                  <textarea 
                    name="content" 
                    required 
                    rows={6}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Type your answer or provide a link to your work..."
                  ></textarea>
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <FileText className="w-4 h-4 mr-2" /> Submit Assignment
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
