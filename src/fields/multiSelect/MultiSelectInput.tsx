import styles from '../shared/choices.module.css'
import { createGroupBlurHandler } from '../shared/groupBlur'
import type { FillInputProps } from '../uiTypes'
import { toggleOption } from './multiSelectLogic'

export default function MultiSelectInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  labelId,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'multiSelect'>) {
  const { options, maxSelections } = field.config
  // At the limit, unticked options are disabled so an invalid state can't be reached.
  const isAtMax = maxSelections !== null && value.length >= maxSelections

  return (
    <div className={isInvalid ? styles.invalid : undefined}>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={isInvalid ? `${inputId}-error` : undefined}
        className={styles.list}
        onBlur={createGroupBlurHandler(onBlur)}
      >
        {options.map((option, index) => {
          const isChecked = value.includes(option.id)
          return (
            <label key={option.id} className={styles.choice}>
              <input
                id={index === 0 ? inputId : `${inputId}-${option.id}`}
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled || (isAtMax && !isChecked)}
                onChange={() => onChange(toggleOption(options, value, option.id))}
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {isAtMax && !isDisabled && (
        <p className={styles.hint} aria-live="polite">
          Maximum {maxSelections} selected
        </p>
      )}
    </div>
  )
}
