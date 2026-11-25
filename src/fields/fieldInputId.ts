import type { FieldId } from './fieldBase'

/** The id of a field's (first) input, e.g. to focus the first invalid field. */
export function fieldInputId(idPrefix: string, fieldId: FieldId): string {
  return `${idPrefix}-${fieldId}`
}
