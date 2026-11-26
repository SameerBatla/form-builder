import { beforeAll, describe, expect, test } from 'vitest'
import type { ExportModel } from './buildExportModel'
import { buildPrintHtml } from './printResponse'

const model: ExportModel = {
  title: 'Job <application>',
  submittedAt: '2026-11-26T12:00:00.000Z',
  responseNumber: 'ABCDEF12',
  items: [
    { kind: 'heading', id: 'h', text: 'Details', size: 'md' },
    { kind: 'answer', id: 'a', label: 'Name', lines: ['<script>alert(1)</script>'] },
    { kind: 'answer', id: 'b', label: 'Middle name', lines: [] },
    {
      kind: 'answer',
      id: 'c',
      label: 'CV',
      lines: ['cv.pdf (240 KB)'],
      note: 'Not embedded.',
    },
  ],
}

describe('buildPrintHtml', () => {
  let html = ''
  beforeAll(async () => {
    html = await buildPrintHtml(model)
  })

  test('is a full HTML page with the export and print styles inlined', () => {
    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain('@page')
    expect(html).toContain('fb-export__row')
  })

  test('escapes user content (title and answers)', () => {
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('<title>Job &lt;application&gt; – 2026-11-26</title>')
  })

  test('shows headings, labels, "—" for empty answers, and file notes', () => {
    expect(html).toContain(
      '<h4 class="fb-export__heading fb-export__heading--md">Details</h4>',
    )
    expect(html).toContain('Middle name')
    expect(html).toContain('—')
    expect(html).toContain('Not embedded.')
    expect(html).toContain('Response ABCDEF12')
  })
})
