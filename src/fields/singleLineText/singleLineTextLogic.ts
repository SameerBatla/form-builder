import { createDefaultRequiredRules, createDefaultVisibility } from '../fieldBase'
import type { FieldDefinition } from '../logicTypes'

export const singleLineTextDefinition: FieldDefinition<'singleLineText'> = {
  type: 'singleLineText',
  displayName: 'Single line text',
  createField: (id) => {
    return {
      id,
      type: 'singleLineText',
      label: 'Single line text',
      config: {
        placeholder: '',
        minLength: null,
        maxLength: null,
        prefix: '',
        suffix: '',
      },
      visibility: createDefaultVisibility(),
      required: createDefaultRequiredRules(),
    }
  },
}
