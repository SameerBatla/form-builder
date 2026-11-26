import { numberValueSchema } from './numberSchema'
import { formatNumber, roundToDecimals } from '../../lib/numbers'
import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'

const MAX_DECIMAL_PLACES = 4

export const numberDefinition: FieldDefinition<'number'> = {
  type: 'number',
  displayName: 'Number',
  valueSchema: numberValueSchema,
  capturesValue: true,
  conditionKinds: ['number', 'numberRange'],
  isCalculationSource: true,
  createField: (id) => {
    return {
      id,
      type: 'number',
      label: 'Number',
      config: { min: null, max: null, decimalPlaces: 0, prefix: '', suffix: '' },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
  initialValue: () => null,
  validateConfig: (field) => {
    const { min, max, decimalPlaces } = field.config
    const issues: string[] = []
    if (min !== null && max !== null && min > max) {
      issues.push('Min value can’t be greater than max value.')
    }
    const isValidDecimals =
      Number.isInteger(decimalPlaces) &&
      decimalPlaces >= 0 &&
      decimalPlaces <= MAX_DECIMAL_PLACES
    if (!isValidDecimals) {
      issues.push(
        `Decimal places must be a whole number from 0 to ${MAX_DECIMAL_PLACES}.`,
      )
    }
    return issues
  },
  formatForExport: (field, value) => {
    const { prefix, suffix, decimalPlaces } = field.config
    const number = value === null ? '' : formatNumber(value, decimalPlaces)
    return { kind: 'answer', lines: [`${prefix}${number}${suffix ? ` ${suffix}` : ''}`] }
  },
  isEmpty: (value) => value === null,
  validateValue: (field, value) => {
    const { min, max } = field.config
    if (value === null) {
      return null
    }
    if (min !== null && value < min) {
      return `Enter a number of at least ${min}.`
    }
    if (max !== null && value > max) {
      return `Enter a number no greater than ${max}.`
    }
    return null
  },
  normalizeValue: (field, value) =>
    value === null ? null : roundToDecimals(value, field.config.decimalPlaces),
}

/** What the input accepts while typing: digits, a leading minus, and one point if decimals are allowed. */
export function isAllowedNumberDraft(text: string, decimalPlaces: number): boolean {
  const pattern = decimalPlaces > 0 ? /^-?\d*\.?\d*$/ : /^-?\d*$/
  return pattern.test(text)
}

/** Incomplete drafts ("", "-", ".") count as no answer. */
export function parseNumberDraft(text: string): number | null {
  if (text === '' || text === '-' || text === '.' || text === '-.') {
    return null
  }
  return Number(text)
}

export function formatNumberDraft(value: number | null, decimalPlaces: number): string {
  return value === null ? '' : value.toFixed(decimalPlaces)
}
