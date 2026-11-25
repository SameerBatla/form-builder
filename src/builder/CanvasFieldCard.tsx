import { useRef } from 'react'
import type { DragEvent } from 'react'
import { FieldRow } from '../fields/FieldComponents'
import type { Field } from '../fields/fieldUnion'
import { getRequiredRules } from '../fields/fieldUnion'
import { getFieldDefinition, getInitialValue } from '../fields/logicRegistry'
import { fieldUis } from '../fields/uiRegistry'
import Badge from '../ui/Badge/Badge'
import { Button } from '../ui/Button/Button'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BranchIcon,
  EyeOffIcon,
  GripIcon,
  TrashIcon,
} from '../ui/icons/icons'
import styles from './CanvasFieldCard.module.css'
import { DRAG_FIELD_ID } from './dragData'

export type DropPosition = 'before' | 'after' | null

interface CanvasFieldCardProps {
  field: Field
  isSelected: boolean
  hasIssues: boolean
  isFirst: boolean
  isLast: boolean
  isDragging: boolean
  /** Where the drop indicator line shows on this card. */
  dropPosition: DropPosition
  today: string
  onSelect: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDragStart: () => void
  onDragEnd: () => void
  /** Reports whether the pointer is over the top or bottom half of this card. */
  onDragOverHalf: (half: 'top' | 'bottom') => void
}

/** One field on the canvas: a disabled live preview of the real fill-mode input. */
export default function CanvasFieldCard({
  field,
  isSelected,
  hasIssues,
  isFirst,
  isLast,
  isDragging,
  dropPosition,
  today,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOverHalf,
}: CanvasFieldCardProps) {
  const cardRef = useRef<HTMLLIElement>(null)
  const { icon: Icon } = fieldUis[field.type]
  const typeName = getFieldDefinition(field.type).displayName
  const label = field.label.trim() || 'Untitled field'
  const requiredRules = getRequiredRules(field)
  const isRequiredByDefault = requiredRules?.defaultState === 'required'
  const hasRules =
    field.visibility.conditions.length > 0 || (requiredRules?.conditions.length ?? 0) > 0

  const handleGripDragStart = (event: DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.setData(DRAG_FIELD_ID, field.id)
    event.dataTransfer.effectAllowed = 'move'
    // Drag the whole card, not just the small handle.
    if (cardRef.current) {
      event.dataTransfer.setDragImage(cardRef.current, 24, 24)
    }
    onDragStart()
  }

  const handleDragOver = (event: DragEvent<HTMLLIElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const isTopHalf = event.clientY < bounds.top + bounds.height / 2
    onDragOverHalf(isTopHalf ? 'top' : 'bottom')
  }

  const classNames = [styles.card]
  if (isSelected) {
    classNames.push(styles.selected)
  }
  if (isDragging) {
    classNames.push(styles.dragging)
  }
  if (dropPosition) {
    classNames.push(dropPosition === 'before' ? styles.dropBefore : styles.dropAfter)
  }

  return (
    <li ref={cardRef} className={classNames.join(' ')} onDragOver={handleDragOver}>
      {/* Covers the whole card so a click anywhere selects it. */}
      <button
        type="button"
        className={styles.selectOverlay}
        aria-pressed={isSelected}
        aria-label={`${label}, ${typeName}${hasIssues ? ', needs attention' : ''}`}
        onClick={onSelect}
      />
      <div className={styles.header}>
        <span
          className={styles.grip}
          draggable
          onDragStart={handleGripDragStart}
          onDragEnd={onDragEnd}
          title="Drag to reorder"
          aria-hidden="true"
        >
          <GripIcon />
        </span>
        <Badge>
          <Icon size={12} />
          {typeName}
        </Badge>
        {isRequiredByDefault && <Badge tone="danger">Required</Badge>}
        {field.visibility.defaultState === 'hidden' && (
          <Badge>
            <EyeOffIcon size={12} />
            Hidden by default
          </Badge>
        )}
        {hasRules && (
          <Badge>
            <BranchIcon size={12} />
            Logic
          </Badge>
        )}
        {hasIssues && (
          <span className={styles.issueDot} title="Needs attention" aria-hidden="true" />
        )}
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="small"
            iconOnly
            aria-label={`Move ${label} up`}
            disabled={isFirst}
            onClick={onMoveUp}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="small"
            iconOnly
            aria-label={`Move ${label} down`}
            disabled={isLast}
            onClick={onMoveDown}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            variant="ghostDanger"
            size="small"
            iconOnly
            aria-label={`Delete ${label}`}
            onClick={onDelete}
          >
            <TrashIcon />
          </Button>
        </div>
      </div>
      <div className={styles.preview} inert>
        <FieldRow
          field={field}
          idPrefix="canvas"
          value={getInitialValue(field, today)}
          onChange={() => {}}
          isRequired={isRequiredByDefault}
          error={null}
          isDisabled
        />
      </div>
    </li>
  )
}
