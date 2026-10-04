import Link from 'next/link';
import { Clock, Calendar, BookOpen, ChevronRight } from 'lucide-react';

export default function AcademicsRoot() {
  const links = [
    { href: '/student/academics/timetable', icon: Clock, title: 'Timetable', desc: 'View your weekly class schedule' },
    { href: '/student/academics/attendance', icon: Calendar, title: 'Attendance', desc: 'Track your presence in classes' },
    { href: '/student/academics/subjects', icon: BookOpen, title: 'Subjects', desc: 'Browse your enrolled courses' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Academics</h1>
      <div className="grid gap-4">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="flex items-center p-4 bg-surface rounded-lg border border-border hover:border-info transition-colors">
            <div className="w-12 h-12 bg-info-bg text-info rounded-full flex items-center justify-center mr-4"><l.icon /></div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{l.title}</h2>
              <p className="text-sm text-text-secondary">{l.desc}</p>
            </div>
            <ChevronRight className="text-text-secondary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
