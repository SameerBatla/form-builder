import type { Condition } from '../../fields/conditionSchema'
import type { Field } from '../../fields/fieldUnion'
import { getFieldOptions } from '../../fields/logicRegistry'
import OptionalNumberInput from '../../ui/OptionalNumberInput/OptionalNumberInput'
import Select from '../../ui/Select/Select'
import TextInput from '../../ui/TextInput/TextInput'
import styles from './Logic.module.css'

interface ConditionValueInputProps {
  id: string
  condition: Condition
  target: Field
  onChange: (condition: Condition) => void
}

/** The "compare with" input, shaped by the condition's operator family. */
export default function ConditionValueInput({
  id,
  condition,
  target,
  onChange,
}: ConditionValueInputProps) {
  const options = getFieldOptions(target)

  switch (condition.kind) {
    case 'text':
      return (
        <TextInput
          id={id}
          aria-label="Value"
          placeholder="Value"
          value={condition.value}
          onChange={(event) => onChange({ ...condition, value: event.target.value })}
        />
      )
    case 'number':
      return (
        <OptionalNumberInput
          id={id}
          placeholder="Number"
          value={condition.value}
          onChange={(value) => onChange({ ...condition, value })}
        />
      )
    case 'numberRange':
      return (
        <div className={styles.range}>
          <OptionalNumberInput
            id={id}
            placeholder="From"
            value={condition.value.min}
            onChange={(min) =>
              onChange({ ...condition, value: { ...condition.value, min } })
            }
          />
          <span className="muted">and</span>
          <OptionalNumberInput
            id={`${id}-max`}
            placeholder="To"
            value={condition.value.max}
            onChange={(max) =>
              onChange({ ...condition, value: { ...condition.value, max } })
            }
          />
        </div>
      )
    case 'date':
      return (
        <TextInput
          id={id}
          type="date"
          aria-label="Date"
          value={condition.value ?? ''}
          onChange={(event) =>
            onChange({ ...condition, value: event.target.value || null })
          }
        />
      )
    case 'singleSelect':
      return (
        <Select
          id={id}
          aria-label="Option"
          value={condition.value}
          onChange={(event) => onChange({ ...condition, value: event.target.value })}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      )
    case 'multiSelect':
      return (
        <div className={styles.optionChecks} role="group" aria-label="Options">
          {options.map((option) => {
            const isChecked = condition.value.includes(option.id)
            const handleToggle = () => {
              const value = isChecked
                ? condition.value.filter((optionId) => optionId !== option.id)
                : [...condition.value, option.id]
              onChange({ ...condition, value })
            }
            return (
              <label key={option.id} className={styles.optionCheck}>
                <input type="checkbox" checked={isChecked} onChange={handleToggle} />
                {option.label}
              </label>
            )
          })}
        </div>
      )
  }
}
