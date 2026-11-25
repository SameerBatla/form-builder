import type { CalculationAggregation } from './calculationSchema'

export const aggregationLabels: Record<CalculationAggregation, string> = {
  sum: 'Sum',
  average: 'Average',
  min: 'Minimum',
  max: 'Maximum',
}
