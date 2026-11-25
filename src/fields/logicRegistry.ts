import type { ConditionKind } from './conditionSchema'
import type { FieldId, Option } from './fieldBase'
import { validateFieldBase } from './fieldBase'
import type { Field, FieldType, FieldValue } from './fieldUnion'
import type { FieldDefinition, ResolvedField } from './logicTypes'
import { calculationDefinition } from './calculation/calculationLogic'
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
  calculation: calculationDefinition,
}

// Object.keys is always typed string[]; the mapped type above guarantees these are FieldTypes.
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

/** Empty when the field can't be a rule target (Section Header, File Upload, Calculation). */
export function getConditionKinds(field: Field): ConditionKind[] {
  return getFieldDefinition(field.type).conditionKinds ?? []
}

export function getFieldOptions(field: Field): Option[] {
  return getFieldDefinition(field.type).getOptions?.(field) ?? []
}

export function getReferencedFieldIds(field: Field): FieldId[] {
  return getFieldDefinition(field.type).referencedFieldIds?.(field) ?? []
}

export function removeConfigReference(field: Field, removedId: FieldId): Field {
  return getFieldDefinition(field.type).removeFieldReference?.(field, removedId) ?? field
}

/** The computed value for derived fields; undefined for fields the user fills in. */
export function computeFieldValue(
  field: Field,
  getField: (id: FieldId) => ResolvedField | null,
): FieldValue | undefined {
  return getFieldDefinition(field.type).computeValue?.(field, getField)
}

/** Derived fields (Calculation) have no typed value; the engine computes it. */
export function isComputedField(field: Field): boolean {
  return getFieldDefinition(field.type).computeValue !== undefined
}

export function isCalculationSource(field: Field): boolean {
  return getFieldDefinition(field.type).isCalculationSource ?? false
}

export function capturesValue(field: Field): boolean {
  return getFieldDefinition(field.type).capturesValue
}

export function getValueError(field: Field, value: FieldValue): string | null {
  return getFieldDefinition(field.type).validateValue(field, value)
}
