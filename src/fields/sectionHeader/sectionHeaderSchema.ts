import { z } from 'zod'
import { displayFieldBaseSchema } from '../fieldBase'

export const sectionHeaderSizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])
export type SectionHeaderSize = z.infer<typeof sectionHeaderSizeSchema>

export const sectionHeaderConfigSchema = z.object({ size: sectionHeaderSizeSchema })
export type SectionHeaderConfig = z.infer<typeof sectionHeaderConfigSchema>

/** Display only: there is no answer. */
export const sectionHeaderValueSchema = z.null()
export type SectionHeaderValue = z.infer<typeof sectionHeaderValueSchema>

export const sectionHeaderFieldSchema = displayFieldBaseSchema.extend({
  type: z.literal('sectionHeader'),
  config: sectionHeaderConfigSchema,
})
export type SectionHeaderField = z.infer<typeof sectionHeaderFieldSchema>
