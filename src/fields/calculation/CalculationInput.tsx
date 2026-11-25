import { formatNumber } from '../../lib/numbers'
import TextInput from '../../ui/TextInput/TextInput'
import styles from '../shared/fieldInputs.module.css'
import type { FillInputProps } from '../uiTypes'
import { aggregationLabels } from './calculationLabels'

/** Read-only: the value is computed by the engine from the source Number fields. */
export default function CalculationInput({
  field,
  value,
  inputId,
  fields,
}: FillInputProps<'calculation'>) {
  const { aggregation, decimalPlaces, sourceFieldIds } = field.config
  const sourceLabels = sourceFieldIds
    .map((sourceId) => fields.find((candidate) => candidate.id === sourceId))
    .filter((source) => source !== undefined)
    .map((source) => source.label.trim() || 'Untitled field')
  const hintId = `${inputId}-hint`

  return (
    <div className={styles.stack}>
      <TextInput
        id={inputId}
        value={value === null ? '—' : formatNumber(value, decimalPlaces)}
        readOnly
        prefix="Σ"
        aria-describedby={hintId}
        className={styles.readOnly}
      />
      <p id={hintId} className={styles.hint}>
        {aggregationLabels[aggregation]} of{' '}
        {sourceLabels.length > 0 ? sourceLabels.join(', ') : 'no fields yet'}
      </p>
    </div>
  )
}
