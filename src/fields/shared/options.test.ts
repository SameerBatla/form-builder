import { describe, expect, test } from 'vitest'
import { createOption, validateOptions } from './options'

describe('validateOptions', () => {
  test('needs at least one option', () => {
    expect(validateOptions([])).toEqual(['Add at least one option.'])
  })

  test('every option needs a label', () => {
    expect(validateOptions([{ id: 'a', label: ' ' }])).toEqual([
      'Every option needs a label.',
    ])
  })

  test('labels must be unique, ignoring case and spaces', () => {
    expect(
      validateOptions([
        { id: 'a', label: 'Red' },
        { id: 'b', label: ' red ' },
      ]),
    ).toEqual(['Option labels must be unique ("Red" appears twice).'])
  })

  test('valid options have no issues', () => {
    expect(validateOptions([createOption('Yes'), createOption('No')])).toEqual([])
  })
})
