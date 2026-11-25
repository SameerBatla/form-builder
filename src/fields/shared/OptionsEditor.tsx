import type { Option } from '../fieldBase'
import { Button } from '../../ui/Button/Button'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from '../../ui/icons/icons'
import TextInput from '../../ui/TextInput/TextInput'
import { createOption } from './options'
import styles from './OptionsEditor.module.css'

interface OptionsEditorProps {
  idPrefix: string
  options: Option[]
  onChange: (options: Option[]) => void
}

/** Add, rename, reorder and remove the options of a select field. */
export default function OptionsEditor({
  idPrefix,
  options,
  onChange,
}: OptionsEditorProps) {
  const handleRename = (optionId: string, label: string) => {
    onChange(
      options.map((option) => (option.id === optionId ? { ...option, label } : option)),
    )
  }

  const handleMove = (index: number, toIndex: number) => {
    const moved = options[index]
    onChange(options.toSpliced(index, 1).toSpliced(toIndex, 0, moved))
  }

  const handleRemove = (optionId: string) => {
    onChange(options.filter((option) => option.id !== optionId))
  }

  const handleAdd = () => {
    onChange([...options, createOption(`Option ${options.length + 1}`)])
  }

  return (
    <div className={styles.editor}>
      <ol className={styles.list}>
        {options.map((option, index) => {
          const name = option.label.trim() || `option ${index + 1}`
          return (
            <li key={option.id} className={styles.row}>
              <TextInput
                id={`${idPrefix}-option-${option.id}`}
                value={option.label}
                onChange={(event) => handleRename(option.id, event.target.value)}
                aria-label={`Option ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="small"
                iconOnly
                aria-label={`Move ${name} up`}
                disabled={index === 0}
                onClick={() => handleMove(index, index - 1)}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                variant="ghost"
                size="small"
                iconOnly
                aria-label={`Move ${name} down`}
                disabled={index === options.length - 1}
                onClick={() => handleMove(index, index + 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                variant="ghostDanger"
                size="small"
                iconOnly
                aria-label={`Remove ${name}`}
                onClick={() => handleRemove(option.id)}
              >
                <XIcon />
              </Button>
            </li>
          )
        })}
      </ol>
      <Button size="small" onClick={handleAdd}>
        <PlusIcon />
        Add option
      </Button>
    </div>
  )
}
