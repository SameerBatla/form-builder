/** Min/max character length settings, shared by the text field types. */
export function validateLengthLimits(
  minLength: number | null,
  maxLength: number | null,
): string[] {
  const issues: string[] = []
  if (minLength !== null && (!Number.isInteger(minLength) || minLength < 0)) {
    issues.push('Min length must be a whole number, 0 or more.')
  }
  if (maxLength !== null && (!Number.isInteger(maxLength) || maxLength < 1)) {
    issues.push('Max length must be a whole number, 1 or more.')
  }
  if (
    issues.length === 0 &&
    minLength !== null &&
    maxLength !== null &&
    minLength > maxLength
  ) {
    issues.push('Min length can’t be greater than max length.')
  }
  return issues
}
