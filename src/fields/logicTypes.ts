import type { FieldId } from './fieldBase'
import type { FieldOfType, FieldType } from './fieldUnion'

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
}
