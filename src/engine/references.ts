import type { Condition } from '../fields/conditionSchema'
import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { getRequiredRules } from '../fields/fieldUnion'
import {
  getFieldOptions,
  getReferencedFieldIds,
  removeConfigReference,
} from '../fields/logicRegistry'

/*
 * Keeping references valid when the builder deletes a field or an option, so a
 * saved template never points at something that no longer exists.
 */

export interface FieldReference {
  fieldId: FieldId
  label: string
  /** Rules in this field that target the referenced field. */
  ruleCount: number
  /** True when this field's own config reads it (e.g. a Calculation source). */
  usesAsSource: boolean
}

function allConditions(field: Field): Condition[] {
  return [...field.visibility.conditions, ...(getRequiredRules(field)?.conditions ?? [])]
}

/**
 * Applies `update` to both rule groups. Returns the same object when nothing
 * changed, so unaffected fields keep their identity (cheap change detection).
 */
function updateConditions(
  field: Field,
  update: (conditions: Condition[]) => Condition[],
): Field {
  const visibilityConditions = update(field.visibility.conditions)
  const visibilityChanged = !sameConditions(
    visibilityConditions,
    field.visibility.conditions,
  )
  let next: Field = visibilityChanged
    ? { ...field, visibility: { ...field.visibility, conditions: visibilityConditions } }
    : field

  if ('required' in next) {
    const requiredConditions = update(next.required.conditions)
    if (!sameConditions(requiredConditions, next.required.conditions)) {
      next = { ...next, required: { ...next.required, conditions: requiredConditions } }
    }
  }
  return next
}

function sameConditions(first: Condition[], second: Condition[]): boolean {
  return (
    first.length === second.length &&
    first.every((condition, index) => condition === second[index])
  )
}

/** Who would be affected if `fieldId` were deleted (for the confirm dialog). */
export function findFieldReferences(fields: Field[], fieldId: FieldId): FieldReference[] {
  const references: FieldReference[] = []
  for (const field of fields) {
    if (field.id === fieldId) {
      continue
    }
    const ruleCount = allConditions(field).filter(
      (condition) => condition.targetId === fieldId,
    ).length
    const usesAsSource = getReferencedFieldIds(field).includes(fieldId)
    if (ruleCount > 0 || usesAsSource) {
      references.push({
        fieldId: field.id,
        label: field.label.trim() || 'Untitled field',
        ruleCount,
        usesAsSource,
      })
    }
  }
  return references
}

/** After deleting `removedId`: drop rules that target it and config references to it. */
export function removeFieldReferences(fields: Field[], removedId: FieldId): Field[] {
  return fields.map((field) => {
    const withoutRules = updateConditions(field, (conditions) =>
      conditions.filter((condition) => condition.targetId !== removedId),
    )
    return removeConfigReference(withoutRules, removedId)
  })
}

/**
 * After a select field's options change: rules on it that use a removed option
 * are fixed (multi select drops the id) or deleted (single select, or nothing left).
 * Renaming keeps the option id, so it never affects rules.
 */
export function pruneOptionConditions(fields: Field[], updatedField: Field): Field[] {
  const optionIds = new Set(getFieldOptions(updatedField).map((option) => option.id))
  const fixCondition = (condition: Condition): Condition | null => {
    if (condition.targetId !== updatedField.id) {
      return condition
    }
    if (condition.kind === 'singleSelect') {
      return optionIds.has(condition.value) ? condition : null
    }
    if (condition.kind === 'multiSelect') {
      const kept = condition.value.filter((optionId) => optionIds.has(optionId))
      if (kept.length === condition.value.length) {
        return condition
      }
      return kept.length > 0 ? { ...condition, value: kept } : null
    }
    return condition
  }

  return fields.map((field) =>
    updateConditions(field, (conditions) => {
      const fixed: Condition[] = []
      for (const condition of conditions) {
        const result = fixCondition(condition)
        if (result) {
          fixed.push(result)
        }
      }
      return fixed
    }),
  )
}

/** Labels of fields whose rules would change if `updatedField` replaced its old version. */
export function findOptionRuleImpact(fields: Field[], updatedField: Field): string[] {
  const pruned = pruneOptionConditions(fields, updatedField)
  return fields
    .filter((field, index) => field.id !== updatedField.id && pruned[index] !== field)
    .map((field) => field.label.trim() || 'Untitled field')
}
