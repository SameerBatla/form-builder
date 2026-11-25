import { z } from 'zod'
import { inputFieldBaseSchema } from '../fieldBase'

// Dates are local calendar dates (YYYY-MM-DD) with no time zone, like <input type="date">.
export const dateConfigSchema = z.object({
  prefillToday: z.boolean(),
  minDate: z.iso.date().nullable(),
  maxDate: z.iso.date().nullable(),
})
export type DateConfig = z.infer<typeof dateConfigSchema>

export const dateValueSchema = z.iso.date().nullable()
export type DateValue = z.infer<typeof dateValueSchema>

export const dateFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('date'),
  config: dateConfigSchema,
})
export type DateField = z.infer<typeof dateFieldSchema>
