/** Text helpers shared by the single- and multi-line text field types. */

/** Min/max character length settings in the builder. */
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

/** Whitespace-only answers count as empty. */
export function isTextEmpty(value: string): boolean {
  return value.trim() === ''
}

/** Fill-time length check for a non-empty answer. */
export function validateTextLength(
  value: string,
  minLength: number | null,
  maxLength: number | null,
): string | null {
  if (minLength !== null && value.length < minLength) {
    return `Enter at least ${minLength} characters.`
  }
  if (maxLength !== null && value.length > maxLength) {
    return `Use at most ${maxLength} characters.`
  }
  return null
}
