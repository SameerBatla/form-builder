import { useState } from 'react'
import type { FormEvent } from 'react'
import type { FormValues } from '../engine/evaluateForm'
import { buildSubmission, evaluateForm } from '../engine/evaluateForm'
import type { FieldId } from '../fields/fieldBase'
import { FieldRow } from '../fields/FieldComponents'
import { fieldInputId } from '../fields/fieldInputId'
import type { Field, FieldValue } from '../fields/fieldUnion'
import { getInitialValue, isComputedField } from '../fields/logicRegistry'
import { toLocalIsoDate } from '../lib/dates'
import { pluralize } from '../lib/format'
import { Button } from '../ui/Button/Button'
import { AlertCircleIcon, DownloadIcon } from '../ui/icons/icons'
import styles from './FormFiller.module.css'

export interface Submission {
  visibleFieldIds: FieldId[]
  values: FormValues
}

interface FormFillerProps {
  title: string
  fields: Field[]
  /** Small label above the title, e.g. "New response" or "Preview". */
  eyebrow: string
  /** Adds a "Submit & download PDF" button (fill mode; not in the builder preview). */
  canDownloadPdf?: boolean
  onSubmit: (submission: Submission, options: { downloadPdf: boolean }) => void
}

const FILL_ID_PREFIX = 'fill'

function createInitialValues(fields: Field[], today: string): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    // Calculations are never typed; the engine computes them from their sources.
    if (!isComputedField(field)) {
      values[field.id] = getInitialValue(field, today)
    }
  }
  return values
}

/*
 * State is only what the user did: the typed values, which fields they've left,
 * and whether they tried to submit. Visibility, required state and errors are
 * recomputed from those on every render by evaluateForm.
 */
export default function FormFiller({
  title,
  fields,
  eyebrow,
  canDownloadPdf = false,
  onSubmit,
}: FormFillerProps) {
  const [today] = useState(() => toLocalIsoDate())
  const [values, setValues] = useState(() => createInitialValues(fields, today))
  const [touchedFieldIds, setTouchedFieldIds] = useState<ReadonlySet<FieldId>>(new Set())
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const evaluation = evaluateForm(fields, values, today)
  const showErrorSummary = hasAttemptedSubmit && evaluation.errorCount > 0

  const handleValueChange = (fieldId: FieldId, value: FieldValue) => {
    setValues((prevValues) => {
      const nextValues = { ...prevValues, [fieldId]: value }
      return nextValues
    })
  }

  const handleFieldBlur = (fieldId: FieldId) => {
    setTouchedFieldIds((prevTouched) => {
      if (prevTouched.has(fieldId)) {
        return prevTouched
      }
      const nextTouched = new Set(prevTouched)
      nextTouched.add(fieldId)
      return nextTouched
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasAttemptedSubmit(true)
    if (evaluation.firstErrorFieldId !== null) {
      // Focusing also scrolls the first problem into view.
      document
        .getElementById(fieldInputId(FILL_ID_PREFIX, evaluation.firstErrorFieldId))
        ?.focus()
      return
    }
    // Which button submitted the form: both run the same validation first.
    const { nativeEvent } = event
    const submitter = 'submitter' in nativeEvent ? nativeEvent.submitter : null
    const downloadPdf =
      submitter instanceof HTMLButtonElement && submitter.value === 'pdf'
    onSubmit(buildSubmission(fields, evaluation), { downloadPdf })
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <header className={styles.header}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
      </header>

      <div className={styles.fields}>
        {fields.map((field) => {
          const fieldEvaluation = evaluation.fields[field.id]
          if (!fieldEvaluation.isVisible) {
            return null
          }
          const showError = hasAttemptedSubmit || touchedFieldIds.has(field.id)
          return (
            <FieldRow
              key={field.id}
              field={field}
              fields={fields}
              idPrefix={FILL_ID_PREFIX}
              value={field.id in values ? values[field.id] : fieldEvaluation.value}
              onChange={(value) => handleValueChange(field.id, value)}
              onBlur={() => handleFieldBlur(field.id)}
              isRequired={fieldEvaluation.isRequired}
              error={showError ? fieldEvaluation.error : null}
            />
          )
        })}
      </div>

      <footer className={styles.footer}>
        {showErrorSummary && (
          <p className={styles.errorSummary} role="alert">
            <AlertCircleIcon />
            {pluralize(evaluation.errorCount, 'field needs', 'fields need')} attention
          </p>
        )}
        <div className={styles.actions}>
          {canDownloadPdf && (
            <Button type="submit" name="intent" value="pdf">
              <DownloadIcon />
              Submit &amp; download PDF
            </Button>
          )}
          <Button type="submit" variant="primary" name="intent" value="submit">
            Submit
          </Button>
        </div>
      </footer>
    </form>
  )
}
