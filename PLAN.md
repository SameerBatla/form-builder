# Plan
**Mode:** Build. No pauses between steps; stop at the end of each phase. Walk the user through every step afterwards.
**Goal:** Build a form template, fill it with live conditions and calculations, submit it, and export it as a PDF, all in localStorage.
**Spec:** `SPEC.md` (resolved from `TASK.md`; the Q&A is in `INTERVIEW.md`).

## Architecture
- Look: design tokens in `index.css`, hand-written SVG icons in `ui/icons` · Keychain-inspired, no icon library
- Field types: one folder per type in `fields/`, `logicRegistry.ts` (pure) + `uiRegistry.ts` · new field = folder + 2 registry lines + 1 union member
- Rules: each field has `visibility` / `required` groups `{ default, match: all|any, conditions }`; effect = opposite of default · conflicting effects can't happen
- Engine: pure `engine/evaluateForm`, topological order, hidden = empty downstream; derived on each render, never state · chains correct, testable without React
- Builder state: `builderReducer.ts` · one action updates fields + selection + reference cascades together
- Persistence: `storage/`, two `v1` keys, zod-validated per record; each response stores a full form copy + `visibleFieldIds` · history never changes, bad records skipped
- Routing: react-router data router, `useBlocker` for unsaved changes · a refresh keeps the current screen
- PDF: export model → escaped HTML → hidden iframe `print()` · browser-native, real typography, Unicode

## Phases
### Phase 1: Foundation
- [x] 1. Install react-router + zod; replace starter with routed empty pages
- [x] 2. Field/rule/value types and registry contract for Single Line Text
- [x] 3. Storage: zod schema, per-record read/write, "couldn't load" banner
- [x] 4. Templates list shows saved templates with counts and New Template

### Phase 2: Builder (Single Line Text slice)
- [x] 5. Apply design tokens, Inter, SVG icon set; restyle templates list
- [x] 6. Builder reducer: add below selected, select, update, move, delete
- [x] 7. Three-panel builder: palette click-to-add, canvas, Single Line Text config
- [x] 8. Save with config validation, red dots, editable title
- [x] 9. Unsaved-changes guard on navigation and tab close
- [x] 10. Reorder by native drag-and-drop and ↑/↓; drag from palette

### Phase 3: Fill & submit
- [x] 11. Fill page renders the template; blur/submit validation with errors
- [x] 12. Submit saves response → responses list with highlighted timestamp row
- [x] 13. Preview modal renders unsaved builder state; submit saves nothing

### Phase 4: Remaining field types
- [x] 14. Multi-line Text (rows, length counter)
- [x] 15. Number (decimal text input, round on blur, prefix/suffix, min/max)
- [x] 16. Date (prefill today, min/max, out-of-range builder warning)
- [x] 17. Single Select: options editor with stable ids; radio, dropdown, tiles, clear
- [x] 18. Multi Select: checkboxes, min/max, disable at max
- [x] 19. File Upload (metadata, accept, reject invalid) and Section Header sizes

### Phase 5: Conditional logic
- [x] 20. Engine: operators per target type, ALL/ANY, empty/hidden target never matches
- [x] 21. Engine: `evaluateForm` topological order, chains, hidden-required, cycle detection
- [x] 22. Fill uses `evaluateForm`: live show/hide, required flips, hidden excluded on submit
- [x] 23. Builder rule editor: groups, ALL/ANY, target picker without self/cycles
- [x] 24. Delete field / delete option cascades with confirm dialog

### Phase 6: Calculation
- [x] 25. Engine aggregation: skip empty/hidden sources, "—" when none, rounding
- [x] 26. Calculation field: source picker (Number only), read-only live value

### Phase 7: PDF & responses
- [x] 27. `buildExportModel` + registry `formatForExport` for every type
- [x] 28. Print via hidden iframe; Re-download PDF and Submit & download PDF
- [x] 29. Responses list: answer preview, read-only View, Delete with confirm

### Phase 8: Finish
- [x] 30. UI behavior tests: conditional show/hide, hidden-required submit, live calc
- [x] 31. README: run, schema + reasoning, architecture, decisions, improvements

