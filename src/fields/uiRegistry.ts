import {
  CalendarIcon,
  CheckboxIcon,
  HeadingIcon,
  MultiLineIcon,
  NumberIcon,
  PaperclipIcon,
  RadioIcon,
  TextIcon,
} from '../ui/icons/icons'
import type { FieldType } from './fieldUnion'
import DateConfig from './date/DateConfig'
import DateInput from './date/DateInput'
import FileUploadConfig from './fileUpload/FileUploadConfig'
import FileUploadInput from './fileUpload/FileUploadInput'
import MultiLineTextConfig from './multiLineText/MultiLineTextConfig'
import MultiLineTextInput from './multiLineText/MultiLineTextInput'
import MultiSelectConfig from './multiSelect/MultiSelectConfig'
import MultiSelectInput from './multiSelect/MultiSelectInput'
import NumberConfig from './number/NumberConfig'
import NumberInput from './number/NumberInput'
import SectionHeaderConfig from './sectionHeader/SectionHeaderConfig'
import SectionHeaderInput from './sectionHeader/SectionHeaderInput'
import SingleSelectConfig from './singleSelect/SingleSelectConfig'
import SingleSelectInput from './singleSelect/SingleSelectInput'
import SingleLineTextConfig from './singleLineText/SingleLineTextConfig'
import SingleLineTextInput from './singleLineText/SingleLineTextInput'
import type { FieldUi, PaletteGroup } from './uiTypes'

// The mapped type makes a missing entry a compile error, like the logic registry.
export const fieldUis: { [T in FieldType]: FieldUi<T> } = {
  singleLineText: {
    icon: TextIcon,
    description: 'Short answer, one line',
    group: 'inputs',
    labelLayout: 'label',
    ConfigPanel: SingleLineTextConfig,
    FillInput: SingleLineTextInput,
  },
  multiLineText: {
    icon: MultiLineIcon,
    description: 'Longer answer, several lines',
    group: 'inputs',
    labelLayout: 'label',
    ConfigPanel: MultiLineTextConfig,
    FillInput: MultiLineTextInput,
  },
  number: {
    icon: NumberIcon,
    description: 'Amounts, quantities, scores',
    group: 'inputs',
    labelLayout: 'label',
    ConfigPanel: NumberConfig,
    FillInput: NumberInput,
  },
  date: {
    icon: CalendarIcon,
    description: 'Pick a day from a calendar',
    group: 'inputs',
    labelLayout: 'label',
    ConfigPanel: DateConfig,
    FillInput: DateInput,
  },
  singleSelect: {
    icon: RadioIcon,
    description: 'Pick one: radio, dropdown or tiles',
    group: 'choices',
    labelLayout: 'group',
    ConfigPanel: SingleSelectConfig,
    FillInput: SingleSelectInput,
  },
  multiSelect: {
    icon: CheckboxIcon,
    description: 'Pick several from a list',
    group: 'choices',
    labelLayout: 'group',
    ConfigPanel: MultiSelectConfig,
    FillInput: MultiSelectInput,
  },
  fileUpload: {
    icon: PaperclipIcon,
    description: 'Attach documents or images',
    group: 'choices',
    labelLayout: 'group',
    ConfigPanel: FileUploadConfig,
    FillInput: FileUploadInput,
  },
  sectionHeader: {
    icon: HeadingIcon,
    description: 'A heading to group fields',
    group: 'layout',
    labelLayout: 'none',
    ConfigPanel: SectionHeaderConfig,
    FillInput: SectionHeaderInput,
  },
}

export const paletteGroups: { id: PaletteGroup; label: string }[] = [
  { id: 'inputs', label: 'Inputs' },
  { id: 'choices', label: 'Choices' },
  { id: 'layout', label: 'Layout & logic' },
]
