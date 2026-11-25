import { expect, test } from 'vitest'
import { sectionHeaderDefinition as definition } from './sectionHeaderLogic'

test('section header: display only, medium size, never required or invalid', () => {
  const field = definition.createField('intro')
  expect(definition.capturesValue).toBe(false)
  expect(field.config.size).toBe('md')
  expect('required' in field).toBe(false)
  expect(definition.initialValue(field, '2026-11-26')).toBeNull()
  expect(definition.validateConfig(field)).toEqual([])
  expect(definition.validateValue(field, null)).toBeNull()
})
