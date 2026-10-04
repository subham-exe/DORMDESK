import { getCurrentUser } from '@/lib/auth/session';
import { FeeService } from '@/lib/services/fee';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, CheckCircle } from 'lucide-react';

export default async function FeesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const fees = await FeeService.getStudentFees(user.id);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Fees & Dues</h1>
        <p className="text-sm text-text-secondary">Track your financial clearance</p>
      </div>

      <div className="space-y-4">
        {fees.length === 0 ? (
          <div className="p-4 md:p-8 text-center text-text-secondary bg-surface rounded-lg border border-border flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-success mb-2 opacity-50" />
            <p className="font-medium">All Clear!</p>
            <p className="text-sm">You have no pending fees or dues.</p>
          </div>
        ) : (
          fees.map(fee => {
            const isPaid = fee.status === 'PAID';
            const isOverdue = !isPaid && new Date(fee.dueDate) < now;
            
            return (
              <Card key={fee.id} className={`hover:border-info transition-colors ${isOverdue ? 'border-error/50 bg-error-bg/30' : ''}`}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-success-bg text-success' : isOverdue ? 'bg-error-bg text-error' : 'bg-warning-bg text-warning'}`}>
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{(fee.description || 'Fee')}</h2>
                      <p className="text-sm text-text-secondary">{'Amount Due'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">?{fee.amount}</p>
                    <p className={`text-sm font-semibold mt-1 ${isPaid ? 'text-success' : isOverdue ? 'text-error' : 'text-warning'}`}>
                      {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'DUE ' + new Date(fee.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

