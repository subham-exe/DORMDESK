import { getCurrentUser } from '@/lib/auth/session';
import { getAuthorityName } from '@/lib/auth/authority';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MentorService } from '@/lib/services/mentor';
import { revalidatePath } from 'next/cache';

export default async function HodDashboard() {
  const user = await getCurrentUser();
  if (!user || getAuthorityName(user) !== 'HOD') redirect('/login');

  const departmentId = user.departmentRefId;
  const collegeId = user.collegeId;

  if (!departmentId || !collegeId) throw new Error('HOD lacks proper scope');

  // Fetch all faculty in this department
  const faculties = await prisma.user.findMany({
    where: { departmentRefId: departmentId, collegeId, role: { in: ['Faculty', 'HOD'] } },
    select: { id: true, name: true }
  });

  // Fetch all students in this department
  const students = await prisma.user.findMany({
    where: { departmentRefId: departmentId, collegeId, role: 'Student' },
    select: { id: true, name: true, year: true, branch: true }
  });

  // Fetch all active assignments
  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: { 
      active: true,
      student: { departmentRefId: departmentId, collegeId }
    },
    include: { student: true, mentor: true }
  });

  async function assignMentorAction(formData: FormData) {
    'use server';
    const actionUser = await getCurrentUser();
    if (!actionUser || actionUser.role !== 'HOD') throw new Error('Unauthorized');
    
    const mentorId = formData.get('mentorId') as string;
    const studentId = formData.get('studentId') as string;

    if (!mentorId || !studentId) return;

    await MentorService.assignMentor(actionUser.id, mentorId, studentId);
    revalidatePath('/hod');
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">HOD Dashboard</h1>
          <p className="text-sm text-text-secondary">Department Overview & Operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={assignMentorAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Faculty (Mentor)</label>
                <select name="mentorId" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <option value="" disabled>Select Faculty</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Student</label>
                <select name="studentId" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <option value="" disabled>Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch} - Yr {s.year})</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full">Assign Mentor</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Mentor Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto space-y-2">
              {activeAssignments.length === 0 ? (
                <p className="text-sm text-text-secondary">No active assignments.</p>
              ) : (
                activeAssignments.map(a => (
                  <div key={a.id} className="p-3 bg-surface-muted rounded text-sm flex justify-between">
                    <div>
                      <p className="font-bold">{a.student.name}</p>
                      <p className="text-xs text-text-secondary">Mentee</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{a.mentor.name}</p>
                      <p className="text-xs text-text-secondary">Mentor</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
