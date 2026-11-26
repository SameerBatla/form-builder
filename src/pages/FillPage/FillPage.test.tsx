import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import type { Field } from '../../fields/fieldUnion'
import { createField } from '../../fields/logicRegistry'
import { loadResponsesForTemplate } from '../../storage/responseStore'
import { saveTemplate } from '../../storage/templateStore'
import { buildTemplate } from '../../test/fixtures'
import { renderRoute } from '../../test/renderRoute'
import { simulateFullStorage } from '../../test/storageFull'

beforeEach(() => {
  localStorage.clear()
})

function textField(
  id: string,
  label: string,
  options: { required?: boolean; hidden?: boolean; minLength?: number } = {},
): Field {
  const field = createField('singleLineText', id)
  if (field.type !== 'singleLineText') {
    throw new Error('expected a single line text field')
  }
  return {
    ...field,
    label,
    config: { ...field.config, minLength: options.minLength ?? null },
    visibility: {
      ...field.visibility,
      defaultState: options.hidden ? 'hidden' : 'visible',
    },
    required: {
      ...field.required,
      defaultState: options.required ? 'required' : 'optional',
    },
  }
}

function seed(fields: Field[]) {
  saveTemplate(buildTemplate('t1', { title: 'Job application', fields }))
  return renderRoute('/templates/t1/fill')
}

describe('fill mode', () => {
  test('renders the title and each visible field with its label', () => {
    seed([
      textField('name', 'Full name', { required: true }),
      textField('x', 'Secret', { hidden: true }),
    ])
    expect(screen.getByRole('heading', { name: 'Job application' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /full name/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Secret' })).not.toBeInTheDocument()
  })

  test('submitting with an empty required field shows errors and saves nothing', async () => {
    const user = userEvent.setup()
    seed([textField('name', 'Full name', { required: true })])

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.getByText('This field is required.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('1 field needs attention')
    expect(screen.getByRole('textbox', { name: /full name/i })).toHaveFocus()
    expect(loadResponsesForTemplate('t1')).toHaveLength(0)
  })

  test('errors wait for blur, then update live while fixing', async () => {
    const user = userEvent.setup()
    seed([textField('code', 'Code', { minLength: 4 })])
    const input = screen.getByRole('textbox', { name: 'Code' })

    await user.type(input, 'ab')
    expect(screen.queryByText('Enter at least 4 characters.')).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByText('Enter at least 4 characters.')).toBeInTheDocument()

    await user.type(input, 'cd')
    expect(screen.queryByText('Enter at least 4 characters.')).not.toBeInTheDocument()
  })

  test('spec: a hidden required field does not block submit and is not stored', async () => {
    const user = userEvent.setup()
    const { router } = seed([
      textField('name', 'Full name'),
      textField('secret', 'Secret', { required: true, hidden: true }),
    ])

    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Jane')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    const [response] = loadResponsesForTemplate('t1')
    expect(response.values).toEqual({ name: 'Jane' })
    expect(response.visibleFieldIds).toEqual(['name'])
    expect(response.form.title).toBe('Job application')
    expect(router.state.location.pathname).toBe('/templates/t1/responses')
    expect(router.state.location.search).toBe(`?highlight=${response.id}`)
  })
})

describe('responses list after submit', () => {
  test('shows the new response highlighted as just submitted', async () => {
    const user = userEvent.setup()
    seed([textField('name', 'Full name')])
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.getByRole('heading', { name: 'Job application' })).toBeInTheDocument()
    expect(screen.getByText('1 response')).toBeInTheDocument()
    expect(screen.getByText('Just submitted')).toBeInTheDocument()
  })

  test('an unknown template shows not found', () => {
    renderRoute('/templates/nope/fill')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

test('if storage is full, Submit says so and stays on the form with the answers', async () => {
  const user = userEvent.setup()
  const { router } = seed([textField('name', 'Full name')])
  await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Jane')

  const fullStorage = simulateFullStorage()
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  fullStorage.mockRestore()

  expect(
    screen.getByText(/Couldn’t save: your browser’s storage is full/),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/templates/t1/fill')
  expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('Jane')
})
