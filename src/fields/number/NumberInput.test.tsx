import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'
import NumberInput from './NumberInput'
import { numberDefinition } from './numberLogic'
import type { NumberValue } from './numberSchema'

const baseField = numberDefinition.createField('price')
const field = {
  ...baseField,
  config: { ...baseField.config, decimalPlaces: 2, prefix: '$' },
}

function Harness({ onValue }: { onValue: (value: NumberValue) => void }) {
  const [value, setValue] = useState<NumberValue>(null)
  return (
    <NumberInput
      field={field}
      value={value}
      onChange={(next) => {
        setValue(next)
        onValue(next)
      }}
      fields={[]}
      inputId="price"
      labelId="price-label"
      isRequired={false}
      isInvalid={false}
    />
  )
}

test('keeps raw typing, sends parsed numbers live, rounds and formats on blur', async () => {
  const user = userEvent.setup()
  const received: NumberValue[] = []
  render(<Harness onValue={(value) => received.push(value)} />)
  const input = screen.getByRole('textbox')

  await user.type(input, '3.14159')
  expect(input).toHaveValue('3.14159')
  expect(received.at(-1)).toBe(3.14159)

  await user.tab()
  expect(input).toHaveValue('3.14')
  expect(received.at(-1)).toBe(3.14)
})

test('ignores characters that cannot be part of a number', async () => {
  const user = userEvent.setup()
  render(<Harness onValue={() => {}} />)
  const input = screen.getByRole('textbox')

  await user.type(input, '1a2e.5.')
  expect(input).toHaveValue('12.5')
})
