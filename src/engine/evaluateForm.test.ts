import { describe, expect, test } from 'vitest'
import type { Field } from '../fields/fieldUnion'
import type { SingleLineTextField } from '../fields/singleLineText/singleLineTextSchema'
import { createField } from '../fields/logicRegistry'
import { ruleField, whenText } from '../test/ruleFixtures'
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

describe('evaluateForm: cleared values', () => {
  test('a value cleared to null stays cleared instead of falling back to the initial value', () => {
    const field = createField('number', 'qty')
    if (field.type !== 'number') {
      throw new Error('expected a number field')
    }
    const required: Field = {
      ...field,
      required: { ...field.required, defaultState: 'required' },
    }
    const evaluation = evaluateForm([required], { qty: null }, today)
    expect(evaluation.fields.qty).toMatchObject({
      value: null,
      error: 'This field is required.',
    })
  })
})

describe('buildSubmission: display-only fields', () => {
  test('a visible section header is listed in visibleFieldIds but stores no value', () => {
    const header = createField('sectionHeader', 'intro')
    const name = textField('name')
    const evaluation = evaluateForm([header, name], { name: 'Jane' }, today)
    expect(buildSubmission([header, name], evaluation)).toEqual({
      visibleFieldIds: ['intro', 'name'],
      values: { name: 'Jane' },
    })
    expect(evaluation.fields.intro.error).toBeNull()
  })
})

describe('evaluateForm: conditional logic', () => {
  test('show when: a hidden-by-default field appears when its condition matches', () => {
    const fields = [ruleField('a'), ruleField('b', { showWhen: [whenText('a', 'yes')] })]
    expect(evaluateForm(fields, { a: 'no' }, today).fields.b.isVisible).toBe(false)
    expect(evaluateForm(fields, { a: 'Yes' }, today).fields.b.isVisible).toBe(true)
  })

  test('spec chain: A hides B, B would have shown C → C stays hidden', () => {
    const fields = [
      ruleField('a'),
      ruleField('b', { hideWhen: [whenText('a', 'x')] }),
      ruleField('c', { showWhen: [whenText('b', 'y')] }),
    ]
    const withoutA = evaluateForm(fields, { a: '', b: 'y' }, today)
    expect(withoutA.fields.c.isVisible).toBe(true)

    const withA = evaluateForm(fields, { a: 'x', b: 'y' }, today)
    expect(withA.fields.b.isVisible).toBe(false)
    expect(withA.fields.c.isVisible).toBe(false)
  })

  test('chains work regardless of form order', () => {
    const fields = [
      ruleField('c', { showWhen: [whenText('b', 'y')] }),
      ruleField('b', { hideWhen: [whenText('a', 'x')] }),
      ruleField('a'),
    ]
    expect(evaluateForm(fields, { a: 'x', b: 'y' }, today).fields.c.isVisible).toBe(false)
  })

  test('spec: a hidden required field is not validated and not submitted', () => {
    const fields = [
      ruleField('a'),
      ruleField('b', { required: true, hideWhen: [whenText('a', 'skip')] }),
    ]
    const evaluation = evaluateForm(fields, { a: 'skip', b: '' }, today)
    expect(evaluation.fields.b).toMatchObject({
      isVisible: false,
      isRequired: false,
      error: null,
    })
    expect(evaluation.errorCount).toBe(0)
    expect(buildSubmission(fields, evaluation)).toEqual({
      visibleFieldIds: ['a'],
      values: { a: 'skip' },
    })
  })

  test('mark as required / mark as not required', () => {
    const fields = [
      ruleField('a'),
      ruleField('b', { requireWhen: [whenText('a', 'yes')] }),
      ruleField('c', { optionalWhen: [whenText('a', 'yes')] }),
    ]
    const evaluation = evaluateForm(fields, { a: 'yes', b: '', c: '' }, today)
    expect(evaluation.fields.b).toMatchObject({
      isRequired: true,
      error: 'This field is required.',
    })
    expect(evaluation.fields.c).toMatchObject({ isRequired: false, error: null })
  })

  test('multiple conditions: ALL vs ANY', () => {
    const conditions = [whenText('a', '1'), whenText('b', '1')]
    const fields = [
      ruleField('a'),
      ruleField('b'),
      ruleField('all', { showWhen: conditions, match: 'all' }),
      ruleField('any', { showWhen: conditions, match: 'any' }),
    ]
    const evaluation = evaluateForm(fields, { a: '1', b: '0' }, today)
    expect(evaluation.fields.all.isVisible).toBe(false)
    expect(evaluation.fields.any.isVisible).toBe(true)
  })

  test('a condition on a deleted field is ignored (default state), without crashing', () => {
    const fields = [ruleField('b', { showWhen: [whenText('gone', 'x')] })]
    expect(evaluateForm(fields, {}, today).fields.b.isVisible).toBe(false)
  })

  test('a looping rule set in stored data falls back to defaults instead of crashing', () => {
    const fields = [
      ruleField('a', { hideWhen: [whenText('b', '1')] }),
      ruleField('b', { hideWhen: [whenText('a', '1')] }),
    ]
    const evaluation = evaluateForm(fields, { a: '1', b: '1' }, today)
    expect(evaluation.fields.a.isVisible).toBe(true)
    expect(evaluation.fields.b.isVisible).toBe(false)
  })

  test('errors are counted in form order, not evaluation order', () => {
    const fields = [
      ruleField('second', { required: true, hideWhen: [whenText('first', 'x')] }),
      ruleField('first', { required: true }),
    ]
    expect(evaluateForm(fields, {}, today).firstErrorFieldId).toBe('second')
  })
})

describe('evaluateForm: calculation', () => {
  function numberField(
    id: string,
    options: { hideWhen?: ReturnType<typeof whenText>[] } = {},
  ) {
    const field = createField('number', id)
    if (field.type !== 'number') {
      throw new Error('expected number')
    }
    return {
      ...field,
      label: id,
      visibility: {
        ...field.visibility,
        conditions: options.hideWhen ?? [],
      },
    }
  }
  function total(sourceFieldIds: string[]) {
    const field = createField('calculation', 'total')
    if (field.type !== 'calculation') {
      throw new Error('expected calculation')
    }
    return { ...field, config: { ...field.config, sourceFieldIds } }
  }

  test('sums the visible source values, and is stored computed in the submission', () => {
    const fields = [
      numberField('price'),
      numberField('shipping'),
      total(['price', 'shipping']),
    ]
    // Sources are used as stored: shipping has 0 decimal places, so 7.4 counts as 7.
    const evaluation = evaluateForm(fields, { price: 100, shipping: 7.4 }, today)
    expect(evaluation.fields.total.value).toBe(107)
    expect(buildSubmission(fields, evaluation).values.total).toBe(107)
  })

  test('works even when the calculation is above its sources in the form', () => {
    const fields = [total(['price']), numberField('price')]
    expect(evaluateForm(fields, { price: 3 }, today).fields.total.value).toBe(3)
  })

  test('spec Q14: a source hidden by a rule stops counting immediately', () => {
    const fields = [
      ruleField('pickup'),
      numberField('price'),
      numberField('shipping', { hideWhen: [whenText('pickup', 'yes')] }),
      total(['price', 'shipping']),
    ]
    const values = { pickup: 'yes', price: 100, shipping: 5 }
    expect(evaluateForm(fields, values, today).fields.total.value).toBe(100)
  })

  test('a user-typed value for a calculation is ignored', () => {
    const fields = [numberField('price'), total(['price'])]
    expect(evaluateForm(fields, { price: 1, total: 999 }, today).fields.total.value).toBe(
      1,
    )
  })
})
