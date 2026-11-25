import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import FormFiller from '../../fill/FormFiller'
import { fileUploadDefinition } from './fileUploadLogic'

const base = fileUploadDefinition.createField('docs')
const field = {
  ...base,
  label: 'Documents',
  config: { allowedTypes: ['.pdf', '.png'], maxFiles: 2 },
}

test('keeps allowed files as metadata and explains the rejected ones', async () => {
  // applyAccept: false simulates a drag-drop, which bypasses the picker's filter.
  const user = userEvent.setup({ applyAccept: false })
  const onSubmit = vi.fn()
  const { container } = render(
    <FormFiller title="T" eyebrow="E" fields={[field]} onSubmit={onSubmit} />,
  )
  const fileInput = container.querySelector('input[type="file"]')
  if (!(fileInput instanceof HTMLInputElement)) {
    throw new Error('file input not found')
  }

  await user.upload(fileInput, [
    new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }),
    new File(['doc'], 'notes.docx', { type: 'application/msword' }),
  ])

  expect(screen.getByText('cv.pdf')).toBeInTheDocument()
  expect(screen.getByText('notes.docx: not an allowed file type')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Submit' }))
  expect(onSubmit).toHaveBeenCalledWith({
    visibleFieldIds: ['docs'],
    values: { docs: [{ name: 'cv.pdf', size: 4, type: 'application/pdf' }] },
  })
})
