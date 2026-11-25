import { describe, expect, test } from 'vitest'
import type { Condition } from '../fields/conditionSchema'
import type { Field } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'
import { ruleField, whenText } from '../test/ruleFixtures'
import {
  findFieldReferences,
  findOptionRuleImpact,
  pruneOptionConditions,
  removeFieldReferences,
} from './references'

function colourField(optionIds: string[]): Field {
  const field = createField('singleSelect', 'colour')
  if (field.type !== 'singleSelect') {
    throw new Error('expected a single select')
  }
  return {
    ...field,
    label: 'Colour',
    config: { ...field.config, options: optionIds.map((id) => ({ id, label: id })) },
  }
}

const colourIs = (value: string): Condition => ({
  id: `colour=${value}`,
  targetId: 'colour',
  kind: 'singleSelect',
  operator: 'equals',
  value,
})

const coloursInclude = (value: string[]): Condition => ({
  id: `colours⊇${value.join()}`,
  targetId: 'colour',
  kind: 'multiSelect',
  operator: 'containsAny',
  value,
})

describe('deleting a referenced field', () => {
  const fields = [
    ruleField('a'),
    ruleField('b', { hideWhen: [whenText('a', '1'), whenText('a', '2', 'second')] }),
    ruleField('c', { requireWhen: [whenText('a', 'x')] }),
    ruleField('d'),
  ]

  test('findFieldReferences lists who uses the field and how often', () => {
    expect(findFieldReferences(fields, 'a')).toEqual([
      { fieldId: 'b', label: 'b', ruleCount: 2, usesAsSource: false },
      { fieldId: 'c', label: 'c', ruleCount: 1, usesAsSource: false },
    ])
    expect(findFieldReferences(fields, 'd')).toEqual([])
  })

  test('spec edge case: removeFieldReferences drops every rule that targets it', () => {
    const remaining = removeFieldReferences(fields, 'a')
    expect(remaining.find((field) => field.id === 'b')?.visibility.conditions).toEqual([])
    const c = remaining.find((field) => field.id === 'c')
    expect(c && 'required' in c ? c.required.conditions : null).toEqual([])
  })
})

describe('removing a select option used in rules', () => {
  test('single select rules using the removed option are deleted; others stay', () => {
    const fields = [
      colourField(['red', 'blue']),
      ruleField('x', { hideWhen: [colourIs('red'), colourIs('blue')], match: 'any' }),
    ]
    const updated = colourField(['blue'])
    const pruned = pruneOptionConditions(fields, updated)
    expect(pruned[1].visibility.conditions.map((condition) => condition.id)).toEqual([
      'colour=blue',
    ])
  })

  test('multi select rules drop the removed id, and are deleted when nothing is left', () => {
    const fields = [
      colourField(['red', 'blue']),
      ruleField('x', { hideWhen: [coloursInclude(['red', 'blue'])] }),
      ruleField('y', { hideWhen: [coloursInclude(['red'])] }),
    ]
    const pruned = pruneOptionConditions(fields, colourField(['blue']))
    expect(pruned[1].visibility.conditions[0]).toMatchObject({ value: ['blue'] })
    expect(pruned[2].visibility.conditions).toEqual([])
  })

  test('renaming an option (same id) changes nothing', () => {
    const fields = [colourField(['red']), ruleField('x', { hideWhen: [colourIs('red')] })]
    const renamed = colourField(['red'])
    expect(pruneOptionConditions(fields, renamed)[1]).toBe(fields[1])
    expect(findOptionRuleImpact(fields, renamed)).toEqual([])
  })

  test('findOptionRuleImpact names the fields whose rules would change', () => {
    const fields = [
      colourField(['red', 'blue']),
      ruleField('x', { hideWhen: [colourIs('red')] }),
    ]
    expect(findOptionRuleImpact(fields, colourField(['blue']))).toEqual(['x'])
  })
})
