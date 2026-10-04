import { getCurrentUser } from '@/lib/auth/session';
import { MentorService } from '@/lib/services/mentor';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MessageCircle, Mail, Building } from 'lucide-react';
import Link from 'next/link';

export default async function MentorPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const activeMentor = await MentorService.getMenteeDashboard(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Mentor</h1>
        <p className="text-sm text-text-secondary">Your assigned academic advisor</p>
      </div>

      {!activeMentor ? (
        <div className="p-4 md:p-8 text-center text-text-secondary bg-surface rounded-lg border border-border">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-medium text-text-primary mb-2">No Mentor Assigned</h2>
          <p>Your HOD has not yet assigned a mentor to you.</p>
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
              <div className="w-24 h-24 rounded-full bg-primary-bg text-primary flex items-center justify-center shrink-0">
                <User className="w-10 h-10" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-1">{activeMentor.mentor.name}</h2>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                    <Mail className="w-4 h-4" />
                    <span>{activeMentor.mentor.email}</span>
                  </div>
                  {activeMentor.mentor.department && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                      <Building className="w-4 h-4" />
                      <span>{activeMentor.mentor.department}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-center sm:justify-start">
                  <Button asChild>
                    <Link href={`/student/requests/new?type=MENTOR_COMMUNICATION&assignee=${activeMentor.mentorId}`}>
                      <MessageCircle className="w-4 h-4 mr-2" /> Ping Mentor
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

