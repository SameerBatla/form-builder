import { describe, expect, test } from 'vitest'
import type { ResolvedField } from '../logicTypes'
import { aggregate, calculationDefinition as definition } from './calculationLogic'
import type { CalculationAggregation } from './calculationSchema'

const base = definition.createField('total')

function withConfig(config: Partial<typeof base.config>) {
  return { ...base, config: { ...base.config, ...config } }
}

describe('aggregate', () => {
  const cases: [CalculationAggregation, number][] = [
    ['sum', 60],
    ['average', 20],
    ['min', 10],
    ['max', 30],
  ]
  test.each(cases)('%s of 10, 20, 30 → %d', (aggregation, expected) => {
    expect(aggregate([10, 20, 30], aggregation, 0)).toBe(expected)
  })

  test('no numbers → null (shown as "—", never 0)', () => {
    expect(aggregate([], 'sum', 2)).toBeNull()
  })

  test('rounds the result to the decimal places', () => {
    expect(aggregate([1, 2, 2], 'average', 2)).toBe(1.67)
    expect(aggregate([0.1, 0.2], 'sum', 1)).toBe(0.3)
  })
})

describe('computeValue: which sources count', () => {
  const sources: Record<string, ResolvedField> = {
    q1: { isVisible: true, isEmpty: false, value: 10 },
    q2: { isVisible: true, isEmpty: false, value: 20 },
    empty: { isVisible: true, isEmpty: true, value: null },
    hidden: { isVisible: false, isEmpty: false, value: 5 },
  }
  const getField = (id: string) => sources[id] ?? null

  test('spec Q13: empty sources are skipped (average of 10, 20 and empty is 15)', () => {
    const field = withConfig({
      sourceFieldIds: ['q1', 'q2', 'empty'],
      aggregation: 'average',
    })
    expect(definition.computeValue?.(field, getField)).toBe(15)
  })

  test('spec Q14: hidden sources are skipped even if they hold a value', () => {
    const field = withConfig({ sourceFieldIds: ['q1', 'hidden'], aggregation: 'sum' })
    expect(definition.computeValue?.(field, getField)).toBe(10)
  })

  test('only empty, hidden or missing sources → null', () => {
    const field = withConfig({ sourceFieldIds: ['empty', 'hidden', 'gone'] })
    expect(definition.computeValue?.(field, getField)).toBeNull()
  })
})

describe('config', () => {
  test('defaults: no sources yet, sum, 2 decimals, never required', () => {
    expect(base.config).toEqual({
      sourceFieldIds: [],
      aggregation: 'sum',
      decimalPlaces: 2,
    })
    expect('required' in base).toBe(false)
  })

  test('needs at least one source', () => {
    expect(definition.validateConfig(base)).toEqual([
      'Choose at least one Number field to calculate from.',
    ])
  })

  test('sources are its references, and a deleted source is removed', () => {
    const field = withConfig({ sourceFieldIds: ['a', 'b'] })
    expect(definition.referencedFieldIds?.(field)).toEqual(['a', 'b'])
    expect(definition.removeFieldReference?.(field, 'a').config.sourceFieldIds).toEqual([
      'b',
    ])
  })

  test('a calculation is not itself a calculation source or a rule target', () => {
    expect(definition.isCalculationSource).toBeFalsy()
    expect(definition.conditionKinds).toBeUndefined()
  })
})
