import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { buildExportModel } from '../../export/buildExportModel'
import ExportDocument from '../../export/ExportDocument'
import { exportDocumentCss } from '../../export/exportStyles'
import { printResponse } from '../../export/printResponse'
import { loadResponse } from '../../storage/responseStore'
import { Button } from '../../ui/Button/Button'
import { ChevronLeftIcon, DownloadIcon } from '../../ui/icons/icons'
import NotFoundPage from '../NotFoundPage/NotFoundPage'
import styles from './ResponseViewPage.module.css'

/** A submitted response, read-only, in the same document layout as the PDF. */
export default function ResponseViewPage() {
  const { templateId = '', responseId = '' } = useParams()
  const [response] = useState(() => loadResponse(responseId))

  if (!response || response.templateId !== templateId) {
    return <NotFoundPage />
  }

  return (
    <main className="page">
      <div className={styles.toolbar}>
        <Link to={`/templates/${templateId}/responses`} className={styles.back}>
          <ChevronLeftIcon />
          All responses
        </Link>
        <Button variant="primary" onClick={() => void printResponse(response)}>
          <DownloadIcon />
          Download PDF
        </Button>
      </div>
      {/* Shared with the print iframe, which CSS modules can't reach. */}
      <style>{exportDocumentCss}</style>
      <div className={styles.paper}>
        <ExportDocument model={buildExportModel(response)} />
      </div>
    </main>
  )
}
