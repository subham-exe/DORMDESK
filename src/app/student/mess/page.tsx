"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Star, MessageSquare, Utensils } from "lucide-react";

export default function StudentMessPage() {
  const [menus, setMenus] = useState<{id: string; items: string; mealType: string; notes?: string; date: string; feedbacks?: {rating: number; comment?: string}[]}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDate, setActiveDate] = useState<string>("");

  

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mess");
      if (!res.ok) throw new Error("Failed to load mess menu");
      const data = await res.json();
      setMenus(data);
      if (data.length > 0 && !activeDate) {
        // Group by dates
        const dates = Array.from(new Set(data.map((m: {date: string}) => new Date(m.date).toLocaleDateString())));
        setActiveDate(dates[0] as string);
      }
    } catch (e: Error | unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitFeedback = async (menuId: string, rating: number, comment: string) => {
    try {
      const res = await fetch(`/api/mess/${menuId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment })
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      await fetchMenus(); // refresh state
    } catch (e: Error | unknown) {
      alert((e as Error).message);
    }
  };

  if (loading) return <LoadingState text="Loading Mess Menu..." />;
  if (error) return <div className="p-4 text-error">{error}</div>;

  const dates = Array.from(new Set(menus.map((m: {date: string}) => new Date(m.date).toLocaleDateString())));
  const activeMenus = menus.filter(m => new Date(m.date).toLocaleDateString() === activeDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mess Menu</h1>
        <p className="text-text-secondary">View weekly meals and submit feedback.</p>
      </div>

      {dates.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date: string) => (
            <button
              key={date}
              onClick={() => setActiveDate(date)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeDate === date ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-text-primary hover:bg-surface-muted"
              }`}
            >
              {date === new Date().toLocaleDateString() ? "Today" : date}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No Menu Available" description="No meals are currently scheduled for this week." icon={<Utensils className="h-6 w-6" />} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {activeMenus.map((menu: {id: string; items: string; mealType: string; notes?: string; date: string; feedbacks?: {rating: number; comment?: string}[]}) => (
          <MealCard key={menu.id} menu={menu} onSubmitFeedback={submitFeedback} />
        ))}
      </div>
    </div>
  );
}

function MealCard({ menu, onSubmitFeedback }: { menu: {id: string; items: string; mealType: string; notes?: string; date: string; feedbacks?: {rating: number; comment?: string}[]}, onSubmitFeedback: (id: string, rating: number, comment: string) => void }) {
  const existingFeedback = menu.feedbacks && menu.feedbacks.length > 0 ? menu.feedbacks[0] : null;
  const [rating, setRating] = useState((existingFeedback?.rating ?? 0));
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [isEditing, setIsEditing] = useState(!existingFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a rating.");
    setIsSubmitting(true);
    await onSubmitFeedback(menu.id, rating, comment);
    setIsSubmitting(false);
    setIsEditing(false);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="mb-2">{menu.mealType}</Badge>
          {existingFeedback && !isEditing && (
             <Badge variant="success">Feedback Submitted</Badge>
          )}
        </div>
        <CardTitle className="text-lg">{menu.items}</CardTitle>
        {menu.notes && <p className="text-sm text-text-secondary mt-1">{menu.notes}</p>}
      </CardHeader>
      
      <CardContent className="flex-1 mt-4 border-t border-border pt-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Rate this meal:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} stars`}
                    onClick={() => setRating(star)}
                    className={`p-1 ${rating >= star ? "text-warning" : "text-border"}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Comment (Optional):</label>
              <textarea 
                className="w-full text-sm p-2 rounded-md border border-input bg-surface"
                rows={2}
                placeholder="How was the food?"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90"
              >
                {isSubmitting ? "Saving..." : "Submit Feedback"}
              </button>
              {existingFeedback && (
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="bg-surface-muted text-text-primary border border-border px-3 py-1.5 rounded-md text-sm font-medium hover:bg-surface"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-warning">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${(existingFeedback?.rating ?? 0) >= star ? "fill-current" : "text-border fill-transparent"}`} />
              ))}
              <span className="text-sm text-text-secondary ml-2">Your rating</span>
            </div>
            {existingFeedback?.comment && (
              <p className="text-sm text-text-secondary italic flex gap-2 items-start mt-2 bg-surface-muted p-2 rounded-md">
                <MessageSquare className="w-4 h-4 mt-0.5" />
                {existingFeedback.comment}
              </p>
            )}
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-sm text-primary font-medium mt-2 hover:underline inline-block"
            >
              Edit Feedback
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
