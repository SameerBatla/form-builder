import { z } from 'zod'
import { inputFieldBaseSchema } from '../fieldBase'

// `null` means "not set", so a limit of 0 stays distinguishable from no limit.
export const singleLineTextConfigSchema = z.object({
  placeholder: z.string(),
  minLength: z.number().int().nonnegative().nullable(),
  maxLength: z.number().int().positive().nullable(),
  prefix: z.string(),
  suffix: z.string(),
})
export type SingleLineTextConfig = z.infer<typeof singleLineTextConfigSchema>

export const singleLineTextValueSchema = z.string()
export type SingleLineTextValue = z.infer<typeof singleLineTextValueSchema>

export const singleLineTextFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('singleLineText'),
  config: singleLineTextConfigSchema,
})
export type SingleLineTextField = z.infer<typeof singleLineTextFieldSchema>
