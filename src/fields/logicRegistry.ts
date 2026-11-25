import type { FieldId } from './fieldBase'
import { validateFieldBase } from './fieldBase'
import type { Field, FieldType, FieldValue } from './fieldUnion'
import type { FieldDefinition } from './logicTypes'
import { singleLineTextDefinition } from './singleLineText/singleLineTextLogic'

// The mapped type makes a missing definition a compile error.
export const fieldDefinitions: { [T in FieldType]: FieldDefinition<T> } = {
  singleLineText: singleLineTextDefinition,
}

export const fieldTypes = Object.keys(fieldDefinitions) as FieldType[]

/** For untrusted strings (e.g. drag data). */
export function isFieldType(value: string): value is FieldType {
  return fieldTypes.some((type) => type === value)
}

export function getFieldDefinition(type: FieldType): FieldDefinition<FieldType> {
  return fieldDefinitions[type]
}

/*
 * Dispatchers: the only place that pairs "some field" with its type's definition.
 * Callers (builder, fill, engine, export) use these instead of switching on field.type.
 */

export function createField(type: FieldType, id: FieldId): Field {
  return getFieldDefinition(type).createField(id)
}

export function getInitialValue(field: Field, today: string): FieldValue {
  return getFieldDefinition(field.type).initialValue(field, today)
}

export function getConfigIssues(field: Field): string[] {
  return [
    ...validateFieldBase(field),
    ...getFieldDefinition(field.type).validateConfig(field),
  ]
}
