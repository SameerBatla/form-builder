import type { ReactNode } from 'react'
import { AlertCircleIcon } from '../icons/icons'
import styles from './FormControl.module.css'

interface FormControlProps {
  label: ReactNode
  htmlFor: string
  /** For radio/checkbox groups: render the label as text the group references by id. */
  isGroupLabel?: boolean
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
  isGroupLabel = false,
  isRequired = false,
  hint,
  error,
  children,
}: FormControlProps) {
  const LabelElement = isGroupLabel ? 'span' : 'label'

  return (
    <div className={styles.control}>
      <LabelElement
        id={`${htmlFor}-label`}
        htmlFor={isGroupLabel ? undefined : htmlFor}
        className={styles.label}
      >
        {label}
        {isRequired && (
          <span className={styles.requiredMark} aria-hidden="true">
            *
          </span>
        )}
      </LabelElement>
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
