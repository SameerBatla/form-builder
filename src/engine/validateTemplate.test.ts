import { describe, expect, test } from 'vitest'
import type { SingleLineTextField } from '../fields/singleLineText/singleLineTextSchema'
import { createField } from '../fields/logicRegistry'
import { ruleField, whenText } from '../test/ruleFixtures'
import { countIssues, validateTemplate } from './validateTemplate'

function textField(
  id: string,
  overrides: Partial<SingleLineTextField['config']> = {},
): SingleLineTextField {
  const field = createField('singleLineText', id)
  if (field.type !== 'singleLineText') {
    throw new Error('expected a single line text field')
  }
  return { ...field, config: { ...field.config, ...overrides } }
}

describe('validateTemplate: form level', () => {
  test('a titled form with one valid field has no issues', () => {
    const issues = validateTemplate({ title: 'Intake', fields: [textField('a')] })
    expect(issues).toEqual({ formIssues: [], fieldIssues: {} })
    expect(countIssues(issues)).toBe(0)
  })

  test('a blank title is an issue', () => {
    const issues = validateTemplate({ title: '   ', fields: [textField('a')] })
    expect(issues.formIssues).toEqual(['Give the form a title.'])
  })

  test('a form with no fields is an issue', () => {
    const issues = validateTemplate({ title: 'Intake', fields: [] })
    expect(issues.formIssues).toEqual(['Add at least one field.'])
  })
})

describe('validateTemplate: field level', () => {
  test('every field needs a label', () => {
    const field = { ...textField('a'), label: ' ' }
    const issues = validateTemplate({ title: 'Intake', fields: [field] })
    expect(issues.fieldIssues).toEqual({ a: ['Label is required.'] })
  })

  test('single line text: min length cannot exceed max length', () => {
    const issues = validateTemplate({
      title: 'Intake',
      fields: [textField('a', { minLength: 10, maxLength: 5 })],
    })
    expect(issues.fieldIssues.a).toEqual(['Min length can’t be greater than max length.'])
  })

  test('single line text: lengths must be whole numbers (storage would reject them)', () => {
    const issues = validateTemplate({
      title: 'Intake',
      fields: [textField('a', { minLength: -1, maxLength: 2.5 })],
    })
    expect(issues.fieldIssues.a).toEqual([
      'Min length must be a whole number, 0 or more.',
      'Max length must be a whole number, 1 or more.',
    ])
  })

  test('countIssues counts form issues plus fields that have issues', () => {
    const issues = validateTemplate({
      title: '',
      fields: [
        { ...textField('a'), label: '' },
        textField('b', { minLength: 3, maxLength: 1 }),
      ],
    })
    expect(countIssues(issues)).toBe(3)
  })
})

describe('validateTemplate: rules', () => {
  test('an incomplete condition blocks Save on the field that owns it', () => {
    const fields = [ruleField('a'), ruleField('b', { showWhen: [whenText('a', '')] })]
    expect(validateTemplate({ title: 'T', fields }).fieldIssues).toEqual({
      b: ['A rule on “a” needs a value to compare with.'],
    })
  })

  test('a loop in the rules is a form-level issue', () => {
    const fields = [
      ruleField('a', { hideWhen: [whenText('b', '1')] }),
      ruleField('b', { hideWhen: [whenText('a', '1')] }),
    ]
    expect(validateTemplate({ title: 'T', fields }).formIssues).toEqual([
      'These fields’ rules depend on each other in a loop: a, b.',
    ])
  })
})
