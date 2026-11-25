import { z } from 'zod'
import { fieldIdSchema } from '../fields/fieldBase'
import { fieldSchema, fieldValueSchema } from '../fields/fieldUnion'

// The `v1` prefix leaves room for a migration if the stored shape ever changes.
export const TEMPLATES_KEY = 'formBuilder:v1:templates'
export const RESPONSES_KEY = 'formBuilder:v1:responses'

/** The form itself: what the builder edits and what a response freezes. */
export const formDefinitionSchema = z.object({
  title: z.string(),
  fields: z.array(fieldSchema),
})
export type FormDefinition = z.infer<typeof formDefinitionSchema>

export const templateSchema = formDefinitionSchema.extend({
  id: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type Template = z.infer<typeof templateSchema>

export const formResponseSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  submittedAt: z.iso.datetime(),
  // A full copy of the form at submit time, so later template edits never change it.
  form: formDefinitionSchema,
  // What the user saw at submit, in form order. Exports never re-run conditions.
  visibleFieldIds: z.array(fieldIdSchema),
  // Only visible fields that hold a value.
  values: z.record(fieldIdSchema, fieldValueSchema),
})
export type FormResponse = z.infer<typeof formResponseSchema>
