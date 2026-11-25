import { createId } from '../../lib/id'
import type { Option } from '../fieldBase'

/** Options get stable ids: answers and rules store the id, so renaming is always safe. */
export function createOption(label: string): Option {
  return { id: createId(), label }
}

/** Builder rules shared by Single Select and Multi Select. */
export function validateOptions(options: Option[]): string[] {
  if (options.length === 0) {
    return ['Add at least one option.']
  }
  const issues: string[] = []
  if (options.some((option) => option.label.trim() === '')) {
    issues.push('Every option needs a label.')
  }
  // Remember each label as first written, so the message names the original.
  const firstLabelByKey = new Map<string, string>()
  for (const option of options) {
    const key = option.label.trim().toLowerCase()
    if (key === '') {
      continue
    }
    const firstLabel = firstLabelByKey.get(key)
    if (firstLabel !== undefined) {
      issues.push(`Option labels must be unique ("${firstLabel}" appears twice).`)
      break
    }
    firstLabelByKey.set(key, option.label.trim())
  }
  return issues
}

export function findOptionLabel(options: Option[], optionId: string): string | null {
  return options.find((option) => option.id === optionId)?.label ?? null
}
