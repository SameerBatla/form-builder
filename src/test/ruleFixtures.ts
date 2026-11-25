import type { Condition } from '../fields/conditionSchema'
import type { RuleMatch } from '../fields/fieldBase'
import type { Field } from '../fields/fieldUnion'
import { createField } from '../fields/logicRegistry'

/** Text-equals condition, the most common shape in rule tests. */
export function whenText(
  targetId: string,
  value: string,
  id = `${targetId}=${value}`,
): Condition {
  return { id, targetId, kind: 'text', operator: 'equals', value }
}

interface RuleOptions {
  hidden?: boolean
  required?: boolean
  showWhen?: Condition[]
  hideWhen?: Condition[]
  requireWhen?: Condition[]
  optionalWhen?: Condition[]
  match?: RuleMatch
}

/**
 * A single line text field with rules. "showWhen" implies default hidden,
 * "requireWhen" implies default optional, and so on: the effect is always the
 * opposite of the default, as in the app.
 */
export function ruleField(id: string, options: RuleOptions = {}): Field {
  const field = createField('singleLineText', id)
  if (field.type !== 'singleLineText') {
    throw new Error('expected a single line text field')
  }
  const match = options.match ?? 'all'
  const isHidden = options.hidden ?? options.showWhen !== undefined
  const isRequired = options.required ?? options.optionalWhen !== undefined
  return {
    ...field,
    label: id,
    visibility: {
      defaultState: isHidden ? 'hidden' : 'visible',
      match,
      conditions: options.showWhen ?? options.hideWhen ?? [],
    },
    required: {
      defaultState: isRequired ? 'required' : 'optional',
      match,
      conditions: options.requireWhen ?? options.optionalWhen ?? [],
    },
  }
}
