import { useState } from 'react'
import type { ChangeEvent } from 'react'
import TextInput from '../../ui/TextInput/TextInput'
import type { FillInputProps } from '../uiTypes'
import { formatNumberDraft, isAllowedNumberDraft, parseNumberDraft } from './numberLogic'
import { roundToDecimals } from '../../lib/numbers'

/*
 * Keeps the raw text the user is typing ("1.", "-") so it isn't reformatted
 * mid-keystroke, while sending the parsed number up on every change so
 * calculations update live. On blur the value is rounded and shown formatted.
 */
export default function NumberInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'number'>) {
  const { decimalPlaces, prefix, suffix } = field.config
  const [draft, setDraft] = useState(() => formatNumberDraft(value, decimalPlaces))
  const [lastValue, setLastValue] = useState(value)

  // The value changed from outside (e.g. the form was reset): show it.
  if (value !== lastValue) {
    setLastValue(value)
    if (parseNumberDraft(draft) !== value) {
      setDraft(formatNumberDraft(value, decimalPlaces))
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value
    if (!isAllowedNumberDraft(text, decimalPlaces)) {
      return
    }
    setDraft(text)
    onChange(parseNumberDraft(text))
  }

  const handleBlur = () => {
    const parsed = parseNumberDraft(draft)
    const rounded = parsed === null ? null : roundToDecimals(parsed, decimalPlaces)
    setDraft(formatNumberDraft(rounded, decimalPlaces))
    onChange(rounded)
    onBlur?.()
  }

  return (
    <TextInput
      id={inputId}
      type="text"
      inputMode={decimalPlaces > 0 ? 'decimal' : 'numeric'}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      prefix={prefix}
      suffix={suffix}
      isInvalid={isInvalid}
      disabled={isDisabled}
      aria-describedby={isInvalid ? `${inputId}-error` : undefined}
    />
  )
}
