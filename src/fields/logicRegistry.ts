import type { FieldId } from './fieldBase'
import type { Field, FieldType } from './fieldUnion'
import type { FieldDefinition } from './logicTypes'
import { singleLineTextDefinition } from './singleLineText/singleLineTextLogic'

// The mapped type makes a missing definition a compile error.
export const fieldDefinitions: { [T in FieldType]: FieldDefinition<T> } = {
  singleLineText: singleLineTextDefinition,
}

export const fieldTypes = Object.keys(fieldDefinitions) as FieldType[]

export function getFieldDefinition(type: FieldType): FieldDefinition<FieldType> {
  return fieldDefinitions[type]
}

export function createField(type: FieldType, id: FieldId): Field {
  return getFieldDefinition(type).createField(id)
}
