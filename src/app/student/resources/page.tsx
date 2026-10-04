import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';

export default function ResourcesRoot() {
  const links = [
    { href: '/student/resources/materials', icon: FileText, title: 'Materials', desc: 'Access study materials' },
    { href: '/student/resources/assignments', icon: FileText, title: 'Assignments', desc: 'Submit and view your coursework' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Resources</h1>
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
