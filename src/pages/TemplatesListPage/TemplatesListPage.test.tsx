import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { saveResponse } from '../../storage/responseStore'
import { saveTemplate } from '../../storage/templateStore'
import { buildResponse, buildTemplate } from '../../test/fixtures'
import { renderRoute } from '../../test/renderRoute'

beforeEach(() => {
  localStorage.clear()
})

test('empty state offers to create a template', () => {
  renderRoute('/')
  expect(screen.getByRole('heading', { name: 'No templates yet' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Create a template' })).toHaveAttribute(
    'href',
    '/templates/new',
  )
})

test('a saved template card shows title, field count, response count and actions', () => {
  const template = buildTemplate('t1')
  saveTemplate(template)
  saveResponse(buildResponse('r1', template))
  saveResponse(buildResponse('r2', template))
  renderRoute('/')

  const card = screen.getByRole('listitem')
  expect(within(card).getByRole('link', { name: 'Template t1' })).toHaveAttribute(
    'href',
    '/templates/t1/edit',
  )
  expect(card).toHaveTextContent('1 field · 2 responses')
  expect(within(card).getByRole('link', { name: 'New response' })).toHaveAttribute(
    'href',
    '/templates/t1/fill',
  )
  expect(within(card).getByRole('link', { name: 'Responses' })).toHaveAttribute(
    'href',
    '/templates/t1/responses',
  )
})

test('templates are listed most recently edited first', () => {
  saveTemplate(buildTemplate('older', { updatedAt: '2026-11-01T10:00:00.000Z' }))
  saveTemplate(buildTemplate('newer', { updatedAt: '2026-11-24T10:00:00.000Z' }))
  renderRoute('/')

  const titles = screen
    .getAllByRole('listitem')
    .map((card) => card.querySelector('a')?.textContent)
  expect(titles).toEqual(['Template newer', 'Template older'])
})
