import { describe, expect, test } from 'vitest'
import type { Field } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'
import { ruleField, whenText } from '../test/ruleFixtures'
import { findDeleteFieldChange, findRemoveOptionsChange } from './pendingChange'

function colour(optionIds: string[]): Field {
  const field = createField('singleSelect', 'colour')
  if (field.type !== 'singleSelect') {
    throw new Error('expected a single select')
  }
  const options = optionIds.map((id) => ({ id, label: id.toUpperCase() }))
  return { ...field, label: 'Colour', config: { ...field.config, options } }
}

describe('findDeleteFieldChange', () => {
  test('null when nothing depends on the field (delete without asking)', () => {
    expect(findDeleteFieldChange([ruleField('a'), ruleField('b')], 'a')).toBeNull()
  })

  test('lists the fields whose rules use it', () => {
    const fields = [ruleField('a'), ruleField('b', { hideWhen: [whenText('a', 'x')] })]
    expect(findDeleteFieldChange(fields, 'a')).toMatchObject({
      kind: 'deleteField',
      label: 'a',
      references: [{ fieldId: 'b', ruleCount: 1 }],
    })
  })
})

describe('findRemoveOptionsChange', () => {
  const rule = {
    id: 'r',
    targetId: 'colour',
    kind: 'singleSelect',
    operator: 'equals',
    value: 'red',
  } as const

  test('names the removed options and the fields whose rules change', () => {
    const fields = [colour(['red', 'blue']), ruleField('note', { hideWhen: [rule] })]
    expect(findRemoveOptionsChange(fields, colour(['blue']))).toMatchObject({
      kind: 'removeOptions',
      removedLabels: ['RED'],
      affectedLabels: ['note'],
    })
  })

  test('null when the removed option is not used by any rule', () => {
    const fields = [colour(['red', 'blue']), ruleField('note', { hideWhen: [rule] })]
    expect(findRemoveOptionsChange(fields, colour(['red']))).toBeNull()
  })
})
