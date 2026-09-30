import { describe, it, expect } from 'vitest';
import { PolicyConditionEvaluator } from '../policy-evaluator';

describe('R2 - PolicyConditionEvaluator', () => {
  it('supports legacy short-leave condition', () => {
    const condition = {
 type: 'LEAVE_DAYS_LESS_THAN_OR_EQUAL', days: 2 };
    expect(PolicyConditionEvaluator.evaluate(condition as any, { leaveDays: 2 })).toBe(true);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { leaveDays: 1 })).toBe(true);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { leaveDays: 3 })).toBe(false);
  });

  it('supports basic equals and gt/lt operators', () => {
    const condition = {
 field: 'leaveDays', operator: 'lte', value: 2 };
    expect(PolicyConditionEvaluator.evaluate(condition as any, { leaveDays: 2 })).toBe(true);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { leaveDays: 3 })).toBe(false);
  });

  it('supports logical ALL operator', () => {
    const condition = {

      all: [
        { field: 'requestType', operator: 'equals', value: 'LEAVE' },
        { field: 'leaveDays', operator: 'lte', value: 2 }
      ]
    };

    expect(PolicyConditionEvaluator.evaluate(condition as any, { requestType: 'LEAVE', leaveDays: 2 })).toBe(true);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { requestType: 'COMPLAINT', leaveDays: 2 })).toBe(false);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { requestType: 'LEAVE', leaveDays: 5 })).toBe(false);
  });

  it('supports logical ANY and NOT operators', () => {
    const condition = {

      any: [
        { field: 'category', operator: 'equals', value: 'X' },
        { field: 'category', operator: 'equals', value: 'Y' }
      ]
    };
    expect(PolicyConditionEvaluator.evaluate(condition as any, { category: 'X' })).toBe(true);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { category: 'Y' })).toBe(true);
    expect(PolicyConditionEvaluator.evaluate(condition as any, { category: 'Z' })).toBe(false);

    const notCondition = { not: condition };
    expect(PolicyConditionEvaluator.evaluate(notCondition as any, { category: 'X' })).toBe(false);
    expect(PolicyConditionEvaluator.evaluate(notCondition as any, { category: 'Z' })).toBe(true);
  });

  it('handles missing fields gracefully', () => {
    const condition = {
 field: 'someField', operator: 'equals', value: '123' };
    expect(PolicyConditionEvaluator.evaluate(condition as any, {})).toBe(false);
  });

  it('handles invalid operators gracefully', () => {
    const condition = {
 field: 'someField', operator: 'invalid_op', value: '123' };
    expect(PolicyConditionEvaluator.evaluate(condition as any, { someField: '123' })).toBe(false);
  });
});

