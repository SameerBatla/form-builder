import { loadResponses } from './responseStore'
import { loadTemplates } from './templateStore'

/** Templates and responses present in storage that the app can't load. */
export function countUnloadableRecords(): number {
  return loadTemplates().skippedCount + loadResponses().skippedCount
}
