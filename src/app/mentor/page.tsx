import { getCurrentUser } from '@/lib/auth/session';
import { MentorService } from '@/lib/services/mentor';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default async function MentorDashboard() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'Faculty' && user.role !== 'HOD')) redirect('/login');

  const mentees = await MentorService.getMentorDashboard(user.id);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Mentor Dashboard</h1>
          <p className="text-sm text-text-secondary">Overview of your assigned students</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-info" /> My Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mentees.length === 0 ? (
            <p className="text-sm text-text-secondary p-4 text-center border rounded-md">You have no students assigned to you.</p>
          ) : (
            <div className="divide-y divide-border">
              {mentees.map(assignment => (
                <div key={assignment.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center font-bold">
                      {assignment.student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold">{assignment.student.name}</h3>
                      <p className="text-xs text-text-secondary">
                        {assignment.student.branch} � Year {assignment.student.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={"/requests/new?type=MENTOR_COMMUNICATION&target=${assignment.studentId}"}>Message</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
