import { createId } from '../lib/id'
import { readCollection, writeRecord } from './collectionStore'
import type { Template } from './schema'
import { TEMPLATES_KEY, templateSchema } from './schema'

export function loadTemplates(): { templates: Template[]; skippedCount: number } {
  const { records, skippedCount } = readCollection(TEMPLATES_KEY, templateSchema)
  return { templates: records, skippedCount }
}

export function loadTemplate(id: string): Template | null {
  const { templates } = loadTemplates()
  return templates.find((template) => template.id === id) ?? null
}

export function saveTemplate(template: Template) {
  writeRecord(TEMPLATES_KEY, template)
}

export function sortByLastEdited(templates: Template[]): Template[] {
  return templates.toSorted((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  )
}

/** A new, unsaved template. It is only written to storage on the first Save. */
export function createBlankTemplate(now: Date = new Date()): Template {
  const timestamp = now.toISOString()
  return {
    id: createId(),
    title: 'Untitled form',
    fields: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
