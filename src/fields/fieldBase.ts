import { z } from 'zod'
import { conditionSchema } from './conditionSchema'

export const fieldIdSchema = z.string().min(1)
export type FieldId = z.infer<typeof fieldIdSchema>

export const optionSchema = z.object({ id: z.string().min(1), label: z.string() })
export type Option = z.infer<typeof optionSchema>

const matchSchema = z.enum(['all', 'any'])
export type RuleMatch = z.infer<typeof matchSchema>

/*
 * A rule group = a default state + conditions that flip it.
 * There is no per-condition effect: when the group matches, the state becomes the
 * opposite of `defaultState` (default hidden → "show when…"). Conflicting effects
 * therefore can't be represented.
 */
export const visibilityRulesSchema = z.object({
  defaultState: z.enum(['visible', 'hidden']),
  match: matchSchema,
  conditions: z.array(conditionSchema),
})
export type VisibilityRules = z.infer<typeof visibilityRulesSchema>

export const requiredRulesSchema = z.object({
  defaultState: z.enum(['required', 'optional']),
  match: matchSchema,
  conditions: z.array(conditionSchema),
})
export type RequiredRules = z.infer<typeof requiredRulesSchema>

/** Fields that never take input (Section Header, Calculation): visibility rules only. */
export const displayFieldBaseSchema = z.object({
  id: fieldIdSchema,
  label: z.string(),
  visibility: visibilityRulesSchema,
})

/** Fields that take input: they can also be required. */
export const inputFieldBaseSchema = displayFieldBaseSchema.extend({
  required: requiredRulesSchema,
})

export function createDefaultVisibility(): VisibilityRules {
  return { defaultState: 'visible', match: 'all', conditions: [] }
}

export function createDefaultRequiredRules(): RequiredRules {
  return { defaultState: 'optional', match: 'all', conditions: [] }
}

/** Config rules shared by every field type. */
export function validateFieldBase(field: { label: string }): string[] {
  return field.label.trim() === '' ? ['Label is required.'] : []
}
