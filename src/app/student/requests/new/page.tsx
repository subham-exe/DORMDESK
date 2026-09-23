/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function CreateRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const selectedType = formData.get("requestType") as string;

    const metadata: Record<string, any> = {};
    if (selectedType === "LEAVE") {
      const leaveDaysStr = formData.get("leaveDays");
      if (leaveDaysStr) {
        metadata.leaveDays = parseInt(leaveDaysStr as string, 10);
      }
    }

    const data = {
      requestType: selectedType,
      category: formData.get("category"),
      location: formData.get("location") || undefined,
      description: formData.get("description"),
      priority: formData.get("priority") || "MEDIUM",
      requesterId: "mock-user-123", // In a real app this would come from session
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
      }

      const newRequest = await response.json();
      router.push(`/student/requests/${newRequest.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const renderCategoryOptions = () => {
    switch (requestType) {
      case "MAINTENANCE":
        return (
          <>
            <option value="ELECTRICAL">Electrical (Fan, Light, etc)</option>
            <option value="PLUMBING">Plumbing (Water, Washroom)</option>
            <option value="CARPENTRY">Carpentry (Bed, Door)</option>
            <option value="CLEANING">Cleaning & Hygiene</option>
            <option value="WIFI">Wi-Fi & Internet</option>
            <option value="OTHER">Other</option>
          </>
        );
      case "LEAVE":
        return (
          <>
            <option value="HOME">Going Home</option>
            <option value="MEDICAL">Medical Emergency</option>
            <option value="OUTING">Local Outing</option>
            <option value="OTHER">Other</option>
          </>
        );
      case "CERTIFICATE":
        return (
          <>
            <option value="BONAFIDE">Bonafide Certificate</option>
            <option value="CONDUCT">Conduct Certificate</option>
            <option value="TRANSFER">Transfer Certificate</option>
            <option value="OTHER">Other</option>
          </>
        );
      case "GENERAL":
      default:
        return <option value="OTHER">Other</option>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student" passHref>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Request</h1>
      </div>

      {error && (
        <div className="p-4 bg-error-bg text-error rounded-md border border-error">
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestType">What do you need?</Label>
              <Select 
                id="requestType" 
                name="requestType" 
                required
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
              >
                <option value="">Select a type...</option>
                <option value="MAINTENANCE">Hostel Complaint / Maintenance</option>
                <option value="LEAVE">Leave / Gate Pass</option>
                <option value="CERTIFICATE">Certificate Request</option>
                <option value="GENERAL">General Request</option>
              </Select>
            </div>

            {requestType && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" required>
                  <option value="">Select category...</option>
                  {renderCategoryOptions()}
                </Select>
              </div>
            )}

            {requestType === "LEAVE" && (
              <div className="space-y-2">
                <Label htmlFor="leaveDays">Number of Days</Label>
                <Input 
                  id="leaveDays" 
                  name="leaveDays" 
                  type="number"
                  min="1"
                  max="30"
                  required
                  placeholder="e.g. 2" 
                />
                <p className="text-xs text-text-secondary">Requests of 2 days or fewer are auto-approved.</p>
              </div>
            )}

            {requestType === "MAINTENANCE" && (
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium leading-none">Location *</label>
                <Input 
                  id="location" 
                  name="location" 
                  placeholder="e.g. Room 402, Block A" 
                  required
                />
              </div>
            )}

            {requestType && (
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium leading-none">Description *</label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Please describe the issue or reason in detail..." 
                  rows={4} 
                  required 
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !requestType}>
              {loading ? "Submitting..." : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
