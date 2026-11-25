import type { InputHTMLAttributes } from 'react'
import styles from './TextInput.module.css'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Static text shown before the input, e.g. "https://". */
  prefix?: string
  /** Static text shown after the input, e.g. ".com". */
  suffix?: string
  isInvalid?: boolean
}

export default function TextInput({
  prefix,
  suffix,
  isInvalid = false,
  className,
  ...rest
}: TextInputProps) {
  const groupClassName = [styles.group, isInvalid ? styles.invalid : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={groupClassName}>
      {prefix && <span className={styles.addon}>{prefix}</span>}
      <input className={styles.input} aria-invalid={isInvalid || undefined} {...rest} />
      {suffix && <span className={styles.addon}>{suffix}</span>}
    </div>
  )
}
