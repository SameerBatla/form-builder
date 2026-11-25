import { describe, expect, test } from 'vitest'
import { singleSelectDefinition as definition } from './singleSelectLogic'

const field = definition.createField('plan')
const [firstOption] = field.config.options

describe('single select', () => {
  test('defaults: two options shown as radio buttons, nothing selected', () => {
    expect(field.config.display).toBe('radio')
    expect(field.config.options.map((option) => option.label)).toEqual([
      'Option 1',
      'Option 2',
    ])
    expect(definition.initialValue(field, '2026-11-26')).toBeNull()
  })

  test('config: option rules apply', () => {
    const noOptions = { ...field, config: { ...field.config, options: [] } }
    expect(definition.validateConfig(noOptions)).toEqual(['Add at least one option.'])
  })

  test('value: a chosen option id is valid, null is empty', () => {
    expect(definition.isEmpty(null)).toBe(true)
    expect(definition.validateValue(field, firstOption.id)).toBeNull()
  })

  test('value: an id that is no longer an option is rejected', () => {
    expect(definition.validateValue(field, 'deleted-option')).toBe(
      'Choose one of the options.',
    )
  })
})
