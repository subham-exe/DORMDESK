"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const { toast } = useToast();
  
  const [newFee, setNewFee] = useState({ studentId: "", amount: "", description: "", dueDate: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees");
      const data = await res.json();
      if (data.success) {
        setFees(data.fees);
      }
      
      const sRes = await fetch("/api/admin/users?role=Student");
      const sData = await sRes.json();
      if (sData.success) {
        setStudents(sData.users);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: newFee.studentId,
          amount: parseFloat(newFee.amount),
          description: newFee.description,
          dueDate: newFee.dueDate
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Fee created successfully", variant: "success" });
        setIsDialogOpen(false);
        fetchData();
      } else {
        toast({ title: "Error", description: data.error, variant: "default" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "default" });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/fees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Status updated", variant: "success" });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Fees Management</h1>
          <p className="text-text-secondary text-sm">Manage student fees and dues</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-text-inverse hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Fee
        </Button>
        <Modal 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          title="Create New Fee Due"
          footer={
            <Button onClick={handleCreate} className="w-full bg-primary text-text-inverse hover:bg-primary/90">Create Fee</Button>
          }
        >
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <select 
                className="w-full h-10 px-3 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                value={newFee.studentId}
                onChange={(e) => setNewFee({...newFee, studentId: e.target.value})}
              >
                <option value="">Select Student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={newFee.amount} onChange={(e) => setNewFee({...newFee, amount: e.target.value})} placeholder="e.g. 500" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newFee.description} onChange={(e) => setNewFee({...newFee, description: e.target.value})} placeholder="e.g. Mess Due" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={newFee.dueDate} onChange={(e) => setNewFee({...newFee, dueDate: e.target.value})} />
            </div>
          </div>
        </Modal>
      </div>

      {loading ? (
        <div>Loading fees...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fees.map(fee => (
            <Card key={fee.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">${fee.amount}</h3>
                      <p className="text-sm text-text-secondary">{fee.student?.name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${fee.status === 'PAID' ? 'bg-success-bg text-success' : fee.status === 'PENDING' ? 'bg-warning-bg text-warning' : 'bg-error-bg text-error'}`}>
                    {fee.status}
                  </span>
                </div>
                <div className="text-sm text-text-secondary mb-4 space-y-1">
                  <p><strong>For:</strong> {fee.description}</p>
                  <p><strong>Due:</strong> {new Date(fee.dueDate).toLocaleDateString()}</p>
                </div>
                {fee.status !== 'PAID' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-success text-success hover:bg-success-bg"
                    onClick={() => handleUpdateStatus(fee.id, 'PAID')}
                  >
                    Mark as Paid
                  </Button>
                )}
                {fee.status === 'PAID' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-warning text-warning hover:bg-warning-bg"
                    onClick={() => handleUpdateStatus(fee.id, 'PENDING')}
                  >
                    Mark as Pending
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {fees.length === 0 && <div className="text-text-secondary p-4">No fees found.</div>}
        </div>
      )}
    </div>
  );
}
