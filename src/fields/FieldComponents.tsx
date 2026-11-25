import type { ComponentType } from 'react'
import FormControl from '../ui/FormControl/FormControl'
import { fieldInputId } from './fieldInputId'
import type { Field, FieldType, FieldValue } from './fieldUnion'
import type { ConfigPanelProps, FillInputProps } from './uiTypes'
import { fieldUis } from './uiRegistry'

/*
 * The only place that turns "some field" into its type's components.
 * TypeScript can't see that `fieldUis[field.type]` and `field` belong to the
 * same type (a "correlated union"), so each lookup below has one cast. The
 * registry's mapped type already guarantees every type has matching components.
 */

interface FieldConfigPanelProps {
  field: Field
  fields: Field[]
  onChange: (field: Field) => void
}

export function FieldConfigPanel({ field, fields, onChange }: FieldConfigPanelProps) {
  const ConfigPanel = fieldUis[field.type].ConfigPanel as ComponentType<
    ConfigPanelProps<FieldType>
  >
  return <ConfigPanel field={field} fields={fields} onChange={onChange} />
}

type FieldFillInputProps = FillInputProps<FieldType>

export function FieldFillInput(props: FieldFillInputProps) {
  const FillInput = fieldUis[props.field.type]
    .FillInput as ComponentType<FieldFillInputProps>
  return <FillInput {...props} />
}

interface FieldRowProps {
  field: Field
  /** Every field in the form, for types that refer to others. */
  fields: Field[]
  value: FieldValue
  onChange: (value: FieldValue) => void
  onBlur?: () => void
  /** Keeps ids unique when the same field renders twice (canvas vs. fill). */
  idPrefix: string
  isRequired: boolean
  error: string | null
  isDisabled?: boolean
}

/** A field's label, input and error, laid out the way its type asks for. */
export function FieldRow({
  field,
  idPrefix,
  isRequired,
  error,
  ...inputProps
}: FieldRowProps) {
  const { labelLayout } = fieldUis[field.type]
  const inputId = fieldInputId(idPrefix, field.id)
  const input = (
    <FieldFillInput
      field={field}
      inputId={inputId}
      labelId={`${inputId}-label`}
      isRequired={isRequired}
      isInvalid={error !== null}
      {...inputProps}
    />
  )
  if (labelLayout === 'none') {
    return input
  }
  return (
    <FormControl
      label={field.label.trim() || 'Untitled field'}
      htmlFor={inputId}
      isGroupLabel={labelLayout === 'group'}
      isRequired={isRequired}
      error={error}
    >
      {input}
    </FormControl>
  )
}
