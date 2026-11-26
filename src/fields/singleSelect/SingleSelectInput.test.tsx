import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import FormFiller from '../../fill/FormFiller'
import type { Field } from '../fieldUnion'
import { singleSelectDefinition } from './singleSelectLogic'
import type { SingleSelectDisplay } from './singleSelectSchema'

function planField(display: SingleSelectDisplay, isRequired: boolean): Field {
  const field = singleSelectDefinition.createField('plan')
  return {
    ...field,
    label: 'Plan',
    config: {
      display,
      options: [
        { id: 'basic', label: 'Basic' },
        { id: 'pro', label: 'Pro' },
      ],
    },
    required: { ...field.required, defaultState: isRequired ? 'required' : 'optional' },
  }
}

async function choose(display: SingleSelectDisplay, label: string) {
  const user = userEvent.setup()
  if (display === 'dropdown') {
    await user.selectOptions(screen.getByRole('combobox'), label)
  } else {
    await user.click(screen.getByRole('radio', { name: label }))
  }
}

const displays: SingleSelectDisplay[] = ['radio', 'dropdown', 'tiles']

describe.each(displays)('single select shown as %s', (display) => {
  test('spec: required validation behaves the same in every display', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <FormFiller
        title="T"
        eyebrow="E"
        fields={[planField(display, true)]}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('This field is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await choose(display, 'Pro')
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(onSubmit.mock.lastCall?.[0]).toEqual({
      visibleFieldIds: ['plan'],
      values: { plan: 'pro' },
    })
  })

  test('an optional selection can be cleared', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <FormFiller
        title="T"
        eyebrow="E"
        fields={[planField(display, false)]}
        onSubmit={onSubmit}
      />,
    )

    await choose(display, 'Basic')
    if (display === 'dropdown') {
      await user.selectOptions(screen.getByRole('combobox'), '— Select —')
    } else {
      await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    }
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(onSubmit.mock.lastCall?.[0]).toEqual({
      visibleFieldIds: ['plan'],
      values: { plan: null },
    })
  })
})
