import { TextIcon } from '../ui/icons/icons'
import type { FieldType } from './fieldUnion'
import SingleLineTextConfig from './singleLineText/SingleLineTextConfig'
import SingleLineTextInput from './singleLineText/SingleLineTextInput'
import type { FieldUi, PaletteGroup } from './uiTypes'

// The mapped type makes a missing entry a compile error, like the logic registry.
export const fieldUis: { [T in FieldType]: FieldUi<T> } = {
  singleLineText: {
    icon: TextIcon,
    description: 'Short answer, one line',
    group: 'inputs',
    ConfigPanel: SingleLineTextConfig,
    FillInput: SingleLineTextInput,
  },
}

export const paletteGroups: { id: PaletteGroup; label: string }[] = [
  { id: 'inputs', label: 'Inputs' },
  { id: 'choices', label: 'Choices' },
  { id: 'layout', label: 'Layout & logic' },
]
