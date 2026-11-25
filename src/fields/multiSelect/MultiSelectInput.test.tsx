import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import FormFiller from '../../fill/FormFiller'
import { multiSelectDefinition } from './multiSelectLogic'

const base = multiSelectDefinition.createField('skills')
const field = {
  ...base,
  label: 'Top skills',
  config: {
    options: ['React', 'Vue', 'Svelte'].map((label) => ({ id: label, label })),
    minSelections: null,
    maxSelections: 2,
  },
}

test('at the maximum, the remaining options are disabled with a hint', async () => {
  const user = userEvent.setup()
  render(<FormFiller title="T" eyebrow="E" fields={[field]} onSubmit={() => {}} />)

  await user.click(screen.getByRole('checkbox', { name: 'React' }))
  await user.click(screen.getByRole('checkbox', { name: 'Vue' }))

  expect(screen.getByRole('checkbox', { name: 'Svelte' })).toBeDisabled()
  expect(screen.getByText('Maximum 2 selected')).toBeInTheDocument()

  await user.click(screen.getByRole('checkbox', { name: 'React' }))
  expect(screen.getByRole('checkbox', { name: 'Svelte' })).toBeEnabled()
})
