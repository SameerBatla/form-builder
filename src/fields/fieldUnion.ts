import { z } from 'zod'
import type { CalculationValue } from './calculation/calculationSchema'
import {
  calculationFieldSchema,
  calculationValueSchema,
} from './calculation/calculationSchema'
import type { RequiredRules } from './fieldBase'
import type { SectionHeaderValue } from './sectionHeader/sectionHeaderSchema'
import {
  sectionHeaderFieldSchema,
  sectionHeaderValueSchema,
} from './sectionHeader/sectionHeaderSchema'
import type { FileUploadValue } from './fileUpload/fileUploadSchema'
import {
  fileUploadFieldSchema,
  fileUploadValueSchema,
} from './fileUpload/fileUploadSchema'
import type { MultiSelectValue } from './multiSelect/multiSelectSchema'
import {
  multiSelectFieldSchema,
  multiSelectValueSchema,
} from './multiSelect/multiSelectSchema'
import type { SingleSelectValue } from './singleSelect/singleSelectSchema'
import {
  singleSelectFieldSchema,
  singleSelectValueSchema,
} from './singleSelect/singleSelectSchema'
import type { DateValue } from './date/dateSchema'
import { dateFieldSchema, dateValueSchema } from './date/dateSchema'
import type { NumberValue } from './number/numberSchema'
import { numberFieldSchema, numberValueSchema } from './number/numberSchema'
import type { MultiLineTextValue } from './multiLineText/multiLineTextSchema'
import {
  multiLineTextFieldSchema,
  multiLineTextValueSchema,
} from './multiLineText/multiLineTextSchema'
import type { SingleLineTextValue } from './singleLineText/singleLineTextSchema'
import {
  singleLineTextFieldSchema,
  singleLineTextValueSchema,
} from './singleLineText/singleLineTextSchema'

// Adding a field type: add it to the two lists and to FieldValueMap below.
export const fieldSchema = z.discriminatedUnion('type', [
  calculationFieldSchema,
  sectionHeaderFieldSchema,
  fileUploadFieldSchema,
  multiSelectFieldSchema,
  singleSelectFieldSchema,
  dateFieldSchema,
  numberFieldSchema,
  singleLineTextFieldSchema,
  multiLineTextFieldSchema,
])
export const fieldValueSchema = z.union([
  calculationValueSchema,
  sectionHeaderValueSchema,
  fileUploadValueSchema,
  multiSelectValueSchema,
  singleSelectValueSchema,
  dateValueSchema,
  numberValueSchema,
  singleLineTextValueSchema,
  multiLineTextValueSchema,
])

export type Field = z.infer<typeof fieldSchema>
export type FieldType = Field['type']
export type FieldOfType<T extends FieldType> = Extract<Field, { type: T }>
export type FieldValue = z.infer<typeof fieldValueSchema>

/** The value each field type holds while filling. Indexing by FieldType forces an entry per type. */
export interface FieldValueMap {
  calculation: CalculationValue
  sectionHeader: SectionHeaderValue
  fileUpload: FileUploadValue
  multiSelect: MultiSelectValue
  singleSelect: SingleSelectValue
  date: DateValue
  number: NumberValue
  singleLineText: SingleLineTextValue
  multiLineText: MultiLineTextValue
}
export type FieldValueOf<T extends FieldType> = FieldValueMap[T]

/** Display-only fields (e.g. Section Header) have no required rules at all. */
export function getRequiredRules(field: Field): RequiredRules | null {
  return 'required' in field ? field.required : null
}
