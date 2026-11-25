import { describe, expect, test } from 'vitest'
import { fieldSchema } from './fieldUnion'
import { createField, fieldTypes } from './logicRegistry'

describe('field registry', () => {
  test.each(fieldTypes)('a new %s field is valid against the storage schema', (type) => {
    const field = createField(type, 'field-1')
    expect(fieldSchema.safeParse(field).success).toBe(true)
    expect(field.type).toBe(type)
    expect(field.id).toBe('field-1')
  })

  test('new fields start visible and optional with no conditions', () => {
    const field = createField('singleLineText', 'field-1')
    expect(field.visibility).toEqual({
      defaultState: 'visible',
      match: 'all',
      conditions: [],
    })
    expect(field.required).toEqual({
      defaultState: 'optional',
      match: 'all',
      conditions: [],
    })
  })
})

describe('condition schema', () => {
  test('rejects an operator that does not belong to the condition kind', () => {
    const field = createField('singleLineText', 'field-1')
    const withBadCondition = {
      ...field,
      visibility: {
        ...field.visibility,
        conditions: [
          {
            id: 'c1',
            targetId: 'field-2',
            kind: 'number',
            operator: 'contains',
            value: 3,
          },
        ],
      },
    }
    expect(fieldSchema.safeParse(withBadCondition).success).toBe(false)
  })
})
