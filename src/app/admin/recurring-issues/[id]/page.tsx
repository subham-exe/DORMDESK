'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export interface RecurringIssueDetailUI {
  category: string;
  location: string;
  status: string;
  occurrenceCount: number;
  detectionReason: string;
  firstDetectedAt: string | Date;
  lastDetectedAt: string | Date;
  incidents?: Array<{
    id: string;
    title: string;
    createdAt: string | Date;
    status: string;
  }>;
  requests?: Array<{
    id: string;
    ticketNumber: string;
    requestType: string;
    createdAt: string | Date;
    status: string;
  }>;
}

export default function RecurringIssueDetail() {
  const params = useParams();
  const [issue, setIssue] = useState<RecurringIssueDetailUI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/recurring-issues/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setIssue(d.data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!issue) return <div className="p-8 text-red-500">Not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/admin/recurring-issues" className="text-blue-600 hover:underline">&larr; Back to List</Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{issue.category} at {issue.location}</h1>
            <p className="text-gray-500 mt-1">Recurring Pattern Detected</p>
          </div>
          <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${issue.status === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {issue.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-sm text-gray-500">Occurrence Count</div>
            <div className="text-xl font-semibold mt-1">{issue.occurrenceCount}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-sm text-gray-500">Detection Reason</div>
            <div className="text-sm font-medium mt-1">{issue.detectionReason}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-sm text-gray-500">First Detected</div>
            <div className="text-sm font-medium mt-1">{new Date(issue.firstDetectedAt).toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-sm text-gray-500">Last Detected</div>
            <div className="text-sm font-medium mt-1">{new Date(issue.lastDetectedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Affected Incidents</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <ul className="divide-y divide-gray-200">
          {issue.incidents?.length === 0 ? (
            <li className="px-6 py-4 text-gray-500">No linked incidents.</li>
          ) : issue.incidents?.map((inc) => (
            <li key={inc.id} className="px-6 py-4 flex justify-between">
              <div>
                <div className="font-medium">{inc.title}</div>
                <div className="text-sm text-gray-500">{new Date(inc.createdAt).toLocaleDateString()} &middot; {inc.status}</div>
              </div>
              <Link href={`/admin/incidents/${inc.id}`} className="text-blue-600 hover:underline">View</Link>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="text-xl font-bold mb-4">Standalone Requests (No Incident)</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {issue.requests?.length === 0 ? (
            <li className="px-6 py-4 text-gray-500">No standalone requests.</li>
          ) : issue.requests?.map((req) => (
            <li key={req.id} className="px-6 py-4 flex justify-between">
              <div>
                <div className="font-medium">{req.ticketNumber} &middot; {req.requestType}</div>
                <div className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()} &middot; {req.status}</div>
              </div>
              <Link href={`/admin/requests/${req.id}`} className="text-blue-600 hover:underline">View</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
