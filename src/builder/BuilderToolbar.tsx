import { Link } from 'react-router'
import { Button } from '../ui/Button/Button'
import { CheckIcon, ChevronLeftIcon, EyeIcon } from '../ui/icons/icons'
import styles from './BuilderToolbar.module.css'

export type SaveStatus = 'new' | 'unsaved' | 'saved'

interface BuilderToolbarProps {
  title: string
  saveStatus: SaveStatus
  isTitleInvalid: boolean
  onTitleChange: (title: string) => void
  onSave: () => void
}

const statusLabels: Record<SaveStatus, string> = {
  new: 'Not saved yet',
  unsaved: 'Unsaved changes',
  saved: 'Saved',
}

export default function BuilderToolbar({
  title,
  saveStatus,
  isTitleInvalid,
  onTitleChange,
  onSave,
}: BuilderToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <Link to="/" className={styles.back}>
        <ChevronLeftIcon />
        Templates
      </Link>
      <input
        className={`${styles.title} ${isTitleInvalid ? styles.titleInvalid : ''}`}
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Untitled form"
        aria-label="Form title"
        aria-invalid={isTitleInvalid || undefined}
      />
      <span className={styles.status}>
        {saveStatus === 'unsaved' && <span className={styles.dot} aria-hidden="true" />}
        {saveStatus === 'saved' && <CheckIcon />}
        {statusLabels[saveStatus]}
      </span>
      <div className={styles.actions}>
        <Button disabled title="Available in a later step">
          <EyeIcon />
          Preview
        </Button>
        <Button variant="primary" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}
