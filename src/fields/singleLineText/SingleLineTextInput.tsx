import type { ChangeEvent } from 'react'
import TextInput from '../../ui/TextInput/TextInput'
import type { FillInputProps } from '../uiTypes'
import styles from '../shared/fieldInputs.module.css'

export default function SingleLineTextInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'singleLineText'>) {
  const { placeholder, maxLength, prefix, suffix } = field.config

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={styles.stack}>
      <TextInput
        id={inputId}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        // Native maxLength makes the limit a hard stop instead of an error.
        maxLength={maxLength ?? undefined}
        prefix={prefix}
        suffix={suffix}
        isInvalid={isInvalid}
        disabled={isDisabled}
        aria-describedby={isInvalid ? `${inputId}-error` : undefined}
      />
      {maxLength !== null && !isDisabled && (
        <p className={styles.counter} aria-live="polite">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  )
}
