import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { toLocalIsoDate } from '../lib/dates'
import type { FormResponse } from '../storage/schema'
import { buildExportModel } from './buildExportModel'
import type { ExportModel } from './buildExportModel'
import ExportDocument from './ExportDocument'
import { exportDocumentCss, printPageCss } from './exportStyles'

const PRINT_FRAME_ID = 'form-builder-print-frame'

/** A complete HTML page for the print iframe. React escapes every value. */
export function buildPrintHtml(model: ExportModel): string {
  const body = renderToStaticMarkup(createElement(ExportDocument, { model }))
  // The title becomes the suggested PDF file name in most browsers.
  const fileTitle = `${model.title} – ${toLocalIsoDate(new Date(model.submittedAt))}`
  const escapedTitle = renderToStaticMarkup(createElement('title', null, fileTitle))
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
${escapedTitle}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
<style>${exportDocumentCss}${printPageCss}</style>
</head>
<body>${body}</body>
</html>`
}

/**
 * Browser-native PDF: render the document into a hidden iframe and open the
 * print dialog, where the user picks "Save as PDF". No PDF library involved.
 */
export function printHtml(html: string) {
  document.getElementById(PRINT_FRAME_ID)?.remove()
  const iframe = document.createElement('iframe')
  iframe.id = PRINT_FRAME_ID
  iframe.setAttribute('aria-hidden', 'true')
  iframe.tabIndex = -1
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  })
  iframe.onload = async () => {
    const frameWindow = iframe.contentWindow
    if (!frameWindow) {
      return
    }
    // Wait for the web font so the PDF isn't printed in the fallback font.
    await frameWindow.document.fonts.ready
    frameWindow.addEventListener('afterprint', () => iframe.remove())
    frameWindow.focus()
    frameWindow.print()
  }
  iframe.srcdoc = html
  document.body.appendChild(iframe)
}

export function printResponse(response: FormResponse) {
  printHtml(buildPrintHtml(buildExportModel(response)))
}
