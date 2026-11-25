import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { getRequiredRules } from '../fields/fieldUnion'
import { getConfigIssues } from '../fields/logicRegistry'
import { validateCondition } from './conditionBuilder'
import { findDependencyCycle } from './dependencies'

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

  // The rule editor never offers a looping target; this guards hand-edited data.
  const loopingIds = findDependencyCycle(form.fields)
  if (loopingIds) {
    const labels = form.fields
      .filter((field) => loopingIds.includes(field.id))
      .map((field) => field.label.trim() || 'Untitled field')
    formIssues.push(
      `These fields’ rules depend on each other in a loop: ${labels.join(', ')}.`,
    )
  }

  const fieldIssues: Record<FieldId, string[]> = {}
  for (const field of form.fields) {
    const conditions = [
      ...field.visibility.conditions,
      ...(getRequiredRules(field)?.conditions ?? []),
    ]
    const issues = [
      ...getConfigIssues(field),
      ...conditions.flatMap((condition) =>
        validateCondition(condition, form.fields, field.id),
      ),
    ]
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
