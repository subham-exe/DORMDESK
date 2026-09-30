import { prisma } from '../db/prisma';

export interface RouteResult {
  classification: string;
  domain: string;
  department?: string;
  authorityRole?: string;
  authorityUserId?: string;
  reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRESOLVED';
  score: number;
  evidence: string[];
  safeConfidence: boolean;
  manualReviewRequired: boolean;
}

interface CategoryDictionary {
  category: string;
  domain: string;
  department?: string;
  authorityRole: string;
  signals: string[];
  requestType: string[];
}

const DICTIONARY: CategoryDictionary[] = [
  {
    category: 'Plumbing',
    domain: 'Facilities',
    department: 'Plumbing',
    authorityRole: 'Staff',
    requestType: ['COMPLAINT'],
    signals: ['water', 'tap', 'pipe', 'leak', 'drain', 'plumbing', 'washroom', 'toilet', 'flush']
  },
  {
    category: 'Electrical',
    domain: 'Facilities',
    department: 'Electrical',
    authorityRole: 'Staff',
    requestType: ['COMPLAINT'],
    signals: ['light', 'fan', 'switch', 'socket', 'plug', 'power', 'electrical', 'wire', 'spark', 'shock', 'ac', 'cooler']
  },
  {
    category: 'Cleanliness',
    domain: 'Facilities',
    department: 'Housekeeping',
    authorityRole: 'Staff',
    requestType: ['COMPLAINT'],
    signals: ['clean', 'sweep', 'dust', 'garbage', 'trash', 'smell', 'dirty', 'mop', 'housekeeping', 'corridor']
  },
  {
    category: 'Internet',
    domain: 'IT',
    department: 'IT',
    authorityRole: 'Staff',
    requestType: ['COMPLAINT'],
    signals: ['wifi', 'internet', 'network', 'router', 'lan', 'disconnect', 'speed']
  },
  {
    category: 'Leave',
    domain: 'Hostel Operations',
    authorityRole: 'Warden',
    requestType: ['LEAVE'],
    signals: ['leave', 'home', 'holiday', 'vacation', 'sick', 'outstation']
  },
  {
    category: 'Gate Pass',
    domain: 'Hostel Operations',
    authorityRole: 'Warden',
    requestType: ['GATE_PASS'],
    signals: ['pass', 'out', 'gate', 'visit']
  },
  {
    category: 'Academic',
    domain: 'Academic',
    authorityRole: 'Faculty',
    requestType: ['CERTIFICATE', 'ACADEMIC', 'SCHOLARSHIP'],
    signals: ['certificate', 'bonafide', 'scholarship', 'academic', 'marksheet', 'transcript', 'grade']
  }
];

export class RoutingEngine {
  static async classifyAndRoute(payload: { requestType: string, category: string, description: string, location?: string }): Promise<RouteResult> {
    const { requestType, category, description, location } = payload;
    
    // 1. Scoring Candidate Categories
    const descLower = description.toLowerCase();
    const locLower = location?.toLowerCase() || '';
    const catLower = category.toLowerCase();
    
    let bestMatch: CategoryDictionary | null = null;
    let highestScore = 0;
    let bestEvidence: string[] = [];

    for (const dict of DICTIONARY) {
      let score = 0;
      const evidence: string[] = [];

      if (!dict.requestType.includes(requestType)) {
        continue; // Hard constraint: must match request type
      }

      // Exact category match
      if (dict.category.toLowerCase() === catLower) {
        score += 50;
        evidence.push(`Category exactly matched '${dict.category}' (+50)`);
      }

      // Signal matches in description
            for (const signal of dict.signals) {
        // Regex word boundary matching for whole word match
        const regex = new RegExp(`\\b${signal}\\b`, 'i');
        if (regex.test(descLower)) {
          score += 15;
          evidence.push(`Description contained keyword '${signal}' (+15)`);
        }
        if (regex.test(locLower)) {
          score += 5;
          evidence.push(`Location contained keyword '${signal}' (+5)`);
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = dict;
        bestEvidence = evidence;
      }
    }

    // 2. Resolve Confidence
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRESOLVED' = 'UNRESOLVED';
    let safeConfidence = false;
    let manualReviewRequired = true;

    // Thresholds: Exact category match = 50. 
    // If user selected "Other" but wrote "water tap broken" = 15+15=30 (Medium confidence -> Auto routes)
    if (highestScore >= 50) {
       confidence = 'HIGH';
       safeConfidence = true;
       manualReviewRequired = false;
    } else if (highestScore >= 30) {
       confidence = 'MEDIUM';
       safeConfidence = false;
       manualReviewRequired = true;
    } else if (highestScore > 0) {
       confidence = 'LOW';
       // Low confidence falls back to manual review
       manualReviewRequired = true;
    }

    // Additional hard constraint: Academic requests always require manual review for department assignment
    if (bestMatch && bestMatch.domain === 'Academic') {
       manualReviewRequired = true;
       safeConfidence = false;
       bestEvidence.push('Academic domain hard-constrained to manual review for department assignment.');
    }

    let domain = 'System';
    let department: string | undefined = undefined;
    let authorityRole: string | undefined = undefined;
    let classification = category || 'Unknown';
    let reason = '';

    if (bestMatch && highestScore > 0) {
       domain = bestMatch.domain;
       department = bestMatch.department;
       authorityRole = bestMatch.authorityRole;
       classification = bestMatch.category;
       reason = `Classified as ${classification} with ${confidence} confidence (Score: ${highestScore}).`;
    } else {
       reason = `Could not deterministically classify request. Score was 0.`;
       bestEvidence.push('No signals matched any known category.');
    }

    let authorityUserId: string | undefined = undefined;

    // 3. Smart Assignment
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
      classification,
      domain,
      department,
      authorityRole,
      authorityUserId,
      reason,
      confidence,
      score: highestScore,
      evidence: bestEvidence,
      safeConfidence,
      manualReviewRequired
    };
  }
}


