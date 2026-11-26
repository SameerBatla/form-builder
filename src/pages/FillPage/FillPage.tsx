import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Submission } from '../../fill/FormFiller'
import FormFiller from '../../fill/FormFiller'
import { createId } from '../../lib/id'
import { printResponse } from '../../export/printResponse'
import { saveResponse } from '../../storage/responseStore'
import type { FormResponse } from '../../storage/schema'
import { STORAGE_FULL_MESSAGE } from '../../storage/storageMessages'
import { loadTemplate } from '../../storage/templateStore'
import Banner from '../../ui/Banner/Banner'
import styles from './FillPage.module.css'
import NotFoundPage from '../NotFoundPage/NotFoundPage'

export default function FillPage() {
  const { templateId = '' } = useParams()
  const navigate = useNavigate()
  const [template] = useState(() => loadTemplate(templateId))
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!template) {
    return <NotFoundPage />
  }

  const handleSubmit = (submission: Submission, options: { downloadPdf: boolean }) => {
    const responseId = createId()
    const response: FormResponse = {
      id: responseId,
      templateId: template.id,
      submittedAt: new Date().toISOString(),
      // A full copy, so later template edits never change this response.
      form: { title: template.title, fields: template.fields },
      ...submission,
    }
    if (!saveResponse(response)) {
      // Stay on the page so the filled-in answers aren't lost.
      setSubmitError(STORAGE_FULL_MESSAGE)
      return
    }
    if (options.downloadPdf) {
      // Printed from the saved response, so the PDF has the real timestamp.
      void printResponse(response)
    }
    navigate(`/templates/${template.id}/responses?highlight=${responseId}`)
  }

  return (
    <main className="page">
      {submitError && (
        <div className={styles.error}>
          <Banner tone="warning" onDismiss={() => setSubmitError(null)}>
            {submitError}
          </Banner>
        </div>
      )}
      <FormFiller
        title={template.title}
        fields={template.fields}
        eyebrow="New response"
        canDownloadPdf
        onSubmit={handleSubmit}
      />
    </main>
  )
}
