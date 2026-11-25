import FormControl from '../../ui/FormControl/FormControl'
import OptionalNumberInput from '../../ui/OptionalNumberInput/OptionalNumberInput'
import Select from '../../ui/Select/Select'
import TextInput from '../../ui/TextInput/TextInput'
import styles from '../shared/fieldInputs.module.css'
import type { ConfigPanelProps } from '../uiTypes'
import type { NumberConfig as Config } from './numberSchema'

const decimalOptions = [0, 1, 2, 3, 4]

export default function NumberConfig({ field, onChange }: ConfigPanelProps<'number'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`

  const handleConfigChange = (changes: Partial<Config>) => {
    onChange({ ...field, config: { ...config, ...changes } })
  }

  return (
    <>
      <FormControl label="Decimal places" htmlFor={`${idPrefix}-decimals`}>
        <Select
          id={`${idPrefix}-decimals`}
          value={String(config.decimalPlaces)}
          onChange={(event) =>
            handleConfigChange({ decimalPlaces: Number(event.target.value) })
          }
        >
          {decimalOptions.map((places) => (
            <option key={places} value={places}>
              {places === 0 ? 'Whole numbers' : `${places} (${(0).toFixed(places)})`}
            </option>
          ))}
        </Select>
      </FormControl>

      <section className={styles.configSection}>
        <h3 className={`eyebrow ${styles.configSectionTitle}`}>Validation</h3>
        <div className={styles.pair}>
          <FormControl label="Min value" htmlFor={`${idPrefix}-min`}>
            <OptionalNumberInput
              id={`${idPrefix}-min`}
              value={config.min}
              onChange={(min) => handleConfigChange({ min })}
              placeholder="None"
            />
          </FormControl>
          <FormControl label="Max value" htmlFor={`${idPrefix}-max`}>
            <OptionalNumberInput
              id={`${idPrefix}-max`}
              value={config.max}
              onChange={(max) => handleConfigChange({ max })}
              placeholder="None"
            />
          </FormControl>
        </div>
      </section>

      <section className={styles.configSection}>
        <h3 className={`eyebrow ${styles.configSectionTitle}`}>Appearance</h3>
        <div className={styles.pair}>
          <FormControl label="Prefix" htmlFor={`${idPrefix}-prefix`} hint="e.g. $">
            <TextInput
              id={`${idPrefix}-prefix`}
              value={config.prefix}
              onChange={(event) => handleConfigChange({ prefix: event.target.value })}
            />
          </FormControl>
          <FormControl label="Suffix" htmlFor={`${idPrefix}-suffix`} hint="e.g. kg">
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
