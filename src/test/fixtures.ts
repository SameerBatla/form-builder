import { createField } from '../fields/logicRegistry'
import type { FormResponse, Template } from '../storage/schema'

/** A valid template with a single text field `<id>-name`. */
export function buildTemplate(id: string, overrides: Partial<Template> = {}): Template {
  return {
    id,
    title: `Template ${id}`,
    fields: [createField('singleLineText', `${id}-name`)],
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-21T10:00:00.000Z',
    ...overrides,
  }
}

/** A response to `template`, answering its first field with "Jane". */
export function buildResponse(id: string, template: Template): FormResponse {
  const firstFieldId = template.fields[0].id
  return {
    id,
    templateId: template.id,
    submittedAt: '2026-11-22T10:00:00.000Z',
    form: { title: template.title, fields: template.fields },
    visibleFieldIds: [firstFieldId],
    values: { [firstFieldId]: 'Jane' },
  }
}
