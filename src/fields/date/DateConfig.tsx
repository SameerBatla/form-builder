import { useState } from 'react'
import { toLocalIsoDate } from '../../lib/dates'
import FormControl from '../../ui/FormControl/FormControl'
import { AlertCircleIcon } from '../../ui/icons/icons'
import TextInput from '../../ui/TextInput/TextInput'
import Toggle from '../../ui/Toggle/Toggle'
import styles from '../shared/fieldInputs.module.css'
import type { ConfigPanelProps } from '../uiTypes'
import { isTodayOutsideRange } from './dateLogic'
import type { DateConfig as Config } from './dateSchema'

export default function DateConfig({ field, onChange }: ConfigPanelProps<'date'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`
  const [today] = useState(() => toLocalIsoDate())

  const handleConfigChange = (changes: Partial<Config>) => {
    onChange({ ...field, config: { ...config, ...changes } })
  }

  return (
    <>
      <Toggle
        label="Pre-fill with today’s date"
        isOn={config.prefillToday}
        onChange={(prefillToday) => handleConfigChange({ prefillToday })}
      />
      {isTodayOutsideRange(config, today) && (
        <p className={styles.warning}>
          <AlertCircleIcon />
          Today is outside the allowed range, so the pre-filled date will show an error.
        </p>
      )}

      <section className={styles.configSection}>
        <h3 className={`eyebrow ${styles.configSectionTitle}`}>Allowed range</h3>
        <div className={styles.pair}>
          <FormControl label="Earliest" htmlFor={`${idPrefix}-min`}>
            <TextInput
              id={`${idPrefix}-min`}
              type="date"
              value={config.minDate ?? ''}
              onChange={(event) =>
                handleConfigChange({ minDate: event.target.value || null })
              }
            />
          </FormControl>
          <FormControl label="Latest" htmlFor={`${idPrefix}-max`}>
            <TextInput
              id={`${idPrefix}-max`}
              type="date"
              value={config.maxDate ?? ''}
              onChange={(event) =>
                handleConfigChange({ maxDate: event.target.value || null })
              }
            />
          </FormControl>
        </div>
      </section>
    </>
  )
}
