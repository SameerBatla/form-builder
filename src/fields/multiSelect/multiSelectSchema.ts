import { z } from 'zod'
import { inputFieldBaseSchema, optionSchema } from '../fieldBase'

export const multiSelectConfigSchema = z.object({
  options: z.array(optionSchema),
  minSelections: z.number().int().nonnegative().nullable(),
  maxSelections: z.number().int().positive().nullable(),
})
export type MultiSelectConfig = z.infer<typeof multiSelectConfigSchema>

/** The chosen option ids, in the options' order. */
export const multiSelectValueSchema = z.array(z.string())
export type MultiSelectValue = z.infer<typeof multiSelectValueSchema>

export const multiSelectFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('multiSelect'),
  config: multiSelectConfigSchema,
})
export type MultiSelectField = z.infer<typeof multiSelectFieldSchema>
