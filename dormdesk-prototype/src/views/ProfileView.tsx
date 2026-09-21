import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  BellRing, 
  WifiOff, 
  Save, 
  Check, 
  GraduationCap, 
  AlertCircle 
} from 'lucide-react';
import { StudentProfile } from '../types';

interface ProfileViewProps {
  profile: StudentProfile;
  onSavePreferences: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onSavePreferences,
}) => {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    onSavePreferences();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-slate-500">
            Institutional Identity & Residential Operations
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Student Profile & Operations Registry
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified academic credentials, residential room allocation, and telemetry preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic Identity Card */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Verified Academic Enrollment
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg border border-slate-700 shadow-xs flex-shrink-0">
              AS
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{profile.name}</h3>
                <span className="font-mono-code text-xs font-bold text-slate-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {profile.studentId}
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Active Enrollment
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {profile.degree} • {profile.department}
              </p>
              <p className="text-[11px] text-slate-400">
                {profile.institution} • {profile.year}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Primary Email</span>
              <span className="font-semibold text-slate-800 font-mono-code">{profile.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Registered Mobile</span>
              <span className="font-semibold text-slate-800 font-mono-code">{profile.phone}</span>
            </div>
          </div>
        </section>

        {/* Residential Assignment Card */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Residential Assignment & Wing Officers
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Hostel Block</span>
              <span className="font-semibold text-slate-900">{profile.hostelBlock}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Allocated Unit</span>
              <span className="font-semibold text-slate-900 font-mono-code">{profile.room}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Wing / Floor</span>
              <span className="font-semibold text-slate-900">{profile.wing}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Bed Slot</span>
              <span className="font-semibold text-slate-900 font-mono-code">{profile.bed} ({profile.occupancyId})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Wing Steward Officer
              </span>
              <div className="font-bold text-slate-900">{profile.wingSteward}</div>
              <div className="text-slate-500 font-mono-code text-[11px]">Direct Contact: {profile.wingStewardPhone}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Chief Hostel Warden
              </span>
              <div className="font-bold text-slate-900">{profile.wardenName}</div>
              <div className="text-slate-500 font-mono-code text-[11px]">Office Extension: {profile.wardenExt}</div>
            </div>
          </div>
        </section>

        {/* Emergency Guardian Card */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Emergency & Guardian Contacts
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px]">Guardian Contact</span>
              <span className="font-semibold text-slate-900">{profile.emergencyContact.name} ({profile.emergencyContact.relation})</span>
              <span className="block font-mono-code text-slate-600 mt-0.5">{profile.emergencyContact.phone}</span>
            </div>

            <div className="p-3 bg-red-50/50 rounded-xl border border-red-200/60">
              <span className="text-red-700 block text-[11px] font-semibold">Campus Medical Emergency</span>
              <span className="font-bold text-slate-900">Health Clinic 24/7 Ambulance</span>
              <span className="block font-mono-code text-red-600 font-bold mt-0.5">Speed Dial: Ext. 108</span>
            </div>
          </div>
        </section>

        {/* Notification & Telemetry Preferences */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BellRing className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Accountability & SLA Notification Preferences
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">SMS Resolution & Gate Pass Dispatch</span>
                <span className="text-slate-500 text-[11px]">Instant text alert when technician completes maintenance</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Campus Outage & Maintenance Bulletins</span>
                <span className="text-slate-500 text-[11px]">Water tank cleaning, Wi-Fi outage cluster warnings</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Low-Bandwidth Mode (2G Optimized)</span>
                <span className="text-slate-500 text-[11px]">Reduces image resolution and prioritizes essential text telemetry</span>
              </div>
              <input
                type="checkbox"
                checked={lowBandwidthMode}
                onChange={(e) => setLowBandwidthMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Preferences Saved</span>
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold tracking-wider uppercase shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};
