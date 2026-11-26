import { vi } from 'vitest'

/** Makes every localStorage write fail the way a full browser storage does. */
export function simulateFullStorage() {
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
  })
}
