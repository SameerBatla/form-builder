import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { Field } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'
import FormFiller from './FormFiller'

function numberField(id: string, label: string): Field {
  return { ...createField('number', id), label }
}

test('a calculation updates in real time as its source numbers change', async () => {
  const user = userEvent.setup()
  const total = createField('calculation', 'total')
  if (total.type !== 'calculation') {
    throw new Error('expected calculation')
  }
  const fields: Field[] = [
    numberField('price', 'Price'),
    numberField('shipping', 'Shipping'),
    {
      ...total,
      label: 'Total',
      config: { ...total.config, sourceFieldIds: ['price', 'shipping'] },
    },
  ]
  render(<FormFiller title="T" eyebrow="E" fields={fields} onSubmit={() => {}} />)
  const totalInput = screen.getByRole('textbox', { name: 'Total' })

  expect(totalInput).toHaveValue('—')
  expect(screen.getByText('Sum of Price, Shipping')).toBeInTheDocument()

  await user.type(screen.getByRole('textbox', { name: 'Price' }), '1200')
  expect(totalInput).toHaveValue('1,200.00')

  await user.type(screen.getByRole('textbox', { name: 'Shipping' }), '50')
  expect(totalInput).toHaveValue('1,250.00')
  expect(totalInput).toHaveAttribute('readonly')
})
