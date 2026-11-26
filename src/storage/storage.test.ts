import { beforeEach, describe, expect, test } from 'vitest'
import {
  deleteResponse,
  loadResponses,
  loadResponsesForTemplate,
  saveResponse,
} from './responseStore'
import { RESPONSES_KEY, TEMPLATES_KEY } from './schema'
import { loadTemplate, loadTemplates, saveTemplate } from './templateStore'
import { buildResponse, buildTemplate } from '../test/fixtures'
import { simulateFullStorage } from '../test/storageFull'

function writeRaw(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

beforeEach(() => {
  localStorage.clear()
})

describe('templates', () => {
  test('empty storage loads no templates and nothing skipped', () => {
    expect(loadTemplates()).toEqual({ templates: [], skippedCount: 0 })
  })

  test('round trip: a saved template loads back identical (survives refresh)', () => {
    const template = buildTemplate('t1')
    saveTemplate(template)
    expect(loadTemplates().templates).toEqual([template])
    expect(loadTemplate('t1')).toEqual(template)
    expect(loadTemplate('missing')).toBeNull()
  })

  test('saving again replaces the record with the same id', () => {
    saveTemplate(buildTemplate('t1'))
    const renamed = buildTemplate('t1', { updatedAt: '2026-11-25T10:00:00.000Z' })
    saveTemplate(renamed)
    expect(loadTemplates().templates).toEqual([renamed])
  })

  test('bad data: an invalid record is skipped, valid ones still load', () => {
    writeRaw(TEMPLATES_KEY, {
      t1: buildTemplate('t1'),
      broken: { id: 'broken', title: 42 },
    })
    const result = loadTemplates()
    expect(result.templates.map((template) => template.id)).toEqual(['t1'])
    expect(result.skippedCount).toBe(1)
  })

  test('bad data: an unknown field type makes the template invalid', () => {
    const template = buildTemplate('t1')
    const raw = JSON.parse(JSON.stringify(template))
    raw.fields[0].type = 'hologram'
    writeRaw(TEMPLATES_KEY, { t1: raw })
    expect(loadTemplates()).toEqual({ templates: [], skippedCount: 1 })
  })

  test('bad data: a record stored under a key different from its id is skipped', () => {
    writeRaw(TEMPLATES_KEY, { other: buildTemplate('t1') })
    expect(loadTemplates().skippedCount).toBe(1)
  })

  test('bad data: invalid records are left untouched when another template is saved', () => {
    const broken = { id: 'broken', title: 42 }
    writeRaw(TEMPLATES_KEY, { broken })
    saveTemplate(buildTemplate('t2'))
    const raw = JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '{}')
    expect(raw.broken).toEqual(broken)
    expect(raw.t2).toBeDefined()
  })

  test('bad data: unparseable JSON loads nothing and is replaced on the next save', () => {
    localStorage.setItem(TEMPLATES_KEY, '{not json')
    expect(loadTemplates()).toEqual({ templates: [], skippedCount: 1 })

    saveTemplate(buildTemplate('t1'))
    expect(loadTemplates()).toEqual({ templates: [buildTemplate('t1')], skippedCount: 0 })
  })
})

describe('responses', () => {
  test('round trip, filtered by template', () => {
    const first = buildResponse('r1', buildTemplate('t1'))
    const second = buildResponse('r2', buildTemplate('t2'))
    saveResponse(first)
    saveResponse(second)

    expect(loadResponses().responses).toHaveLength(2)
    expect(loadResponsesForTemplate('t1')).toEqual([first])
  })

  test('delete removes only that response', () => {
    const template = buildTemplate('t1')
    saveResponse(buildResponse('r1', template))
    saveResponse(buildResponse('r2', template))
    deleteResponse('r1')
    expect(loadResponsesForTemplate('t1').map((response) => response.id)).toEqual(['r2'])
  })

  test('a response keeps its own copy of the form when the template is edited later', () => {
    const template = buildTemplate('t1')
    saveTemplate(template)
    saveResponse(buildResponse('r1', template))

    saveTemplate({ ...template, title: 'Renamed', fields: [] })

    const [response] = loadResponsesForTemplate('t1')
    expect(response.form.title).toBe('Template t1')
    expect(response.form.fields).toHaveLength(1)
  })

  test('bad data: a malformed response is skipped', () => {
    writeRaw(RESPONSES_KEY, { r1: { id: 'r1', values: 'oops' } })
    expect(loadResponses()).toEqual({ responses: [], skippedCount: 1 })
  })
})

describe('when the browser refuses a write (storage full)', () => {
  test('saves report failure instead of throwing, and stored data is unchanged', () => {
    const template = buildTemplate('t1')
    saveTemplate(template)
    const fullStorage = simulateFullStorage()

    expect(saveTemplate({ ...template, title: 'Renamed' })).toBe(false)
    expect(saveResponse(buildResponse('r1', template))).toBe(false)
    expect(deleteResponse('r1')).toBe(false)

    fullStorage.mockRestore()
    expect(loadTemplate('t1')?.title).toBe('Template t1')
    expect(loadResponses().responses).toEqual([])
  })
})