## Decisions (go into README)
Full rationale in `SPEC.md` §9.
- Multiple conditions → per-group ALL/ANY toggle, default ALL · user chooses, both explainable
- Effect → always opposite of the default · no conflicts
- Empty or hidden target → condition never matches · spec: "no value → default state"
- Hidden field → empty for chains, calculations, submit, PDF; value kept in memory · re-show restores input
- Cycles → blocked in builder; engine sorts topologically · no oscillation
- Text match → trimmed, case-insensitive; number range → inclusive · least surprising
- Condition targets → spec table only · no invented operators
- Visibility rules on every field; Required only on input fields · headers/calcs never take input
- Hidden Section Header → hides only itself · no positional magic
- Deleted field → confirm + cascade; options by stable id (rename safe, delete cascades) · no dangling refs
- Field type → immutable · typed configs stay simple
- Calculation → skips empty/hidden sources, "—" if none · untouched ≠ 0
- Number → text input, rounded on blur; errors on blur/submit then live · no typing interruptions
- Text max → hard stop + counter; Multi max → disable rest; files → reject invalid on pick · invalid state impossible
- Date prefill → applied even if out of range (error + builder warning) · honest
- Optional single select → "Clear selection" · all three displays behave the same
- Each response stores a full form copy (not template versions) · history exact, simplest code
- No drafts; after submit → responses list · matches "filled instances" = submitted
- PDF → print dialog via hidden iframe; "Submit & download PDF" instead of pre-submit export · needs timestamp
- Invalid config → blocks Save; unsaved changes → confirm on leave · stored templates always valid
- Corrupt storage records → skipped with notice, not deleted · never destroy user data
- Extras → view + delete responses; no template delete/duplicate · scope control

- Whitespace-only text → counts as empty (fails required) · a space isn't an answer
- Preview submit → runs full validation, shows "would be accepted", saves nothing · test the form safely

- Number typing → only digits, "-" and one "." accepted; incomplete text ("-") counts as empty · no "invalid number" state to explain
- Number rounding → half away from zero, applied on blur and again before storing · stored values always match the decimals
- File types → extensions only (spec example: ".pdf, .jpg, .png"); ".PDF, png" normalised to [".pdf", ".png"], matched by file name · forgiving input, simplest matching
- Single Select dropdown → always offers "— Select —" (selecting it = empty) · same clear behaviour as radio/tiles' "Clear selection"

- Rule targets → any field above or below (evaluation follows dependencies, not position) · reordering never breaks rules
- Changing a group's default (e.g. Visible → Hidden) keeps its conditions; the sentence flips ("Hide it when" → "Show it when") · no silent data loss
- Deleting a field nobody references → no confirm; referenced → confirm listing the rules · ask only when something else is lost
- Half-written conditions are allowed in the builder (null values) but block Save · editing never fights the user
- Stored data with a rule loop → evaluated with defaults, never crashes; builder flags it on Save · defensive against hand-edited storage

