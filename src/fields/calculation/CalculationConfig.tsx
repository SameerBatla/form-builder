import FormControl from '../../ui/FormControl/FormControl'
import Select from '../../ui/Select/Select'
import { isCalculationSource } from '../logicRegistry'
import choiceStyles from '../shared/choices.module.css'
import styles from '../shared/fieldInputs.module.css'
import type { ConfigPanelProps } from '../uiTypes'
import { aggregationLabels } from './calculationLabels'
import type {
  CalculationAggregation,
  CalculationConfig as Config,
} from './calculationSchema'

const aggregations: CalculationAggregation[] = ['sum', 'average', 'min', 'max']
const decimalOptions = [0, 1, 2, 3, 4]

export default function CalculationConfig({
  field,
  fields,
  onChange,
}: ConfigPanelProps<'calculation'>) {
  const { config } = field
  const idPrefix = `config-${field.id}`
  // Only Number fields: a Calculation can never use another Calculation.
  const numberFields = fields.filter(isCalculationSource)

  const handleConfigChange = (changes: Partial<Config>) => {
    onChange({ ...field, config: { ...config, ...changes } })
  }

  const handleToggleSource = (sourceId: string) => {
    const isSelected = config.sourceFieldIds.includes(sourceId)
    const selected = new Set(config.sourceFieldIds)
    if (isSelected) {
      selected.delete(sourceId)
    } else {
      selected.add(sourceId)
    }
    // Keep form order, so "Sum of A, B" reads like the form.
    const sourceFieldIds = numberFields
      .filter((candidate) => selected.has(candidate.id))
      .map((candidate) => candidate.id)
    handleConfigChange({ sourceFieldIds })
  }

  return (
    <>
      <div className={styles.pair}>
        <FormControl label="Calculate" htmlFor={`${idPrefix}-aggregation`}>
          <Select
            id={`${idPrefix}-aggregation`}
            value={config.aggregation}
            onChange={(event) => {
              const aggregation = aggregations.find(
                (value) => value === event.target.value,
              )
              if (aggregation) {
                handleConfigChange({ aggregation })
              }
            }}
          >
            {aggregations.map((aggregation) => (
              <option key={aggregation} value={aggregation}>
                {aggregationLabels[aggregation]}
              </option>
            ))}
          </Select>
        </FormControl>
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
                {places}
              </option>
            ))}
          </Select>
        </FormControl>
      </div>

      <FormControl label="Source fields" htmlFor={`${idPrefix}-sources`} isGroupLabel>
        {numberFields.length === 0 ? (
          <p className={styles.hint}>Add a Number field to calculate from.</p>
        ) : (
          <div
            role="group"
            aria-labelledby={`${idPrefix}-sources-label`}
            className={choiceStyles.list}
          >
            {numberFields.map((numberField) => (
              <label key={numberField.id} className={choiceStyles.choice}>
                <input
                  type="checkbox"
                  checked={config.sourceFieldIds.includes(numberField.id)}
                  onChange={() => handleToggleSource(numberField.id)}
                />
                {numberField.label.trim() || 'Untitled field'}
              </label>
            ))}
          </div>
        )}
      </FormControl>
    </>
  )
}
