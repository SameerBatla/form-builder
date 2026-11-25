import TextArea from '../../ui/TextArea/TextArea'
import styles from '../shared/fieldInputs.module.css'
import type { FillInputProps } from '../uiTypes'

export default function MultiLineTextInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'multiLineText'>) {
  const { placeholder, rows, maxLength } = field.config

  return (
    <div className={styles.stack}>
      <TextArea
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength ?? undefined}
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
