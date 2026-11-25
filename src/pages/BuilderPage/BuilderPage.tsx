import { useState } from 'react'
import { useParams } from 'react-router'
import TemplateBuilder from '../../builder/TemplateBuilder'
import { createBlankTemplate, loadTemplate } from '../../storage/templateStore'
import NotFoundPage from '../NotFoundPage/NotFoundPage'

/** Loads the template to edit (or starts a blank one); the builder does the rest. */
export default function BuilderPage() {
  const { templateId } = useParams()
  // Read once: after the first save of a new template the URL changes to /edit,
  // and this keeps the same template object instead of reloading.
  const [template] = useState(() =>
    templateId ? loadTemplate(templateId) : createBlankTemplate(),
  )

  if (!template) {
    return <NotFoundPage />
  }
  return <TemplateBuilder initialTemplate={template} isNew={!templateId} />
}
