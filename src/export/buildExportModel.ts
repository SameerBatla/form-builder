import type { FieldId } from '../fields/fieldBase'
import { formatValueForExport } from '../fields/logicRegistry'
import type { ExportContent } from '../fields/logicTypes'
import type { FormResponse } from '../storage/schema'

export type ExportItem =
  | {
      kind: 'heading'
      id: FieldId
      text: string
      size: Extract<ExportContent, { kind: 'heading' }>['size']
    }
  | { kind: 'answer'; id: FieldId; label: string; lines: string[]; note?: string }

/** Everything the PDF and the in-app response view show, already formatted. */
export interface ExportModel {
  title: string
  /** ISO timestamp; the renderer formats it. */
  submittedAt: string
  /** First 8 characters of the response id, uppercased: a human-friendly reference. */
  responseNumber: string
  items: ExportItem[]
}

/**
 * Built only from the response itself: its own copy of the form and the ids
 * that were visible at submit. Hidden fields therefore can't reach the export,
 * and later template edits can't change it.
 */
export function buildExportModel(response: FormResponse): ExportModel {
  const visibleIds = new Set(response.visibleFieldIds)
  const items: ExportItem[] = []
  for (const field of response.form.fields) {
    if (!visibleIds.has(field.id)) {
      continue
    }
    const content = formatValueForExport(field, response.values[field.id])
    const label = field.label.trim() || 'Untitled field'
    if (content.kind === 'heading') {
      items.push({ kind: 'heading', id: field.id, text: label, size: content.size })
    } else {
      items.push({
        kind: 'answer',
        id: field.id,
        label,
        lines: content.lines,
        note: content.note,
      })
    }
  }
  return {
    title: response.form.title,
    submittedAt: response.submittedAt,
    responseNumber: response.id.slice(0, 8).toUpperCase(),
    items,
  }
}

/** "Jane Doe · jane@example.com": helps tell responses apart in the list. */
export function getAnswerPreview(model: ExportModel, count = 2): string | null {
  const answers: string[] = []
  for (const item of model.items) {
    if (item.kind === 'answer' && item.lines.length > 0) {
      // Multi-line answers read as one sentence in the one-line preview.
      answers.push(item.lines.join(' '))
    }
    if (answers.length === count) {
      break
    }
  }
  return answers.length > 0 ? answers.join(' · ') : null
}
