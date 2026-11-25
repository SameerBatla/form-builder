import { expect, test } from 'vitest'
import { formatFileSize, pluralize } from './format'

test('pluralize', () => {
  expect(pluralize(1, 'file')).toBe('1 file')
  expect(pluralize(2, 'file')).toBe('2 files')
})

test('formatFileSize', () => {
  expect(formatFileSize(512)).toBe('512 B')
  expect(formatFileSize(1536)).toBe('1.5 KB')
  expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2.4 MB')
})
