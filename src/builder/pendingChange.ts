import type { FieldReference } from '../engine/references'
import { findFieldReferences, findOptionRuleImpact } from '../engine/references'
import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { getFieldOptions } from '../fields/logicRegistry'

/** A builder change that also removes rules, so it is confirmed first (Q9, Q10). */
export type PendingChange =
  | { kind: 'deleteField'; fieldId: FieldId; label: string; references: FieldReference[] }
  | {
      kind: 'removeOptions'
      field: Field
      removedLabels: string[]
      affectedLabels: string[]
    }

/** Deleting a field other fields depend on needs confirmation; null when nothing else is affected. */
export function findDeleteFieldChange(
  fields: Field[],
  fieldId: FieldId,
): PendingChange | null {
  const references = findFieldReferences(fields, fieldId)
  if (references.length === 0) {
    return null
  }
  const field = fields.find((candidate) => candidate.id === fieldId)
  const label = field?.label.trim() || 'Untitled field'
  return { kind: 'deleteField', fieldId, label, references }
}

/** Removing select options that rules use needs confirmation; null otherwise (incl. renames). */
export function findRemoveOptionsChange(
  fields: Field[],
  updatedField: Field,
): PendingChange | null {
  const affectedLabels = findOptionRuleImpact(fields, updatedField)
  if (affectedLabels.length === 0) {
    return null
  }
  const previous = fields.find((candidate) => candidate.id === updatedField.id)
  const keptIds = new Set(getFieldOptions(updatedField).map((option) => option.id))
  const removedLabels = (previous ? getFieldOptions(previous) : [])
    .filter((option) => !keptIds.has(option.id))
    .map((option) => option.label.trim() || 'Untitled option')
  return { kind: 'removeOptions', field: updatedField, removedLabels, affectedLabels }
}
