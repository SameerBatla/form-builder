import type { ComponentType } from 'react'
import type { IconProps } from '../ui/icons/icons'
import type { FieldOfType, FieldType, FieldValueOf } from './fieldUnion'

/** Props every field type's fill-mode input receives. */
export interface FillInputProps<T extends FieldType> {
  field: FieldOfType<T>
  value: FieldValueOf<T>
  onChange: (value: FieldValueOf<T>) => void
  onBlur?: () => void
  /** The id the label points at (for groups: the first option's input). */
  inputId: string
  /** Id of the visible label, for groups to use as aria-labelledby. */
  labelId: string
  isRequired: boolean
  isInvalid: boolean
  /** Builder canvas preview: shown but not interactive. */
  isDisabled?: boolean
}

/** Props every field type's builder settings panel receives. */
export interface ConfigPanelProps<T extends FieldType> {
  field: FieldOfType<T>
  onChange: (field: FieldOfType<T>) => void
}

export type PaletteGroup = 'inputs' | 'choices' | 'layout'

/**
 * How the field's label is rendered around its input:
 * - 'label': a <label for> pointing at one input
 * - 'group': a text label that a radio/checkbox group references
 * - 'none': the input renders its own heading (Section Header)
 */
export type LabelLayout = 'label' | 'group' | 'none'

/** UI half of a field type (the logic half is FieldDefinition, which stays React-free). */
export interface FieldUi<T extends FieldType> {
  icon: ComponentType<IconProps>
  /** One line under the name in the palette. */
  description: string
  group: PaletteGroup
  labelLayout: LabelLayout
  ConfigPanel: ComponentType<ConfigPanelProps<T>>
  FillInput: ComponentType<FillInputProps<T>>
}
