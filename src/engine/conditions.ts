import type { Condition } from '../fields/conditionSchema'
import type { RuleMatch } from '../fields/fieldBase'
import type { FieldValue } from '../fields/fieldUnion'

/** What a condition can see of its target field, after the target was evaluated. */
export interface TargetState {
  isVisible: boolean
  isEmpty: boolean
  value: FieldValue
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

function isStringArray(value: FieldValue): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Spec: "default state when the target field has no value". So a hidden, empty
 * or missing target never matches, for every operator (including "does not
 * equal" and "contains none of"). A value of the wrong shape never matches either.
 */
export function isConditionMet(
  condition: Condition,
  target: TargetState | null,
): boolean {
  if (!target || !target.isVisible || target.isEmpty) {
    return false
  }
  const { value } = target

  switch (condition.kind) {
    case 'text': {
      if (typeof value !== 'string') {
        return false
      }
      const actual = normalizeText(value)
      const expected = normalizeText(condition.value)
      if (condition.operator === 'equals') {
        return actual === expected
      }
      if (condition.operator === 'notEquals') {
        return actual !== expected
      }
      return actual.includes(expected)
    }

    case 'number': {
      if (typeof value !== 'number' || condition.value === null) {
        return false
      }
      if (condition.operator === 'equals') {
        return value === condition.value
      }
      if (condition.operator === 'greaterThan') {
        return value > condition.value
      }
      return value < condition.value
    }

    case 'numberRange': {
      const { min, max } = condition.value
      if (typeof value !== 'number' || min === null || max === null) {
        return false
      }
      return value >= min && value <= max
    }

    case 'singleSelect': {
      if (typeof value !== 'string') {
        return false
      }
      return condition.operator === 'equals'
        ? value === condition.value
        : value !== condition.value
    }

    case 'multiSelect': {
      if (!isStringArray(value)) {
        return false
      }
      const selected = new Set(value)
      if (condition.operator === 'containsAny') {
        return condition.value.some((optionId) => selected.has(optionId))
      }
      if (condition.operator === 'containsAll') {
        return condition.value.every((optionId) => selected.has(optionId))
      }
      return condition.value.every((optionId) => !selected.has(optionId))
    }

    case 'date': {
      // YYYY-MM-DD strings compare in date order.
      if (typeof value !== 'string' || condition.value === null) {
        return false
      }
      if (condition.operator === 'equals') {
        return value === condition.value
      }
      if (condition.operator === 'before') {
        return value < condition.value
      }
      return value > condition.value
    }
  }
}

/** ALL: every condition is met. ANY: at least one. No conditions never matches. */
export function matchesRuleGroup(
  group: { match: RuleMatch; conditions: Condition[] },
  isMet: (condition: Condition) => boolean,
): boolean {
  if (group.conditions.length === 0) {
    return false
  }
  return group.match === 'all'
    ? group.conditions.every(isMet)
    : group.conditions.some(isMet)
}
