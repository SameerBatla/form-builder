import { useEffect, useReducer, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router'
import { countIssues, validateTemplate } from '../engine/validateTemplate'
import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldType } from '../fields/fieldUnion'
import { toLocalIsoDate } from '../lib/dates'
import { createId } from '../lib/id'
import type { Template } from '../storage/schema'
import { templateSchema } from '../storage/schema'
import { STORAGE_FULL_MESSAGE } from '../storage/storageMessages'
import { saveTemplate } from '../storage/templateStore'
import Banner from '../ui/Banner/Banner'
import ConfirmDialog from '../ui/ConfirmDialog/ConfirmDialog'
import type { SaveStatus } from './BuilderToolbar'
import BuilderToolbar from './BuilderToolbar'
import type { BuilderState } from './builderReducer'
import { builderReducer } from './builderReducer'
import ConfigPanel from './ConfigPanel'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import type { PendingChange } from './pendingChange'
import { findDeleteFieldChange, findRemoveOptionsChange } from './pendingChange'
import PendingChangeDialog from './PendingChangeDialog'
import PreviewModal from './PreviewModal'
import SaveIssuesBar from './SaveIssuesBar'
import styles from './TemplateBuilder.module.css'

/** True when this history entry was pushed by our own "Preview" button. */
function wasPreviewOpenedHere(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'openedPreview' in state
}

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
  // Shown when a valid form still couldn't be written (e.g. storage is full).
  const [saveError, setSaveError] = useState<string | null>(null)
  const [today] = useState(() => toLocalIsoDate())
  // Preview lives in the URL (?preview=1) so the browser's Back button closes it
  // instead of leaving the builder. Search-only changes don't trip the blocker below.
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isPreviewOpen = searchParams.get('preview') === '1'
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)

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
    const change = findRemoveOptionsChange(state.fields, field)
    if (change) {
      setPendingChange(change)
      return
    }
    dispatch({ type: 'updateField', field })
  }

  const handleMoveField = (fieldId: FieldId, toIndex: number) => {
    dispatch({ type: 'moveField', fieldId, toIndex })
  }

  const handleInsertField = (fieldType: FieldType, index: number) => {
    dispatch({ type: 'addField', fieldType, fieldId: createId(), index })
  }

  const handleDeleteField = (fieldId: FieldId) => {
    const change = findDeleteFieldChange(state.fields, fieldId)
    if (change) {
      setPendingChange(change)
      return
    }
    dispatch({ type: 'deleteField', fieldId })
  }

  // Deleting or removing options that rules use is confirmed first (Q9, Q10).
  const handleConfirmPendingChange = () => {
    if (pendingChange?.kind === 'deleteField') {
      dispatch({ type: 'deleteField', fieldId: pendingChange.fieldId })
    } else if (pendingChange?.kind === 'removeOptions') {
      dispatch({ type: 'updateField', field: pendingChange.field })
    }
    setPendingChange(null)
  }

  const handleOpenPreview = () => {
    setSearchParams({ preview: '1' }, { state: { openedPreview: true } })
  }

  const handleClosePreview = () => {
    if (wasPreviewOpenedHere(location.state)) {
      // Same as pressing Back: pops the entry "Preview" pushed.
      navigate(-1)
    } else {
      // Opened from the URL directly (e.g. after a refresh): just drop the flag.
      setSearchParams({}, { replace: true })
    }
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
      setSaveError(
        'This form has a setting that can’t be saved. Please check the fields.',
      )
      return
    }
    if (!saveTemplate(template)) {
      // Nothing is lost: the edits stay in the builder until a save succeeds.
      setSaveError(`${STORAGE_FULL_MESSAGE} Your changes are still here.`)
      return
    }
    setSaveError(null)
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
        onPreview={handleOpenPreview}
        onSave={handleSave}
      />
      {saveError && (
        <Banner tone="warning" onDismiss={() => setSaveError(null)}>
          {saveError}
        </Banner>
      )}
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
            fields={state.fields}
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
          onClose={handleClosePreview}
        />
      )}
      {pendingChange && (
        <PendingChangeDialog
          change={pendingChange}
          onConfirm={handleConfirmPendingChange}
          onCancel={() => setPendingChange(null)}
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
