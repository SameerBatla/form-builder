import { describe, expect, test } from 'vitest'
import {
  formatNumberDraft,
  isAllowedNumberDraft,
  numberDefinition as definition,
  parseNumberDraft,
} from './numberLogic'
import { roundToDecimals } from '../../lib/numbers'

const field = definition.createField('price')

function withConfig(config: Partial<typeof field.config>) {
  return { ...field, config: { ...field.config, ...config } }
}

describe('number: config', () => {
  test('defaults: no limits, whole numbers, no prefix/suffix, empty answer', () => {
    expect(field.config).toEqual({
      min: null,
      max: null,
      decimalPlaces: 0,
      prefix: '',
      suffix: '',
    })
    expect(definition.initialValue(field, '2026-11-26')).toBeNull()
  })

  test('min cannot exceed max', () => {
    expect(definition.validateConfig(withConfig({ min: 10, max: 1 }))).toEqual([
      'Min value can’t be greater than max value.',
    ])
  })

  test('decimal places must be 0 to 4', () => {
    expect(definition.validateConfig(withConfig({ decimalPlaces: 5 }))).toEqual([
      'Decimal places must be a whole number from 0 to 4.',
    ])
  })
})

describe('number: value', () => {
  test('null is empty, 0 is an answer', () => {
    expect(definition.isEmpty(null)).toBe(true)
    expect(definition.isEmpty(0)).toBe(false)
  })

  test('min and max are inclusive', () => {
    const limited = withConfig({ min: 5, max: 10 })
    expect(definition.validateValue(limited, 5)).toBeNull()
    expect(definition.validateValue(limited, 10)).toBeNull()
    expect(definition.validateValue(limited, 4)).toBe('Enter a number of at least 5.')
    expect(definition.validateValue(limited, 11)).toBe(
      'Enter a number no greater than 10.',
    )
  })

  test('normalizeValue rounds to the decimal places (rounding on blur, never an error)', () => {
    expect(definition.normalizeValue?.(withConfig({ decimalPlaces: 2 }), 3.14159)).toBe(
      3.14,
    )
    expect(definition.normalizeValue?.(withConfig({ decimalPlaces: 0 }), 2.6)).toBe(3)
    expect(definition.normalizeValue?.(withConfig({ decimalPlaces: 2 }), null)).toBeNull()
  })
})

describe('number: typing helpers', () => {
  test('roundToDecimals rounds half away from zero, without floating point surprises', () => {
    expect(roundToDecimals(1.005, 2)).toBe(1.01)
    expect(roundToDecimals(-1.25, 1)).toBe(-1.3)
    expect(roundToDecimals(2.5, 0)).toBe(3)
  })

  test('only digits, one leading minus and (if decimals allowed) one point are accepted', () => {
    expect(isAllowedNumberDraft('-12.5', 2)).toBe(true)
    expect(isAllowedNumberDraft('12.5', 0)).toBe(false)
    expect(isAllowedNumberDraft('1e5', 2)).toBe(false)
    expect(isAllowedNumberDraft('1.2.3', 2)).toBe(false)
  })

  test('incomplete drafts parse as empty', () => {
    expect(parseNumberDraft('')).toBeNull()
    expect(parseNumberDraft('-')).toBeNull()
    expect(parseNumberDraft('.')).toBeNull()
    expect(parseNumberDraft('1.')).toBe(1)
    expect(parseNumberDraft('-0.5')).toBe(-0.5)
  })

  test('formatNumberDraft shows the configured decimals', () => {
    expect(formatNumberDraft(3.1, 2)).toBe('3.10')
    expect(formatNumberDraft(null, 2)).toBe('')
  })
})
