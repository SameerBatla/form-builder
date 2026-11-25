import { readCollection, removeRecord, writeRecord } from './collectionStore'
import type { FormResponse } from './schema'
import { formResponseSchema, RESPONSES_KEY } from './schema'

export function loadResponses(): { responses: FormResponse[]; skippedCount: number } {
  const { records, skippedCount } = readCollection(RESPONSES_KEY, formResponseSchema)
  return { responses: records, skippedCount }
}

export function loadResponsesForTemplate(templateId: string): FormResponse[] {
  return loadResponses().responses.filter(
    (response) => response.templateId === templateId,
  )
}

export function sortByNewest(responses: FormResponse[]): FormResponse[] {
  return responses.toSorted((first, second) =>
    second.submittedAt.localeCompare(first.submittedAt),
  )
}

export function countResponsesByTemplate(responses: FormResponse[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const response of responses) {
    counts.set(response.templateId, (counts.get(response.templateId) ?? 0) + 1)
  }
  return counts
}

export function saveResponse(response: FormResponse) {
  writeRecord(RESPONSES_KEY, response)
}

export function deleteResponse(id: string) {
  removeRecord(RESPONSES_KEY, id)
}
