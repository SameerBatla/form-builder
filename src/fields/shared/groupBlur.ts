import type { FocusEvent } from 'react'

/** For radio/checkbox groups: "blurred" only when focus leaves the whole group. */
export function createGroupBlurHandler(onBlur: (() => void) | undefined) {
  return (event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      onBlur?.()
    }
  }
}
