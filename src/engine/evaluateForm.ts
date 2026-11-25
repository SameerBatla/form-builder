import type { Condition } from '../fields/conditionSchema'
import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldValue } from '../fields/fieldUnion'
import { getRequiredRules } from '../fields/fieldUnion'
import {
  capturesValue,
  computeFieldValue,
  getInitialValue,
  getValueError,
  isValueEmpty,
  normalizeValue,
} from '../fields/logicRegistry'
import type { TargetState } from './conditions'
import { isConditionMet, matchesRuleGroup } from './conditions'
import { orderByDependencies } from './dependencies'

export type FormValues = Record<FieldId, FieldValue>

export interface FieldEvaluation {
  isVisible: boolean
  /** Always false while hidden: a hidden field is never required. */
  isRequired: boolean
  /** The value as used downstream (normalized). Consumers must check isVisible first. */
  value: FieldValue
  error: string | null
}

export interface FormEvaluation {
  fields: Record<FieldId, FieldEvaluation>
  errorCount: number
  firstErrorFieldId: FieldId | null
}

/*
 * Everything derived from the typed values, computed on each render and never
 * stored. Fields are evaluated in dependency order, so when a field's rules
 * run, every field they look at already has its final visibility and value.
 * A hidden target counts as "no value", which is what makes chains collapse:
 * A hides B → B counts as empty → C (shown by B) falls back to its default.
 */
export function evaluateForm(
  fields: Field[],
  rawValues: FormValues,
  today: string,
): FormEvaluation {
  const fieldsById = new Map(fields.map((field) => [field.id, field]))
  const evaluated: Record<FieldId, FieldEvaluation> = {}

  const getTargetState = (targetId: FieldId): TargetState | null => {
    const target = fieldsById.get(targetId)
    const targetEvaluation = evaluated[targetId]
    // Missing (deleted) or not evaluated yet (only inside a loop) → no value.
    if (!target || !targetEvaluation) {
      return null
    }
    return {
      isVisible: targetEvaluation.isVisible,
      isEmpty: isValueEmpty(target, targetEvaluation.value),
      value: targetEvaluation.value,
    }
  }
  const isMet = (condition: Condition) =>
    isConditionMet(condition, getTargetState(condition.targetId))

  for (const field of orderByDependencies(fields)) {
    // Each rule group flips its default when it matches.
    const isVisibleByDefault = field.visibility.defaultState === 'visible'
    const isVisible = matchesRuleGroup(field.visibility, isMet)
      ? !isVisibleByDefault
      : isVisibleByDefault

    let isRequired = false
    const requiredRules = getRequiredRules(field)
    if (isVisible && requiredRules) {
      const isRequiredByDefault = requiredRules.defaultState === 'required'
      isRequired = matchesRuleGroup(requiredRules, isMet)
        ? !isRequiredByDefault
        : isRequiredByDefault
    }

    const initialValue = getInitialValue(field, today)
    // Derived fields (Calculation) compute from their sources, which the
    // dependency order guarantees are already evaluated.
    const computedValue = computeFieldValue(field, getTargetState)
    let rawValue: FieldValue = initialValue
    if (computedValue !== undefined) {
      rawValue = computedValue
    } else if (field.id in rawValues) {
      // `in`, not `??`: a deliberately cleared value (null) must stay cleared.
      rawValue = rawValues[field.id]
    }
    const value = isVisible ? normalizeValue(field, rawValue) : initialValue

    let error: string | null = null
    if (isVisible) {
      if (isValueEmpty(field, value)) {
        error = isRequired ? 'This field is required.' : null
      } else {
        error = getValueError(field, value)
      }
    }
    evaluated[field.id] = { isVisible, isRequired, value, error }
  }

  // Counted in form order so "first error" is the first one on screen.
  let errorCount = 0
  let firstErrorFieldId: FieldId | null = null
  for (const field of fields) {
    if (evaluated[field.id].error !== null) {
      errorCount += 1
      firstErrorFieldId ??= field.id
    }
  }
  return { fields: evaluated, errorCount, firstErrorFieldId }
}

/** What a response stores: visible fields only, in form order. */
export function buildSubmission(
  fields: Field[],
  evaluation: FormEvaluation,
): { visibleFieldIds: FieldId[]; values: FormValues } {
  const visibleFieldIds: FieldId[] = []
  const values: FormValues = {}
  for (const field of fields) {
    const fieldEvaluation = evaluation.fields[field.id]
    if (fieldEvaluation.isVisible) {
      visibleFieldIds.push(field.id)
      if (capturesValue(field)) {
        values[field.id] = fieldEvaluation.value
      }
    }
  }
  return { visibleFieldIds, values }
}
