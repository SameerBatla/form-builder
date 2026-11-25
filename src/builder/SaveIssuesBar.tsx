import type { TemplateIssues } from '../engine/validateTemplate'
import { countIssues } from '../engine/validateTemplate'
import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { pluralize } from '../lib/format'
import { AlertCircleIcon } from '../ui/icons/icons'
import styles from './SaveIssuesBar.module.css'

interface SaveIssuesBarProps {
  issues: TemplateIssues
  fields: Field[]
  onSelectField: (fieldId: FieldId) => void
}

/** Shown after a blocked Save: what to fix, with links to the problem fields. */
export default function SaveIssuesBar({
  issues,
  fields,
  onSelectField,
}: SaveIssuesBarProps) {
  const fieldsWithIssues = fields.filter((field) => issues.fieldIssues[field.id])
  const count = pluralize(countIssues(issues), 'thing needs', 'things need')
  const message = `Can’t save yet: ${count} attention.`

  return (
    <div className={styles.bar} role="alert">
      <p className={styles.heading}>
        <AlertCircleIcon />
        {message}
      </p>
      <ul className={styles.list}>
        {issues.formIssues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
        {fieldsWithIssues.map((field) => (
          <li key={field.id}>
            <button
              type="button"
              className={styles.fieldLink}
              onClick={() => onSelectField(field.id)}
            >
              {field.label.trim() || 'Untitled field'}
            </button>
            : {issues.fieldIssues[field.id].join(' ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
