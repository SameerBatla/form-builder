import type { FieldId } from './fieldBase'
import { validateFieldBase } from './fieldBase'
import type { Field, FieldType, FieldValue } from './fieldUnion'
import type { FieldDefinition } from './logicTypes'
import { sectionHeaderDefinition } from './sectionHeader/sectionHeaderLogic'
import { fileUploadDefinition } from './fileUpload/fileUploadLogic'
import { multiSelectDefinition } from './multiSelect/multiSelectLogic'
import { singleSelectDefinition } from './singleSelect/singleSelectLogic'
import { dateDefinition } from './date/dateLogic'
import { numberDefinition } from './number/numberLogic'
import { multiLineTextDefinition } from './multiLineText/multiLineTextLogic'
import { singleLineTextDefinition } from './singleLineText/singleLineTextLogic'

// The mapped type makes a missing definition a compile error. Order = palette order.
export const fieldDefinitions: { [T in FieldType]: FieldDefinition<T> } = {
  singleLineText: singleLineTextDefinition,
  multiLineText: multiLineTextDefinition,
  number: numberDefinition,
  date: dateDefinition,
  singleSelect: singleSelectDefinition,
  multiSelect: multiSelectDefinition,
  fileUpload: fileUploadDefinition,
  sectionHeader: sectionHeaderDefinition,
}

export const fieldTypes = Object.keys(fieldDefinitions) as FieldType[]

/** For untrusted strings (e.g. drag data). */
export function isFieldType(value: string): value is FieldType {
  return fieldTypes.some((type) => type === value)
}

/*
 * TypeScript can't see that `fieldDefinitions[field.type]` and `field` belong to
 * the same type (a "correlated union"), so this lookup has the one cast. The
 * mapped type above already guarantees each type's definition matches its fields.
 */
export function getFieldDefinition(type: FieldType): FieldDefinition<FieldType> {
  return fieldDefinitions[type] as FieldDefinition<FieldType>
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

export function isValueEmpty(field: Field, value: FieldValue): boolean {
  return getFieldDefinition(field.type).isEmpty(value)
}

/** The value as used and stored (e.g. Number rounded to its decimal places). */
export function normalizeValue(field: Field, value: FieldValue): FieldValue {
  const definition = getFieldDefinition(field.type)
  return definition.normalizeValue ? definition.normalizeValue(field, value) : value
}

export function capturesValue(field: Field): boolean {
  return getFieldDefinition(field.type).capturesValue
}

export function getValueError(field: Field, value: FieldValue): string | null {
  return getFieldDefinition(field.type).validateValue(field, value)
}
