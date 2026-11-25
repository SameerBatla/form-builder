import FormControl from '../../ui/FormControl/FormControl'
import OptionalNumberInput from '../../ui/OptionalNumberInput/OptionalNumberInput'
import OptionsEditor from '../shared/OptionsEditor'
import styles from '../shared/fieldInputs.module.css'
import type { ConfigPanelProps } from '../uiTypes'
import type { MultiSelectConfig as Config } from './multiSelectSchema'

export default function MultiSelectConfig({
  field,
  onChange,
}: ConfigPanelProps<'multiSelect'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`

  const handleConfigChange = (changes: Partial<Config>) => {
    onChange({ ...field, config: { ...config, ...changes } })
  }

  return (
    <>
      <FormControl label="Options" htmlFor={`${idPrefix}-options`} isGroupLabel>
        <OptionsEditor
          idPrefix={idPrefix}
          options={config.options}
          onChange={(options) => handleConfigChange({ options })}
        />
      </FormControl>

      <section className={styles.configSection}>
        <h3 className={`eyebrow ${styles.configSectionTitle}`}>Validation</h3>
        <div className={styles.pair}>
          <FormControl label="Min selections" htmlFor={`${idPrefix}-min`}>
            <OptionalNumberInput
              id={`${idPrefix}-min`}
              value={config.minSelections}
              onChange={(minSelections) => handleConfigChange({ minSelections })}
              placeholder="None"
              min={0}
            />
          </FormControl>
          <FormControl label="Max selections" htmlFor={`${idPrefix}-max`}>
            <OptionalNumberInput
              id={`${idPrefix}-max`}
              value={config.maxSelections}
              onChange={(maxSelections) => handleConfigChange({ maxSelections })}
              placeholder="None"
              min={1}
            />
          </FormControl>
        </div>
      </section>
    </>
  )
}