- Calculation sources → used as stored (each Number's own rounding applies first) · the total matches what the user sees
- Calculation → never typed and never required; can be hidden by rules; not a rule target · spec table + simplest model

- PDF content → built only from the response's own form copy + visibleFieldIds · hidden fields can't leak, template edits can't change history
- Stored value with the wrong shape (hand-edited) → exported as "—" via each type's value schema · never crash an export
- Response reference → first 8 chars of the id ("D1FA4141") on the PDF · human-friendly without sequential numbering
- Export styles as TS strings (not CSS modules) · the print iframe can't see the app's stylesheets

- Preview in the URL (?preview=1) · browser Back closes it instead of leaving the builder (and tripping the unsaved-changes prompt)

## Later (not built unless I ask)
- Dark mode
- Drafts / autosave of half-filled responses
- Template delete and duplicate
- Multi-tab sync via `storage` event
- Touch drag-and-drop
- "is empty" operator; Calculation as condition target
- Field type conversion
- One-click PDF download (hand-written PDF bytes)
- Response numbering

## Code map
| Feature | Logic (file → function) | UI (folder → component) |
|---|---|---|
| Routing / page shells | `routes.tsx → routes` | `pages/AppLayout → AppLayout` |
| Field & rule types | `fields/fieldUnion.ts → fieldSchema`, `fields/conditionSchema.ts`, `fields/fieldBase.ts` | — |
| Field registry | `fields/logicRegistry.ts → fieldDefinitions, createField` | — |
| Storage (validated, per record) | `storage/collectionStore.ts → readCollection, writeRecord`; `templateStore.ts`, `responseStore.ts` | — |
| Unloadable-data notice | `storage/storageHealth.ts → countUnloadableRecords` | `ui/Banner → Banner` (in `AppLayout`) |
| Templates list | `templateStore.ts → sortByLastEdited`; `responseStore.ts → countResponsesByTemplate`; `lib/dates.ts → formatRelativeTime` | `pages/TemplatesListPage → TemplatesListPage, TemplateCard` |
| Design tokens & icons | `index.css` tokens | `ui/icons/icons.tsx`, `ui/IconTile`, `ui/Button` |
| Builder state | `builder/builderReducer.ts → builderReducer, finalIndexForDrop` | — |
| Builder layout | — | `builder/TemplateBuilder` → `BuilderToolbar`, `FieldPalette`, `FormCanvas`, `CanvasFieldCard`, `ConfigPanel` |
| Field UI registry | `fields/uiRegistry.ts → fieldUis`; `fields/FieldComponents.tsx → FieldConfigPanel, FieldFillInput` | `fields/singleLineText → SingleLineTextConfig, SingleLineTextInput` |
| Save + config validation | `engine/validateTemplate.ts → validateTemplate`; `logicRegistry.ts → getConfigIssues`; `fields/shared/lengthLimits.ts` | `builder/SaveIssuesBar` |
| Unsaved-changes guard | `TemplateBuilder → useBlocker + beforeunload` | `ui/ConfirmDialog` |
| Reorder (DnD + ↑/↓) | `builderReducer → moveField`; `FormCanvas → handleDrop` | `CanvasFieldCard` grip, `FieldPalette` draggable items |
| Form evaluation (derived state) | `engine/evaluateForm.ts → evaluateForm, buildSubmission` | — |
| Fill-time value rules | `logicRegistry.ts → isValueEmpty, getValueError`; `fields/shared/lengthLimits.ts → isTextEmpty, validateTextLength` | — |
| Fill mode + submit | `pages/FillPage → handleSubmit` (full form copy into the response) | `fill/FormFiller` |
| Responses list (basic) | `responseStore.ts → sortByNewest` | `pages/ResponsesPage` |
| Preview | — | `builder/PreviewModal` (reuses `FormFiller`) |
| Field contract + dispatchers | `fields/logicTypes.ts`; `logicRegistry.ts → getFieldDefinition (1 cast), normalizeValue, capturesValue`; `fieldUnion.ts → getRequiredRules` | `fields/FieldComponents.tsx → FieldRow, FieldFillInput (1 cast), FieldConfigPanel (1 cast)` |
| Multi-line text | `fields/multiLineText/multiLineTextLogic.ts` | `MultiLineTextConfig`, `MultiLineTextInput`, `ui/TextArea` |
| Number | `fields/number/numberLogic.ts → roundToDecimals, parseNumberDraft` | `NumberConfig`, `NumberInput`, `ui/Select` |
| Date | `fields/date/dateLogic.ts → isTodayOutsideRange`; `lib/dates.ts → formatIsoDate` | `DateConfig`, `DateInput` |
| Single select | `fields/singleSelect/singleSelectLogic.ts`; `fields/shared/options.ts → validateOptions` | `SingleSelectConfig`, `SingleSelectInput`, `fields/shared/OptionsEditor`, `ui/SegmentedControl` |
| Multi select | `fields/multiSelect/multiSelectLogic.ts → toggleOption` | `MultiSelectConfig`, `MultiSelectInput` |
| File upload | `fields/fileUpload/fileUploadLogic.ts → parseAllowedTypes, isFileAllowed, addFiles` | `FileUploadConfig`, `FileUploadInput` |
| Section header | `fields/sectionHeader/sectionHeaderLogic.ts` (capturesValue: false) | `SectionHeaderConfig`, `SectionHeaderInput` |
| Condition operators + ALL/ANY | `engine/conditions.ts → isConditionMet, matchesRuleGroup` | — |
| Dependency order, loops | `engine/dependencies.ts → orderByDependencies, findDependencyCycle, dependsOn` | — |
| Conditional evaluation | `engine/evaluateForm.ts → evaluateForm` (topological, hidden = no value) | `fill/FormFiller` (unchanged) |
| Rule editor | `engine/conditionBuilder.ts → getEligibleTargets, createCondition, changeConditionOperator, validateCondition` | `builder/logic → LogicTab, RuleGroupEditor, ConditionRow, ConditionValueInput` |
| Cascades | `engine/references.ts → findFieldReferences, removeFieldReferences, pruneOptionConditions`; `builder/pendingChange.ts → findDeleteFieldChange, findRemoveOptionsChange`; `builderReducer` delete/update | `builder/PendingChangeDialog` |
| Calculation | `fields/calculation/calculationLogic.ts → aggregate, computeValue`; `logicRegistry → computeFieldValue, isComputedField, isCalculationSource`; `validateTemplate → validateSources` | `CalculationConfig` (source picker), `CalculationInput` (read-only); `lib/numbers.ts → formatNumber` |
| Export model | `export/buildExportModel.ts → buildExportModel, getAnswerPreview`; `logicRegistry → formatValueForExport`; each type's `formatForExport` + `valueSchema` | — |
| PDF (browser print) | `export/printResponse.ts → buildPrintHtml (renderToStaticMarkup), printHtml (hidden iframe), printResponse` | `export/ExportDocument`, `export/exportStyles.ts` |
| Responses + view | `responseStore → loadResponse, deleteResponse` | `pages/ResponsesPage` (preview, View, Re-download, Delete), `pages/ResponseViewPage`; `FormFiller` "Submit & download PDF" |
| README | `README.md` (run, schema, architecture, decisions, improvements) | — |
