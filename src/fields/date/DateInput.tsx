import TextInput from '../../ui/TextInput/TextInput'
import type { FillInputProps } from '../uiTypes'

export default function DateInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'date'>) {
  const { minDate, maxDate } = field.config

  return (
    <TextInput
      id={inputId}
      type="date"
      value={value ?? ''}
      // The native picker gives "" when cleared.
      onChange={(event) =>
        onChange(event.target.value === '' ? null : event.target.value)
      }
      onBlur={onBlur}
      min={minDate ?? undefined}
      max={maxDate ?? undefined}
      isInvalid={isInvalid}
      disabled={isDisabled}
      aria-describedby={isInvalid ? `${inputId}-error` : undefined}
    />
  )
}
