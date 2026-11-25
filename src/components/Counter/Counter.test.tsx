import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import Counter from './Counter'

test('increments the count when clicked', async () => {
  render(<Counter />)
  const button = screen.getByRole('button', { name: /count: 0/i })
  await userEvent.click(button)
  expect(button).toHaveTextContent('Count: 1')
})
