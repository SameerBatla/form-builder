import FormControl from '../../ui/FormControl/FormControl'
import OptionalNumberInput from '../../ui/OptionalNumberInput/OptionalNumberInput'
import TextInput from '../../ui/TextInput/TextInput'
import styles from '../shared/fieldInputs.module.css'
import type { ConfigPanelProps } from '../uiTypes'
import type { MultiLineTextConfig as Config } from './multiLineTextSchema'

export default function MultiLineTextConfig({
  field,
  onChange,
}: ConfigPanelProps<'multiLineText'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`

  const handleConfigChange = (changes: Partial<Config>) => {
    onChange({ ...field, config: { ...config, ...changes } })
  }

  return (
    <>
      <FormControl label="Placeholder" htmlFor={`${idPrefix}-placeholder`}>
        <TextInput
          id={`${idPrefix}-placeholder`}
          value={config.placeholder}
          onChange={(event) => handleConfigChange({ placeholder: event.target.value })}
        />
      </FormControl>
      <FormControl label="Visible rows" htmlFor={`${idPrefix}-rows`} hint="2 to 20">
        <OptionalNumberInput
          id={`${idPrefix}-rows`}
          value={config.rows}
          // An emptied box keeps the old value: rows always needs a number.
          onChange={(rows) => handleConfigChange({ rows: rows ?? config.rows })}
          min={2}
        />
      </FormControl>

      <section className={styles.configSection}>
        <h3 className={`eyebrow ${styles.configSectionTitle}`}>Validation</h3>
        <div className={styles.pair}>
          <FormControl label="Min length" htmlFor={`${idPrefix}-min`}>
            <OptionalNumberInput
              id={`${idPrefix}-min`}
              value={config.minLength}
              onChange={(minLength) => handleConfigChange({ minLength })}
              placeholder="None"
              min={0}
            />
          </FormControl>
          <FormControl label="Max length" htmlFor={`${idPrefix}-max`}>
            <OptionalNumberInput
              id={`${idPrefix}-max`}
              value={config.maxLength}
              onChange={(maxLength) => handleConfigChange({ maxLength })}
              placeholder="None"
              min={1}
            />
          </FormControl>
        </div>
      </section>
    </>
  )
}
