import { getCurrentUser } from '@/lib/auth/session';
import { CourseService } from '@/lib/services/course';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function NewAssignmentPage({ searchParams }: { searchParams: { courseId?: string } }) {
  const user = await getCurrentUser();
  if (!user || (user as any).authority?.name !== 'FACULTY') redirect('/login');

  const courses = await prisma.course.findMany({ where: { facultyId: user.id } });

  async function createAssignment(formData: FormData) {
    'use server';
    const actionUser = await getCurrentUser();
    if (!actionUser || actionUser.role !== 'Faculty') throw new Error('Unauthorized');

    const courseId = formData.get('courseId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDateStr = formData.get('dueDate') as string;

    if (!courseId || !title || !description || !dueDateStr) throw new Error('Missing required fields');

    await CourseService.createAssignment(courseId, actionUser.id, { 
      title, 
      description, 
      dueDate: new Date(dueDateStr) 
    });
    redirect('/faculty');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Create Assignment</h1>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <form action={createAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Course</label>
              <select name="courseId" defaultValue={searchParams.courseId} required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <option value="" disabled>Select a course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignment Title</label>
              <input type="text" name="title" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="datetime-local" name="dueDate" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" rows={5} required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="Instructions for students..."></textarea>
            </div>
            <Button type="submit" className="w-full">Create Assignment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
