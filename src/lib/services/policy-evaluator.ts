export interface PolicyCondition {
  field?: string;
  operator?: 'equals' | 'not_equals' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'not_in' | 'exists';
  value?: any;
  all?: PolicyCondition[];
  any?: PolicyCondition[];
  not?: PolicyCondition;
  // Legacy support
  type?: string;
  days?: number;
}

export class PolicyConditionEvaluator {
  static evaluate(condition: PolicyCondition, context: Record<string, any>): boolean {
    // Legacy support for short-leave auto approval
    if (condition.type === 'LEAVE_DAYS_LESS_THAN_OR_EQUAL') {
      const leaveDays = context.leaveDays;
      return typeof leaveDays === 'number' && leaveDays > 0 && leaveDays <= (condition.days || 0);
    }

    if (condition.all && Array.isArray(condition.all)) {
      return condition.all.every(c => this.evaluate(c, context));
    }
    if (condition.any && Array.isArray(condition.any)) {
      return condition.any.some(c => this.evaluate(c, context));
    }
    if (condition.not) {
      return !this.evaluate(condition.not, context);
    }

    if (condition.field && condition.operator) {
      const fieldValue = this.getNestedValue(context, condition.field);
      return this.evaluateComparison(fieldValue, condition.operator, condition.value);
    }

    // Unrecognized condition, fail safe
    return false;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private static evaluateComparison(fieldValue: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === targetValue;
      case 'not_equals':
        return fieldValue !== targetValue;
      case 'lt':
        return typeof fieldValue === 'number' && typeof targetValue === 'number' && fieldValue < targetValue;
      case 'lte':
        return typeof fieldValue === 'number' && typeof targetValue === 'number' && fieldValue <= targetValue;
      case 'gt':
        return typeof fieldValue === 'number' && typeof targetValue === 'number' && fieldValue > targetValue;
      case 'gte':
        return typeof fieldValue === 'number' && typeof targetValue === 'number' && fieldValue >= targetValue;
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(targetValue) && !targetValue.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }
}
