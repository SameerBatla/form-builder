import { describe, expect, test } from 'vitest'
import { formatDate, formatRelativeTime } from './dates'

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
