import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { isInvalid?: boolean }

/** Native select, styled to match the text inputs. */
export default function Select({ isInvalid = false, className, ...rest }: SelectProps) {
  const classNames = [styles.select, isInvalid ? styles.invalid : '', className ?? '']
  return (
    <select
      className={classNames.filter(Boolean).join(' ')}
      aria-invalid={isInvalid || undefined}
      {...rest}
    />
  )
}
