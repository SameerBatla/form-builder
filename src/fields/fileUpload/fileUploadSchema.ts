import { z } from 'zod'
import { inputFieldBaseSchema } from '../fieldBase'

export const fileUploadConfigSchema = z.object({
  /** Normalised extensions like ".pdf". Empty = any type. */
  allowedTypes: z.array(z.string()),
  maxFiles: z.number().int().positive(),
})
export type FileUploadConfig = z.infer<typeof fileUploadConfigSchema>

/** Metadata only: file contents are never stored (no server, limited localStorage). */
export const fileMetaSchema = z.object({
  name: z.string(),
  size: z.number().int().nonnegative(),
  type: z.string(),
})
export type FileMeta = z.infer<typeof fileMetaSchema>

export const fileUploadValueSchema = z.array(fileMetaSchema)
export type FileUploadValue = z.infer<typeof fileUploadValueSchema>

export const fileUploadFieldSchema = inputFieldBaseSchema.extend({
  type: z.literal('fileUpload'),
  config: fileUploadConfigSchema,
})
export type FileUploadField = z.infer<typeof fileUploadFieldSchema>
