import { z } from 'zod'
import { inputFieldBaseSchema } from '../fieldBase'

export const numberConfigSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  decimalPlaces: z.number().int().min(0).max(4),
  prefix: z.string(),
  suffix: z.string(),
})
export type NumberConfig = z.infer<typeof numberConfigSchema>

export const numberValueSchema = z.number().nullable()
export type NumberValue = z.infer<typeof numberValueSchema>

export const numberFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('number'),
  config: numberConfigSchema,
})
export type NumberField = z.infer<typeof numberFieldSchema>
