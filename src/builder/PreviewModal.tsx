import { useEffect, useState } from 'react'
import FormFiller from '../fill/FormFiller'
import type { Field } from '../fields/fieldUnion'
import { Button } from '../ui/Button/Button'
import { CheckIcon, EyeIcon, XIcon } from '../ui/icons/icons'
import styles from './PreviewModal.module.css'

interface PreviewModalProps {
  title: string
  fields: Field[]
  onClose: () => void
}

/** Fill mode on the builder's unsaved state. Submitting validates but never saves. */
export default function PreviewModal({ title, fields, onClose }: PreviewModalProps) {
  const [hasPassed, setHasPassed] = useState(false)
  // Changing the key remounts the form, which resets its values.
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    // The page behind shouldn't scroll while the preview covers it.
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleFillAgain = () => {
    setHasPassed(false)
    setFormKey((prevKey) => {
      const nextKey = prevKey + 1
      return nextKey
    })
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Form preview"
    >
      <div className={styles.strip}>
        <span className={styles.stripLabel}>
          <EyeIcon />
          Preview: nothing is saved
        </span>
        <Button size="small" onClick={onClose} autoFocus>
          <XIcon />
          Close preview
        </Button>
      </div>
      <div className={styles.content}>
        {hasPassed ? (
          <div className={styles.success} role="status">
            <span className={styles.successIcon}>
              <CheckIcon size={20} />
            </span>
            <h2 className={styles.successTitle}>This response would be accepted</h2>
            <p className="muted">It passed validation. Nothing was saved.</p>
            <Button onClick={handleFillAgain}>Fill again</Button>
          </div>
        ) : (
          <FormFiller
            key={formKey}
            title={title.trim() || 'Untitled form'}
            fields={fields}
            eyebrow="Preview"
            onSubmit={() => setHasPassed(true)}
          />
        )}
      </div>
    </div>
  )
}
