import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { getConfigIssues } from '../fields/logicRegistry'

export interface TemplateIssues {
  /** Problems with the form as a whole (title, no fields). */
  formIssues: string[]
  /** Only fields that have problems appear here. */
  fieldIssues: Record<FieldId, string[]>
}

/** Everything that blocks Save in the builder. Stored templates always pass this. */
export function validateTemplate(form: {
  title: string
  fields: Field[]
}): TemplateIssues {
  const formIssues: string[] = []
  if (form.title.trim() === '') {
    formIssues.push('Give the form a title.')
  }
  if (form.fields.length === 0) {
    formIssues.push('Add at least one field.')
  }

  const fieldIssues: Record<FieldId, string[]> = {}
  for (const field of form.fields) {
    const issues = getConfigIssues(field)
    if (issues.length > 0) {
      fieldIssues[field.id] = issues
    }
  }
  return { formIssues, fieldIssues }
}

/** Form-level issues plus the number of fields that have issues. */
export function countIssues(issues: TemplateIssues): number {
  return issues.formIssues.length + Object.keys(issues.fieldIssues).length
}
