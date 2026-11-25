import { pluralize } from '../../lib/format'
import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'
import type { FileMeta, FileUploadConfig } from './fileUploadSchema'

const EXTENSION_PATTERN = /^\.[a-z0-9]+$/
const MIME_PATTERN = /^[a-z]+\/([a-z0-9.+-]+|\*)$/

export const fileUploadDefinition: FieldDefinition<'fileUpload'> = {
  type: 'fileUpload',
  displayName: 'File upload',
  capturesValue: true,
  createField: (id) => {
    return {
      id,
      type: 'fileUpload',
      label: 'File upload',
      config: { allowedTypes: [], maxFiles: 1 },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
  initialValue: () => [],
  validateConfig: (field) => {
    const { allowedTypes, maxFiles } = field.config
    const issues: string[] = []
    if (!Number.isInteger(maxFiles) || maxFiles < 1) {
      issues.push('Max files must be a whole number, 1 or more.')
    }
    for (const allowedType of allowedTypes) {
      if (!EXTENSION_PATTERN.test(allowedType) && !MIME_PATTERN.test(allowedType)) {
        issues.push(
          `"${allowedType}" isn’t a valid file type. Use an extension like .pdf or a type like image/*.`,
        )
      }
    }
    return issues
  },
  isEmpty: (value) => value.length === 0,
  validateValue: (field, value) => {
    const { allowedTypes, maxFiles } = field.config
    if (value.length > maxFiles) {
      return `Attach at most ${pluralize(maxFiles, 'file')}.`
    }
    const disallowed = value.find((file) => !isFileAllowed(file, allowedTypes))
    return disallowed ? `${disallowed.name} isn’t an allowed file type.` : null
  },
}

/** ".PDF, png, image/*" → [".pdf", ".png", "image/*"]. A bare word becomes an extension. */
export function parseAllowedTypes(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part !== '')
    .map((part) => (part.startsWith('.') || part.includes('/') ? part : `.${part}`))
}

export function isFileAllowed(
  file: Pick<FileMeta, 'name' | 'type'>,
  allowedTypes: string[],
): boolean {
  if (allowedTypes.length === 0) {
    return true
  }
  const name = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()
  return allowedTypes.some((allowedType) => {
    if (allowedType.startsWith('.')) {
      return name.endsWith(allowedType)
    }
    if (allowedType.endsWith('/*')) {
      return mimeType.startsWith(allowedType.slice(0, -1))
    }
    return mimeType === allowedType
  })
}

/** Adds what fits; explains everything that didn't. */
export function addFiles(
  current: FileMeta[],
  incoming: FileMeta[],
  config: FileUploadConfig,
): { files: FileMeta[]; rejections: string[] } {
  const files = [...current]
  const rejections: string[] = []
  for (const file of incoming) {
    if (!isFileAllowed(file, config.allowedTypes)) {
      rejections.push(`${file.name}: not an allowed file type`)
    } else if (files.length >= config.maxFiles) {
      rejections.push(
        `Only ${pluralize(config.maxFiles, 'file')} allowed, so ${file.name} wasn’t added`,
      )
    } else {
      files.push(file)
    }
  }
  return { files, rejections }
}
