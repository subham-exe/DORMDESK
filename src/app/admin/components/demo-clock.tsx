"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoClock() {
  const router = useRouter();
  const [offsetHours, setOffsetHours] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/demo-clock")
      .then(res => res.json())
      .then(data => setOffsetHours(data.offsetHours || 0))
      .catch(console.error);
  }, []);

  const mutateClock = async (action: "ADVANCE" | "RESET", hours?: number) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/demo-clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, hours })
      });
      if (res.ok) {
        const data = await res.json();
        setOffsetHours(data.offsetHours);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 p-3 bg-surface border border-border rounded-lg shadow-xl w-64 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <h3 className="text-sm font-semibold flex items-center text-primary">
              <Clock className="w-4 h-4 mr-2" />
              Demo Clock
            </h3>
            <span className="text-xs font-mono bg-surface-muted px-1.5 py-0.5 rounded border border-border">
              +{offsetHours}h
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-text-secondary mb-2">Advance simulated time to test SLA:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" disabled={isLoading} onClick={() => mutateClock("ADVANCE", 1)} className="text-xs">
                +1h
              </Button>
              <Button size="sm" variant="outline" disabled={isLoading} onClick={() => mutateClock("ADVANCE", 6)} className="text-xs">
                +6h
              </Button>
              <Button size="sm" variant="outline" disabled={isLoading} onClick={() => mutateClock("ADVANCE", 24)} className="text-xs">
                +24h
              </Button>
            </div>
            <Button size="sm" variant="ghost" disabled={isLoading} onClick={() => mutateClock("RESET")} className="w-full text-xs text-error hover:bg-error-bg hover:text-error mt-2 border border-transparent hover:border-error/20">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Time
            </Button>
          </div>
        </div>
      )}
      
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full shadow-lg h-12 px-4 flex items-center gap-2 ${offsetHours > 0 ? 'bg-warning hover:bg-warning/90 text-text-inverse' : 'bg-primary hover:bg-primary/90 text-text-inverse'}`}
        aria-label="Toggle Demo Clock"
      >
        <FastForward className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline-block">
          {offsetHours > 0 ? `+${offsetHours}h Demo` : "Demo Clock"}
        </span>
      </Button>
    </div>
  );
}
