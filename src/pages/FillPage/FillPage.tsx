import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Submission } from '../../fill/FormFiller'
import FormFiller from '../../fill/FormFiller'
import { createId } from '../../lib/id'
import { saveResponse } from '../../storage/responseStore'
import { loadTemplate } from '../../storage/templateStore'
import NotFoundPage from '../NotFoundPage/NotFoundPage'

export default function FillPage() {
  const { templateId = '' } = useParams()
  const navigate = useNavigate()
  const [template] = useState(() => loadTemplate(templateId))

  if (!template) {
    return <NotFoundPage />
  }

  const handleSubmit = (submission: Submission) => {
    const responseId = createId()
    saveResponse({
      id: responseId,
      templateId: template.id,
      submittedAt: new Date().toISOString(),
      // A full copy, so later template edits never change this response.
      form: { title: template.title, fields: template.fields },
      ...submission,
    })
    navigate(`/templates/${template.id}/responses?highlight=${responseId}`)
  }

  return (
    <main className="page">
      <FormFiller
        title={template.title}
        fields={template.fields}
        eyebrow="New response"
        onSubmit={handleSubmit}
      />
    </main>
  )
}
