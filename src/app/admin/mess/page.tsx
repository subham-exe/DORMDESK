"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Utensils, Plus, Trash2, Star, Users } from "lucide-react";

export default function AdminMessPage() {
  const [menus, setMenus] = useState<{id: string; items: string; mealType: string; notes?: string; date: string; avgRating?: string | number; feedbackCount?: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDate, setActiveDate] = useState<string>(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD format roughly
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newMeal, setNewMeal] = useState({ mealType: "BREAKFAST", items: "", notes: "" });

  

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/mess");
      if (!res.ok) throw new Error("Failed to load mess menu");
      const data = await res.json();
      setMenus(data);
    } catch (e: Error | unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchMenus();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/mess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: activeDate,
          ...newMeal
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create menu");
      }
      setIsAdding(false);
      setNewMeal({ mealType: "BREAKFAST", items: "", notes: "" });
      fetchMenus();
    } catch (err: Error | unknown) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu?")) return;
    try {
      await fetch(`/api/admin/mess/${id}`, { method: "DELETE" });
      fetchMenus();
    } catch (err: Error | unknown) {
      alert((err as Error).message);
    }
  };

  if (loading) return <LoadingState text="Loading Mess Operations..." />;
  if (error) return <div className="p-4 text-error">{error}</div>;

  const activeMenus = menus.filter(m => new Date(m.date).toLocaleDateString('en-CA') === activeDate);
  const dateOptions = Array.from({length: 14}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d.toLocaleDateString('en-CA');
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mess Operations</h1>
          <p className="text-text-secondary mt-1">Manage weekly meals and monitor student feedback.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-surface p-4 rounded-lg border border-border">
        <label className="text-sm font-medium">Select Date:</label>
        <select 
          value={activeDate} 
          onChange={e => setActiveDate(e.target.value)}
          className="p-2 border border-input rounded-md bg-background text-sm"
        >
          {dateOptions.map(date => (
            <option key={date} value={date}>{date === new Date().toLocaleDateString('en-CA') ? `Today (${date})` : date}</option>
          ))}
        </select>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="ml-auto flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Meal
        </button>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Add Meal for {activeDate}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meal Slot</label>
                  <select 
                    value={newMeal.mealType}
                    onChange={e => setNewMeal({...newMeal, mealType: e.target.value})}
                    className="w-full p-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Items</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rice, Dal, Chapati" 
                    value={newMeal.items}
                    onChange={e => setNewMeal({...newMeal, items: e.target.value})}
                    className="w-full p-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Special weekend menu" 
                  value={newMeal.notes}
                  onChange={e => setNewMeal({...newMeal, notes: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-input rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Save Meal</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeMenus.length === 0 && !isAdding ? (
        <EmptyState title="No Meals Scheduled" description={`No menu found for ${activeDate}.`} icon={<Utensils className="h-6 w-6" />} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeMenus.map((menu: {id: string; items: string; mealType: string; notes?: string; date: string; avgRating?: string | number; feedbackCount?: number}) => (
            <Card key={menu.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary">{menu.mealType}</Badge>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(menu.id)} className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded-md transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-lg">{menu.items}</CardTitle>
                {menu.notes && <p className="text-sm text-text-secondary">{menu.notes}</p>}
              </CardHeader>
              <CardContent className="pt-4 border-t border-border mt-2 bg-surface-muted/30">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-warning fill-warning" />
                    <div>
                      <div className="font-bold text-lg leading-none">{menu.avgRating || "-"}</div>
                      <div className="text-xs text-text-secondary">Avg Rating</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-info" />
                    <div>
                      <div className="font-bold text-lg leading-none">{menu.feedbackCount}</div>
                      <div className="text-xs text-text-secondary">Responses</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
