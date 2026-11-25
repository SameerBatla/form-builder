import { describe, expect, test } from 'vitest'
import type { Field } from '../fields/fieldUnion'
import type { SingleLineTextField } from '../fields/singleLineText/singleLineTextSchema'
import { createField } from '../fields/logicRegistry'
import { buildSubmission, evaluateForm } from './evaluateForm'

const today = '2026-11-26'

function textField(
  id: string,
  options: {
    required?: boolean
    hidden?: boolean
    minLength?: number
    maxLength?: number
  } = {},
): SingleLineTextField {
  const field = createField('singleLineText', id)
  if (field.type !== 'singleLineText') {
    throw new Error('expected a single line text field')
  }
  return {
    ...field,
    label: id,
    config: {
      ...field.config,
      minLength: options.minLength ?? null,
      maxLength: options.maxLength ?? null,
    },
    visibility: {
      ...field.visibility,
      defaultState: options.hidden ? 'hidden' : 'visible',
    },
    required: {
      ...field.required,
      defaultState: options.required ? 'required' : 'optional',
    },
  }
}

function errorsOf(fields: Field[], values: Record<string, string>) {
  const evaluation = evaluateForm(fields, values, today)
  return Object.fromEntries(
    fields.map((field) => [field.id, evaluation.fields[field.id].error]),
  )
}

describe('evaluateForm: required', () => {
  test('a visible required field that is empty has an error', () => {
    expect(errorsOf([textField('name', { required: true })], { name: '' })).toEqual({
      name: 'This field is required.',
    })
  })

  test('whitespace-only text counts as empty', () => {
    expect(errorsOf([textField('name', { required: true })], { name: '   ' }).name).toBe(
      'This field is required.',
    )
  })

  test('an optional empty field has no error, even with a min length', () => {
    expect(errorsOf([textField('bio', { minLength: 10 })], { bio: '' }).bio).toBeNull()
  })

  test('spec: a hidden field is never validated as required', () => {
    const fields = [textField('secret', { required: true, hidden: true })]
    const evaluation = evaluateForm(fields, { secret: '' }, today)
    expect(evaluation.fields.secret).toMatchObject({
      isVisible: false,
      isRequired: false,
      error: null,
    })
    expect(evaluation.errorCount).toBe(0)
  })
})

describe('evaluateForm: field rules', () => {
  test('single line text: shorter than min length is an error', () => {
    expect(errorsOf([textField('code', { minLength: 4 })], { code: 'ab' }).code).toBe(
      'Enter at least 4 characters.',
    )
  })

  test('single line text: longer than max length is an error (e.g. pasted text)', () => {
    expect(errorsOf([textField('code', { maxLength: 3 })], { code: 'abcd' }).code).toBe(
      'Use at most 3 characters.',
    )
  })

  test('errorCount and firstErrorFieldId follow form order', () => {
    const fields = [
      textField('a'),
      textField('b', { required: true }),
      textField('c', { required: true }),
    ]
    const evaluation = evaluateForm(fields, { a: '', b: '', c: '' }, today)
    expect(evaluation.errorCount).toBe(2)
    expect(evaluation.firstErrorFieldId).toBe('b')
  })

  test('a field missing from values falls back to its initial value', () => {
    expect(errorsOf([textField('name', { required: true })], {}).name).toBe(
      'This field is required.',
    )
  })
})

describe('buildSubmission', () => {
  test('spec: hidden fields are not in the submitted data', () => {
    const fields = [textField('shown'), textField('secret', { hidden: true })]
    const evaluation = evaluateForm(fields, { shown: 'hi', secret: 'leak' }, today)
    expect(buildSubmission(fields, evaluation)).toEqual({
      visibleFieldIds: ['shown'],
      values: { shown: 'hi' },
    })
  })

  test('keeps form order and includes empty optional answers', () => {
    const fields = [textField('b'), textField('a')]
    const evaluation = evaluateForm(fields, { a: 'x', b: '' }, today)
    expect(buildSubmission(fields, evaluation)).toEqual({
      visibleFieldIds: ['b', 'a'],
      values: { b: '', a: 'x' },
    })
  })
})
