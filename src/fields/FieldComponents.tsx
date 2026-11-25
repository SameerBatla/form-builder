import type { Field, FieldValue } from './fieldUnion'
import { fieldUis } from './uiRegistry'

/*
 * The two components below are the only place that turns "some field" into its
 * type's component. TypeScript can't see that `fieldUis[field.type]` and `field`
 * belong to the same type, so this is where that link is made, once.
 */

interface FieldConfigPanelProps {
  field: Field
  onChange: (field: Field) => void
}

export function FieldConfigPanel({ field, onChange }: FieldConfigPanelProps) {
  const { ConfigPanel } = fieldUis[field.type]
  return <ConfigPanel field={field} onChange={onChange} />
}

interface FieldFillInputProps {
  field: Field
  value: FieldValue
  onChange: (value: FieldValue) => void
  onBlur?: () => void
  inputId: string
  isInvalid: boolean
  isDisabled?: boolean
}

export function FieldFillInput({ field, ...rest }: FieldFillInputProps) {
  const { FillInput } = fieldUis[field.type]
  return <FillInput field={field} {...rest} />
}
