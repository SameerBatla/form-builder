import type { ReactNode } from 'react'
import { AlertCircleIcon } from '../icons/icons'
import styles from './FormControl.module.css'

interface FormControlProps {
  label: ReactNode
  htmlFor: string
  isRequired?: boolean
  hint?: ReactNode
  /** Rendered below the control with id `${htmlFor}-error` (use it for aria-describedby). */
  error?: string | null
  children: ReactNode
}

/** Label, control, hint and error message, stacked. */
export default function FormControl({
  label,
  htmlFor,
  isRequired = false,
  hint,
  error,
  children,
}: FormControlProps) {
  return (
    <div className={styles.control}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {isRequired && (
          <span className={styles.requiredMark} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className={styles.error}>
          <AlertCircleIcon size={14} />
          {error}
        </p>
      )}
    </div>
  )
}
