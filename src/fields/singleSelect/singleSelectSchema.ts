import { z } from 'zod'
import { inputFieldBaseSchema, optionSchema } from '../fieldBase'

export const singleSelectDisplaySchema = z.enum(['radio', 'dropdown', 'tiles'])
export type SingleSelectDisplay = z.infer<typeof singleSelectDisplaySchema>

export const singleSelectConfigSchema = z.object({
  options: z.array(optionSchema),
  display: singleSelectDisplaySchema,
})
export type SingleSelectConfig = z.infer<typeof singleSelectConfigSchema>

/** The chosen option's id. */
export const singleSelectValueSchema = z.string().nullable()
export type SingleSelectValue = z.infer<typeof singleSelectValueSchema>

export const singleSelectFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('singleSelect'),
  config: singleSelectConfigSchema,
})
export type SingleSelectField = z.infer<typeof singleSelectFieldSchema>
