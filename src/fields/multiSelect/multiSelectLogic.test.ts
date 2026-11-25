import { describe, expect, test } from 'vitest'
import { multiSelectDefinition as definition, toggleOption } from './multiSelectLogic'

const base = definition.createField('skills')
const field = {
  ...base,
  config: {
    ...base.config,
    options: [
      { id: 'a', label: 'React' },
      { id: 'b', label: 'Vue' },
      { id: 'c', label: 'Svelte' },
    ],
  },
}

function withLimits(minSelections: number | null, maxSelections: number | null) {
  return { ...field, config: { ...field.config, minSelections, maxSelections } }
}

describe('multi select: config', () => {
  test('defaults: two options, no limits, nothing selected', () => {
    expect(base.config.options).toHaveLength(2)
    expect(base.config.minSelections).toBeNull()
    expect(base.config.maxSelections).toBeNull()
    expect(definition.initialValue(base, '2026-11-26')).toEqual([])
  })

  test('min selections cannot exceed max selections', () => {
    expect(definition.validateConfig(withLimits(3, 2))).toEqual([
      'Min selections can’t be greater than max selections.',
    ])
  })

  test('limits cannot exceed the number of options', () => {
    expect(definition.validateConfig(withLimits(null, 4))).toEqual([
      'Max selections can’t be more than the 3 options.',
    ])
    expect(definition.validateConfig(withLimits(4, null))).toEqual([
      'Min selections can’t be more than the 3 options.',
    ])
  })

  test('limits must be whole numbers', () => {
    expect(definition.validateConfig(withLimits(-1, 0))).toEqual([
      'Min selections must be a whole number, 0 or more.',
      'Max selections must be a whole number, 1 or more.',
    ])
  })
})

describe('multi select: value', () => {
  test('nothing selected is empty', () => {
    expect(definition.isEmpty([])).toBe(true)
    expect(definition.isEmpty(['a'])).toBe(false)
  })

  test('min and max selections are inclusive', () => {
    const limited = withLimits(2, 2)
    expect(definition.validateValue(limited, ['a'])).toBe('Select at least 2 options.')
    expect(definition.validateValue(limited, ['a', 'b'])).toBeNull()
    expect(definition.validateValue(limited, ['a', 'b', 'c'])).toBe(
      'Select at most 2 options.',
    )
  })

  test('ids that are no longer options are rejected', () => {
    expect(definition.validateValue(field, ['a', 'gone'])).toBe(
      'Choose from the listed options.',
    )
  })

  test('toggleOption keeps the options’ order', () => {
    expect(toggleOption(field.config.options, ['c'], 'a')).toEqual(['a', 'c'])
    expect(toggleOption(field.config.options, ['a', 'c'], 'a')).toEqual(['c'])
  })
})
