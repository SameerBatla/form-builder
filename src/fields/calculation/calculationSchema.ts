import { z } from 'zod'
import { displayFieldBaseSchema, fieldIdSchema } from '../fieldBase'

export const calculationAggregationSchema = z.enum(['sum', 'average', 'min', 'max'])
export type CalculationAggregation = z.infer<typeof calculationAggregationSchema>

export const calculationConfigSchema = z.object({
  /** Number fields only (never another Calculation). */
  sourceFieldIds: z.array(fieldIdSchema),
  aggregation: calculationAggregationSchema,
  decimalPlaces: z.number().int().min(0).max(4),
})
export type CalculationConfig = z.infer<typeof calculationConfigSchema>

/** Computed, never typed: null when no source has a value. Stored computed in responses. */
export const calculationValueSchema = z.number().nullable()
export type CalculationValue = z.infer<typeof calculationValueSchema>

// Read-only, so it uses the display base: it can be hidden by rules but never required.
export const calculationFieldSchema = displayFieldBaseSchema.extend({
  type: z.literal('calculation'),
  config: calculationConfigSchema,
})
export type CalculationField = z.infer<typeof calculationFieldSchema>
