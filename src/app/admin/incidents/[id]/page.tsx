import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar } from "lucide-react";
import { AdminAPI } from "@/lib/admin/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IncidentActionsClient } from "./components/incident-actions-client";

export const dynamic = "force-dynamic";

export default async function AdminIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await AdminAPI.getIncident(id);
  
  if (!incident) {
    notFound();
  }

  const allRequests = await AdminAPI.listRequests();
  const affectedRequests = allRequests.filter(req => req.incidentId === incident.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link 
            href="/admin/incidents" 
            className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-3"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Incidents
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {incident.title}
            </h1>
            <Badge variant={incident.status === "OPEN" ? "warning" : "success"}>
              {incident.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary mt-2">
            <span className="font-mono">{incident.incidentNumber}</span>
            <span>•</span>
            <span>{incident.category}</span>
            <span>•</span>
            <span>{incident.location}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-border bg-surface-muted">
            <CardHeader>
              <CardTitle>Affected Requests ({affectedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ageing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affectedRequests.map((req) => (
                      <TableRow key={req.id} className="cursor-pointer hover:bg-surface-muted transition-colors relative group">
                        <TableCell className="font-medium">
                          <Link href={`/admin/requests/${req.id}`} className="absolute inset-0" aria-label={`View request ${req.ticketNumber}`}></Link>
                          {req.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{req.requesterName}</div>
                          <div className="text-xs text-text-secondary">{req.location}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{req.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={req.slaStatus === 'BREACHED' ? 'text-error font-medium' : req.slaStatus === 'WARNING' ? 'text-warning font-medium' : 'text-success font-medium'}>
                            {req.ageingHours}h
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="space-y-6">
          <IncidentActionsClient incident={incident} />

          <Card className="border-2 border-border bg-surface-muted">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Created</p>
                <div className="flex items-center text-sm font-medium text-text-primary">
                  <Calendar className="w-4 h-4 mr-2 text-text-secondary" />
                  {new Date(incident.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-text-secondary mb-1">Last Updated</p>
                <div className="flex items-center text-sm font-medium text-text-primary">
                  <Calendar className="w-4 h-4 mr-2 text-text-secondary" />
                  {new Date(incident.updatedAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
