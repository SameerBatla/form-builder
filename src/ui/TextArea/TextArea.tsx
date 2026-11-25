import type { TextareaHTMLAttributes } from 'react'
import styles from './TextArea.module.css'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  isInvalid?: boolean
}

export default function TextArea({
  isInvalid = false,
  className,
  ...rest
}: TextAreaProps) {
  const classNames = [styles.textArea, isInvalid ? styles.invalid : '', className ?? '']
  return (
    <textarea
      className={classNames.filter(Boolean).join(' ')}
      aria-invalid={isInvalid || undefined}
      {...rest}
    />
  )
}
