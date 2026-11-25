import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { TEMPLATES_KEY } from './storage/schema'
import { renderRoute } from './test/renderRoute'

beforeEach(() => {
  localStorage.clear()
})

test('shows a dismissible notice when stored data cannot be loaded', async () => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify({ broken: { id: 'broken' } }))
  renderRoute('/')
  expect(screen.getByRole('status')).toHaveTextContent('1 saved item couldn’t be loaded')

  await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('no notice when storage is clean', () => {
  renderRoute('/')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('home route shows the templates list', () => {
  renderRoute('/')
  expect(screen.getByRole('heading', { level: 1, name: 'Templates' })).toBeInTheDocument()
})

test('unknown route shows not found with a link home', () => {
  renderRoute('/does/not/exist')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go to templates' })).toHaveAttribute(
    'href',
    '/',
  )
})
