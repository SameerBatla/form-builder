/** Rounds half away from zero. Shifting via exponent strings avoids 1.005 → 1.00. */
export function roundToDecimals(value: number, decimalPlaces: number): number {
  const shifted = Math.round(Math.abs(Number(`${value}e${decimalPlaces}`)))
  return Math.sign(value) * Number(`${shifted}e-${decimalPlaces}`)
}

const numberFormats = new Map<number, Intl.NumberFormat>()

/** "1,250.00" with exactly `decimalPlaces` decimals. */
export function formatNumber(value: number, decimalPlaces: number): string {
  let format = numberFormats.get(decimalPlaces)
  if (!format) {
    format = new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
    numberFormats.set(decimalPlaces, format)
  }
  return format.format(value)
}
