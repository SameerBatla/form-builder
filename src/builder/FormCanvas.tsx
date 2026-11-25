import { useState } from 'react'
import type { DragEvent } from 'react'
import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldType } from '../fields/fieldUnion'
import { isFieldType } from '../fields/logicRegistry'
import { finalIndexForDrop } from './builderReducer'
import type { DropPosition } from './CanvasFieldCard'
import CanvasFieldCard from './CanvasFieldCard'
import { DRAG_FIELD_ID, DRAG_FIELD_TYPE } from './dragData'
import styles from './FormCanvas.module.css'

interface FormCanvasProps {
  fields: Field[]
  selectedFieldId: FieldId | null
  /** Config issues per field; empty until the user tries to save. */
  fieldIssues: Record<FieldId, string[]>
  today: string
  onSelectField: (fieldId: FieldId) => void
  onDeleteField: (fieldId: FieldId) => void
  onMoveField: (fieldId: FieldId, toIndex: number) => void
  onInsertField: (fieldType: FieldType, index: number) => void
}

function isOurDrag(event: DragEvent) {
  const { types } = event.dataTransfer
  return types.includes(DRAG_FIELD_ID) || types.includes(DRAG_FIELD_TYPE)
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  fieldIssues,
  today,
  onSelectField,
  onDeleteField,
  onMoveField,
  onInsertField,
}: FormCanvasProps) {
  // UI-only drag state: which field is being dragged, and where it would land.
  const [draggingFieldId, setDraggingFieldId] = useState<FieldId | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (isOurDrag(event)) {
      // Allows the drop; without this the browser rejects it.
      event.preventDefault()
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setDropIndex(null)
    }
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const insertionIndex = dropIndex ?? fields.length
    const movedFieldId = event.dataTransfer.getData(DRAG_FIELD_ID)
    const newFieldType = event.dataTransfer.getData(DRAG_FIELD_TYPE)

    if (movedFieldId) {
      const fromIndex = fields.findIndex((field) => field.id === movedFieldId)
      if (fromIndex !== -1) {
        onMoveField(movedFieldId, finalIndexForDrop(fromIndex, insertionIndex))
      }
    } else if (isFieldType(newFieldType)) {
      onInsertField(newFieldType, insertionIndex)
    }
    setDropIndex(null)
    setDraggingFieldId(null)
  }

  const handleDragEnd = () => {
    setDraggingFieldId(null)
    setDropIndex(null)
  }

  if (fields.length === 0) {
    return (
      <div
        className={`${styles.empty} ${dropIndex !== null ? styles.emptyActive : ''}`}
        onDragOver={(event) => {
          handleDragOver(event)
          setDropIndex(0)
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className={styles.emptyTitle}>Your form is empty</p>
        <p className="muted">Drag a field here, or click one on the left.</p>
      </div>
    )
  }

  return (
    <ol
      className={styles.list}
      aria-label="Form fields"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {fields.map((field, index) => {
        let dropPosition: DropPosition = null
        if (dropIndex === index) {
          dropPosition = 'before'
        } else if (dropIndex === fields.length && index === fields.length - 1) {
          dropPosition = 'after'
        }
        return (
          <CanvasFieldCard
            key={field.id}
            field={field}
            isSelected={field.id === selectedFieldId}
            hasIssues={field.id in fieldIssues}
            isFirst={index === 0}
            isLast={index === fields.length - 1}
            isDragging={field.id === draggingFieldId}
            dropPosition={dropPosition}
            today={today}
            onSelect={() => onSelectField(field.id)}
            onDelete={() => onDeleteField(field.id)}
            onMoveUp={() => onMoveField(field.id, index - 1)}
            onMoveDown={() => onMoveField(field.id, index + 1)}
            onDragStart={() => setDraggingFieldId(field.id)}
            onDragEnd={handleDragEnd}
            onDragOverHalf={(half) => setDropIndex(half === 'top' ? index : index + 1)}
          />
        )
      })}
    </ol>
  )
}
