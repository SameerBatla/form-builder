import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import { createField } from '../fields/logicRegistry'
import { loadResponsesForTemplate } from '../storage/responseStore'
import { loadTemplate, loadTemplates, saveTemplate } from '../storage/templateStore'
import { buildTemplate } from '../test/fixtures'
import { renderRoute } from '../test/renderRoute'

beforeEach(() => {
  localStorage.clear()
})

function canvas() {
  return screen.getByRole('list', { name: 'Form fields' })
}

test('a new template starts with an empty canvas', () => {
  renderRoute('/templates/new')
  expect(screen.getByText('Your form is empty')).toBeInTheDocument()
  expect(screen.getByText('No field selected')).toBeInTheDocument()
})

test('clicking a palette item adds the field, selects it, and opens its settings', async () => {
  const user = userEvent.setup()
  renderRoute('/templates/new')

  await user.click(screen.getByRole('button', { name: /single line text/i }))

  const card = within(canvas()).getByRole('listitem')
  expect(within(card).getByRole('button', { pressed: true })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Label' })).toHaveValue('Single line text')
})

test('editing the label in settings updates the canvas preview', async () => {
  const user = userEvent.setup()
  renderRoute('/templates/new')
  await user.click(screen.getByRole('button', { name: /single line text/i }))

  const labelInput = screen.getByRole('textbox', { name: 'Label' })
  await user.clear(labelInput)
  await user.type(labelInput, 'Full name')

  expect(within(canvas()).getByText('Full name')).toBeInTheDocument()
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
})

test('deleting the selected field empties the canvas', async () => {
  const user = userEvent.setup()
  renderRoute('/templates/new')
  await user.click(screen.getByRole('button', { name: /single line text/i }))

  await user.click(screen.getByRole('button', { name: 'Delete Single line text' }))
  expect(screen.getByText('Your form is empty')).toBeInTheDocument()
})

describe('saving', () => {
  test('Save is blocked with a reason when the form has no fields', async () => {
    const user = userEvent.setup()
    renderRoute('/templates/new')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Add at least one field.')
    expect(loadTemplates().templates).toHaveLength(0)
  })

  test('the first Save stores the template and moves to its edit URL', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/templates/new')
    await user.click(screen.getByRole('button', { name: /single line text/i }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const [saved] = loadTemplates().templates
    expect(saved.title).toBe('Untitled form')
    expect(saved.fields).toHaveLength(1)
    expect(router.state.location.pathname).toBe(`/templates/${saved.id}/edit`)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  test('a blank label blocks Save, marks the field, and clears once fixed', async () => {
    const user = userEvent.setup()
    saveTemplate(buildTemplate('t1'))
    renderRoute('/templates/t1/edit')

    const labelInput = screen.getByRole('textbox', { name: 'Label' })
    await user.clear(labelInput)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Label is required.')
    expect(
      within(canvas()).getByRole('button', { name: /needs attention/ }),
    ).toBeInTheDocument()

    await user.type(labelInput, 'Email')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(loadTemplate('t1')?.fields[0].label).toBe('Email')
  })
})

describe('unsaved changes guard', () => {
  test('leaving with unsaved changes asks first; Keep editing stays, Discard leaves', async () => {
    const user = userEvent.setup()
    saveTemplate(buildTemplate('t1'))
    const { router } = renderRoute('/templates/t1/edit')
    await user.type(screen.getByRole('textbox', { name: 'Label' }), '!')

    await user.click(screen.getByRole('link', { name: /templates/i }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Discard unsaved changes?')

    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(router.state.location.pathname).toBe('/templates/t1/edit')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /templates/i }))
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(router.state.location.pathname).toBe('/')
  })

  test('leaving without changes does not ask', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/templates/new')
    await user.click(screen.getByRole('link', { name: /templates/i }))
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('reordering', () => {
  function seedThreeFields() {
    const fields = ['A', 'B', 'C'].map((label) => ({
      ...createField('singleLineText', `field-${label}`),
      label,
    }))
    saveTemplate(buildTemplate('t1', { fields }))
    renderRoute('/templates/t1/edit')
  }

  /** Field labels in canvas order, read from each card's select button. */
  function canvasLabels() {
    return [...canvas().querySelectorAll('button[aria-pressed]')].map(
      (button) => button.getAttribute('aria-label')?.split(',')[0],
    )
  }

  /** jsdom has no DataTransfer, so drag tests use a minimal stand-in. */
  function createDataTransfer() {
    const data = new Map<string, string>()
    return {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? '',
      get types() {
        return [...data.keys()]
      },
      setDragImage: () => {},
      effectAllowed: 'all',
      dropEffect: 'none',
    }
  }

  test('the up/down buttons move a field one place', async () => {
    const user = userEvent.setup()
    seedThreeFields()

    await user.click(screen.getByRole('button', { name: 'Move A down' }))
    expect(canvasLabels()).toEqual(['B', 'A', 'C'])
    await user.click(screen.getByRole('button', { name: 'Move C up' }))
    expect(canvasLabels()).toEqual(['B', 'C', 'A'])
    expect(screen.getByRole('button', { name: 'Move B up' })).toBeDisabled()
  })

  test('dragging a field by its handle and dropping below another moves it there', () => {
    seedThreeFields()
    const [cardA, , cardC] = within(canvas()).getAllByRole('listitem')
    const dataTransfer = createDataTransfer()

    const grip = cardA.querySelector('[draggable="true"]')
    if (!grip) {
      throw new Error('drag handle not found')
    }
    fireEvent.dragStart(grip, { dataTransfer })
    // jsdom has no layout, so the pointer counts as the bottom half: "after C".
    fireEvent.dragOver(cardC, { dataTransfer })
    fireEvent.drop(cardC, { dataTransfer })

    expect(canvasLabels()).toEqual(['B', 'C', 'A'])
  })

  test('dragging a palette item onto the canvas inserts a new field at the drop point', () => {
    seedThreeFields()
    const [cardA] = within(canvas()).getAllByRole('listitem')
    const dataTransfer = createDataTransfer()

    const palette = screen.getByRole('navigation', { name: 'Add fields' })
    fireEvent.dragStart(
      within(palette).getByRole('button', { name: /single line text/i }),
      {
        dataTransfer,
      },
    )
    fireEvent.dragOver(cardA, { dataTransfer })
    fireEvent.drop(cardA, { dataTransfer })

    expect(canvasLabels()).toEqual(['A', 'Single line text', 'B', 'C'])
  })
})

describe('preview', () => {
  test('previews unsaved changes, validates on submit, and saves nothing', async () => {
    const user = userEvent.setup()
    saveTemplate(buildTemplate('t1'))
    renderRoute('/templates/t1/edit')

    // Unsaved edits: rename the field and make it required.
    const labelInput = screen.getByRole('textbox', { name: 'Label' })
    await user.clear(labelInput)
    await user.type(labelInput, 'Email')
    await user.click(screen.getByRole('switch', { name: 'Required' }))

    await user.click(screen.getByRole('button', { name: 'Preview' }))
    const preview = screen.getByRole('dialog', { name: 'Form preview' })
    const emailInput = within(preview).getByRole('textbox', { name: /email/i })

    await user.click(within(preview).getByRole('button', { name: 'Submit' }))
    expect(within(preview).getByText('This field is required.')).toBeInTheDocument()

    await user.type(emailInput, 'jane@example.com')
    await user.click(within(preview).getByRole('button', { name: 'Submit' }))
    expect(
      within(preview).getByText('This response would be accepted'),
    ).toBeInTheDocument()
    expect(loadResponsesForTemplate('t1')).toHaveLength(0)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Form preview' })).not.toBeInTheDocument()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })
})
