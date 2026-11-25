import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { saveTemplate } from '../storage/templateStore'
import { buildTemplate } from '../test/fixtures'
import { renderRoute } from '../test/renderRoute'
import { createField, fieldTypes, getFieldDefinition } from './logicRegistry'

// Guards the registry: every registered type must render in the builder and in fill mode.
beforeEach(() => {
  localStorage.clear()
  const fields = fieldTypes.map((type) => createField(type, `field-${type}`))
  saveTemplate(buildTemplate('all', { fields }))
})

test('the builder canvas shows a card for every field type', () => {
  renderRoute('/templates/all/edit')
  const canvas = screen.getByRole('list', { name: 'Form fields' })
  for (const type of fieldTypes) {
    const typeName = getFieldDefinition(type).displayName
    expect(within(canvas).getAllByText(typeName).length).toBeGreaterThan(0)
  }
})

test('fill mode renders every field type', () => {
  renderRoute('/templates/all/fill')
  for (const type of fieldTypes) {
    const { label } = createField(type, 'any')
    expect(screen.getAllByText(label).length).toBeGreaterThan(0)
  }
})
