import type { DragEvent } from 'react'
import type { FieldType } from '../fields/fieldUnion'
import { fieldTypes, getFieldDefinition } from '../fields/logicRegistry'
import { fieldUis, paletteGroups } from '../fields/uiRegistry'
import IconTile from '../ui/IconTile/IconTile'
import { DRAG_FIELD_TYPE } from './dragData'
import styles from './FieldPalette.module.css'

interface FieldPaletteProps {
  onAddField: (fieldType: FieldType) => void
}

function handleItemDragStart(event: DragEvent<HTMLButtonElement>, fieldType: FieldType) {
  event.dataTransfer.setData(DRAG_FIELD_TYPE, fieldType)
  event.dataTransfer.effectAllowed = 'copy'
}

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <nav className={styles.palette} aria-label="Add fields">
      <h2 className={styles.title}>Add fields</h2>
      {paletteGroups.map((group) => {
        const typesInGroup = fieldTypes.filter(
          (type) => fieldUis[type].group === group.id,
        )
        if (typesInGroup.length === 0) {
          return null
        }
        return (
          <section key={group.id} className={styles.group}>
            <h3 className="eyebrow">{group.label}</h3>
            <ul className={styles.list}>
              {typesInGroup.map((type) => {
                const { icon: Icon, description } = fieldUis[type]
                return (
                  <li key={type}>
                    <button
                      type="button"
                      className={styles.item}
                      draggable
                      onDragStart={(event) => handleItemDragStart(event, type)}
                      onClick={() => onAddField(type)}
                    >
                      <IconTile>
                        <Icon />
                      </IconTile>
                      <span className={styles.itemText}>
                        <span className={styles.itemName}>
                          {getFieldDefinition(type).displayName}
                        </span>
                        <span className={styles.itemDescription}>{description}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </nav>
  )
}
