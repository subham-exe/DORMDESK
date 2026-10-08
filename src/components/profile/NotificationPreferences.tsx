"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Preferences {
  EMAIL_REQUEST_NOTIFICATIONS: boolean;
  EMAIL_SLA_NOTIFICATIONS: boolean;
  EMAIL_CAMPUS_ANNOUNCEMENTS: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  EMAIL_REQUEST_NOTIFICATIONS: false,
  EMAIL_SLA_NOTIFICATIONS: false,
  EMAIL_CAMPUS_ANNOUNCEMENTS: false
};

const PURPOSES = [
  { id: 'EMAIL_REQUEST_NOTIFICATIONS', label: 'Request updates', desc: 'Receive email updates when your requests are assigned or otherwise require your attention.' },
  { id: 'EMAIL_SLA_NOTIFICATIONS', label: 'SLA notifications', desc: 'Receive email notifications when request deadlines approach or are escalated.' },
  { id: 'EMAIL_CAMPUS_ANNOUNCEMENTS', label: 'Campus announcements', desc: 'Receive institution-wide or targeted campus announcement emails.' },
] as const;

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/preferences')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPreferences(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const togglePreference = async (purpose: keyof Preferences, currentEnabled: boolean) => {
    setUpdating(purpose);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, enabled: !currentEnabled })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update preference');
      
      setPreferences(prev => ({ ...prev, [purpose]: !currentEnabled }));
      const label = PURPOSES.find(p => p.id === purpose)?.label || purpose;
      setSuccessMsg(`${label} preferences updated successfully.`);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 md:p-6 flex items-center gap-2 text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading preferences...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="bg-info-bg text-info p-4 rounded-md flex items-start gap-3">
          <Info className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Verification vs. Notifications</p>
            <p className="mt-1">
              Verifying your email confirms your identity. It does <strong>not</strong> automatically subscribe you to notifications. You must explicitly opt-in to emails below.
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-error bg-error-bg p-3 rounded-md">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-sm text-success bg-success-bg p-3 rounded-md">
            {successMsg}
          </div>
        )}

        <div className="space-y-4">
          {PURPOSES.map((p) => {
            const isEnabled = preferences[p.id];
            const isUpdating = updating === p.id;
            return (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{p.label}</p>
                  <p className="text-sm text-text-secondary">{p.desc}</p>
                </div>
                <Button 
                  variant={isEnabled ? "primary" : "outline"}
                  onClick={() => togglePreference(p.id, isEnabled)}
                  disabled={isUpdating}
                  className="w-24 shrink-0"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEnabled ? 'Enabled' : 'Disabled')}
                </Button>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
}
