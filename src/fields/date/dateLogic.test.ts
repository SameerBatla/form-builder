import { describe, expect, test } from 'vitest'
import { dateDefinition as definition, isTodayOutsideRange } from './dateLogic'

const field = definition.createField('start')
const today = '2026-11-26'

function withConfig(config: Partial<typeof field.config>) {
  return { ...field, config: { ...field.config, ...config } }
}

describe('date', () => {
  test('defaults: no pre-fill, no range, empty answer', () => {
    expect(field.config).toEqual({ prefillToday: false, minDate: null, maxDate: null })
    expect(definition.initialValue(field, today)).toBeNull()
  })

  test('spec: pre-fill sets today’s date when a new response opens', () => {
    expect(definition.initialValue(withConfig({ prefillToday: true }), today)).toBe(today)
  })

  test('config: earliest date cannot be after latest date', () => {
    expect(
      definition.validateConfig(
        withConfig({ minDate: '2026-12-01', maxDate: '2026-01-01' }),
      ),
    ).toEqual(['Earliest date can’t be after the latest date.'])
  })

  test('value: min and max dates are inclusive', () => {
    const ranged = withConfig({ minDate: '2026-03-01', maxDate: '2026-03-31' })
    expect(definition.validateValue(ranged, '2026-03-01')).toBeNull()
    expect(definition.validateValue(ranged, '2026-03-31')).toBeNull()
    expect(definition.validateValue(ranged, '2026-02-28')).toBe(
      'Choose a date on or after 1 Mar 2026.',
    )
    expect(definition.validateValue(ranged, '2026-04-01')).toBe(
      'Choose a date on or before 31 Mar 2026.',
    )
  })

  test('builder warning: pre-fill is on but today is outside the range', () => {
    const config = { prefillToday: true, minDate: '2026-01-01', maxDate: '2026-03-31' }
    expect(isTodayOutsideRange(config, today)).toBe(true)
    expect(isTodayOutsideRange({ ...config, prefillToday: false }, today)).toBe(false)
    expect(isTodayOutsideRange({ ...config, maxDate: null }, today)).toBe(false)
  })
})
