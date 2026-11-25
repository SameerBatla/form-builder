import type { FieldId } from './fieldBase'
import type { FieldOfType, FieldType, FieldValueOf } from './fieldUnion'

/**
 * The contract every field type implements. Builder, fill, engine and export ask
 * the registry for these instead of switching on `field.type`.
 * Members are added as features need them.
 */
export interface FieldDefinition<T extends FieldType> {
  type: T
  /** Shown in the palette and used as a new field's default label. */
  displayName: string
  createField: (id: FieldId) => FieldOfType<T>
  /** The value a new response starts with. `today` is a local YYYY-MM-DD date. */
  initialValue: (field: FieldOfType<T>, today: string) => FieldValueOf<T>
  /** Builder-side problems with this field's settings (label is checked separately). */
  validateConfig: (field: FieldOfType<T>) => string[]
  /** "No answer". Required checks and "—" in exports are based on this. */
  isEmpty: (value: FieldValueOf<T>) => boolean
  /** Fill-time rules for a non-empty value. Required is checked by the engine, not here. */
  validateValue: (field: FieldOfType<T>, value: FieldValueOf<T>) => string | null
}
