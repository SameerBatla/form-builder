import { describe, expect, test } from 'vitest'
import {
  addFiles,
  fileUploadDefinition as definition,
  isFileAllowed,
  parseAllowedTypes,
} from './fileUploadLogic'

const base = definition.createField('cv')
function withConfig(config: Partial<typeof base.config>) {
  return { ...base, config: { ...base.config, ...config } }
}
const pdf = { name: 'CV.PDF', size: 2048, type: 'application/pdf' }
const png = { name: 'photo.png', size: 500, type: 'image/png' }
const docx = { name: 'report.docx', size: 900, type: 'application/msword' }

describe('file upload: config', () => {
  test('defaults: any type, one file, nothing attached', () => {
    expect(base.config).toEqual({ allowedTypes: [], maxFiles: 1 })
    expect(definition.initialValue(base, '2026-11-26')).toEqual([])
  })

  test('parseAllowedTypes normalises a comma-separated list', () => {
    expect(parseAllowedTypes(' .PDF, png ,image/*,, ')).toEqual([
      '.pdf',
      '.png',
      'image/*',
    ])
    expect(parseAllowedTypes('')).toEqual([])
  })

  test('max files must be a whole number, 1 or more', () => {
    expect(definition.validateConfig(withConfig({ maxFiles: 0 }))).toEqual([
      'Max files must be a whole number, 1 or more.',
    ])
  })

  test('allowed types must look like .ext or type/subtype', () => {
    expect(
      definition.validateConfig(withConfig({ allowedTypes: ['.pdf', 'p d f'] })),
    ).toEqual([
      '"p d f" isn’t a valid file type. Use an extension like .pdf or a type like image/*.',
    ])
  })
})

describe('file upload: matching', () => {
  test('extensions match case-insensitively; MIME types support wildcards', () => {
    expect(isFileAllowed(pdf, ['.pdf'])).toBe(true)
    expect(isFileAllowed(png, ['image/*'])).toBe(true)
    expect(isFileAllowed(png, ['image/jpeg'])).toBe(false)
    expect(isFileAllowed(docx, ['.pdf', 'image/*'])).toBe(false)
  })

  test('an empty list allows any file', () => {
    expect(isFileAllowed(docx, [])).toBe(true)
  })
})

describe('file upload: adding files', () => {
  test('spec Q32: wrong types are rejected, extras beyond the max are not added, valid ones kept', () => {
    const config = { allowedTypes: ['.pdf', '.png'], maxFiles: 2 }
    const result = addFiles([], [pdf, docx, png, { ...png, name: 'third.png' }], config)
    expect(result.files.map((file) => file.name)).toEqual(['CV.PDF', 'photo.png'])
    expect(result.rejections).toEqual([
      'report.docx: not an allowed file type',
      'Only 2 files allowed, so third.png wasn’t added',
    ])
  })

  test('value: too many files or a disallowed type is an error (e.g. old data)', () => {
    const config = withConfig({ allowedTypes: ['.pdf'], maxFiles: 1 })
    expect(definition.validateValue(config, [pdf, pdf])).toBe('Attach at most 1 file.')
    expect(definition.validateValue(config, [docx])).toBe(
      'report.docx isn’t an allowed file type.',
    )
    expect(definition.isEmpty([])).toBe(true)
  })
})
