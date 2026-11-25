import { useEffect, useReducer, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import { countIssues, validateTemplate } from '../engine/validateTemplate'
import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldType } from '../fields/fieldUnion'
import { toLocalIsoDate } from '../lib/dates'
import { createId } from '../lib/id'
import type { Template } from '../storage/schema'
import { templateSchema } from '../storage/schema'
import { saveTemplate } from '../storage/templateStore'
import ConfirmDialog from '../ui/ConfirmDialog/ConfirmDialog'
import type { SaveStatus } from './BuilderToolbar'
import BuilderToolbar from './BuilderToolbar'
import type { BuilderState } from './builderReducer'
import { builderReducer } from './builderReducer'
import ConfigPanel from './ConfigPanel'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import PreviewModal from './PreviewModal'
import SaveIssuesBar from './SaveIssuesBar'
import styles from './TemplateBuilder.module.css'

function toBuilderState(template: Template): BuilderState {
  return {
    title: template.title,
    fields: template.fields,
    selectedFieldId: template.fields[0]?.id ?? null,
  }
}

interface TemplateBuilderProps {
  initialTemplate: Template
  /** True until the template's first Save. */
  isNew: boolean
}

export default function TemplateBuilder({
  initialTemplate,
  isNew,
}: TemplateBuilderProps) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(builderReducer, initialTemplate, toBuilderState)
  // The last saved version; "unsaved changes" is derived by comparing against it.
  const [savedTemplate, setSavedTemplate] = useState(initialTemplate)
  // Issues stay hidden until the first blocked Save, then update live.
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false)
  const [today] = useState(() => toLocalIsoDate())
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Reference checks are enough: the reducer only creates new objects on real edits.
  const hasUnsavedChanges =
    state.title !== savedTemplate.title || state.fields !== savedTemplate.fields
  let saveStatus: SaveStatus = 'saved'
  if (hasUnsavedChanges) {
    saveStatus = 'unsaved'
  } else if (isNew) {
    saveStatus = 'new'
  }
  const issues = validateTemplate(state)
  const visibleIssues = hasAttemptedSave && countIssues(issues) > 0 ? issues : null
  const selectedField =
    state.fields.find((field) => field.id === state.selectedFieldId) ?? null

  const editPath = `/templates/${savedTemplate.id}/edit`
  // In-app navigation with unsaved work asks first. Our own redirect after the
  // first save is let through (it runs before this render sees the saved state).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname &&
      nextLocation.pathname !== editPath,
  )

  // Refresh or tab close: the browser shows its own "Leave site?" prompt.
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleAddField = (fieldType: FieldType) => {
    dispatch({ type: 'addField', fieldType, fieldId: createId() })
  }

  const handleSelectField = (fieldId: FieldId) => {
    dispatch({ type: 'selectField', fieldId })
  }

  const handleUpdateField = (field: Field) => {
    dispatch({ type: 'updateField', field })
  }

  const handleMoveField = (fieldId: FieldId, toIndex: number) => {
    dispatch({ type: 'moveField', fieldId, toIndex })
  }

  const handleInsertField = (fieldType: FieldType, index: number) => {
    dispatch({ type: 'addField', fieldType, fieldId: createId(), index })
  }

  const handleDeleteField = (fieldId: FieldId) => {
    dispatch({ type: 'deleteField', fieldId })
  }

  const handleTitleChange = (title: string) => {
    dispatch({ type: 'setTitle', title })
  }

  const handleSave = () => {
    setHasAttemptedSave(true)
    if (countIssues(issues) > 0) {
      return
    }
    const template: Template = {
      ...savedTemplate,
      title: state.title,
      fields: state.fields,
      updatedAt: new Date().toISOString(),
    }
    // Last line of defence: never write something the next load would reject.
    if (!templateSchema.safeParse(template).success) {
      window.alert(
        'This form has a setting that can’t be saved. Please check the fields.',
      )
      return
    }
    saveTemplate(template)
    setSavedTemplate(template)
    setHasAttemptedSave(false)
    if (isNew) {
      navigate(editPath, { replace: true })
    }
  }

  return (
    <div className={styles.builder}>
      <BuilderToolbar
        title={state.title}
        saveStatus={saveStatus}
        isTitleInvalid={visibleIssues !== null && state.title.trim() === ''}
        onTitleChange={handleTitleChange}
        onPreview={() => setIsPreviewOpen(true)}
        onSave={handleSave}
      />
      <div className={styles.panels}>
        <aside className={styles.palette}>
          <FieldPalette onAddField={handleAddField} />
        </aside>
        <main className={styles.canvas}>
          <div className={styles.canvasInner}>
            {visibleIssues && (
              <SaveIssuesBar
                issues={visibleIssues}
                fields={state.fields}
                onSelectField={handleSelectField}
              />
            )}
            <FormCanvas
              fields={state.fields}
              selectedFieldId={state.selectedFieldId}
              fieldIssues={visibleIssues?.fieldIssues ?? {}}
              today={today}
              onSelectField={handleSelectField}
              onDeleteField={handleDeleteField}
              onMoveField={handleMoveField}
              onInsertField={handleInsertField}
            />
          </div>
        </main>
        <aside className={styles.config} aria-label="Field settings">
          <ConfigPanel
            field={selectedField}
            issues={
              selectedField && visibleIssues
                ? (visibleIssues.fieldIssues[selectedField.id] ?? [])
                : []
            }
            onChange={handleUpdateField}
          />
        </aside>
      </div>
      {isPreviewOpen && (
        <PreviewModal
          title={state.title}
          fields={state.fields}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
      {blocker.state === 'blocked' && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          tone="danger"
          onConfirm={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
        >
          You have changes to this form that haven’t been saved.
        </ConfirmDialog>
      )}
    </div>
  )
}
