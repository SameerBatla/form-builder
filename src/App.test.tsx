import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the page heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /interview starter/i })).toBeInTheDocument()
})
