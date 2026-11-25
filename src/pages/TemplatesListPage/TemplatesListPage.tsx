import { useState } from 'react'
import { countResponsesByTemplate, loadResponses } from '../../storage/responseStore'
import { loadTemplates, sortByLastEdited } from '../../storage/templateStore'
import { LinkButton } from '../../ui/Button/Button'
import TemplateCard from './TemplateCard'
import styles from './TemplatesListPage.module.css'

function loadListData() {
  const templates = sortByLastEdited(loadTemplates().templates)
  const responseCounts = countResponsesByTemplate(loadResponses().responses)
  return { templates, responseCounts }
}

export default function TemplatesListPage() {
  // Read once on mount; navigating back here remounts the page with fresh data.
  const [{ templates, responseCounts }] = useState(loadListData)

  return (
    <main className="page">
      <div className={styles.header}>
        <div>
          <h1>Templates</h1>
          <p className="muted">Design forms, collect responses, export PDFs.</p>
        </div>
        <LinkButton to="/templates/new" variant="primary">
          New template
        </LinkButton>
      </div>

      {templates.length === 0 ? (
        <div className={styles.empty}>
          <h2>No templates yet</h2>
          <p className="muted">
            Create your first form template to start collecting responses.
          </p>
          <LinkButton to="/templates/new" variant="primary">
            Create a template
          </LinkButton>
        </div>
      ) : (
        <ul className={styles.grid}>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              responseCount={responseCounts.get(template.id) ?? 0}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
