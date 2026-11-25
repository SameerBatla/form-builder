import { useState } from 'react'
import type { Field } from '../fields/fieldUnion'
import { getFieldDefinition } from '../fields/logicRegistry'
import { FieldConfigPanel } from '../fields/FieldComponents'
import { fieldUis } from '../fields/uiRegistry'
import FormControl from '../ui/FormControl/FormControl'
import IconTile from '../ui/IconTile/IconTile'
import Tabs from '../ui/Tabs/Tabs'
import TextInput from '../ui/TextInput/TextInput'
import Toggle from '../ui/Toggle/Toggle'
import styles from './ConfigPanel.module.css'
import LogicTab from './logic/LogicTab'

type ConfigTab = 'settings' | 'logic'

const configTabs: { id: ConfigTab; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'logic', label: 'Logic' },
]

interface ConfigPanelProps {
  field: Field | null
  /** All fields in the form, for picking rule targets. */
  fields: Field[]
  /** Shown at the top; empty until the user tries to save. */
  issues: string[]
  onChange: (field: Field) => void
}

export default function ConfigPanel({
  field,
  fields,
  issues,
  onChange,
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('settings')

  if (!field) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No field selected</p>
        <p className="muted">Select a field on the canvas to edit its settings.</p>
      </div>
    )
  }

  const { icon: Icon } = fieldUis[field.type]
  const labelInputId = `config-${field.id}-label`

  const handleLabelChange = (label: string) => {
    onChange({ ...field, label })
  }

  const handleRequiredChange = (isRequired: boolean) => {
    if (!('required' in field)) {
      return
    }
    const defaultState = isRequired ? 'required' : 'optional'
    onChange({ ...field, required: { ...field.required, defaultState } })
  }

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <IconTile tone="accent">
          <Icon />
        </IconTile>
        <h2 className={styles.title}>{getFieldDefinition(field.type).displayName}</h2>
      </header>

      {issues.length > 0 && (
        <ul className={styles.issues} role="alert">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <Tabs
        tabs={configTabs}
        activeTabId={activeTab}
        onChange={setActiveTab}
        idPrefix="config-tabs"
      />

      <div
        id="config-tabs-panel"
        role="tabpanel"
        aria-labelledby={`config-tabs-${activeTab}`}
        className={styles.body}
      >
        {activeTab === 'settings' ? (
          <>
            <FormControl label="Label" htmlFor={labelInputId}>
              <TextInput
                id={labelInputId}
                value={field.label}
                onChange={(event) => handleLabelChange(event.target.value)}
              />
            </FormControl>
            {'required' in field && (
              <Toggle
                label="Required"
                isOn={field.required.defaultState === 'required'}
                onChange={handleRequiredChange}
              />
            )}
            <FieldConfigPanel field={field} fields={fields} onChange={onChange} />
          </>
        ) : (
          <LogicTab field={field} fields={fields} onChange={onChange} />
        )}
      </div>
    </div>
  )
}
