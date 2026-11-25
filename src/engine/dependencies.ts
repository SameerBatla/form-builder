import type { FieldId } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { getRequiredRules } from '../fields/fieldUnion'
import { getReferencedFieldIds } from '../fields/logicRegistry'

/** Every field this field reads: its rule targets plus config references (calculation sources). */
export function getDependencyIds(field: Field): FieldId[] {
  const conditions = [
    ...field.visibility.conditions,
    ...(getRequiredRules(field)?.conditions ?? []),
  ]
  const ids = new Set(conditions.map((condition) => condition.targetId))
  for (const id of getReferencedFieldIds(field)) {
    ids.add(id)
  }
  return [...ids]
}

/**
 * Topological order (Kahn's algorithm): a field comes after every field it
 * depends on, so evaluating in this order sees final target states. Ties keep
 * form order. Fields caught in a loop (only possible in hand-edited data) are
 * appended last in form order instead of throwing.
 */
export function orderByDependencies(fields: Field[]): Field[] {
  const knownIds = new Set(fields.map((field) => field.id))
  const remainingDeps = new Map<FieldId, Set<FieldId>>()
  for (const field of fields) {
    // Deleted targets are ignored: nothing to wait for.
    const deps = getDependencyIds(field).filter((id) => knownIds.has(id))
    remainingDeps.set(field.id, new Set(deps))
  }

  const ordered: Field[] = []
  const placed = new Set<FieldId>()
  let progressed = true
  while (progressed) {
    progressed = false
    // Scanning in form order each round keeps the result stable and readable.
    for (const field of fields) {
      if (placed.has(field.id)) {
        continue
      }
      const deps = remainingDeps.get(field.id) ?? new Set()
      const isReady = [...deps].every((id) => placed.has(id))
      if (isReady) {
        ordered.push(field)
        placed.add(field.id)
        progressed = true
      }
    }
  }

  const looping = fields.filter((field) => !placed.has(field.id))
  return [...ordered, ...looping]
}

/**
 * Fields that are part of a loop (in form order), or null. A field is in a loop
 * when something it depends on depends back on it. Fields that merely sit
 * downstream of a loop are not listed.
 */
export function findDependencyCycle(fields: Field[]): FieldId[] | null {
  const looping = fields
    .filter((field) =>
      getDependencyIds(field).some((dependencyId) =>
        dependsOn(fields, dependencyId, field.id),
      ),
    )
    .map((field) => field.id)
  return looping.length > 0 ? looping : null
}

/** Does `fieldId` read `otherId`, directly or through a chain? A field depends on itself. */
export function dependsOn(fields: Field[], fieldId: FieldId, otherId: FieldId): boolean {
  const fieldsById = new Map(fields.map((field) => [field.id, field]))
  const toVisit = [fieldId]
  const visited = new Set<FieldId>()
  while (toVisit.length > 0) {
    const currentId = toVisit.pop()
    if (currentId === undefined || visited.has(currentId)) {
      continue
    }
    if (currentId === otherId) {
      return true
    }
    visited.add(currentId)
    const current = fieldsById.get(currentId)
    if (current) {
      toVisit.push(...getDependencyIds(current))
    }
  }
  return false
}
