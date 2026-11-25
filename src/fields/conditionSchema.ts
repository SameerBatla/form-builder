import { z } from 'zod'

/*
 * A condition compares one target field's value against a fixed value.
 * `kind` is the operator family, decided by the target's field type when the
 * condition is created. Each kind has its own operators and value shape, so an
 * impossible pair (e.g. 'contains' with a number) can't be represented.
 */

const conditionBase = z.object({
  id: z.string().min(1),
  targetId: z.string().min(1),
})

export const textConditionSchema = conditionBase.extend({
  kind: z.literal('text'),
  operator: z.enum(['equals', 'notEquals', 'contains']),
  value: z.string(),
})

export const numberConditionSchema = conditionBase.extend({
  kind: z.literal('number'),
  operator: z.enum(['equals', 'greaterThan', 'lessThan']),
  value: z.number(),
})

// Separate kind because its value is a range, not a single number.
export const numberRangeConditionSchema = conditionBase.extend({
  kind: z.literal('numberRange'),
  operator: z.literal('withinRange'),
  value: z.object({ min: z.number(), max: z.number() }),
})

export const singleSelectConditionSchema = conditionBase.extend({
  kind: z.literal('singleSelect'),
  operator: z.enum(['equals', 'notEquals']),
  value: z.string(), // option id
})

export const multiSelectConditionSchema = conditionBase.extend({
  kind: z.literal('multiSelect'),
  operator: z.enum(['containsAny', 'containsAll', 'containsNone']),
  value: z.array(z.string()), // option ids
})

export const dateConditionSchema = conditionBase.extend({
  kind: z.literal('date'),
  operator: z.enum(['equals', 'before', 'after']),
  value: z.iso.date(), // YYYY-MM-DD
})

export const conditionSchema = z.discriminatedUnion('kind', [
  textConditionSchema,
  numberConditionSchema,
  numberRangeConditionSchema,
  singleSelectConditionSchema,
  multiSelectConditionSchema,
  dateConditionSchema,
])

export type Condition = z.infer<typeof conditionSchema>
export type ConditionKind = Condition['kind']
