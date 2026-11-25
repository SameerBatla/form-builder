import { createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'

export const sectionHeaderDefinition: FieldDefinition<'sectionHeader'> = {
  type: 'sectionHeader',
  displayName: 'Section header',
  capturesValue: false,
  createField: (id) => {
    return {
      id,
      type: 'sectionHeader',
      label: 'Section title',
      config: { size: 'md' },
      visibility: createDefaultVisibility(),
    }
  },
  initialValue: () => null,
  validateConfig: () => [],
  // Nothing to answer, so "empty" never triggers anything (it is never required).
  isEmpty: () => true,
  validateValue: () => null,
}
