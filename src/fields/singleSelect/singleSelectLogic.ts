import { singleSelectValueSchema } from './singleSelectSchema'
import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'
import { createOption, findOptionLabel, validateOptions } from '../shared/options'

export const singleSelectDefinition: FieldDefinition<'singleSelect'> = {
  type: 'singleSelect',
  displayName: 'Single select',
  valueSchema: singleSelectValueSchema,
  capturesValue: true,
  conditionKinds: ['singleSelect'],
  getOptions: (field) => field.config.options,
  createField: (id) => {
    return {
      id,
      type: 'singleSelect',
      label: 'Single select',
      config: {
        options: [createOption('Option 1'), createOption('Option 2')],
        display: 'radio',
      },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
  initialValue: () => null,
  validateConfig: (field) => validateOptions(field.config.options),
  formatForExport: (field, value) => ({
    kind: 'answer',
    lines: [findOptionLabel(field.config.options, value ?? '') ?? 'Removed option'],
  }),
  isEmpty: (value) => value === null,
  validateValue: (field, value) => {
    const isKnownOption = field.config.options.some((option) => option.id === value)
    return isKnownOption ? null : 'Choose one of the options.'
  },
}
