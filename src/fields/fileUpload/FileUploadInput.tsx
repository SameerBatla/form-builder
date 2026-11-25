import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { formatFileSize, pluralize } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { PaperclipIcon, XIcon } from '../../ui/icons/icons'
import { createGroupBlurHandler } from '../shared/groupBlur'
import type { FillInputProps } from '../uiTypes'
import { addFiles } from './fileUploadLogic'
import type { FileMeta } from './fileUploadSchema'
import styles from './FileUploadInput.module.css'

function toFileMeta(files: FileList | null): FileMeta[] {
  return Array.from(files ?? [], (file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
  }))
}

export default function FileUploadInput({
  field,
  value,
  onChange,
  onBlur,
  inputId,
  labelId,
  isInvalid,
  isDisabled = false,
}: FillInputProps<'fileUpload'>) {
  const { allowedTypes, maxFiles } = field.config
  const fileInputRef = useRef<HTMLInputElement>(null)
  // UI-only feedback about the last files that couldn't be added.
  const [rejections, setRejections] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const isFull = value.length >= maxFiles

  const handleIncoming = (incoming: FileMeta[]) => {
    const result = addFiles(value, incoming, field.config)
    setRejections(result.rejections)
    onChange(result.files)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (!isDisabled) {
      handleIncoming(toFileMeta(event.dataTransfer.files))
    }
  }

  const handleRemove = (index: number) => {
    setRejections([])
    onChange(value.toSpliced(index, 1))
  }

  const typesHint = allowedTypes.length > 0 ? allowedTypes.join(', ') : 'Any file type'

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={isInvalid ? `${inputId}-error` : undefined}
      className={styles.wrapper}
      onBlur={createGroupBlurHandler(onBlur)}
    >
      <div
        className={[
          styles.dropzone,
          isDragOver ? styles.dragOver : '',
          isInvalid ? styles.invalid : '',
        ].join(' ')}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <PaperclipIcon size={20} />
        <p>
          Drop files here or{' '}
          <Button
            id={inputId}
            size="small"
            disabled={isDisabled || isFull}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse
          </Button>
        </p>
        <p className={styles.hint}>
          {typesHint} · up to {pluralize(maxFiles, 'file')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          multiple={maxFiles > 1}
          accept={allowedTypes.join(',') || undefined}
          onChange={(event) => {
            handleIncoming(toFileMeta(event.target.files))
            // Allows choosing the same file again after removing it.
            event.target.value = ''
          }}
        />
      </div>

      {rejections.length > 0 && (
        <ul className={styles.rejections} role="status">
          {rejections.map((rejection) => (
            <li key={rejection}>{rejection}</li>
          ))}
        </ul>
      )}

      {value.length > 0 && (
        <ul className={styles.files}>
          {value.map((file, index) => (
            <li key={`${file.name}-${index}`} className={styles.file}>
              <PaperclipIcon />
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
              <Button
                variant="ghostDanger"
                size="small"
                iconOnly
                aria-label={`Remove ${file.name}`}
                disabled={isDisabled}
                onClick={() => handleRemove(index)}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
