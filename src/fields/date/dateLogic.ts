import { dateValueSchema } from './dateSchema'
import { formatIsoDate } from '../../lib/dates'
import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'
import type { DateConfig } from './dateSchema'

// YYYY-MM-DD strings sort the same way as the dates they represent.
export const dateDefinition: FieldDefinition<'date'> = {
  type: 'date',
  displayName: 'Date',
  valueSchema: dateValueSchema,
  capturesValue: true,
  conditionKinds: ['date'],
  createField: (id) => {
    return {
      id,
      type: 'date',
      label: 'Date',
      config: { prefillToday: false, minDate: null, maxDate: null },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
  initialValue: (field, today) => (field.config.prefillToday ? today : null),
  validateConfig: (field) => {
    const { minDate, maxDate } = field.config
    if (minDate !== null && maxDate !== null && minDate > maxDate) {
      return ['Earliest date can’t be after the latest date.']
    }
    return []
  },
  formatForExport: (_field, value) => ({
    kind: 'answer',
    lines: value === null ? [] : [formatIsoDate(value)],
  }),
  isEmpty: (value) => value === null,
  validateValue: (field, value) => {
    const { minDate, maxDate } = field.config
    if (value === null) {
      return null
    }
    if (minDate !== null && value < minDate) {
      return `Choose a date on or after ${formatIsoDate(minDate)}.`
    }
    if (maxDate !== null && value > maxDate) {
      return `Choose a date on or before ${formatIsoDate(maxDate)}.`
    }
    return null
  },
}

/** Builder warning (not an error): pre-fill would put an out-of-range date in the form. */
export function isTodayOutsideRange(config: DateConfig, today: string): boolean {
  if (!config.prefillToday) {
    return false
  }
  const isBeforeMin = config.minDate !== null && today < config.minDate
  const isAfterMax = config.maxDate !== null && today > config.maxDate
  return isBeforeMin || isAfterMax
}
