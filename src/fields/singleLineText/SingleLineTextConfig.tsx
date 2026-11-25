import FormControl from '../../ui/FormControl/FormControl'
import OptionalNumberInput from '../../ui/OptionalNumberInput/OptionalNumberInput'
import TextInput from '../../ui/TextInput/TextInput'
import type { SingleLineTextConfig as Config } from './singleLineTextSchema'
import type { ConfigPanelProps } from '../uiTypes'
import styles from '../shared/fieldInputs.module.css'

export default function SingleLineTextConfig({
  field,
  onChange,
}: ConfigPanelProps<'singleLineText'>) {
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

      <section className={styles.configSection}>
        <h3 className={`eyebrow ${styles.configSectionTitle}`}>Appearance</h3>
        <div className={styles.pair}>
          <FormControl label="Prefix" htmlFor={`${idPrefix}-prefix`} hint="e.g. https://">
            <TextInput
              id={`${idPrefix}-prefix`}
              value={config.prefix}
              onChange={(event) => handleConfigChange({ prefix: event.target.value })}
            />
          </FormControl>
          <FormControl label="Suffix" htmlFor={`${idPrefix}-suffix`} hint="e.g. .com">
            <TextInput
              id={`${idPrefix}-suffix`}
              value={config.suffix}
              onChange={(event) => handleConfigChange({ suffix: event.target.value })}
            />
          </FormControl>
        </div>
      </section>
    </>
  )
}
