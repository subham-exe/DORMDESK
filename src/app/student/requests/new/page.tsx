/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { saveOfflineMutation } from "@/lib/services/offline-store";
import { useToast } from "@/components/ui/use-toast";

function RequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validate initialType against supported types
  const validTypes = ["COMPLAINT", "LEAVE", "CERTIFICATE", "OTHER"];
  const defaultType = initialType && validTypes.includes(initialType.toUpperCase()) 
    ? initialType.toUpperCase() 
    : "";
    
  const [requestType, setRequestType] = useState<string>(defaultType);

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
      idempotencyKey: crypto.randomUUID(),
      requestType: selectedType,
      category: formData.get("category"),
      location: formData.get("location") || undefined,
      description: formData.get("description"),
      priority: formData.get("priority") || "MEDIUM",
       // In a real app this would come from session
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    try {
      if (!navigator.onLine) {
        await saveOfflineMutation({ idempotencyKey: data.idempotencyKey, userId: localStorage.getItem('dormdesk_user_id') || "", type: "CREATE_REQUEST", payload: data, status: "PENDING_SYNC", timestamp: Date.now() });
        toast({ title: "Offline mode", description: "Request saved locally and will sync when online.", variant: "default" });
        setError("You are offline. Request saved locally and will sync when online. Redirecting...");
        setTimeout(() => router.push("/student"), 2500);
        return;
      }

      let response: Response;
      try {
        response = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        // Network error during fetch, treat as offline
        await saveOfflineMutation({ idempotencyKey: data.idempotencyKey, userId: localStorage.getItem('dormdesk_user_id') || "", type: "CREATE_REQUEST", payload: data, status: "PENDING_SYNC", timestamp: Date.now() });
        toast({ title: "Offline mode", description: "Connection lost. Request saved locally.", variant: "default" });
        setError("Connection lost. Request saved locally and will sync when online. Redirecting...");
        setTimeout(() => router.push("/student"), 2500);
        return;
      }

      if (!response.ok) {
        let errorData = { error: "Failed to create request" };
        try { errorData = await response.json(); } catch {}
        throw new Error(errorData.error || "Failed to create request");
      }

      const newRequest = await response.json();
      toast({ title: "Request submitted", description: "Your request has been successfully created.", variant: "success" });
      router.push(`/student/requests/${newRequest.data.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
      setLoading(false);
    }
  };

  const renderCategoryOptions = () => {
    switch (requestType) {
      case "COMPLAINT":
        return (
          <>
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="FURNITURE">Furniture</option>
            <option value="CLEANLINESS">Cleanliness</option>
            <option value="ROOM">Room</option>
            <option value="WIFI">Wi-Fi</option>
            <option value="WATER">Water</option>
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
      case "OTHER":
      default:
        return <option value="OTHER">Other</option>;
    }
  };

  return (
    <>
      {error && (
        <div role="alert" className="flex items-start gap-3 p-4 mb-4 text-sm bg-error-bg text-error rounded-md border border-error/20"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span></div>
      )}

      <Card>
        <form onSubmit={handleSubmit} noValidate>
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
                <option value="COMPLAINT">Hostel Complaint / Maintenance</option>
                <option value="LEAVE">Leave / Gate Pass</option>
                <option value="CERTIFICATE">Certificate Request</option>
                <option value="OTHER">General Request</option>
              </Select>
            </div>

            {requestType && requestType !== "OTHER" && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" required key={requestType}>
                  <option value="">Select category...</option>
                  {renderCategoryOptions()}
                </Select>
              </div>
            )}
            
            {requestType === "OTHER" && (
              <input type="hidden" name="category" value="OTHER" />
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

            {requestType === "COMPLAINT" && (
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
              {loading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Submitting...</>) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

export default function CreateRequestPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student" passHref>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Request</h1>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="p-8 flex justify-center">
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      }>
        <RequestForm />
      </Suspense>
    </div>
  );
}


