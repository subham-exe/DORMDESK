import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Wifi, 
  Wrench, 
  Droplets,
  Search,
  Filter,
  CheckCircle2,
  MoreVertical,
  Activity
} from 'lucide-react';
import { CampusTicket, IncidentContext } from '../types';

interface CommandCenterViewProps {
  tickets: CampusTicket[];
  incidents: IncidentContext[];
  onSelectTicket: (id: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  tickets,
  incidents,
  onSelectTicket,
}) => {
  const activeTickets = tickets.filter(t => !['CLOSED', 'CANCELLED'].includes(t.status));
  const slaBreached = activeTickets.filter(t => t.slaStatus === 'breached');
  const escalated = activeTickets.filter(t => t.status === 'ESCALATED');
  
  const getCategoryIcon = (category: string) => {
    if (category.includes('Electrical')) return <Wrench className="w-4 h-4 text-amber-600" />;
    if (category.includes('Wi-Fi') || category.includes('Network')) return <Wifi className="w-4 h-4 text-blue-600" />;
    if (category.includes('Plumbing')) return <Droplets className="w-4 h-4 text-cyan-600" />;
    return <Activity className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-slate-500">
              Operations Control
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Admin Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Universal Request Engine Triage & SLA Monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Queue</span>
          </button>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Requests</span>
            <Activity className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {activeTickets.length.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">SLA Breached</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-red-700">
            {slaBreached.length.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Escalated</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-amber-700">
            {escalated.length.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Incidents</span>
            <ShieldAlert className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {incidents.length.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Incidents & Critical */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Incidents */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Active Incidents</h2>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{incidents.length}</span>
            </div>
            <div className="p-3 space-y-3">
              {incidents.map(inc => (
                <div key={inc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono-code text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{inc.id}</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{inc.status}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{inc.title}</h3>
                  <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>{inc.linkedRequestsCount} linked requests</span>
                    <span className="font-medium">{inc.investigatingTeam}</span>
                  </div>
                </div>
              ))}
              {incidents.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs">No active incidents.</div>
              )}
            </div>
          </div>

          {/* Attention Required */}
          <div className="bg-white rounded-xl border border-red-100 overflow-hidden shadow-sm">
            <div className="p-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-red-900">Attention Required</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {slaBreached.length > 0 ? slaBreached.map(t => (
                <div key={t.id} onClick={() => onSelectTicket(t.id)} className="p-3 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono-code text-[11px] font-bold text-red-600">{t.id}</span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded uppercase">Breach</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 truncate">{t.title}</h3>
                </div>
              )) : (
                <div className="text-center py-6 text-slate-500 text-xs">No critical items.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Request Triage Queue</h2>
              <p className="text-[11px] text-slate-500">All active unclosed requests</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search ID..." 
                className="pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg w-40 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 bg-white">
                  <th className="p-3 font-semibold">ID</th>
                  <th className="p-3 font-semibold">Request</th>
                  <th className="p-3 font-semibold">Requester</th>
                  <th className="p-3 font-semibold">SLA / Age</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => onSelectTicket(t.id)}>
                    <td className="p-3">
                      <span className="font-mono-code text-[11px] font-bold text-slate-900">{t.id}</span>
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <div className="text-xs font-semibold text-slate-900 truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        {getCategoryIcon(t.category)}
                        {t.category} • {t.location}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs text-slate-900">Student</div>
                      <div className="text-[10px] text-slate-500">{t.room}</div>
                    </td>
                    <td className="p-3">
                      <div className={`text-[11px] font-mono-code font-medium ${t.slaStatus === 'breached' ? 'text-red-600' : 'text-slate-600'}`}>
                        {t.slaRemainingText}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-slate-400 hover:text-slate-900 p-1 rounded hover:bg-slate-200 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
