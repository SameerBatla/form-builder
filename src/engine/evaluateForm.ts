import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldValue } from '../fields/fieldUnion'
import { getInitialValue, getValueError, isValueEmpty } from '../fields/logicRegistry'

export type FormValues = Record<FieldId, FieldValue>

export interface FieldEvaluation {
  isVisible: boolean
  /** Always false while hidden: a hidden field is never required. */
  isRequired: boolean
  /** What downstream logic and the submission see (hidden → the field's empty value). */
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
 * stored. Today it applies each field's default visibility/required state;
 * conditional rules plug in here later without changing the callers.
 */
export function evaluateForm(
  fields: Field[],
  rawValues: FormValues,
  today: string,
): FormEvaluation {
  const evaluated: Record<FieldId, FieldEvaluation> = {}
  let errorCount = 0
  let firstErrorFieldId: FieldId | null = null

  for (const field of fields) {
    const initialValue = getInitialValue(field, today)
    const rawValue = rawValues[field.id] ?? initialValue
    const isVisible = field.visibility.defaultState === 'visible'
    const isRequired = isVisible && field.required?.defaultState === 'required'
    const value = isVisible ? rawValue : initialValue

    let error: string | null = null
    if (isVisible) {
      if (isValueEmpty(field, value)) {
        error = isRequired ? 'This field is required.' : null
      } else {
        error = getValueError(field, value)
      }
    }
    if (error !== null) {
      errorCount += 1
      firstErrorFieldId ??= field.id
    }
    evaluated[field.id] = { isVisible, isRequired, value, error }
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
      values[field.id] = fieldEvaluation.value
    }
  }
  return { visibleFieldIds, values }
}
