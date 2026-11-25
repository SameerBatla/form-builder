import { describe, expect, test } from 'vitest'
import type { Condition } from '../fields/conditionSchema'
import type { TargetState } from './conditions'
import { isConditionMet, matchesRuleGroup } from './conditions'

function target(
  value: TargetState['value'],
  overrides: Partial<TargetState> = {},
): TargetState {
  return { isVisible: true, isEmpty: false, value, ...overrides }
}

const base = { id: 'c1', targetId: 't' }

describe('text operators (equals, does not equal, contains)', () => {
  const text = (
    operator: 'equals' | 'notEquals' | 'contains',
    value: string,
  ): Condition => ({
    ...base,
    kind: 'text',
    operator,
    value,
  })

  test('equals is trimmed and case-insensitive', () => {
    expect(isConditionMet(text('equals', 'Yes'), target('  yes '))).toBe(true)
    expect(isConditionMet(text('equals', 'Yes'), target('yess'))).toBe(false)
  })

  test('does not equal', () => {
    expect(isConditionMet(text('notEquals', 'yes'), target('no'))).toBe(true)
    expect(isConditionMet(text('notEquals', 'yes'), target('YES'))).toBe(false)
  })

  test('contains', () => {
    expect(isConditionMet(text('contains', 'React'), target('I like react a lot'))).toBe(
      true,
    )
    expect(isConditionMet(text('contains', 'vue'), target('React'))).toBe(false)
  })
})

describe('number operators (equals, greater than, less than, within range)', () => {
  const number = (
    operator: 'equals' | 'greaterThan' | 'lessThan',
    value: number | null,
  ) => ({ ...base, kind: 'number', operator, value }) satisfies Condition

  test('equals / greater than / less than', () => {
    expect(isConditionMet(number('equals', 5), target(5))).toBe(true)
    expect(isConditionMet(number('greaterThan', 5), target(6))).toBe(true)
    expect(isConditionMet(number('greaterThan', 5), target(5))).toBe(false)
    expect(isConditionMet(number('lessThan', 5), target(4))).toBe(true)
  })

  test('within range is inclusive at both ends', () => {
    const range: Condition = {
      ...base,
      kind: 'numberRange',
      operator: 'withinRange',
      value: { min: 18, max: 65 },
    }
    expect(isConditionMet(range, target(18))).toBe(true)
    expect(isConditionMet(range, target(65))).toBe(true)
    expect(isConditionMet(range, target(66))).toBe(false)
  })

  test('an incomplete condition value never matches', () => {
    expect(isConditionMet(number('equals', null), target(5))).toBe(false)
  })
})

describe('single select operators (equals, does not equal)', () => {
  test('compares option ids', () => {
    const equals: Condition = {
      ...base,
      kind: 'singleSelect',
      operator: 'equals',
      value: 'red',
    }
    const notEquals: Condition = { ...equals, operator: 'notEquals' }
    expect(isConditionMet(equals, target('red'))).toBe(true)
    expect(isConditionMet(notEquals, target('blue'))).toBe(true)
    expect(isConditionMet(notEquals, target('red'))).toBe(false)
  })
})

describe('multi select operators (contains any of, all of, none of)', () => {
  const multi = (
    operator: 'containsAny' | 'containsAll' | 'containsNone',
  ): Condition => ({
    ...base,
    kind: 'multiSelect',
    operator,
    value: ['react', 'vue'],
  })

  test('contains any of', () => {
    expect(isConditionMet(multi('containsAny'), target(['vue', 'css']))).toBe(true)
    expect(isConditionMet(multi('containsAny'), target(['css']))).toBe(false)
  })

  test('contains all of', () => {
    expect(isConditionMet(multi('containsAll'), target(['react', 'css', 'vue']))).toBe(
      true,
    )
    expect(isConditionMet(multi('containsAll'), target(['react']))).toBe(false)
  })

  test('contains none of', () => {
    expect(isConditionMet(multi('containsNone'), target(['css']))).toBe(true)
    expect(isConditionMet(multi('containsNone'), target(['css', 'vue']))).toBe(false)
  })
})

describe('date operators (equals, is before, is after)', () => {
  const date = (operator: 'equals' | 'before' | 'after'): Condition => ({
    ...base,
    kind: 'date',
    operator,
    value: '2026-03-15',
  })

  test('compares calendar dates', () => {
    expect(isConditionMet(date('equals'), target('2026-03-15'))).toBe(true)
    expect(isConditionMet(date('before'), target('2026-03-14'))).toBe(true)
    expect(isConditionMet(date('before'), target('2026-03-15'))).toBe(false)
    expect(isConditionMet(date('after'), target('2026-04-01'))).toBe(true)
  })
})

describe('spec: no value → default state', () => {
  const notEquals: Condition = {
    ...base,
    kind: 'text',
    operator: 'notEquals',
    value: 'yes',
  }
  const containsNone: Condition = {
    ...base,
    kind: 'multiSelect',
    operator: 'containsNone',
    value: ['a'],
  }

  test('an empty target never matches, even "does not equal" / "contains none of"', () => {
    expect(isConditionMet(notEquals, target('', { isEmpty: true }))).toBe(false)
    expect(isConditionMet(containsNone, target([], { isEmpty: true }))).toBe(false)
  })

  test('a hidden target never matches, even if it still holds a value', () => {
    expect(isConditionMet(notEquals, target('no', { isVisible: false }))).toBe(false)
  })

  test('a missing target (deleted field) never matches and does not crash', () => {
    expect(isConditionMet(notEquals, null)).toBe(false)
  })

  test('a value of the wrong shape never matches', () => {
    expect(isConditionMet(notEquals, target(42))).toBe(false)
  })
})

describe('matchesRuleGroup: AND / OR', () => {
  const conditions = [
    { ...base, id: 'a', kind: 'text', operator: 'equals', value: 'x' },
    { ...base, id: 'b', kind: 'text', operator: 'equals', value: 'y' },
  ] satisfies Condition[]
  const onlyFirstMet = (condition: Condition) => condition.id === 'a'

  test('ALL needs every condition', () => {
    expect(matchesRuleGroup({ match: 'all', conditions }, onlyFirstMet)).toBe(false)
    expect(matchesRuleGroup({ match: 'all', conditions }, () => true)).toBe(true)
  })

  test('ANY needs at least one', () => {
    expect(matchesRuleGroup({ match: 'any', conditions }, onlyFirstMet)).toBe(true)
    expect(matchesRuleGroup({ match: 'any', conditions }, () => false)).toBe(false)
  })

  test('no conditions never flips the default', () => {
    expect(matchesRuleGroup({ match: 'all', conditions: [] }, () => true)).toBe(false)
  })
})
