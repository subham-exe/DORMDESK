"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";

export default function ProfilePage() {
  const [user, setUser] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-text-secondary">Manage your student details and preferences.</p>
      </div>

      {loading ? (
        <LoadingState text="Loading profile..." />
      ) : error ? (
        <ErrorState title="Failed to load profile" description="We couldn't load your profile information right now." />
      ) : user ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-info-bg text-info rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                {user.name ? user.name.substring(0, 2).toUpperCase() : "ST"}
              </div>
              <div className="space-y-4 w-full">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
                  <p className="text-sm text-text-secondary font-mono">{user.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Role
                    </p>
                    <p className="font-medium capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="Profile not found"
          description="We couldn't load your profile information. Please try signing in again."
        />
      )}
    </div>
  );
}

