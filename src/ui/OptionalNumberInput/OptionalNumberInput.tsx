import type { ChangeEvent } from 'react'
import TextInput from '../TextInput/TextInput'

interface OptionalNumberInputProps {
  id: string
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  min?: number
  isInvalid?: boolean
}

/** A builder setting that may be left empty ("no limit"). Empty → null. */
export default function OptionalNumberInput({
  id,
  value,
  onChange,
  placeholder,
  min,
  isInvalid,
}: OptionalNumberInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = event.target.valueAsNumber
    onChange(Number.isNaN(parsed) ? null : parsed)
  }

  return (
    <TextInput
      id={id}
      type="number"
      value={value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      isInvalid={isInvalid}
    />
  )
}
