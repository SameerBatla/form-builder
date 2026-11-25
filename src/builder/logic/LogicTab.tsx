import type { Field } from '../../fields/fieldUnion'
import RuleGroupEditor from './RuleGroupEditor'
import styles from './Logic.module.css'

interface LogicTabProps {
  field: Field
  fields: Field[]
  onChange: (field: Field) => void
}

export default function LogicTab({ field, fields, onChange }: LogicTabProps) {
  return (
    <div className={styles.tab}>
      <RuleGroupEditor
        title="Visibility"
        ownerId={field.id}
        fields={fields}
        group={field.visibility}
        states={['visible', 'hidden']}
        stateLabels={{ visible: 'Visible', hidden: 'Hidden' }}
        effectLabels={{ visible: 'Hide it when', hidden: 'Show it when' }}
        onChange={(visibility) => onChange({ ...field, visibility })}
      />
      {'required' in field && (
        <RuleGroupEditor
          title="Required"
          ownerId={field.id}
          fields={fields}
          group={field.required}
          states={['optional', 'required']}
          stateLabels={{ optional: 'Optional', required: 'Required' }}
          effectLabels={{
            optional: 'Require it when',
            required: 'Make it optional when',
          }}
          onChange={(required) => onChange({ ...field, required })}
        />
      )}
      <p className={styles.hint}>
        A hidden field is never required, and its answer is left out of the response and
        PDF.
      </p>
    </div>
  )
}
