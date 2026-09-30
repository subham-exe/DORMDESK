import { prisma } from '../db/prisma';

export interface RouteResult {
  domain: string;
  department?: string;
  authorityRole?: string;
  authorityUserId?: string;
  reason: string;
  safeConfidence: boolean;
  manualReviewRequired: boolean;
}

export class RoutingEngine {
  static async classifyAndRoute(payload: { requestType: string, category: string, description: string, location?: string }): Promise<RouteResult> {
    const { requestType, category } = payload;
    
    let domain = 'System';
    let department: string | undefined = undefined;
    let authorityRole: string | undefined = undefined;
    let manualReviewRequired = false;
    let safeConfidence = true;
    let reason = 'Default fallback routing.';

    // Rule 1: Complaint Classification
    if (requestType === 'COMPLAINT') {
      if (category === 'Plumbing') {
         domain = 'Facilities';
         department = 'Plumbing';
         authorityRole = 'Staff';
         reason = 'Mapped Plumbing category to Facilities/Plumbing staff.';
      } else if (category === 'Electrical') {
         domain = 'Facilities';
         department = 'Electrical';
         authorityRole = 'Staff';
         reason = 'Mapped Electrical category to Facilities/Electrical staff.';
      } else if (category === 'Cleanliness' || category === 'Housekeeping') {
         domain = 'Facilities';
         department = 'Housekeeping';
         authorityRole = 'Staff';
         reason = 'Mapped Cleanliness to Facilities/Housekeeping staff.';
      } else if (category === 'Internet' || category === 'IT') {
         domain = 'IT';
         department = 'IT';
         authorityRole = 'Staff';
         reason = 'Mapped Internet to IT staff.';
      } else {
         domain = 'Facilities'; // Default complaints domain
         manualReviewRequired = true;
         safeConfidence = false;
         reason = `Unknown complaint category '${category}'. Flagged for manual review.`;
      }
    } 
    // Rule 2: Leave & Gate Pass
    else if (requestType === 'LEAVE' || requestType === 'GATE_PASS') {
      domain = 'Hostel Operations';
      authorityRole = 'Warden';
      reason = 'Mapped Leave/Gate-Pass to Hostel Warden.';
    } 
    // Rule 3: Academic / Certificate / Scholarship
    else if (requestType === 'CERTIFICATE' || requestType === 'ACADEMIC' || requestType === 'SCHOLARSHIP') {
      domain = 'Academic';
      authorityRole = 'Faculty';
      manualReviewRequired = true;
      reason = 'Mapped academic request. Requires manual review to assign correct department faculty/staff.';
    } 
    // Rule 4: Fallback
    else {
      manualReviewRequired = true;
      safeConfidence = false;
      reason = `Unknown request type '${requestType}'. Flagged for manual review.`;
    }

    let authorityUserId: string | undefined = undefined;

    // Smart Assignment: if deterministically resolvable
    if (!manualReviewRequired && authorityRole) {
       const possibleUsers = await prisma.user.findMany({
          where: {
             role: authorityRole,
             ...(department ? { department } : {})
          }
       });

       if (possibleUsers.length === 1) {
          authorityUserId = possibleUsers[0].id;
          reason += ` Deterministically assigned to ${possibleUsers[0].name}.`;
       } else if (possibleUsers.length > 1) {
          reason += ` Multiple authorities found for ${authorityRole}${department ? '/'+department : ''}. Left unassigned for pool pickup.`;
       } else {
          manualReviewRequired = true;
          safeConfidence = false;
          reason += ` No authority found for ${authorityRole}${department ? '/'+department : ''}. Flagged for manual review.`;
       }
    }

    return {
      domain,
      department,
      authorityRole,
      authorityUserId,
      reason,
      safeConfidence,
      manualReviewRequired
    };
  }
}
