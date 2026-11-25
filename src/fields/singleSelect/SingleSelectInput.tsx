import Select from '../../ui/Select/Select'
import { CheckIcon } from '../../ui/icons/icons'
import styles from '../shared/choices.module.css'
import { createGroupBlurHandler } from '../shared/groupBlur'
import type { FillInputProps } from '../uiTypes'

/*
 * One value (the chosen option id, or null), three ways to show it.
 * Required checks and errors come from the engine, so all three behave the same.
 */
export default function SingleSelectInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  labelId,
  isRequired,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'singleSelect'>) {
  const { options, display } = field.config
  const describedBy = isInvalid ? `${inputId}-error` : undefined

  if (display === 'dropdown') {
    return (
      <Select
        id={inputId}
        value={value ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : event.target.value)
        }
        onBlur={onBlur}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        isInvalid={isInvalid}
        disabled={isDisabled}
      >
        <option value="">— Select —</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    )
  }

  const canClear = !isRequired && value !== null && !isDisabled

  return (
    <div className={isInvalid ? styles.invalid : undefined}>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-required={isRequired}
        className={display === 'tiles' ? styles.tiles : styles.list}
        onBlur={createGroupBlurHandler(onBlur)}
      >
        {options.map((option, index) => {
          const isChecked = option.id === value
          // The first option carries the field's input id, so the label and
          // "focus the first invalid field" land on it.
          const id = index === 0 ? inputId : `${inputId}-${option.id}`
          if (display === 'tiles') {
            return (
              <button
                key={option.id}
                id={id}
                type="button"
                role="radio"
                aria-checked={isChecked}
                className={styles.tile}
                disabled={isDisabled}
                onClick={() => onChange(option.id)}
              >
                {option.label}
                {isChecked && (
                  <span className={styles.tileCheck} aria-hidden="true">
                    <CheckIcon size={12} />
                  </span>
                )}
              </button>
            )
          }
          return (
            <label key={option.id} className={styles.choice}>
              <input
                id={id}
                type="radio"
                name={inputId}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => onChange(option.id)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {canClear && (
        <button type="button" className={styles.clear} onClick={() => onChange(null)}>
          Clear selection
        </button>
      )}
    </div>
  )
}
