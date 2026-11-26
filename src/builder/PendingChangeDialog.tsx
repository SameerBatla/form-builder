import type { FieldReference } from '../engine/references'
import { pluralize } from '../lib/format'
import ConfirmDialog from '../ui/ConfirmDialog/ConfirmDialog'
import type { PendingChange } from './pendingChange'

function describeReference(reference: FieldReference): string {
  const parts: string[] = []
  if (reference.ruleCount > 0) {
    parts.push(`${pluralize(reference.ruleCount, 'rule')} in “${reference.label}”`)
  }
  if (reference.usesAsSource) {
    parts.push(`the calculation “${reference.label}”`)
  }
  return parts.join(' and ')
}

function describeOptionImpact(removedLabels: string[], affectedLabels: string[]): string {
  const quote = (labels: string[]) => labels.map((label) => `“${label}”`).join(', ')
  const isOne = removedLabels.length === 1
  return `${quote(removedLabels)} ${isOne ? 'is' : 'are'} used in rules on ${quote(affectedLabels)}. Removing ${isOne ? 'it' : 'them'} also updates or removes those rules.`
}

interface PendingChangeDialogProps {
  change: PendingChange
  onConfirm: () => void
  onCancel: () => void
}

/** Explains what a field or option deletion will also remove, before it happens. */
export default function PendingChangeDialog({
  change,
  onConfirm,
  onCancel,
}: PendingChangeDialogProps) {
  if (change.kind === 'deleteField') {
    return (
      <ConfirmDialog
        title={`Delete “${change.label}”?`}
        confirmLabel="Delete field and rules"
        tone="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        <p>Other fields use it:</p>
        <ul>
          {change.references.map((reference) => (
            <li key={reference.fieldId}>{describeReference(reference)}</li>
          ))}
        </ul>
        <p>Deleting it also removes those rules and references.</p>
      </ConfirmDialog>
    )
  }
  return (
    <ConfirmDialog
      title={`Remove ${pluralize(change.removedLabels.length, 'option')}?`}
      confirmLabel="Remove and update rules"
      tone="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>{describeOptionImpact(change.removedLabels, change.affectedLabels)}</p>
    </ConfirmDialog>
  )
}
