import { getCurrentUser } from '@/lib/auth/session';
import { getAuthorityName } from '@/lib/auth/authority';
import { CourseService } from '@/lib/services/course';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function NewMaterialPage({ searchParams }: { searchParams: { courseId?: string } }) {
  const user = await getCurrentUser();
  if (!user || getAuthorityName(user) !== 'FACULTY') redirect('/login');

  const courses = await prisma.course.findMany({ where: { facultyId: user.id } });

  async function uploadMaterial(formData: FormData) {
    'use server';
    const actionUser = await getCurrentUser();
    if (!actionUser || actionUser.role !== 'Faculty') throw new Error('Unauthorized');

    const courseId = formData.get('courseId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const fileUrl = formData.get('fileUrl') as string;

    if (!courseId || !title || !type) throw new Error('Missing required fields');

    await CourseService.createMaterial(courseId, actionUser.id, { title, description, fileUrl, type });
    redirect('/faculty');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Publish Study Material</h1>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <form action={uploadMaterial} className="space-y-4">
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
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" name="title" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select name="type" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <option value="NOTES">Lecture Notes</option>
                <option value="SYLLABUS">Syllabus</option>
                <option value="REFERENCE">Reference Document</option>
                <option value="LAB">Lab Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <textarea name="description" rows={3} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resource URL (Optional for Phase 1)</label>
              <input type="url" name="fileUrl" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <Button type="submit" className="w-full">Publish Material</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
