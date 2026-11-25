import { z } from 'zod'
import { inputFieldBaseSchema } from '../fieldBase'

export const multiLineTextConfigSchema = z.object({
  placeholder: z.string(),
  minLength: z.number().int().nonnegative().nullable(),
  maxLength: z.number().int().positive().nullable(),
  rows: z.number().int().min(2).max(20),
})
export type MultiLineTextConfig = z.infer<typeof multiLineTextConfigSchema>

export const multiLineTextValueSchema = z.string()
export type MultiLineTextValue = z.infer<typeof multiLineTextValueSchema>

export const multiLineTextFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('multiLineText'),
  config: multiLineTextConfigSchema,
})
export type MultiLineTextField = z.infer<typeof multiLineTextFieldSchema>
