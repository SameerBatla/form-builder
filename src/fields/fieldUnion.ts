import { z } from 'zod'
import {
  singleLineTextFieldSchema,
  singleLineTextValueSchema,
} from './singleLineText/singleLineTextSchema'

// Adding a field type: add its field schema and value schema to these lists.
export const fieldSchema = z.discriminatedUnion('type', [singleLineTextFieldSchema])
export const fieldValueSchema = z.union([singleLineTextValueSchema])

export type Field = z.infer<typeof fieldSchema>
export type FieldType = Field['type']
export type FieldOfType<T extends FieldType> = Extract<Field, { type: T }>
export type FieldValue = z.infer<typeof fieldValueSchema>
