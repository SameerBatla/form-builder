import { describe, expect, test } from 'vitest'
import type { Condition } from '../fields/conditionSchema'
import type { Field } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'
import { ruleField, whenText } from '../test/ruleFixtures'
import {
  changeConditionOperator,
  changeConditionTarget,
  choicesForTarget,
  createCondition,
  getEligibleTargets,
  validateCondition,
} from './conditionBuilder'

function selectField(id: string): Field {
  const field = createField('singleSelect', id)
  if (field.type !== 'singleSelect') {
    throw new Error('expected a single select')
  }
  return {
    ...field,
    config: {
      ...field.config,
      options: [
        { id: 'red', label: 'Red' },
        { id: 'blue', label: 'Blue' },
      ],
    },
  }
}

describe('getEligibleTargets', () => {
  test('spec: a field cannot target itself; non-value types are never targets', () => {
    const fields = [
      ruleField('self'),
      ruleField('other'),
      createField('sectionHeader', 'header'),
      createField('fileUpload', 'file'),
    ]
    expect(getEligibleTargets(fields, 'self').map((field) => field.id)).toEqual(['other'])
  })

  test('fields that already depend on this one are excluded (no loops)', () => {
    const fields = [
      ruleField('a'),
      ruleField('b', { hideWhen: [whenText('a', '1')] }),
      ruleField('c', { hideWhen: [whenText('b', '1')] }),
    ]
    // c depends on b, b on a: so a may not target b or c.
    expect(getEligibleTargets(fields, 'a').map((field) => field.id)).toEqual([])
    expect(getEligibleTargets(fields, 'c').map((field) => field.id)).toEqual(['a', 'b'])
  })
})

describe('operator choices follow the spec table', () => {
  const labels = (field: Field) => choicesForTarget(field).map((choice) => choice.label)

  test('text, number, single select, multi select, date', () => {
    expect(labels(ruleField('t'))).toEqual(['equals', 'does not equal', 'contains'])
    expect(labels(createField('number', 'n'))).toEqual([
      'equals',
      'is greater than',
      'is less than',
      'is within range',
    ])
    expect(labels(selectField('s'))).toEqual(['equals', 'does not equal'])
    expect(labels(createField('multiSelect', 'm'))).toEqual([
      'contains any of',
      'contains all of',
      'contains none of',
    ])
    expect(labels(createField('date', 'd'))).toEqual(['equals', 'is before', 'is after'])
  })
})

describe('creating and editing conditions', () => {
  test('a new condition uses the target’s first operator and an empty value', () => {
    expect(createCondition('c1', ruleField('t'))).toEqual({
      id: 'c1',
      targetId: 't',
      kind: 'text',
      operator: 'equals',
      value: '',
    })
  })

  test('a single select condition starts with the first option', () => {
    expect(createCondition('c1', selectField('s'))).toMatchObject({ value: 'red' })
  })

  test('changing the operator within the same family keeps the value', () => {
    const condition: Condition = { ...whenText('t', 'hello'), id: 'c1' }
    const contains = choicesForTarget(ruleField('t'))[2]
    expect(changeConditionOperator(condition, contains, ruleField('t'))).toMatchObject({
      operator: 'contains',
      value: 'hello',
    })
  })

  test('switching number → range starts a fresh range value', () => {
    const numberField = createField('number', 'n')
    const condition = createCondition('c1', numberField)
    const withinRange = choicesForTarget(numberField)[3]
    expect(changeConditionOperator(condition, withinRange, numberField)).toEqual({
      id: 'c1',
      targetId: 'n',
      kind: 'numberRange',
      operator: 'withinRange',
      value: { min: null, max: null },
    })
  })

  test('changing the target resets the condition for the new target, keeping its id', () => {
    const condition = createCondition('c1', ruleField('t'))
    expect(changeConditionTarget(condition, selectField('s'))).toEqual({
      id: 'c1',
      targetId: 's',
      kind: 'singleSelect',
      operator: 'equals',
      value: 'red',
    })
  })
})

describe('validateCondition (blocks Save)', () => {
  const fields = [
    ruleField('owner'),
    ruleField('t'),
    selectField('s'),
    createField('number', 'n'),
  ]

  test('a complete condition has no issues', () => {
    expect(validateCondition(whenText('t', 'yes'), fields, 'owner')).toEqual([])
  })

  test('missing value', () => {
    expect(validateCondition(whenText('t', ' '), fields, 'owner')).toEqual([
      'A rule on “t” needs a value to compare with.',
    ])
  })

  test('range ends must both be set and in order', () => {
    const range: Condition = {
      id: 'c',
      targetId: 'n',
      kind: 'numberRange',
      operator: 'withinRange',
      value: { min: 10, max: 1 },
    }
    expect(validateCondition(range, fields, 'owner')).toEqual([
      'A rule on “Number” has a range whose start is after its end.',
    ])
  })

  test('the target must still exist, and cannot be the field itself', () => {
    expect(validateCondition(whenText('gone', 'x'), fields, 'owner')).toEqual([
      'A rule refers to a field that no longer exists.',
    ])
    expect(validateCondition(whenText('owner', 'x'), fields, 'owner')).toEqual([
      'A field can’t have a rule on itself.',
    ])
  })

  test('a select option used by the rule must still exist', () => {
    const condition: Condition = {
      id: 'c',
      targetId: 's',
      kind: 'singleSelect',
      operator: 'equals',
      value: 'green',
    }
    expect(validateCondition(condition, fields, 'owner')).toEqual([
      'A rule on “Single select” uses an option that no longer exists.',
    ])
  })
})
