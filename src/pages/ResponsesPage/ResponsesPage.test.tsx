import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { printResponse } from '../../export/printResponse'
import { createField } from '../../fields/logicRegistry'
import { loadResponsesForTemplate, saveResponse } from '../../storage/responseStore'
import { saveTemplate } from '../../storage/templateStore'
import { buildResponse, buildTemplate } from '../../test/fixtures'
import { renderRoute } from '../../test/renderRoute'

// jsdom has no print dialog; check that printing is requested with the right response.
vi.mock('../../export/printResponse', () => ({ printResponse: vi.fn() }))

const template = buildTemplate('t1', {
  title: 'Job application',
  fields: [{ ...createField('singleLineText', 't1-name'), label: 'Full name' }],
})

beforeEach(() => {
  localStorage.clear()
  vi.mocked(printResponse).mockClear()
  saveTemplate(template)
  saveResponse(buildResponse('r1', template))
})

describe('responses list', () => {
  test('each row shows the timestamp, an answer preview and its actions', () => {
    renderRoute('/templates/t1/responses')
    const row = screen.getByRole('listitem')
    expect(row).toHaveTextContent('22 Nov 2026')
    expect(row).toHaveTextContent('Jane')
    expect(within(row).getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/templates/t1/responses/r1',
    )
  })

  test('spec: Re-download PDF prints that response', async () => {
    const user = userEvent.setup()
    renderRoute('/templates/t1/responses')
    await user.click(screen.getByRole('button', { name: 'Re-download PDF' }))
    expect(printResponse).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }))
  })

  test('deleting asks first, then removes the response', async () => {
    const user = userEvent.setup()
    renderRoute('/templates/t1/responses')
    await user.click(screen.getByRole('button', { name: /Delete response from/ }))
    await user.click(screen.getByRole('button', { name: 'Delete response' }))

    expect(screen.getByText('No responses yet')).toBeInTheDocument()
    expect(loadResponsesForTemplate('t1')).toHaveLength(0)
  })
})

describe('response view', () => {
  test('shows the response as a document, with a Download PDF button', async () => {
    const user = userEvent.setup()
    renderRoute('/templates/t1/responses/r1')
    expect(screen.getByRole('heading', { name: 'Job application' })).toBeInTheDocument()
    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(printResponse).toHaveBeenCalledTimes(1)
  })

  test('a response from another template is not found', () => {
    renderRoute('/templates/other/responses/r1')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

describe('fill mode: Submit & download PDF', () => {
  test('saves the response first, then prints it', async () => {
    const user = userEvent.setup()
    renderRoute('/templates/t1/fill')
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sam')
    await user.click(screen.getByRole('button', { name: 'Submit & download PDF' }))

    const saved = loadResponsesForTemplate('t1').find((response) => response.id !== 'r1')
    expect(saved?.values).toEqual({ 't1-name': 'Sam' })
    expect(printResponse).toHaveBeenCalledWith(saved)
  })
})
