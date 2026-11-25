import type { ConditionKind } from './conditionSchema'
import type { FieldId, Option } from './fieldBase'
import type { FieldOfType, FieldType, FieldValue, FieldValueOf } from './fieldUnion'

/** What one field can see of another, after that other field was evaluated. */
export interface ResolvedField {
  isVisible: boolean
  isEmpty: boolean
  value: FieldValue
}

/**
 * The contract every field type implements. Builder, fill, engine and export ask
 * the registry for these instead of switching on `field.type`.
 */
export interface FieldDefinition<T extends FieldType> {
  type: T
  /** Shown in the palette and used as a new field's default label. */
  displayName: string
  /** False for display-only fields (Section Header): nothing is stored for them. */
  capturesValue: boolean
  createField(id: FieldId): FieldOfType<T>
  /** The value a new response starts with. `today` is a local YYYY-MM-DD date. */
  initialValue(field: FieldOfType<T>, today: string): FieldValueOf<T>
  /** Builder-side problems with this field's settings (label is checked separately). */
  validateConfig(field: FieldOfType<T>): string[]
  /** "No answer". Required checks and "—" in exports are based on this. */
  isEmpty(value: FieldValueOf<T>): boolean
  /** Fill-time rules for a non-empty value. Required is checked by the engine, not here. */
  validateValue(field: FieldOfType<T>, value: FieldValueOf<T>): string | null
  /** Operator families other fields can use when this field is a rule target. None → not a target. */
  conditionKinds?: ConditionKind[]
  /** Select types: their options, for rule values and option clean-up. */
  getOptions?(field: FieldOfType<T>): Option[]
  /** Number fields set this: they can be Calculation sources (Calculations can't). */
  isCalculationSource?: boolean
  /**
   * Derived fields (Calculation) compute their value from other fields instead of
   * user input. `getField` returns null for a missing field.
   */
  computeValue?(
    field: FieldOfType<T>,
    getField: (id: FieldId) => ResolvedField | null,
  ): FieldValueOf<T>
  /** Other fields this field's own config reads (e.g. Calculation sources). Rules are separate. */
  referencedFieldIds?(field: FieldOfType<T>): FieldId[]
  /** Drop a deleted field from this field's own config (e.g. a Calculation source). */
  removeFieldReference?(field: FieldOfType<T>, removedId: FieldId): FieldOfType<T>
  /** Optional clean-up before a value is used or stored (e.g. Number rounding). */
  normalizeValue?(field: FieldOfType<T>, value: FieldValueOf<T>): FieldValueOf<T>
}
