import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { buildExportModel, getAnswerPreview } from '../../export/buildExportModel'
import { printResponse } from '../../export/printResponse'
import { formatDateTime, formatRelativeTime } from '../../lib/dates'
import { pluralize } from '../../lib/format'
import {
  deleteResponse,
  loadResponsesForTemplate,
  sortByNewest,
} from '../../storage/responseStore'
import type { FormResponse } from '../../storage/schema'
import { loadTemplate } from '../../storage/templateStore'
import { Button, LinkButton } from '../../ui/Button/Button'
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog'
import { ChevronLeftIcon, DownloadIcon, PlusIcon, TrashIcon } from '../../ui/icons/icons'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import styles from './ResponsesPage.module.css'

export default function ResponsesPage() {
  const { templateId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const highlightedResponseId = searchParams.get('highlight')
  const [template] = useState(() => loadTemplate(templateId))
  const [responses, setResponses] = useState(() =>
    sortByNewest(loadResponsesForTemplate(templateId)),
  )
  const [responseToDelete, setResponseToDelete] = useState<FormResponse | null>(null)

  if (!template) {
    return <NotFoundPage />
  }

  const handleConfirmDelete = () => {
    if (!responseToDelete) {
      return
    }
    deleteResponse(responseToDelete.id)
    setResponses((prevResponses) => {
      const nextResponses = prevResponses.filter(
        (response) => response.id !== responseToDelete.id,
      )
      return nextResponses
    })
    setResponseToDelete(null)
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
            const preview = getAnswerPreview(buildExportModel(response))
            const viewPath = `/templates/${template.id}/responses/${response.id}`
            return (
              <li
                key={response.id}
                className={`${styles.row} ${isHighlighted ? styles.highlighted : ''}`}
                aria-current={isHighlighted || undefined}
              >
                <div className={styles.summary}>
                  <p className={styles.timestamp}>
                    <Link to={viewPath} className={styles.viewLink}>
                      <time dateTime={response.submittedAt}>
                        {formatDateTime(response.submittedAt)}
                      </time>
                    </Link>
                    <span className={styles.relative}>
                      {' · '}
                      {formatRelativeTime(response.submittedAt)}
                    </span>
                    {isHighlighted && (
                      <span className={styles.newBadge}>Just submitted</span>
                    )}
                  </p>
                  <p className={styles.preview}>{preview ?? 'No answers'}</p>
                </div>
                <div className={styles.actions}>
                  <LinkButton to={viewPath} size="small">
                    View
                  </LinkButton>
                  <Button size="small" onClick={() => printResponse(response)}>
                    <DownloadIcon />
                    Re-download PDF
                  </Button>
                  <Button
                    variant="ghostDanger"
                    size="small"
                    iconOnly
                    aria-label={`Delete response from ${formatDateTime(response.submittedAt)}`}
                    onClick={() => setResponseToDelete(response)}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {responseToDelete && (
        <ConfirmDialog
          title="Delete this response?"
          confirmLabel="Delete response"
          tone="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setResponseToDelete(null)}
        >
          The response submitted {formatDateTime(responseToDelete.submittedAt)} will be
          permanently removed.
        </ConfirmDialog>
      )}
    </main>
  )
}
