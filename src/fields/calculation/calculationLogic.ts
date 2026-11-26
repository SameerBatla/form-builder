import { calculationValueSchema } from './calculationSchema'
import { formatNumber, roundToDecimals } from '../../lib/numbers'
import { createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'
import type { CalculationAggregation } from './calculationSchema'

export const calculationDefinition: FieldDefinition<'calculation'> = {
  type: 'calculation',
  displayName: 'Calculation',
  valueSchema: calculationValueSchema,
  capturesValue: true,
  createField: (id) => {
    return {
      id,
      type: 'calculation',
      label: 'Calculation',
      config: { sourceFieldIds: [], aggregation: 'sum', decimalPlaces: 2 },
      visibility: createDefaultVisibility(),
    }
  },
  initialValue: () => null,
  validateConfig: (field) =>
    field.config.sourceFieldIds.length === 0
      ? ['Choose at least one Number field to calculate from.']
      : [],
  formatForExport: (field, value) => ({
    kind: 'answer',
    lines: value === null ? [] : [formatNumber(value, field.config.decimalPlaces)],
  }),
  isEmpty: (value) => value === null,
  validateValue: () => null,
  /*
   * Spec Q13/Q14: only visible, non-empty sources count. Untouched fields are
   * skipped rather than read as 0, so "Average" and "Minimum" stay meaningful.
   */
  computeValue: (field, getField) => {
    const numbers: number[] = []
    for (const sourceId of field.config.sourceFieldIds) {
      const source = getField(sourceId)
      if (
        source &&
        source.isVisible &&
        !source.isEmpty &&
        typeof source.value === 'number'
      ) {
        numbers.push(source.value)
      }
    }
    return aggregate(numbers, field.config.aggregation, field.config.decimalPlaces)
  },
  referencedFieldIds: (field) => field.config.sourceFieldIds,
  removeFieldReference: (field, removedId) => ({
    ...field,
    config: {
      ...field.config,
      sourceFieldIds: field.config.sourceFieldIds.filter((id) => id !== removedId),
    },
  }),
}

/** Sum, average, minimum or maximum, rounded. No numbers → null (shown as "—"). */
export function aggregate(
  numbers: number[],
  aggregation: CalculationAggregation,
  decimalPlaces: number,
): number | null {
  if (numbers.length === 0) {
    return null
  }
  let result: number
  if (aggregation === 'sum') {
    result = numbers.reduce((total, value) => total + value, 0)
  } else if (aggregation === 'average') {
    result = numbers.reduce((total, value) => total + value, 0) / numbers.length
  } else if (aggregation === 'min') {
    result = Math.min(...numbers)
  } else {
    result = Math.max(...numbers)
  }
  return roundToDecimals(result, decimalPlaces)
}
