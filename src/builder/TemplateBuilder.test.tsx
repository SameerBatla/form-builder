import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import { createField } from '../fields/logicRegistry'
import { loadResponsesForTemplate } from '../storage/responseStore'
import { loadTemplate, loadTemplates, saveTemplate } from '../storage/templateStore'
import { buildTemplate } from '../test/fixtures'
import { whenText } from '../test/ruleFixtures'
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

describe('rule editor', () => {
  function seedTwoFields() {
    const fields = [
      { ...createField('singleLineText', 'hasCar'), label: 'Has car' },
      { ...createField('singleLineText', 'plate'), label: 'Plate' },
    ]
    saveTemplate(buildTemplate('t1', { fields }))
    renderRoute('/templates/t1/edit')
  }

  test('build "show Plate when Has car equals yes", then see it work in Preview', async () => {
    const user = userEvent.setup()
    seedTwoFields()

    await user.click(within(canvas()).getByRole('button', { name: /^Plate,/ }))
    await user.click(screen.getByRole('tab', { name: 'Logic' }))
    const visibility = screen.getByRole('region', { name: 'Visibility' })
    await user.selectOptions(within(visibility).getByLabelText('This field is'), 'Hidden')
    await user.click(within(visibility).getByRole('button', { name: 'Add condition' }))

    expect(within(visibility).getByLabelText('Field to check')).toHaveDisplayValue(
      'Has car',
    )
    expect(within(visibility).getByText('Show it when')).toBeInTheDocument()
    await user.type(within(visibility).getByRole('textbox', { name: 'Value' }), 'yes')
    expect(within(canvas()).getByText('Logic')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Preview' }))
    const preview = screen.getByRole('dialog', { name: 'Form preview' })
    expect(
      within(preview).queryByRole('textbox', { name: 'Plate' }),
    ).not.toBeInTheDocument()
    await user.type(within(preview).getByRole('textbox', { name: 'Has car' }), 'Yes')
    expect(within(preview).getByRole('textbox', { name: 'Plate' })).toBeInTheDocument()
  })

  test('a field is never offered as its own rule target', async () => {
    const user = userEvent.setup()
    seedTwoFields()
    await user.click(within(canvas()).getByRole('button', { name: /^Plate,/ }))
    await user.click(screen.getByRole('tab', { name: 'Logic' }))
    const visibility = screen.getByRole('region', { name: 'Visibility' })
    await user.click(within(visibility).getByRole('button', { name: 'Add condition' }))

    const targetOptions = within(within(visibility).getByLabelText('Field to check'))
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(targetOptions).toEqual(['Has car'])
  })

  test('an incomplete rule blocks Save', async () => {
    const user = userEvent.setup()
    seedTwoFields()
    await user.click(within(canvas()).getByRole('button', { name: /^Plate,/ }))
    await user.click(screen.getByRole('tab', { name: 'Logic' }))
    const visibility = screen.getByRole('region', { name: 'Visibility' })
    await user.click(within(visibility).getByRole('button', { name: 'Add condition' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getAllByRole('alert')[0]).toHaveTextContent(
      'A rule on “Has car” needs a value to compare with.',
    )
  })
})

describe('cascades with confirmation', () => {
  function seedRule() {
    const hasCar = { ...createField('singleLineText', 'hasCar'), label: 'Has car' }
    const plate = createField('singleLineText', 'plate')
    if (plate.type !== 'singleLineText') {
      throw new Error('expected text')
    }
    const plateWithRule = {
      ...plate,
      label: 'Plate',
      visibility: {
        defaultState: 'hidden' as const,
        match: 'all' as const,
        conditions: [whenText('hasCar', 'yes')],
      },
    }
    saveTemplate(buildTemplate('t1', { fields: [hasCar, plateWithRule] }))
    renderRoute('/templates/t1/edit')
  }

  test('deleting a field used by a rule asks first; Cancel keeps it', async () => {
    const user = userEvent.setup()
    seedRule()
    await user.click(screen.getByRole('button', { name: 'Delete Has car' }))

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Delete “Has car”?')
    expect(dialog).toHaveTextContent('1 rule in “Plate”')

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(within(canvas()).getAllByRole('listitem')).toHaveLength(2)
  })

  test('confirming deletes the field and the rule that used it', async () => {
    const user = userEvent.setup()
    seedRule()
    await user.click(screen.getByRole('button', { name: 'Delete Has car' }))
    await user.click(screen.getByRole('button', { name: 'Delete field and rules' }))

    expect(within(canvas()).getAllByRole('listitem')).toHaveLength(1)
    expect(within(canvas()).queryByText('Logic')).not.toBeInTheDocument()
  })
})

test('removing a select option used by a rule asks first, then removes the rule', async () => {
  const user = userEvent.setup()
  const colour = createField('singleSelect', 'colour')
  if (colour.type !== 'singleSelect') {
    throw new Error('expected a single select')
  }
  const colourField = {
    ...colour,
    label: 'Colour',
    config: {
      ...colour.config,
      options: [
        { id: 'red', label: 'Red' },
        { id: 'blue', label: 'Blue' },
      ],
    },
  }
  const note = {
    ...createField('singleLineText', 'note'),
    label: 'Note',
    visibility: {
      defaultState: 'hidden' as const,
      match: 'all' as const,
      conditions: [
        {
          id: 'c',
          targetId: 'colour',
          kind: 'singleSelect' as const,
          operator: 'equals' as const,
          value: 'red',
        },
      ],
    },
  }
  saveTemplate(buildTemplate('t1', { fields: [colourField, note] }))
  renderRoute('/templates/t1/edit')

  await user.click(screen.getByRole('button', { name: 'Remove Red' }))
  expect(screen.getByRole('alertdialog')).toHaveTextContent(
    '“Red” is used in rules on “Note”. Removing it also updates or removes those rules.',
  )
  await user.click(screen.getByRole('button', { name: 'Remove and update rules' }))

  expect(screen.queryByRole('textbox', { name: 'Option 2' })).not.toBeInTheDocument()
  expect(within(canvas()).queryByText('Logic')).not.toBeInTheDocument()
})

describe('preview and the Back button', () => {
  test('Back closes the preview and stays in the builder, without the unsaved-changes prompt', async () => {
    const user = userEvent.setup()
    saveTemplate(buildTemplate('t1'))
    const { router } = renderRoute('/templates/t1/edit')
    // An unsaved change, so leaving the builder would ask first.
    await user.type(screen.getByRole('textbox', { name: 'Label' }), '!')

    await user.click(screen.getByRole('button', { name: 'Preview' }))
    expect(router.state.location.search).toBe('?preview=1')
    expect(screen.getByRole('dialog', { name: 'Form preview' })).toBeInTheDocument()

    await act(() => router.navigate(-1))

    expect(screen.queryByRole('dialog', { name: 'Form preview' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/templates/t1/edit')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  test('Close preview returns to the builder; a direct ?preview=1 link can be closed too', async () => {
    const user = userEvent.setup()
    saveTemplate(buildTemplate('t1'))
    const { router } = renderRoute('/templates/t1/edit?preview=1')
    expect(screen.getByRole('dialog', { name: 'Form preview' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close preview' }))
    expect(screen.queryByRole('dialog', { name: 'Form preview' })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/templates/t1/edit')
    expect(router.state.location.search).toBe('')
  })
})
