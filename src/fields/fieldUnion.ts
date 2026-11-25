import { z } from 'zod'
import type { SingleLineTextValue } from './singleLineText/singleLineTextSchema'
import {
  singleLineTextFieldSchema,
  singleLineTextValueSchema,
} from './singleLineText/singleLineTextSchema'

// Adding a field type: add it to the two lists and to FieldValueMap below.
export const fieldSchema = z.discriminatedUnion('type', [singleLineTextFieldSchema])
export const fieldValueSchema = z.union([singleLineTextValueSchema])

export type Field = z.infer<typeof fieldSchema>
export type FieldType = Field['type']
export type FieldOfType<T extends FieldType> = Extract<Field, { type: T }>
export type FieldValue = z.infer<typeof fieldValueSchema>

/** The value each field type holds while filling. Indexing by FieldType forces an entry per type. */
export interface FieldValueMap {
  singleLineText: SingleLineTextValue
}
export type FieldValueOf<T extends FieldType> = FieldValueMap[T]
