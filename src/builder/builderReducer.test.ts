import { describe, expect, test } from 'vitest'
import { createField } from '../fields/logicRegistry'
import type { BuilderAction, BuilderState } from './builderReducer'
import { ruleField, whenText } from '../test/ruleFixtures'
import { builderReducer, finalIndexForDrop } from './builderReducer'

function stateWith(
  fieldIds: string[],
  selectedFieldId: string | null = null,
): BuilderState {
  return {
    title: 'Form',
    fields: fieldIds.map((id) => createField('singleLineText', id)),
    selectedFieldId,
  }
}

function reduce(state: BuilderState, ...actions: BuilderAction[]): BuilderState {
  return actions.reduce(builderReducer, state)
}

function ids(state: BuilderState): string[] {
  return state.fields.map((field) => field.id)
}

describe('addField', () => {
  test('with nothing selected, appends at the end and selects the new field', () => {
    const next = reduce(stateWith(['a', 'b']), {
      type: 'addField',
      fieldType: 'singleLineText',
      fieldId: 'new',
    })
    expect(ids(next)).toEqual(['a', 'b', 'new'])
    expect(next.selectedFieldId).toBe('new')
  })

  test('inserts directly below the selected field', () => {
    const next = reduce(stateWith(['a', 'b', 'c'], 'a'), {
      type: 'addField',
      fieldType: 'singleLineText',
      fieldId: 'new',
    })
    expect(ids(next)).toEqual(['a', 'new', 'b', 'c'])
  })

  test('an explicit index (drop from palette) wins over the selection', () => {
    const next = reduce(stateWith(['a', 'b', 'c'], 'c'), {
      type: 'addField',
      fieldType: 'singleLineText',
      fieldId: 'new',
      index: 0,
    })
    expect(ids(next)).toEqual(['new', 'a', 'b', 'c'])
  })

  test('the new field gets the registry defaults for its type', () => {
    const next = reduce(stateWith([]), {
      type: 'addField',
      fieldType: 'singleLineText',
      fieldId: 'new',
    })
    expect(next.fields[0]).toEqual(createField('singleLineText', 'new'))
  })
})

describe('selectField and setTitle', () => {
  test('selects and clears the selection', () => {
    const selected = reduce(stateWith(['a']), { type: 'selectField', fieldId: 'a' })
    expect(selected.selectedFieldId).toBe('a')
    const cleared = reduce(selected, { type: 'selectField', fieldId: null })
    expect(cleared.selectedFieldId).toBeNull()
  })

  test('sets the title', () => {
    expect(reduce(stateWith([]), { type: 'setTitle', title: 'Intake' }).title).toBe(
      'Intake',
    )
  })
})

describe('updateField', () => {
  test('replaces only the field with the same id', () => {
    const state = stateWith(['a', 'b'])
    const renamed = { ...state.fields[1], label: 'Email' }
    const next = reduce(state, { type: 'updateField', field: renamed })
    expect(next.fields[1].label).toBe('Email')
    expect(next.fields[0]).toBe(state.fields[0])
  })

  test('an unknown id changes nothing', () => {
    const state = stateWith(['a'])
    const stranger = createField('singleLineText', 'zzz')
    expect(reduce(state, { type: 'updateField', field: stranger })).toBe(state)
  })
})

describe('moveField', () => {
  test('moves a field to its final index and keeps the selection', () => {
    const next = reduce(stateWith(['a', 'b', 'c'], 'a'), {
      type: 'moveField',
      fieldId: 'a',
      toIndex: 2,
    })
    expect(ids(next)).toEqual(['b', 'c', 'a'])
    expect(next.selectedFieldId).toBe('a')
  })

  test('moving up past the top, or down past the bottom, is a no-op', () => {
    const state = stateWith(['a', 'b'])
    expect(reduce(state, { type: 'moveField', fieldId: 'a', toIndex: -1 })).toBe(state)
    expect(reduce(state, { type: 'moveField', fieldId: 'b', toIndex: 2 })).toBe(state)
  })
})

describe('finalIndexForDrop', () => {
  test('dropping below the original position accounts for the removed field', () => {
    // [a, b, c]: drag a, drop between b and c (insertion index 2) → a ends at index 1
    expect(finalIndexForDrop(0, 2)).toBe(1)
  })

  test('dropping above the original position keeps the insertion index', () => {
    expect(finalIndexForDrop(2, 0)).toBe(0)
  })

  test('dropping right next to itself keeps it in place', () => {
    expect(finalIndexForDrop(1, 1)).toBe(1)
    expect(finalIndexForDrop(1, 2)).toBe(1)
  })
})

describe('deleteField', () => {
  test('removes the field; selection moves to the next field', () => {
    const next = reduce(stateWith(['a', 'b', 'c'], 'b'), {
      type: 'deleteField',
      fieldId: 'b',
    })
    expect(ids(next)).toEqual(['a', 'c'])
    expect(next.selectedFieldId).toBe('c')
  })

  test('deleting the last selected field selects the previous one, then none', () => {
    const afterFirst = reduce(stateWith(['a', 'b'], 'b'), {
      type: 'deleteField',
      fieldId: 'b',
    })
    expect(afterFirst.selectedFieldId).toBe('a')
    const afterSecond = reduce(afterFirst, { type: 'deleteField', fieldId: 'a' })
    expect(afterSecond.selectedFieldId).toBeNull()
  })

  test('deleting a field that is not selected keeps the selection', () => {
    const next = reduce(stateWith(['a', 'b'], 'a'), { type: 'deleteField', fieldId: 'b' })
    expect(next.selectedFieldId).toBe('a')
  })
})

describe('cascades (spec edge cases)', () => {
  test('deleting a field also removes rules that target it, in one action', () => {
    const state: BuilderState = {
      title: 'Form',
      fields: [ruleField('a'), ruleField('b', { hideWhen: [whenText('a', 'x')] })],
      selectedFieldId: 'a',
    }
    const next = reduce(state, { type: 'deleteField', fieldId: 'a' })
    expect(ids(next)).toEqual(['b'])
    expect(next.fields[0].visibility.conditions).toEqual([])
  })

  test('removing an option used by a single select rule removes that rule', () => {
    const colour = createField('singleSelect', 'colour')
    if (colour.type !== 'singleSelect') {
      throw new Error('expected a single select')
    }
    const withOptions = {
      ...colour,
      config: {
        ...colour.config,
        options: [
          { id: 'red', label: 'Red' },
          { id: 'blue', label: 'Blue' },
        ],
      },
    }
    const rule = {
      id: 'r',
      targetId: 'colour',
      kind: 'singleSelect',
      operator: 'equals',
      value: 'red',
    } as const
    const state: BuilderState = {
      title: 'Form',
      fields: [withOptions, ruleField('x', { hideWhen: [rule] })],
      selectedFieldId: 'colour',
    }
    const withoutRed = {
      ...withOptions,
      config: { ...withOptions.config, options: [{ id: 'blue', label: 'Blue' }] },
    }
    const next = reduce(state, { type: 'updateField', field: withoutRed })
    expect(next.fields[1].visibility.conditions).toEqual([])
  })
})
