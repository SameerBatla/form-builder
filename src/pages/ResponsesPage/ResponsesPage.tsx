import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { formatDateTime, formatRelativeTime } from '../../lib/dates'
import { pluralize } from '../../lib/format'
import { loadResponsesForTemplate, sortByNewest } from '../../storage/responseStore'
import { loadTemplate } from '../../storage/templateStore'
import { LinkButton } from '../../ui/Button/Button'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons/icons'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import styles from './ResponsesPage.module.css'

export default function ResponsesPage() {
  const { templateId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const highlightedResponseId = searchParams.get('highlight')
  const [template] = useState(() => loadTemplate(templateId))
  const [responses] = useState(() => sortByNewest(loadResponsesForTemplate(templateId)))

  if (!template) {
    return <NotFoundPage />
  }

  return (
    <main className="page">
      <Link to="/" className={styles.back}>
        <ChevronLeftIcon />
        Templates
      </Link>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Responses</p>
          <h1 className={styles.title}>{template.title}</h1>
          <p className={styles.count}>{pluralize(responses.length, 'response')}</p>
        </div>
        <LinkButton to={`/templates/${template.id}/fill`} variant="primary">
          <PlusIcon />
          New response
        </LinkButton>
      </div>

      {responses.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No responses yet</p>
          <p className="muted">Responses appear here after someone submits the form.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {responses.map((response) => {
            const isHighlighted = response.id === highlightedResponseId
            return (
              <li
                key={response.id}
                className={`${styles.row} ${isHighlighted ? styles.highlighted : ''}`}
                aria-current={isHighlighted || undefined}
              >
                <p className={styles.timestamp}>
                  <time dateTime={response.submittedAt}>
                    {formatDateTime(response.submittedAt)}
                  </time>
                  <span className={styles.relative}>
                    {' · '}
                    {formatRelativeTime(response.submittedAt)}
                  </span>
                </p>
                {isHighlighted && <span className={styles.newBadge}>Just submitted</span>}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
