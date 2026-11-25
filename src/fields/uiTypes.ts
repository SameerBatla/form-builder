import type { ComponentType } from 'react'
import type { IconProps } from '../ui/icons/icons'
import type { FieldOfType, FieldType, FieldValueOf } from './fieldUnion'

/** Props every field type's fill-mode input receives. */
export interface FillInputProps<T extends FieldType> {
  field: FieldOfType<T>
  value: FieldValueOf<T>
  onChange: (value: FieldValueOf<T>) => void
  onBlur?: () => void
  /** The id the label points at. */
  inputId: string
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

/** UI half of a field type (the logic half is FieldDefinition, which stays React-free). */
export interface FieldUi<T extends FieldType> {
  icon: ComponentType<IconProps>
  /** One line under the name in the palette. */
  description: string
  group: PaletteGroup
  ConfigPanel: ComponentType<ConfigPanelProps<T>>
  FillInput: ComponentType<FillInputProps<T>>
}
