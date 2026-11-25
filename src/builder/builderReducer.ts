import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldType } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'

/*
 * A reducer (not several useStates) because most actions change the field list
 * and the selection together, e.g. deleting the selected field also moves the
 * selection. Ids are created by the caller so the reducer stays pure.
 */

export interface BuilderState {
  title: string
  fields: Field[]
  selectedFieldId: FieldId | null
}

export type BuilderAction =
  | { type: 'setTitle'; title: string }
  /** Without `index`, inserts below the selected field (or at the end). */
  | { type: 'addField'; fieldType: FieldType; fieldId: FieldId; index?: number }
  | { type: 'selectField'; fieldId: FieldId | null }
  | { type: 'updateField'; field: Field }
  /** `toIndex` is the field's final position. */
  | { type: 'moveField'; fieldId: FieldId; toIndex: number }
  | { type: 'deleteField'; fieldId: FieldId }

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'setTitle': {
      return { ...state, title: action.title }
    }

    case 'addField': {
      const newField = createField(action.fieldType, action.fieldId)
      const selectedIndex = state.fields.findIndex(
        (field) => field.id === state.selectedFieldId,
      )
      let insertAt = state.fields.length
      if (action.index !== undefined) {
        insertAt = action.index
      } else if (selectedIndex !== -1) {
        insertAt = selectedIndex + 1
      }
      const fields = state.fields.toSpliced(insertAt, 0, newField)
      return { ...state, fields, selectedFieldId: newField.id }
    }

    case 'selectField': {
      return { ...state, selectedFieldId: action.fieldId }
    }

    case 'updateField': {
      const index = state.fields.findIndex((field) => field.id === action.field.id)
      if (index === -1) {
        return state
      }
      return { ...state, fields: state.fields.with(index, action.field) }
    }

    case 'moveField': {
      const fromIndex = state.fields.findIndex((field) => field.id === action.fieldId)
      const isOutOfRange = action.toIndex < 0 || action.toIndex >= state.fields.length
      if (fromIndex === -1 || isOutOfRange || fromIndex === action.toIndex) {
        return state
      }
      const movedField = state.fields[fromIndex]
      const fields = state.fields
        .toSpliced(fromIndex, 1)
        .toSpliced(action.toIndex, 0, movedField)
      return { ...state, fields }
    }

    case 'deleteField': {
      const index = state.fields.findIndex((field) => field.id === action.fieldId)
      if (index === -1) {
        return state
      }
      const fields = state.fields.toSpliced(index, 1)
      let selectedFieldId = state.selectedFieldId
      if (selectedFieldId === action.fieldId) {
        // Keep the user's place: select the field that slid into this spot, else the one above.
        const neighbour = fields[index] ?? fields[index - 1]
        selectedFieldId = neighbour ? neighbour.id : null
      }
      return { ...state, fields, selectedFieldId }
    }
  }
}

/**
 * Drag-and-drop reports an insertion point in the current list ("between b and c").
 * Converts it to the final index: dropping below the field's own position counts one
 * less, because the field leaves its old slot first.
 */
export function finalIndexForDrop(fromIndex: number, insertionIndex: number): number {
  return insertionIndex > fromIndex ? insertionIndex - 1 : insertionIndex
}
