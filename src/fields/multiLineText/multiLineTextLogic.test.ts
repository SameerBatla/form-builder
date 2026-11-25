import { describe, expect, test } from 'vitest'
import { multiLineTextDefinition as definition } from './multiLineTextLogic'

const field = definition.createField('bio')

function withConfig(config: Partial<typeof field.config>) {
  return { ...field, config: { ...field.config, ...config } }
}

describe('multi-line text', () => {
  test('defaults: 4 visible rows, no limits, empty answer', () => {
    expect(field.config).toEqual({
      placeholder: '',
      minLength: null,
      maxLength: null,
      rows: 4,
    })
    expect(definition.initialValue(field, '2026-11-26')).toBe('')
  })

  test('config: rows must be a whole number from 2 to 20', () => {
    expect(definition.validateConfig(withConfig({ rows: 1 }))).toEqual([
      'Rows must be a whole number from 2 to 20.',
    ])
    expect(definition.validateConfig(withConfig({ rows: 2.5 }))).toHaveLength(1)
    expect(definition.validateConfig(withConfig({ rows: 20 }))).toEqual([])
  })

  test('config: shares the length-limit rules with single line text', () => {
    expect(definition.validateConfig(withConfig({ minLength: 9, maxLength: 3 }))).toEqual(
      ['Min length can’t be greater than max length.'],
    )
  })

  test('value: whitespace and line breaks only count as empty', () => {
    expect(definition.isEmpty(' \n\t')).toBe(true)
    expect(definition.isEmpty('hi')).toBe(false)
  })

  test('value: length limits apply to the whole text, line breaks included', () => {
    expect(definition.validateValue(withConfig({ minLength: 5 }), 'a\nb')).toBe(
      'Enter at least 5 characters.',
    )
    expect(definition.validateValue(withConfig({ maxLength: 3 }), 'a\nb')).toBeNull()
  })
})
