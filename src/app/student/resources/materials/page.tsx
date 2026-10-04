import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';

export default async function MaterialsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const materials = await prisma.courseMaterial.findMany({
    where: { course: { enrollments: { some: { studentId: user.id } } } },
    include: { course: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Study Materials</h1>
        <p className="text-sm text-text-secondary">Resources published by your faculty</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.length === 0 ? (
          <div className="col-span-full p-4 md:p-8 text-center text-text-secondary bg-surface rounded-lg border border-border">
            No materials have been published yet.
          </div>
        ) : (
          materials.map(m => (
            <Card key={m.id} className="hover:border-info transition-colors">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-info-bg text-info rounded flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h2 className="font-semibold line-clamp-1">{m.title}</h2>
                    <span className="text-[10px] font-bold px-2 py-1 bg-surface-muted rounded ml-2 shrink-0">{m.type}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 mb-2">{m.course.code} â¢ {new Date(m.createdAt).toLocaleDateString()}</p>
                  {m.description && <p className="text-sm text-text-secondary line-clamp-2 mb-3">{m.description}</p>}
                  
                  {m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-info font-medium hover:underline">
                      <Download className="w-4 h-4" /> Download Resource
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
