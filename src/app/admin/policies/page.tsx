'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  allowedTransitions: string | null;
  isActive: boolean;
  version: number;
  updatedAt: string;
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  
  // Simulation states
  const [showSimulation, setShowSimulation] = useState(false);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);

  const fetchPolicies = useCallback(() => {
    fetch('/api/admin/policies')
      .then(res => res.json())
      .then(res => {
        if (!res.success) throw new Error(res.error || 'Failed to fetch policies');
        setPolicies(res.data || []);
      })
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleToggleActive = async (policy: Policy) => {
    try {
      const res = await fetch(`/api/admin/policies/${policy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...policy, isActive: !policy.isActive })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchPolicies();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      requestType: (formData.get('requestType') as string) || null,
      category: (formData.get('category') as string) || null,
      domain: (formData.get('domain') as string) || null,
      approvalRequired: formData.get('approvalRequired') === 'true',
      slaHours: formData.get('slaHours') ? parseInt(formData.get('slaHours') as string, 10) : null,
      autoApproveCondition: (formData.get('autoApproveCondition') as string) || null,
      escalationPolicy: (formData.get('escalationPolicy') as string) || null,
      allowedTransitions: (formData.get('allowedTransitions') as string) || null,
      isActive: formData.get('isActive') === 'true',
      version: editingPolicy ? editingPolicy.version : undefined,
    };

    try {
      const url = editingPolicy ? `/api/admin/policies/${editingPolicy.id}` : '/api/admin/policies';
      const method = editingPolicy ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setShowForm(false);
      setEditingPolicy(null);
      fetchPolicies();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSimulate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      requestType: formData.get('requestType') as string,
      category: formData.get('category') as string,
      domain: formData.get('domain') as string,
    };

    try {
      const res = await fetch('/api/admin/policies/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSimResult(data.data as Record<string, unknown>);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policy Administration</h1>
          <p className="text-slate-500 mt-1">Manage configuration rules for requests, SLAs, and workflows.</p>
        </div>
        <div className="space-x-3">
          <Button onClick={() => { setShowSimulation(true); setShowForm(false); }} className="px-4 py-2 bg-slate-100 border text-slate-700 rounded hover:bg-slate-200">
            Simulate Request
          </Button>
          <Button onClick={() => { setEditingPolicy(null); setShowForm(true); setShowSimulation(false); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Policy
          </Button>
        </div>
      </div>

      {showSimulation && (
        <div className="bg-slate-50 border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Simulate Policy Matching</h2>
          <form onSubmit={handleSimulate} className="flex flex-col md:flex-row gap-4 md:items-end mb-6">
            <div>
              <Label className="block text-sm font-medium mb-1">Request Type</Label>
              <Input name="requestType" className="border rounded px-3 py-2 w-48" placeholder="e.g. COMPLAINT" />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">Category</Label>
              <Input name="category" className="border rounded px-3 py-2 w-48" placeholder="e.g. Plumbing" />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">Domain</Label>
              <Input name="domain" className="border rounded px-3 py-2 w-48" placeholder="e.g. Maintenance" />
            </div>
            <Button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900">
              Run Simulation
            </Button>
            <Button type="button" onClick={() => setShowSimulation(false)} className="px-4 py-2 border rounded">Close</Button>
          </form>

          {simResult && (
            <div className="bg-white border rounded p-4 text-sm">
              <div className="font-bold text-lg mb-2">{simResult.policyName as string || 'No Policy Matched'}</div>
              <p className="text-slate-700 mb-4">{simResult.explanation as string}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Approval:</strong> {simResult.approvalRequired ? 'Required' : 'Not Required'}</div>
                <div><strong>Auto Approve:</strong> {simResult.autoApproveAllowed ? 'Yes' : 'No'}</div>
                <div><strong>SLA:</strong> {simResult.slaHours ? `${simResult.slaHours} hours` : 'N/A'}</div>
                <div><strong>Escalation:</strong> {simResult.escalationPolicy ? JSON.stringify(simResult.escalationPolicy) : 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">{editingPolicy ? 'Edit Policy' : 'Create Policy'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Policy Name *</Label>
                <Input required name="name" defaultValue={editingPolicy?.name} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Description</Label>
                <Input name="description" defaultValue={editingPolicy?.description || ''} className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border rounded">
              <div>
                <Label className="block text-sm font-medium mb-1">Request Type Match</Label>
                <Input name="requestType" defaultValue={editingPolicy?.requestType || ''} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Category Match</Label>
                <Input name="category" defaultValue={editingPolicy?.category || ''} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Domain Match</Label>
                <Input name="domain" defaultValue={editingPolicy?.domain || ''} className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Approval Required</Label>
                <Select name="approvalRequired" defaultValue={editingPolicy?.approvalRequired ? 'true' : 'false'} className="w-full border rounded px-3 py-2">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">SLA Hours</Label>
                <Input type="number" name="slaHours" defaultValue={editingPolicy?.slaHours || ''} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Active</Label>
                <Select name="isActive" defaultValue={editingPolicy?.isActive !== false ? 'true' : 'false'} className="w-full border rounded px-3 py-2">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-1">Escalation JSON</Label>
              <Textarea name="escalationPolicy" defaultValue={editingPolicy?.escalationPolicy || ''} className="w-full border rounded px-3 py-2 font-mono text-sm" rows={2} placeholder='{"escalateToRole":"Warden","sendSms":true}' />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-1">Auto-Approve JSON</Label>
              <Textarea name="autoApproveCondition" defaultValue={editingPolicy?.autoApproveCondition || ''} className="w-full border rounded px-3 py-2 font-mono text-sm" rows={2} />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-1">Allowed Transitions JSON</Label>
              <Textarea name="allowedTransitions" defaultValue={editingPolicy?.allowedTransitions || ''} className="w-full border rounded px-3 py-2 font-mono text-sm" rows={2} placeholder='{"Staff":["PROCESSING","RESOLVED"]}' />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded hover:bg-slate-50">Cancel</Button>
              <Button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Policy</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {policies.map(policy => (
          <div key={policy.id} className="bg-white border rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  {policy.name}
                  {!policy.isActive && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactive</span>}
                  {policy.isActive && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>}
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">v{policy.version}</span>
                </h3>
                <p className="text-sm text-slate-600 mt-1">{policy.description}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setEditingPolicy(policy); setShowForm(true); setShowSimulation(false); }} className="text-sm text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">
                  Edit
                </Button>
                <Button onClick={() => handleToggleActive(policy)} className={`text-sm px-3 py-1 rounded border ${policy.isActive ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'}`}>
                  {policy.isActive ? 'Deactivate' : 'Activate'}
                </Button>
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
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs font-medium uppercase mb-1">SLA Target</div>
                <div className="font-medium text-slate-800">
                  {policy.slaHours ? `${policy.slaHours} hours` : 'None'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs font-medium uppercase mb-1">Last Updated</div>
                <div className="font-medium text-slate-800">
                  {new Date(policy.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
