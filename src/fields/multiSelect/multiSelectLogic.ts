import { multiSelectValueSchema } from './multiSelectSchema'
import type { Option } from '../fieldBase'
import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'
import { createOption, findOptionLabel, validateOptions } from '../shared/options'
import type { MultiSelectConfig, MultiSelectValue } from './multiSelectSchema'

export const multiSelectDefinition: FieldDefinition<'multiSelect'> = {
  type: 'multiSelect',
  displayName: 'Multi select',
  valueSchema: multiSelectValueSchema,
  capturesValue: true,
  conditionKinds: ['multiSelect'],
  getOptions: (field) => field.config.options,
  createField: (id) => {
    return {
      id,
      type: 'multiSelect',
      label: 'Multi select',
      config: {
        options: [createOption('Option 1'), createOption('Option 2')],
        minSelections: null,
        maxSelections: null,
      },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
  initialValue: () => [],
  validateConfig: (field) => [
    ...validateOptions(field.config.options),
    ...validateSelectionLimits(field.config),
  ],
  formatForExport: (field, value) => ({
    kind: 'answer',
    lines: [
      value
        .map(
          (optionId) =>
            findOptionLabel(field.config.options, optionId) ?? 'Removed option',
        )
        .join(', '),
    ],
  }),
  isEmpty: (value) => value.length === 0,
  validateValue: (field, value) => {
    const { options, minSelections, maxSelections } = field.config
    const optionIds = new Set(options.map((option) => option.id))
    if (value.some((optionId) => !optionIds.has(optionId))) {
      return 'Choose from the listed options.'
    }
    if (minSelections !== null && value.length < minSelections) {
      return `Select at least ${minSelections} options.`
    }
    if (maxSelections !== null && value.length > maxSelections) {
      return `Select at most ${maxSelections} options.`
    }
    return null
  },
}

function validateSelectionLimits(config: MultiSelectConfig): string[] {
  const { minSelections: min, maxSelections: max } = config
  const optionCount = config.options.length
  const issues: string[] = []
  if (min !== null && (!Number.isInteger(min) || min < 0)) {
    issues.push('Min selections must be a whole number, 0 or more.')
  }
  if (max !== null && (!Number.isInteger(max) || max < 1)) {
    issues.push('Max selections must be a whole number, 1 or more.')
  }
  if (issues.length > 0) {
    return issues
  }
  if (min !== null && max !== null && min > max) {
    issues.push('Min selections can’t be greater than max selections.')
  }
  if (max !== null && max > optionCount) {
    issues.push(`Max selections can’t be more than the ${optionCount} options.`)
  }
  if (min !== null && min > optionCount) {
    issues.push(`Min selections can’t be more than the ${optionCount} options.`)
  }
  return issues
}

/** Adds or removes one option, keeping the result in the options' order. */
export function toggleOption(
  options: Option[],
  selected: MultiSelectValue,
  optionId: string,
): MultiSelectValue {
  const nextSelected = new Set(selected)
  if (nextSelected.has(optionId)) {
    nextSelected.delete(optionId)
  } else {
    nextSelected.add(optionId)
  }
  return options
    .filter((option) => nextSelected.has(option.id))
    .map((option) => option.id)
}
