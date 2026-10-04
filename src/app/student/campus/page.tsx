import Link from 'next/link';
import { MessageCircle, User, DollarSign, FileText, ChevronRight } from 'lucide-react';

export default function CampusRoot() {
  const links = [
    { href: '/student/campus/notices', icon: MessageCircle, title: 'Notice Board', desc: 'Important campus announcements' },
    { href: '/student/campus/mentor', icon: User, title: 'My Mentor', desc: 'Connect with your advisor' },
    { href: '/student/campus/fees', icon: DollarSign, title: 'Fees & Dues', desc: 'Track your financial status' },
    { href: '/student/requests', icon: FileText, title: 'Requests', desc: 'Manage your official requests' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Campus</h1>
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
