export type SeriousnessClassification = 'NORMAL' | 'SERIOUS' | 'SERIOUS_REVIEW';

export interface SeriousnessSignals {
  studentFlaggedSerious?: boolean;
  immediateSafetyConcern?: boolean;
  involvesHarassment?: boolean;
  involvesRagging?: boolean;
  involvesAbuse?: boolean;
  isAgainstPrincipal?: boolean;
}

export interface SeriousnessResult {
  classification: SeriousnessClassification;
  reasons: string[];
}

const SENSITIVE_KEYWORDS = [
  'threat', 'threatening', 'attack', 'attacked', 'kill', 'killing', 
  'ragging', 'harass', 'harassment', 'abuse', 'unsafe', 'danger', 'dangerous'
];

export class SeriousnessPolicy {
  /**
   * Deterministically evaluates the seriousness of a request.
   */
  static evaluate(
    requestType: string,
    category: string,
    description: string,
    signals: SeriousnessSignals = {}
  ): SeriousnessResult {
    const reasons: string[] = [];

    // R1
    if (signals.immediateSafetyConcern) {
      reasons.push('IMMEDIATE_SAFETY_CONCERN');
    }
    // R2
    if (signals.involvesHarassment) {
      reasons.push('INVOLVES_HARASSMENT');
    }
    // R3
    if (signals.involvesRagging) {
      reasons.push('INVOLVES_RAGGING');
    }
    // R4
    if (signals.involvesAbuse) {
      reasons.push('INVOLVES_ABUSE');
    }
    // R5: Existing explicit safety-sensitive categories
    const catLower = category.toLowerCase();
    if (catLower === 'ragging' || catLower === 'harassment' || catLower === 'safety' || catLower === 'abuse') {
      reasons.push('SAFETY_SENSITIVE_CATEGORY');
    }
    // R6
    if (signals.isAgainstPrincipal) {
      reasons.push('COMPLAINT_AGAINST_PRINCIPAL');
    }

    if (reasons.length > 0) {
      return { classification: 'SERIOUS', reasons };
    }

    // Keyword extraction (R7 / Keyword Signals)
    const descLower = description.toLowerCase();
    
    for (const kw of SENSITIVE_KEYWORDS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(descLower)) {
        
        reasons.push('SENSITIVE_KEYWORD_SIGNAL');
        break; // Only need one to trigger review
      }
    }

    // R7
    if (signals.studentFlaggedSerious) {
      reasons.push('STUDENT_FLAGGED_SERIOUS');
    }

    if (reasons.length > 0) {
      // Either keyword found, or student flagged serious
      return { classification: 'SERIOUS_REVIEW', reasons };
    }

    // R8
    return { classification: 'NORMAL', reasons: ['ROUTINE_REQUEST'] };
  }
}
