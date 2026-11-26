import { describe, expect, test } from 'vitest'
import type { Field } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'
import type { FormResponse } from '../storage/schema'
import { buildExportModel, getAnswerPreview } from './buildExportModel'

function withLabel(field: Field, label: string): Field {
  return { ...field, label }
}

const name = withLabel(createField('singleLineText', 'name'), 'Full name')
const website = (() => {
  const field = createField('singleLineText', 'site')
  if (field.type !== 'singleLineText') {
    throw new Error('expected text')
  }
  return {
    ...field,
    label: 'Website',
    config: { ...field.config, prefix: 'https://', suffix: '.dev' },
  }
})()
const salary = (() => {
  const field = createField('number', 'salary')
  if (field.type !== 'number') {
    throw new Error('expected number')
  }
  return {
    ...field,
    label: 'Salary',
    config: { ...field.config, decimalPlaces: 2, prefix: '$' },
  }
})()
const middle = withLabel(createField('singleLineText', 'middle'), 'Middle name')
const secret = withLabel(createField('singleLineText', 'secret'), 'Secret')
const cv = withLabel(createField('fileUpload', 'cv'), 'CV')
const section = withLabel(createField('sectionHeader', 'details'), 'Personal details')

const response: FormResponse = {
  id: 'abcdef12-3456-7890-abcd-ef1234567890',
  templateId: 't1',
  submittedAt: '2026-11-26T14:32:00.000Z',
  form: {
    title: 'Job application',
    fields: [section, name, website, salary, middle, secret, cv],
  },
  // "secret" was hidden at submit, so it isn't listed as visible.
  visibleFieldIds: ['details', 'name', 'site', 'salary', 'middle', 'cv'],
  values: {
    name: 'Jane Doe',
    site: 'jane',
    salary: 85000,
    middle: '',
    cv: [{ name: 'cv.pdf', size: 245760, type: 'application/pdf' }],
  },
}

describe('buildExportModel', () => {
  const model = buildExportModel(response)

  test('spec: includes the form title, submission timestamp and a short response id', () => {
    expect(model.title).toBe('Job application')
    expect(model.submittedAt).toBe('2026-11-26T14:32:00.000Z')
    expect(model.responseNumber).toBe('ABCDEF12')
  })

  test('spec: visible fields in form order; hidden fields never appear', () => {
    expect(model.items.map((item) => item.id)).toEqual([
      'details',
      'name',
      'site',
      'salary',
      'middle',
      'cv',
    ])
    expect(JSON.stringify(model)).not.toContain('Secret')
  })

  test('answers are formatted per field type', () => {
    const byId = Object.fromEntries(model.items.map((item) => [item.id, item]))
    expect(byId.details).toMatchObject({
      kind: 'heading',
      text: 'Personal details',
      size: 'md',
    })
    expect(byId.name).toMatchObject({
      kind: 'answer',
      label: 'Full name',
      lines: ['Jane Doe'],
    })
    expect(byId.site).toMatchObject({ lines: ['https://jane.dev'] })
    expect(byId.salary).toMatchObject({ lines: ['$85,000.00'] })
  })

  test('an empty optional answer is kept (shown as "—"), with no lines', () => {
    expect(model.items.find((item) => item.id === 'middle')).toMatchObject({
      kind: 'answer',
      lines: [],
    })
  })

  test('spec: files are listed by name and size, with a note that contents are not embedded', () => {
    expect(model.items.find((item) => item.id === 'cv')).toMatchObject({
      lines: ['cv.pdf (240 KB)'],
      note: 'File contents are not embedded in this export.',
    })
  })

  test('a stored value of the wrong shape exports as no answer instead of crashing', () => {
    const broken = { ...response, values: { ...response.values, salary: 'lots' } }
    expect(
      buildExportModel(broken).items.find((item) => item.id === 'salary'),
    ).toMatchObject({
      lines: [],
    })
  })
})

describe('getAnswerPreview', () => {
  test('the first two non-empty answers, joined', () => {
    expect(getAnswerPreview(buildExportModel(response))).toBe(
      'Jane Doe · https://jane.dev',
    )
  })

  test('no answers → null', () => {
    const empty = { ...response, values: {} }
    expect(getAnswerPreview(buildExportModel(empty))).toBeNull()
  })
})
