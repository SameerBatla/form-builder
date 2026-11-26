import type { z } from 'zod'

/*
 * Each localStorage key holds an object of `id → record`.
 * Records are validated one by one, so one bad record never hides the others.
 * Writes touch only the record being changed: invalid records stay in storage
 * exactly as they were (we never delete data we don't understand).
 */

type RawCollection = Record<string, unknown>

interface ReadResult<T> {
  records: T[]
  skippedCount: number
}

function isPlainObject(value: unknown): value is RawCollection {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `null` means the key holds something that isn't a JSON object. */
function readRaw(key: string): RawCollection | null {
  const text = localStorage.getItem(key)
  if (text === null) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(text)
    return isPlainObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function readCollection<Schema extends z.ZodType<{ id: string }>>(
  key: string,
  schema: Schema,
): ReadResult<z.infer<Schema>> {
  const raw = readRaw(key)
  if (raw === null) {
    return { records: [], skippedCount: 1 }
  }

  const records: z.infer<Schema>[] = []
  let skippedCount = 0
  for (const [id, value] of Object.entries(raw)) {
    const result = schema.safeParse(value)
    if (result.success && result.data.id === id) {
      records.push(result.data)
    } else {
      skippedCount += 1
    }
  }
  return { records, skippedCount }
}

/**
 * Returns false when the browser refuses the write (usually because storage is
 * full), so callers can tell the user instead of failing silently.
 */
function writeRaw(key: string, update: (collection: RawCollection) => void): boolean {
  // A key that isn't a JSON object at all can't be partially kept: start fresh.
  const collection = readRaw(key) ?? {}
  update(collection)
  try {
    localStorage.setItem(key, JSON.stringify(collection))
    return true
  } catch {
    return false
  }
}

export function writeRecord(key: string, record: { id: string }): boolean {
  return writeRaw(key, (collection) => {
    collection[record.id] = record
  })
}

export function removeRecord(key: string, id: string): boolean {
  return writeRaw(key, (collection) => {
    delete collection[id]
  })
}
