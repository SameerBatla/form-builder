import { useEffect, useReducer, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import type { FieldReference } from '../engine/references'
import { findFieldReferences, findOptionRuleImpact } from '../engine/references'
import { countIssues, validateTemplate } from '../engine/validateTemplate'
import type { FieldId } from '../fields/fieldBase'
import type { Field, FieldType } from '../fields/fieldUnion'
import { getFieldOptions } from '../fields/logicRegistry'
import { toLocalIsoDate } from '../lib/dates'
import { pluralize } from '../lib/format'
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

/** A change that needs the builder's confirmation because it also removes rules. */
type PendingChange =
  | { kind: 'deleteField'; fieldId: FieldId; label: string; references: FieldReference[] }
  | {
      kind: 'removeOptions'
      field: Field
      removedLabels: string[]
      affectedLabels: string[]
    }

function describeReference(reference: FieldReference): string {
  const parts: string[] = []
  if (reference.ruleCount > 0) {
    parts.push(`${pluralize(reference.ruleCount, 'rule')} in “${reference.label}”`)
  }
  if (reference.usesAsSource) {
    parts.push(`the calculation “${reference.label}”`)
  }
  return parts.join(' and ')
}

function describeOptionImpact(removedLabels: string[], affectedLabels: string[]): string {
  const quote = (labels: string[]) => labels.map((label) => `“${label}”`).join(', ')
  const verb = removedLabels.length === 1 ? 'is' : 'are'
  return `${quote(removedLabels)} ${verb} used in rules on ${quote(affectedLabels)}. Removing ${
    removedLabels.length === 1 ? 'it' : 'them'
  } also updates or removes those rules.`
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
  const [today] = useState(() => toLocalIsoDate())
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
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
    // Removing a select option that rules use: confirm first (Q10).
    const affectedLabels = findOptionRuleImpact(state.fields, field)
    if (affectedLabels.length > 0) {
      const previous = state.fields.find((candidate) => candidate.id === field.id)
      const keptIds = new Set(getFieldOptions(field).map((option) => option.id))
      const removedLabels = (previous ? getFieldOptions(previous) : [])
        .filter((option) => !keptIds.has(option.id))
        .map((option) => option.label.trim() || 'Untitled option')
      setPendingChange({ kind: 'removeOptions', field, removedLabels, affectedLabels })
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
    // Deleting a field other fields depend on: confirm, then cascade (Q9).
    const references = findFieldReferences(state.fields, fieldId)
    if (references.length > 0) {
      const field = state.fields.find((candidate) => candidate.id === fieldId)
      const label = field?.label.trim() || 'Untitled field'
      setPendingChange({ kind: 'deleteField', fieldId, label, references })
      return
    }
    dispatch({ type: 'deleteField', fieldId })
  }

  const handleConfirmPendingChange = () => {
    if (pendingChange?.kind === 'deleteField') {
      dispatch({ type: 'deleteField', fieldId: pendingChange.fieldId })
    } else if (pendingChange?.kind === 'removeOptions') {
      dispatch({ type: 'updateField', field: pendingChange.field })
    }
    setPendingChange(null)
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
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
      {pendingChange?.kind === 'deleteField' && (
        <ConfirmDialog
          title={`Delete “${pendingChange.label}”?`}
          confirmLabel="Delete field and rules"
          tone="danger"
          onConfirm={handleConfirmPendingChange}
          onCancel={() => setPendingChange(null)}
        >
          <p>Other fields use it:</p>
          <ul>
            {pendingChange.references.map((reference) => (
              <li key={reference.fieldId}>{describeReference(reference)}</li>
            ))}
          </ul>
          <p>Deleting it also removes those rules and references.</p>
        </ConfirmDialog>
      )}
      {pendingChange?.kind === 'removeOptions' && (
        <ConfirmDialog
          title={`Remove ${pluralize(pendingChange.removedLabels.length, 'option')}?`}
          confirmLabel="Remove and update rules"
          tone="danger"
          onConfirm={handleConfirmPendingChange}
          onCancel={() => setPendingChange(null)}
        >
          <p>
            {describeOptionImpact(
              pendingChange.removedLabels,
              pendingChange.affectedLabels,
            )}
          </p>
        </ConfirmDialog>
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
