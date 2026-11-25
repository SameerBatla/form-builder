import { createCondition, getEligibleTargets } from '../../engine/conditionBuilder'
import type { Condition } from '../../fields/conditionSchema'
import type { FieldId, RuleMatch } from '../../fields/fieldBase'
import type { Field } from '../../fields/fieldUnion'
import { createId } from '../../lib/id'
import { Button } from '../../ui/Button/Button'
import { PlusIcon } from '../../ui/icons/icons'
import Select from '../../ui/Select/Select'
import ConditionRow from './ConditionRow'
import styles from './Logic.module.css'

interface RuleGroup<State extends string> {
  defaultState: State
  match: RuleMatch
  conditions: Condition[]
}

interface RuleGroupEditorProps<State extends string> {
  title: string
  ownerId: FieldId
  fields: Field[]
  group: RuleGroup<State>
  /** The two default states, e.g. visible / hidden. */
  states: [State, State]
  stateLabels: Record<State, string>
  /** What the conditions do from each default, e.g. hidden → "Show it when". */
  effectLabels: Record<State, string>
  onChange: (group: RuleGroup<State>) => void
}

/**
 * One rule group as a sentence: "This field is [Hidden]. Show it when [all] of
 * these match: …". The effect is always the opposite of the default.
 */
export default function RuleGroupEditor<State extends string>({
  title,
  ownerId,
  fields,
  group,
  states,
  stateLabels,
  effectLabels,
  onChange,
}: RuleGroupEditorProps<State>) {
  const eligibleTargets = getEligibleTargets(fields, ownerId)
  const idPrefix = `rules-${ownerId}-${title.toLowerCase()}`

  const handleDefaultChange = (value: string) => {
    const defaultState = states.find((state) => state === value)
    if (defaultState) {
      onChange({ ...group, defaultState })
    }
  }

  const handleAddCondition = () => {
    const [firstTarget] = eligibleTargets
    if (firstTarget) {
      const condition = createCondition(createId(), firstTarget)
      onChange({ ...group, conditions: [...group.conditions, condition] })
    }
  }

  const handleConditionChange = (index: number, condition: Condition) => {
    onChange({ ...group, conditions: group.conditions.with(index, condition) })
  }

  const handleConditionRemove = (index: number) => {
    onChange({ ...group, conditions: group.conditions.toSpliced(index, 1) })
  }

  return (
    <section className={styles.group} aria-labelledby={`${idPrefix}-title`}>
      <h3 id={`${idPrefix}-title`} className="eyebrow">
        {title}
      </h3>
      <div className={styles.sentence}>
        <label htmlFor={`${idPrefix}-default`}>This field is</label>
        <Select
          id={`${idPrefix}-default`}
          value={group.defaultState}
          onChange={(event) => handleDefaultChange(event.target.value)}
        >
          {states.map((state) => (
            <option key={state} value={state}>
              {stateLabels[state]}
            </option>
          ))}
        </Select>
      </div>

      {group.conditions.length > 0 && (
        <>
          <div className={styles.sentence}>
            <span>{effectLabels[group.defaultState]}</span>
            {group.conditions.length > 1 ? (
              <>
                <Select
                  aria-label="Match"
                  value={group.match}
                  onChange={(event) =>
                    onChange({
                      ...group,
                      match: event.target.value === 'any' ? 'any' : 'all',
                    })
                  }
                >
                  <option value="all">all</option>
                  <option value="any">any</option>
                </Select>
                <span>of these match:</span>
              </>
            ) : (
              <span>this matches:</span>
            )}
          </div>
          <ol className={styles.conditions}>
            {group.conditions.map((condition, index) => (
              <ConditionRow
                key={condition.id}
                condition={condition}
                eligibleTargets={eligibleTargets}
                fields={fields}
                onChange={(next) => handleConditionChange(index, next)}
                onRemove={() => handleConditionRemove(index)}
              />
            ))}
          </ol>
        </>
      )}

      <div>
        <Button
          size="small"
          onClick={handleAddCondition}
          disabled={eligibleTargets.length === 0}
        >
          <PlusIcon />
          Add condition
        </Button>
        {eligibleTargets.length === 0 && (
          <p className={styles.hint}>
            Add a text, number, date or choice field to use it in a rule.
          </p>
        )}
      </div>
    </section>
  )
}
