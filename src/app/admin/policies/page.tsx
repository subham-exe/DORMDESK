'use client';

import { useEffect, useState } from 'react';

type Policy = {
  id: string;
  name: string;
  description: string;
  requestType: string | null;
  category: string | null;
  domain: string | null;
  approvalRequired: boolean;
  autoApproveCondition: string | null;
  slaHours: number | null;
  escalationPolicy: string | null;
  isActive: boolean;
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/policies')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch policies');
        return res.json();
      })
      .then(data => {
        setPolicies(data.policies || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading policies...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Policy Management</h1>
        <p className="text-slate-500 mt-1">View active configuration rules for requests, SLAs, and workflows.</p>
      </div>

      {policies.length === 0 ? (
        <div className="bg-white border rounded p-8 text-center text-slate-500">
          No policies configured.
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.map(policy => (
            <div key={policy.id} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    {policy.name}
                    {!policy.isActive && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactive</span>}
                    {policy.isActive && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Active</span>}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{policy.description}</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 rounded p-3 border">
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-1">Scope</div>
                  <div className="font-medium text-slate-800">
                    {policy.requestType && <div>Type: {policy.requestType}</div>}
                    {policy.category && <div>Cat: {policy.category}</div>}
                    {policy.domain && <div>Domain: {policy.domain}</div>}
                    {!policy.requestType && !policy.category && !policy.domain && 'Global Default'}
                  </div>
                </div>
                
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-1">Approval</div>
                  <div className="font-medium text-slate-800">
                    {policy.approvalRequired ? 'Required' : 'Not Required'}
                    {policy.autoApproveCondition && <div className="text-emerald-600 mt-1 break-words">Auto: {policy.autoApproveCondition}</div>}
                  </div>
                </div>
                
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-1">SLA Target</div>
                  <div className="font-medium text-slate-800">
                    {policy.slaHours ? `${policy.slaHours} hours` : 'None'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-1">Escalation</div>
                  <div className="font-medium text-slate-800 break-words">
                    {policy.escalationPolicy ? policy.escalationPolicy : 'None'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
