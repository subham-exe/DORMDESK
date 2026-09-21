import React, { useState } from 'react';
import { 
  Wrench, 
  DoorOpen, 
  FileCheck, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  UploadCloud, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles,
  Info,
  Building2,
  Trash2,
  X
} from 'lucide-react';
import { RequestDomain, CampusTicket, StudentProfile } from '../types';

interface CreateRequestViewProps {
  profile: StudentProfile;
  onBack: () => void;
  onSubmitSuccess: (newTicket: CampusTicket) => void;
  onSaveDraftToast: () => void;
}

let ticketIdCounter = 0;

export const CreateRequestView: React.FC<CreateRequestViewProps> = ({
  profile,
  onBack,
  onSubmitSuccess,
  onSaveDraftToast,
}) => {
  const [domain, setDomain] = useState<RequestDomain>('maintenance');
  const [category, setCategory] = useState('Electrical');
  const [hostelBlock, setHostelBlock] = useState(profile.hostelBlock);
  const [wingFloor, setWingFloor] = useState('3rd Floor • North Wing');
  const [room, setRoom] = useState(profile.room);
  const [isCommonArea, setIsCommonArea] = useState(false);
  const [commonAreaName, setCommonAreaName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const domainCategories: Record<RequestDomain, string[]> = {
    maintenance: [
      'Electrical',
      'Plumbing',
      'Carpentry / Furniture',
      'Cleaning & Janitorial',
      'Wi-Fi / Network',
      'Pest Control',
    ],
    leave_pass: [
      'Weekend Overnight Pass',
      'Vacation / Semester Break',
      'Medical Emergency Pass',
      'Day Outpass (> 8:00 PM)',
    ],
    certificates: [
      'Bonafide Certificate',
      'Hostel Dues Clearance',
      'Residential Address Proof',
      'Mess Rebate Endorsement',
    ],
    campus_ops: [
      'Dining & Mess Quality',
      'Gymnasium & Sports Grounds',
      'Library Facilities',
      'Noise / Disruption Grievance',
    ],
  };

  const handleDomainChange = (newDomain: RequestDomain) => {
    setDomain(newDomain);
    setCategory(domainCategories[newDomain][0]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        },
      ]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Please provide a clear subject for your request.';
    if (!description.trim()) newErrors.description = 'Please detail the operational issue or request description.';
    if (isCommonArea && !commonAreaName.trim()) newErrors.commonAreaName = 'Please specify the common area location.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    ticketIdCounter += 1;
    const newTicketId = `REQ-${Date.now().toString().slice(-4)}${ticketIdCounter}`;
    const finalLocation = isCommonArea 
      ? `${hostelBlock}, ${commonAreaName}`
      : `${hostelBlock}, ${room}`;

    const newTicket: CampusTicket = {
      id: newTicketId,
      domain,
      category,
      title: title.trim(),
      description: description.trim(),
      status: 'ROUTED',
      humanStatus: 'Being Routed',
      location: finalLocation,
      hostelBlock,
      room: isCommonArea ? commonAreaName : room,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      slaTargetHours: priority === 'urgent' ? 4 : 24,
      slaRemainingText: priority === 'urgent' ? '4h remaining (Urgent)' : '24h remaining',
      slaStatus: 'normal',
      priority,
      timeline: [
        {
          id: `tl-new-1`,
          action: 'Created',
          stage: 'SUBMISSION',
          humanStatus: 'Created',
          timestamp: 'Just now',
          actor: profile.name,
          actorRole: 'Student Resident',
          description: `Logged via Dormdesk Student Operations Console. Priority: ${priority.toUpperCase()}.`,
        },
        {
          id: `tl-new-2`,
          action: 'Classified & Routed',
          stage: 'ROUTED',
          humanStatus: 'Being Routed',
          timestamp: 'Just now',
          actor: 'Universal Request Engine',
          actorRole: 'System Core',
          description: `Auto-routed to ${domain === 'maintenance' ? 'Estate Maintenance Desk' : domain === 'leave_pass' ? 'Warden Office' : 'Registrar Office'}.`,
        },
      ],
    };

    onSubmitSuccess(newTicket);
  };

  const showIncidentWarning = domain === 'maintenance' && category.includes('Wi-Fi');

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create Campus Operation Request
            </h1>
            <p className="text-xs text-slate-500">
              Universal Request Engine • Automatic classification, routing & SLA accountability
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveDraftToast}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Save Draft
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Request Domain */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Select Operational Domain
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleDomainChange('maintenance')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                domain === 'maintenance'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Wrench className={`w-5 h-5 mb-2 ${domain === 'maintenance' ? 'text-slate-900' : 'text-slate-500'}`} />
              <div className="text-xs font-bold text-slate-900">Maintenance</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Electrical, Plumbing, Wi-Fi</div>
            </button>

            <button
              type="button"
              onClick={() => handleDomainChange('leave_pass')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                domain === 'leave_pass'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <DoorOpen className={`w-5 h-5 mb-2 ${domain === 'leave_pass' ? 'text-slate-900' : 'text-slate-500'}`} />
              <div className="text-xs font-bold text-slate-900">Leave & Pass</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Gate Pass, Weekend Leave</div>
            </button>

            <button
              type="button"
              onClick={() => handleDomainChange('certificates')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                domain === 'certificates'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <FileCheck className={`w-5 h-5 mb-2 ${domain === 'certificates' ? 'text-slate-900' : 'text-slate-500'}`} />
              <div className="text-xs font-bold text-slate-900">Certificates</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bonafide, Dues Clearance</div>
            </button>

            <button
              type="button"
              onClick={() => handleDomainChange('campus_ops')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                domain === 'campus_ops'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Layers className={`w-5 h-5 mb-2 ${domain === 'campus_ops' ? 'text-slate-900' : 'text-slate-500'}`} />
              <div className="text-xs font-bold text-slate-900">Campus Ops</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Dining, Gym, Grievances</div>
            </button>
          </div>
        </section>

        {/* Step 2: Category Taxonomy */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Specific Category Taxonomy
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {domainCategories[domain].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Live Incident Cluster Notification if applicable */}
          {showIncidentWarning && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 mt-3 animate-in fade-in">
              <Info className="w-4 h-4 text-slate-900 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Active Incident Detected:</span> Incident <span className="font-mono-code font-bold text-slate-900">#INC-042</span> (Hostel B Optical Fiber Degradation) is currently open. Splicing crew is on-site; your ticket will be automatically correlated with this root cluster.
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Physical Location Vector */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Location Vector
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Locked to residential profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Hostel Block
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{hostelBlock}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Wing / Floor
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{wingFloor}</span>
              </div>
            </div>

            <div>
              <label htmlFor="room-target-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Room / Target
              </label>
              <input
                id="room-target-input"
                type="text"
                disabled={isCommonArea}
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono-code font-bold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isCommonArea}
                onChange={(e) => setIsCommonArea(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>This issue is in a common area (Washroom, Corridor, Study Lounge, Mess)</span>
            </label>
          </div>

          {isCommonArea && (
            <div className="pt-1 animate-in fade-in">
              <label htmlFor="common-area-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Common Area Description
              </label>
              <input
                id="common-area-input"
                type="text"
                placeholder="e.g. 3rd Floor North Washroom Cubicle 2 or Corridor Water Dispenser"
                value={commonAreaName}
                onChange={(e) => setCommonAreaName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.commonAreaName && (
                <p className="text-[11px] text-red-600 mt-1">{errors.commonAreaName}</p>
              )}
            </div>
          )}
        </section>

        {/* Step 4: Issue Details & Severity */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Issue Parameters & Description
            </h2>
          </div>

          <div>
            <label htmlFor="subject-summary-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Subject Summary <span className="text-red-500">*</span>
            </label>
            <input
              id="subject-summary-input"
              type="text"
              placeholder="e.g. Ceiling fan humming loudly and not spinning at speed 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.title && (
              <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description-textarea" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Comprehensive Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description-textarea"
              rows={4}
              placeholder="Provide exact symptoms, when the issue started, and any safety concerns..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.description && (
              <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Priority Assessment */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Priority Self-Assessment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  priority === 'normal'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Normal Dispatch</span>
                  <span className="font-mono-code text-[11px] text-slate-500">&lt; 24h SLA</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Routine room repairs, standard turnarounds, maintenance maintenance queues.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  priority === 'urgent'
                    ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Urgent Escalation
                  </span>
                  <span className="font-mono-code text-[11px] text-red-600 font-bold">&lt; 4h SLA</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Immediate flood hazard, electrical spark hazard, door lock lockout. Notifies Warden immediately.
                </p>
              </button>
            </div>
          </div>
        </section>

        {/* Step 5: Evidence & Artifacts */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                5
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Photo Evidence & Attachments (Optional)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">Accelerates triage</span>
          </div>

          <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50">
            <UploadCloud className="w-6 h-6 text-slate-400" />
            <div className="text-xs font-semibold text-slate-700">
              Click to browse or drag photo of the issue
            </div>
            <div className="text-[10px] text-slate-400">
              PNG, JPG, or PDF up to 10MB
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />
          </label>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono-code">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove file ${file.name}`}
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Institutional SLA Guarantee Badge */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-start gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-slate-100 flex items-center gap-2">
              <span>Universal SLA Guarantee: {priority === 'urgent' ? 'Under 4 Hours' : 'Under 24 Hours'}</span>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono-code px-1.5 py-0.2 rounded border border-emerald-800">
                TIER-1 AUDITED
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Upon submission, your ticket enters the Universal Request Engine. You will receive an SMS and app push when the technician acknowledges dispatch. Resident quality sign-off will be required upon completion.
            </p>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 active:scale-95 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Operational Request</span>
          </button>
        </div>
      </form>
    </div>
  );
};
