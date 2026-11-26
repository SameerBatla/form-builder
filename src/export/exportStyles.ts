/*
 * Styles for the exported document, as strings because they're used twice:
 * injected into the in-app response view, and inlined into the print iframe
 * (CSS modules can't reach an iframe). Classes are prefixed to avoid clashes.
 */

export const exportDocumentCss = `
.fb-export {
  max-width: 720px;
  margin: 0 auto;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #020817;
}

.fb-export__header {
  padding-bottom: 16px;
  margin-bottom: 8px;
  border-bottom: 2px solid #020817;
}

.fb-export__eyebrow {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #64748b;
}

.fb-export__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.fb-export__meta {
  margin: 8px 0 0;
  color: #374151;
}

.fb-export__heading {
  margin: 24px 0 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
  break-after: avoid;
}

.fb-export__heading--xl {
  font-size: 20px;
  font-weight: 700;
}
.fb-export__heading--lg {
  font-size: 17px;
  font-weight: 700;
}
.fb-export__heading--md {
  font-size: 15px;
  font-weight: 600;
}
.fb-export__heading--sm {
  font-size: 13px;
  font-weight: 600;
}
.fb-export__heading--xs {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #64748b;
}

.fb-export__row {
  display: grid;
  grid-template-columns: 35% 1fr;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  break-inside: avoid;
}

.fb-export__label {
  color: #64748b;
}

.fb-export__value {
  margin: 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.fb-export__value p {
  margin: 0;
}

.fb-export__empty {
  color: #9ca3af;
  font-weight: 400;
}

.fb-export__note {
  margin-top: 2px;
  font-size: 12px;
  font-style: italic;
  font-weight: 400;
  color: #64748b;
}

.fb-export__footer {
  margin-top: 24px;
  font-size: 11px;
  color: #9ca3af;
}
`

/** Only for the print iframe: page setup for "Save as PDF". */
export const printPageCss = `
@page {
  size: A4;
  margin: 18mm 16mm 20mm;

  /* Page numbers where the browser supports page margin boxes (recent Chrome). */
  @bottom-right {
    content: 'Page ' counter(page) ' of ' counter(pages);
    font:
      9px 'Inter',
      system-ui,
      sans-serif;
    color: #64748b;
  }
}

html,
body {
  margin: 0;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
`
