"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export function AdminSLACheckButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSLACheck = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/sla-check", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Success: Processed ${data.result.processed} requests.`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage(`Error: Unknown error occurred`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handleSLACheck} 
        disabled={loading} 
        variant="outline" 
        size="sm"
        className="w-full justify-start"
      >
        <Clock className="w-4 h-4 mr-2" />
        {loading ? "Running..." : "Run SLA check"}
      </Button>
      {message && <div className="text-xs text-text-secondary mt-1">{message}</div>}
    </div>
  );
}
