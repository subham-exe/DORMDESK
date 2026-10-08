import { getCurrentUser } from "@/lib/auth/session";
import { getAuthorityName } from "@/lib/auth/authority";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorAssignmentForm } from "./components/mentor-form";

export default async function HodDashboard() {
  const user = await getCurrentUser();
  if (!user || getAuthorityName(user) !== "HOD") redirect("/login");

  const departmentId = user.departmentRefId;
  const collegeId = user.collegeId;

  if (!departmentId || !collegeId) throw new Error("HOD lacks proper scope");

  const faculties = await prisma.user.findMany({
    where: { departmentRefId: departmentId, collegeId, role: { in: ["Faculty", "HOD"] } },
    select: { id: true, name: true }
  });

  const students = await prisma.user.findMany({
    where: { departmentRefId: departmentId, collegeId, role: "Student" },
    select: { id: true, name: true, year: true, branch: true }
  });

  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: { 
      active: true,
      student: { departmentRefId: departmentId, collegeId }
    },
    include: { student: true, mentor: true },
    orderBy: { assignedAt: "desc" }
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">HOD Dashboard</h1>
          <p className="text-sm text-text-secondary">Department Overview & Operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <MentorAssignmentForm faculties={faculties} students={students} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Mentor Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-y-auto space-y-2 pr-2">
              {activeAssignments.length === 0 ? (
                <p className="text-sm text-text-secondary">No active assignments.</p>
              ) : (
                activeAssignments.map(a => (
                  <div key={a.id} className="p-3 bg-surface-muted rounded text-sm flex justify-between border border-border">
                    <div>
                      <p className="font-bold text-text-primary">{a.student.name}</p>
                      <p className="text-xs text-text-secondary">Mentee</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">{a.mentor.name}</p>
                      <p className="text-xs text-text-secondary">Mentor</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
