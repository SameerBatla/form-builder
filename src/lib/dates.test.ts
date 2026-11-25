import { describe, expect, test } from 'vitest'
import { formatDate, formatIsoDate, formatRelativeTime, toLocalIsoDate } from './dates'

// Noon UTC keeps the calendar day the same in any time zone within ±11h.
const now = new Date('2026-11-26T12:00:00.000Z')

describe('formatRelativeTime', () => {
  test.each([
    ['2026-11-26T11:59:30.000Z', 'just now'],
    ['2026-11-26T11:55:00.000Z', '5 minutes ago'],
    ['2026-11-26T09:00:00.000Z', '3 hours ago'],
    ['2026-11-25T12:00:00.000Z', 'yesterday'],
    ['2026-11-22T12:00:00.000Z', '4 days ago'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected)
  })

  test('older than a week shows the date instead', () => {
    expect(formatRelativeTime('2026-11-10T12:00:00.000Z', now)).toBe('10 Nov 2026')
  })
})

describe('formatDate', () => {
  test('day, short month, year', () => {
    expect(formatDate('2026-03-01T12:00:00.000Z')).toBe('1 Mar 2026')
  })
})

describe('toLocalIsoDate', () => {
  test('uses the local calendar date, zero-padded', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('formatIsoDate', () => {
  test('formats a calendar date without time zone shifts', () => {
    expect(formatIsoDate('2026-03-01')).toBe('1 Mar 2026')
  })
})
