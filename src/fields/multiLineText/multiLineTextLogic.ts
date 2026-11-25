import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'
import {
  isTextEmpty,
  validateLengthLimits,
  validateTextLength,
} from '../shared/lengthLimits'

const MIN_ROWS = 2
const MAX_ROWS = 20

export const multiLineTextDefinition: FieldDefinition<'multiLineText'> = {
  type: 'multiLineText',
  displayName: 'Multi-line text',
  capturesValue: true,
  createField: (id) => {
    return {
      id,
      type: 'multiLineText',
      label: 'Multi-line text',
      config: { placeholder: '', minLength: null, maxLength: null, rows: 4 },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
  initialValue: () => '',
  validateConfig: (field) => {
    const { rows, minLength, maxLength } = field.config
    const issues = validateLengthLimits(minLength, maxLength)
    if (!Number.isInteger(rows) || rows < MIN_ROWS || rows > MAX_ROWS) {
      issues.push(`Rows must be a whole number from ${MIN_ROWS} to ${MAX_ROWS}.`)
    }
    return issues
  },
  isEmpty: isTextEmpty,
  validateValue: (field, value) =>
    validateTextLength(value, field.config.minLength, field.config.maxLength),
}
