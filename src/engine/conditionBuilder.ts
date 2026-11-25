import type { Condition, ConditionKind } from '../fields/conditionSchema'
import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { getConditionKinds, getFieldOptions } from '../fields/logicRegistry'
import { dependsOn } from './dependencies'

/*
 * Pure helpers behind the builder's rule editor: which fields can be targets,
 * which operators each target offers (wording from the spec), sensible defaults,
 * and what makes a condition incomplete.
 */

export const operatorChoices = [
  { kind: 'text', operator: 'equals', label: 'equals' },
  { kind: 'text', operator: 'notEquals', label: 'does not equal' },
  { kind: 'text', operator: 'contains', label: 'contains' },
  { kind: 'number', operator: 'equals', label: 'equals' },
  { kind: 'number', operator: 'greaterThan', label: 'is greater than' },
  { kind: 'number', operator: 'lessThan', label: 'is less than' },
  { kind: 'numberRange', operator: 'withinRange', label: 'is within range' },
  { kind: 'singleSelect', operator: 'equals', label: 'equals' },
  { kind: 'singleSelect', operator: 'notEquals', label: 'does not equal' },
  { kind: 'multiSelect', operator: 'containsAny', label: 'contains any of' },
  { kind: 'multiSelect', operator: 'containsAll', label: 'contains all of' },
  { kind: 'multiSelect', operator: 'containsNone', label: 'contains none of' },
  { kind: 'date', operator: 'equals', label: 'equals' },
  { kind: 'date', operator: 'before', label: 'is before' },
  { kind: 'date', operator: 'after', label: 'is after' },
] as const satisfies readonly { kind: ConditionKind; operator: string; label: string }[]

export type OperatorChoice = (typeof operatorChoices)[number]

/** A stable key for a choice, e.g. "number:greaterThan" (used as a <select> value). */
export function choiceKey(choice: { kind: ConditionKind; operator: string }): string {
  return `${choice.kind}:${choice.operator}`
}

export function choicesForTarget(target: Field): OperatorChoice[] {
  const kinds = new Set(getConditionKinds(target))
  return operatorChoices.filter((choice) => kinds.has(choice.kind))
}

/**
 * Fields `fieldId` may use as a rule target: types that support rules, except
 * the field itself and any field that already depends on it (that would loop).
 */
export function getEligibleTargets(fields: Field[], fieldId: FieldId): Field[] {
  return fields.filter(
    (field) =>
      getConditionKinds(field).length > 0 && !dependsOn(fields, field.id, fieldId),
  )
}

/** A condition for `target` with the given operator and an empty/default value. */
function buildCondition(id: string, target: Field, choice: OperatorChoice): Condition {
  const targetId = target.id
  switch (choice.kind) {
    case 'text':
      return { id, targetId, kind: choice.kind, operator: choice.operator, value: '' }
    case 'number':
      return { id, targetId, kind: choice.kind, operator: choice.operator, value: null }
    case 'numberRange':
      return {
        id,
        targetId,
        kind: choice.kind,
        operator: choice.operator,
        value: { min: null, max: null },
      }
    case 'date':
      return { id, targetId, kind: choice.kind, operator: choice.operator, value: null }
    case 'singleSelect': {
      const [firstOption] = getFieldOptions(target)
      const value = firstOption ? firstOption.id : ''
      return { id, targetId, kind: choice.kind, operator: choice.operator, value }
    }
    case 'multiSelect':
      return { id, targetId, kind: choice.kind, operator: choice.operator, value: [] }
  }
}

export function createCondition(id: string, target: Field): Condition {
  const [firstChoice] = choicesForTarget(target)
  if (!firstChoice) {
    throw new Error(`Field "${target.id}" can't be a rule target`)
  }
  return buildCondition(id, target, firstChoice)
}

export function changeConditionTarget(condition: Condition, target: Field): Condition {
  return createCondition(condition.id, target)
}

/** Same operator family → keep the typed value; otherwise start a fresh value. */
export function changeConditionOperator(
  condition: Condition,
  choice: OperatorChoice,
  target: Field,
): Condition {
  // Checking both kinds in each branch lets TypeScript pair the operator with the value.
  switch (condition.kind) {
    case 'text':
      if (choice.kind === 'text') {
        return { ...condition, operator: choice.operator }
      }
      break
    case 'number':
      if (choice.kind === 'number') {
        return { ...condition, operator: choice.operator }
      }
      break
    case 'numberRange':
      if (choice.kind === 'numberRange') {
        return condition
      }
      break
    case 'singleSelect':
      if (choice.kind === 'singleSelect') {
        return { ...condition, operator: choice.operator }
      }
      break
    case 'multiSelect':
      if (choice.kind === 'multiSelect') {
        return { ...condition, operator: choice.operator }
      }
      break
    case 'date':
      if (choice.kind === 'date') {
        return { ...condition, operator: choice.operator }
      }
      break
  }
  return buildCondition(condition.id, target, choice)
}

function labelOf(field: Field): string {
  return field.label.trim() || 'Untitled field'
}

/** Problems that block Save. Empty array when the condition is complete and valid. */
export function validateCondition(
  condition: Condition,
  fields: Field[],
  ownerId: FieldId,
): string[] {
  if (condition.targetId === ownerId) {
    return ['A field can’t have a rule on itself.']
  }
  const target = fields.find((field) => field.id === condition.targetId)
  if (!target) {
    return ['A rule refers to a field that no longer exists.']
  }
  if (!getConditionKinds(target).includes(condition.kind)) {
    return [`A rule on “${labelOf(target)}” uses an operator this field doesn’t support.`]
  }

  const onTarget = `A rule on “${labelOf(target)}”`
  const optionIds = new Set(getFieldOptions(target).map((option) => option.id))
  switch (condition.kind) {
    case 'text':
      return condition.value.trim() === ''
        ? [`${onTarget} needs a value to compare with.`]
        : []
    case 'number':
    case 'date':
      return condition.value === null
        ? [`${onTarget} needs a value to compare with.`]
        : []
    case 'numberRange': {
      const { min, max } = condition.value
      if (min === null || max === null) {
        return [`${onTarget} needs both ends of the range.`]
      }
      return min > max ? [`${onTarget} has a range whose start is after its end.`] : []
    }
    case 'singleSelect':
      return optionIds.has(condition.value)
        ? []
        : [`${onTarget} uses an option that no longer exists.`]
    case 'multiSelect':
      if (condition.value.length === 0) {
        return [`${onTarget} needs at least one option.`]
      }
      return condition.value.every((optionId) => optionIds.has(optionId))
        ? []
        : [`${onTarget} uses an option that no longer exists.`]
  }
}
