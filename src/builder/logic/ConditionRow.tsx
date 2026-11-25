import type { Condition } from '../../fields/conditionSchema'
import type { Field } from '../../fields/fieldUnion'
import {
  changeConditionOperator,
  changeConditionTarget,
  choiceKey,
  choicesForTarget,
} from '../../engine/conditionBuilder'
import { Button } from '../../ui/Button/Button'
import { XIcon } from '../../ui/icons/icons'
import Select from '../../ui/Select/Select'
import ConditionValueInput from './ConditionValueInput'
import styles from './Logic.module.css'

interface ConditionRowProps {
  condition: Condition
  /** Fields this condition may point at (excludes the owner and anything that would loop). */
  eligibleTargets: Field[]
  fields: Field[]
  onChange: (condition: Condition) => void
  onRemove: () => void
}

function labelOf(field: Field) {
  return field.label.trim() || 'Untitled field'
}

export default function ConditionRow({
  condition,
  eligibleTargets,
  fields,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const target = fields.find((field) => field.id === condition.targetId)
  const idPrefix = `condition-${condition.id}`

  const handleTargetChange = (targetId: string) => {
    const nextTarget = fields.find((field) => field.id === targetId)
    if (nextTarget) {
      onChange(changeConditionTarget(condition, nextTarget))
    }
  }

  const handleOperatorChange = (key: string) => {
    if (!target) {
      return
    }
    const choice = choicesForTarget(target).find(
      (candidate) => choiceKey(candidate) === key,
    )
    if (choice) {
      onChange(changeConditionOperator(condition, choice, target))
    }
  }

  return (
    <li className={styles.condition}>
      <div className={styles.conditionHeader}>
        <Select
          id={`${idPrefix}-target`}
          aria-label="Field to check"
          value={condition.targetId}
          onChange={(event) => handleTargetChange(event.target.value)}
        >
          {!target && <option value={condition.targetId}>Missing field</option>}
          {eligibleTargets.map((field) => (
            <option key={field.id} value={field.id}>
              {labelOf(field)}
            </option>
          ))}
        </Select>
        <Button
          variant="ghostDanger"
          size="small"
          iconOnly
          aria-label="Remove condition"
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
      {target && (
        <>
          <Select
            id={`${idPrefix}-operator`}
            aria-label="Operator"
            value={choiceKey(condition)}
            onChange={(event) => handleOperatorChange(event.target.value)}
          >
            {choicesForTarget(target).map((choice) => (
              <option key={choiceKey(choice)} value={choiceKey(choice)}>
                {choice.label}
              </option>
            ))}
          </Select>
          <ConditionValueInput
            id={`${idPrefix}-value`}
            condition={condition}
            target={target}
            onChange={onChange}
          />
        </>
      )}
    </li>
  )
}
