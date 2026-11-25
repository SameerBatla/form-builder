import { describe, expect, test } from 'vitest'
import { ruleField, whenText } from '../test/ruleFixtures'
import { dependsOn, findDependencyCycle, orderByDependencies } from './dependencies'

const ids = (fields: { id: string }[]) => fields.map((field) => field.id)

describe('orderByDependencies', () => {
  test('targets come before the fields whose rules use them, whatever the form order', () => {
    const fields = [
      ruleField('c', { showWhen: [whenText('b', 'y')] }),
      ruleField('b', { hideWhen: [whenText('a', 'x')] }),
      ruleField('a'),
    ]
    expect(ids(orderByDependencies(fields))).toEqual(['a', 'b', 'c'])
  })

  test('independent fields keep their form order', () => {
    expect(ids(orderByDependencies([ruleField('x'), ruleField('y')]))).toEqual(['x', 'y'])
  })

  test('a cycle does not crash: the looping fields come last, in form order', () => {
    const fields = [
      ruleField('a', { hideWhen: [whenText('b', '1')] }),
      ruleField('b', { hideWhen: [whenText('a', '1')] }),
      ruleField('free'),
    ]
    expect(ids(orderByDependencies(fields))).toEqual(['free', 'a', 'b'])
  })
})

describe('findDependencyCycle', () => {
  test('returns the fields caught in a loop', () => {
    const fields = [
      ruleField('a', { hideWhen: [whenText('c', '1')] }),
      ruleField('b', { hideWhen: [whenText('a', '1')] }),
      ruleField('c', { hideWhen: [whenText('b', '1')] }),
    ]
    expect(findDependencyCycle(fields)).toEqual(['a', 'b', 'c'])
  })

  test('spec: a field cannot set a condition on itself (a loop of one)', () => {
    expect(
      findDependencyCycle([ruleField('a', { hideWhen: [whenText('a', '1')] })]),
    ).toEqual(['a'])
  })

  test('no loop → null', () => {
    expect(
      findDependencyCycle([
        ruleField('a'),
        ruleField('b', { hideWhen: [whenText('a', '1')] }),
      ]),
    ).toBeNull()
  })
})

describe('dependsOn (used to hide targets that would create a loop)', () => {
  const fields = [
    ruleField('a'),
    ruleField('b', { hideWhen: [whenText('a', '1')] }),
    ruleField('c', { hideWhen: [whenText('b', '1')] }),
  ]

  test('follows chains', () => {
    expect(dependsOn(fields, 'c', 'a')).toBe(true)
    expect(dependsOn(fields, 'a', 'c')).toBe(false)
  })

  test('a field depends on itself (so it is never offered as its own target)', () => {
    expect(dependsOn(fields, 'a', 'a')).toBe(true)
  })
})

test('findDependencyCycle: fields that only depend on a loop are not listed as part of it', () => {
  const fields = [
    ruleField('a', { hideWhen: [whenText('b', '1')] }),
    ruleField('b', { hideWhen: [whenText('a', '1')] }),
    ruleField('downstream', { hideWhen: [whenText('a', '1')] }),
  ]
  expect(findDependencyCycle(fields)).toEqual(['a', 'b'])
})
