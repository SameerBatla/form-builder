import { Link } from 'react-router'
import { formatDateTime, formatRelativeTime } from '../../lib/dates'
import { pluralize } from '../../lib/format'
import type { Template } from '../../storage/schema'
import { LinkButton } from '../../ui/Button/Button'
import styles from './TemplatesListPage.module.css'

interface TemplateCardProps {
  template: Template
  responseCount: number
}

export default function TemplateCard({ template, responseCount }: TemplateCardProps) {
  return (
    <li className={styles.card}>
      {/* The title link stretches over the whole card, so clicking the card opens the builder. */}
      <Link to={`/templates/${template.id}/edit`} className={styles.cardTitle}>
        {template.title}
      </Link>
      <p className={styles.cardMeta}>
        {pluralize(template.fields.length, 'field')} ·{' '}
        {pluralize(responseCount, 'response')}
      </p>
      <p className={styles.cardMeta}>
        Edited{' '}
        <time dateTime={template.updatedAt} title={formatDateTime(template.updatedAt)}>
          {formatRelativeTime(template.updatedAt)}
        </time>
      </p>
      <div className={styles.cardActions}>
        <LinkButton to={`/templates/${template.id}/fill`} variant="primary" size="small">
          New response
        </LinkButton>
        <LinkButton to={`/templates/${template.id}/responses`} size="small">
          Responses
        </LinkButton>
      </div>
    </li>
  )
}
