import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ruleField, whenText } from '../test/ruleFixtures'
import FormFiller from './FormFiller'

const fields = [
  ruleField('hasCar'),
  ruleField('plate', { required: true, showWhen: [whenText('hasCar', 'yes')] }),
]

function renderForm(onSubmit = vi.fn()) {
  render(<FormFiller title="T" eyebrow="E" fields={fields} onSubmit={onSubmit} />)
  return onSubmit
}

test('a conditional field shows and hides in real time as values change', async () => {
  const user = userEvent.setup()
  renderForm()
  const hasCar = screen.getByRole('textbox', { name: 'hasCar' })
  expect(screen.queryByRole('textbox', { name: /plate/ })).not.toBeInTheDocument()

  await user.type(hasCar, 'Yes')
  expect(screen.getByRole('textbox', { name: /plate/ })).toBeInTheDocument()

  await user.clear(hasCar)
  expect(screen.queryByRole('textbox', { name: /plate/ })).not.toBeInTheDocument()
})

test('spec: submitting with a hidden required field succeeds and leaves it out', async () => {
  const user = userEvent.setup()
  const onSubmit = renderForm()
  await user.type(screen.getByRole('textbox', { name: 'hasCar' }), 'no')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  expect(onSubmit.mock.lastCall?.[0]).toEqual({
    visibleFieldIds: ['hasCar'],
    values: { hasCar: 'no' },
  })
})

test('once shown, the field is required; a value typed before hiding comes back (Q4)', async () => {
  const user = userEvent.setup()
  const onSubmit = renderForm()
  const hasCar = screen.getByRole('textbox', { name: 'hasCar' })

  await user.type(hasCar, 'yes')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  expect(screen.getByText('This field is required.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()

  await user.type(screen.getByRole('textbox', { name: /plate/ }), 'AB-123')
  await user.clear(hasCar)
  await user.type(hasCar, 'yes')
  expect(screen.getByRole('textbox', { name: /plate/ })).toHaveValue('AB-123')
})
