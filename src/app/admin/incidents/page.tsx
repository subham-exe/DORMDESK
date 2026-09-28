import { Shield } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminAPI } from "@/lib/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminIncidentsPage() {
  const incidents = await AdminAPI.listIncidents();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
        <p className="text-text-secondary">Grouped operational problems affecting multiple requests.</p>
      </div>
      
      {incidents.length === 0 ? (
        <EmptyState 
                title="No Active Incidents" 
                description={"There are currently no grouped incidents. You can group related requests from the Request Queue." 
        }
                icon={<Shield className="h-6 w-6" />}
              />
      ) : (
                <Card className="overflow-hidden">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Affected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id} className="cursor-pointer hover:bg-surface-muted transition-colors relative group">
                    <TableCell className="font-medium">
                      <Link href={`/admin/incidents/${inc.id}`} className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" aria-label={`View incident ${inc.incidentNumber}`}></Link>
                      {inc.incidentNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{inc.title}</div>
                      <div className="text-xs text-text-secondary">{inc.category} � {inc.location}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{inc.affectedStudentCount} Requests</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inc.status === "OPEN" ? "warning" : "success"}>{inc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(inc.updatedAt).toLocaleString()}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden divide-y divide-border">
            {incidents.map((inc) => (
              <div key={inc.id} className="relative p-4 hover:bg-surface-muted transition-colors flex flex-col gap-3">
                <Link href={`/admin/incidents/${inc.id}`} className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" aria-label={`View incident ${inc.incidentNumber}`}></Link>
                <div className="flex justify-between items-start gap-2">
                  <div className="font-semibold text-sm">{inc.incidentNumber}</div>
                  <Badge variant={inc.status === "OPEN" ? "warning" : "success"}>{inc.status}</Badge>
                </div>
                <div>
                  <div className="font-medium text-sm">{inc.title}</div>
                  <div className="text-xs text-text-secondary">{inc.category} � {inc.location}</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Badge variant="secondary" className="text-[10px]">{inc.affectedStudentCount} Requests</Badge>
                  <div className="text-text-muted">{new Date(inc.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
