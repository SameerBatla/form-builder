# Form Builder: Final Specification

The source requirements are the assignment brief. This file resolves every ambiguity found in the spec interview (`INTERVIEW.md`, Q1–Q48). Where this file is more specific than the brief, this file wins. Everything under **Decisions** goes into the README.

---

## 1. Scope

A browser-only form builder (React 19 + TypeScript strict + Vite). Users build form **templates**, fill **responses**, and export responses as PDF. All data lives in `localStorage`, and the app works after a full refresh, staying on the same screen.

**Approved dependencies:** `react-router` (routing + unsaved-changes blocker) and `zod` (validating localStorage data). No other runtime dependencies. **No PDF libraries.**

**Theme:** light only, Keychain-inspired (Inter, slate neutrals, yellow primary, 6px corners, hand-written line icons); tokens live in `src/index.css`.

---

## 2. Screens & routes (react-router)

| Route | Screen |
|---|---|
| `/` | Templates list |
| `/templates/new` | Builder with a blank template. The first Save creates the id and replaces the URL with `/templates/:id/edit` |
| `/templates/:id/edit` | Builder |
| `/templates/:id/fill` | Fill Mode: a new response to the template as it is now |
| `/templates/:id/responses` | Responses list (`?highlight=<responseId>` after submit) |
| `/templates/:id/responses/:responseId` | Read-only response view |

Unknown ids show a "Not found" panel with a link home.

### 2.1 Templates list
- A card per template: **title**, **field count**, **response count**, **last modified** (relative time, with the absolute time in a tooltip).
- Clicking a card opens the Builder. Each card has **New Response** (→ fill) and **Responses** (→ list) buttons.
- A **New Template** button. The empty state explains what to do.
- No delete or duplicate for templates (out of scope).

### 2.2 Builder
Three panels:
- **Left palette:** the field types. **Click** inserts the field below the selected field (or at the end if none is selected) and auto-selects it. **Drag** onto the canvas inserts it at the drop position.
- **Center canvas:** an ordered field list. Reorder by **native HTML5 drag-and-drop** (a drag handle) **and ↑/↓ buttons** for the keyboard and as a fallback. Each row shows the type icon, label, badges (Required, Has rules, Hidden by default), a red dot if the config is invalid, and Delete.
- **Right panel:** the config for the selected field. Its sections are: Basic settings (type-specific) → Visibility rules → Required rules (input fields only).
- **Header:** an editable template title, an "Unsaved changes" indicator, **Preview**, and **Save**.

**Save**
- Blocked if any config is invalid (§6.1). Shows "N fields need attention"; invalid fields get a red dot, and the panel lists the issues.
- Overwrites the template. Existing responses are unaffected, because each one stores its own copy of the form (§8).
- Updates `updatedAt`.

**Unsaved changes:** a confirm dialog on in-app navigation (react-router `useBlocker`) and `beforeunload` on refresh or tab close. Nothing auto-saves.

**Delete field:** if other fields reference it (condition target or calculation source), a dialog lists them: "Used by 2 rules and 1 calculation. Deleting removes those too." On confirm, one reducer action removes the field and every reference to it. A Calculation left with 0 sources becomes invalid (it blocks Save until fixed).

**Field type is fixed** after creation. To change it, delete the field and add a new one.

**Preview:** a full-screen modal rendering the **current unsaved builder state** in Fill Mode. Conditions, calculations and validation are all live. Submit validates and shows "Preview: nothing saved". Closing returns to the builder unchanged.

### 2.3 Fill Mode
- Renders the template's fields in order. Visibility, required state and calculations are derived from values on every render (§4).
- New-response defaults: empty values, except Date fields with "Pre-fill today", which get today's local date.
- **Nothing is saved before Submit.** No drafts; a refresh starts a blank response.
- Buttons: **Submit** and **Submit & download PDF**. Both validate every visible field and mark them all touched. On errors, scroll to and focus the first invalid field and show "N fields need attention" near the buttons. On success, save the response; "Submit & download PDF" then opens the print flow (§7). Both end on `/templates/:id/responses?highlight=<id>`.
- A standalone pre-submit "Download PDF" is **not** offered, because the PDF needs a submission timestamp.

### 2.4 Responses list
- Newest first. Each row shows the **submitted timestamp**, a **preview of the first 2 non-empty visible answers** ("Jane Doe · jane@x.com"), and the buttons **View**, **Re-download PDF**, **Delete** (with a confirm).
- A row arriving via `?highlight=` is briefly highlighted.
- Empty state: "No responses yet", with a New Response button.

### 2.5 Response view (read-only)
Renders the same export model as the PDF (§7) inside the app, plus a Download PDF button.

---

## 3. Data model

### 3.1 Field definitions

```ts
type FieldId = string           // crypto.randomUUID()
type OptionId = string

type FieldType =
  | 'singleLineText' | 'multiLineText' | 'number' | 'date'
  | 'singleSelect' | 'multiSelect' | 'fileUpload'
  | 'sectionHeader' | 'calculation'
// "Conditional logic" is not a field type. Every field has rule groups (§3.2).

interface BaseField<T extends FieldType, C> {
  id: FieldId
  type: T
  label: string
  config: C
  visibility: RuleGroup<'show' | 'hide'>      // every field
  required?: RuleGroup<'require' | 'unrequire'> // only input fields (registry: canBeRequired)
}

interface Option { id: OptionId; label: string }
```

Per-type configs:

| Type | Config |
|---|---|
| Single Line Text | `placeholder, minLength?, maxLength?, prefix, suffix` |
| Multi-line Text | `placeholder, minLength?, maxLength?, rows` (default 4, range 2–20) |
| Number | `min?, max?, decimalPlaces: 0–4, prefix, suffix` |
| Date | `prefillToday: boolean, minDate?, maxDate?` (`YYYY-MM-DD`) |
| Single Select | `options: Option[], display: 'radio' \| 'dropdown' \| 'tiles'` |
| Multi Select | `options: Option[], minSelections?, maxSelections?` |
| File Upload | `allowedTypes: string[]` (e.g. `['.pdf','.png']`; empty = any), `maxFiles` (default 1) |
| Section Header | `size: 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` (label = the header text) |
| Calculation | `sourceFieldIds: FieldId[]` (Number fields only), `aggregation: 'sum' \| 'average' \| 'min' \| 'max'`, `decimalPlaces: 0–4` |

Per-type values (`null` = empty):

| Type | Value |
|---|---|
| Text / Multi-line | `string` (`''` = empty) |
| Number | `number \| null` |
| Date | `string \| null` (`YYYY-MM-DD`, local) |
| Single Select | `OptionId \| null` |
| Multi Select | `OptionId[]` |
| File Upload | `{ name, size, type }[]` (metadata only) |
| Calculation | derived, `number \| null` |
| Section Header | no value |

### 3.2 Rules (conditional logic)

```ts
interface RuleGroup<E> {
  defaultState: 'visible' | 'hidden'  (visibility) / 'required' | 'optional' (required)
  match: 'all' | 'any'           // default 'all'
  conditions: Condition[]
}
// The effect is implicit: it is always the opposite of `defaultState`.
//   visibility default visible → conditions mean "Hide when…"; default hidden → "Show when…"
//   required default optional → "Require when…"; default required → "Make optional when…"

type Condition =
  | { targetId; kind: 'text';   operator: 'equals' | 'notEquals' | 'contains'; value: string }
  | { targetId; kind: 'number'; operator: 'equals' | 'greaterThan' | 'lessThan'; value: number }
  | { targetId; kind: 'number'; operator: 'withinRange'; value: { min: number; max: number } }
  | { targetId; kind: 'singleSelect'; operator: 'equals' | 'notEquals'; value: OptionId }
  | { targetId; kind: 'multiSelect'; operator: 'containsAny' | 'containsAll' | 'containsNone'; value: OptionId[] }
  | { targetId; kind: 'date';   operator: 'equals' | 'before' | 'after'; value: string }
```

**Targets** are only the types in the spec table: Single/Multi-line Text, Number, Single Select, Multi Select, Date. No Calculation, File Upload or Section Header targets, and no "is empty" operator.

### 3.3 Field registry
- `fields/logicRegistry.ts` (pure TS) maps `FieldType → FieldDefinition`: `createDefaultConfig`, `initialValue(config, today)`, `isEmpty(value)`, `validateValue(config, value) → string[]`, `validateConfig(field, allFields) → string[]`, `conditionKind?` (whether the type is a target, and with which operators), `formatForExport(config, value) → ExportValue`, and the flags `hasValue`, `canBeRequired`, `isNumericSource`.
- A UI registry maps `FieldType → { ConfigPanel, FillInput, icon, paletteLabel }`.
- No `switch (field.type)` outside `fields/`. **Adding an 11th type = a new folder + one line per registry + one member in the `Field` union.**

---

## 4. Form evaluation engine (`engine/`, pure, no React)

`evaluateForm(fields, rawValues, today) → { visible, required, effectiveValues, errors }`, computed during render and never stored as state.

1. **Order:** topologically sort fields by dependency (condition target → field; calc source → calculation). Cycles can't exist (§6.1), so the sort always succeeds.
2. For each field in that order:
   - **Condition match:** a condition whose target is **empty or hidden** never matches (the spec's "target has no value → default state"). That includes `notEquals` and `containsNone`.
   - **Group result:** `all` → every condition matches; `any` → at least one matches. An empty condition list never flips the default.
   - **Visible** = the default, flipped if the visibility group matches.
   - **Required** = the default, flipped if the required group matches; **always false when hidden**.
   - **Effective value:** hidden → empty. Calculation → its computed value. Otherwise → the raw value.
3. **Downstream fields always see effective values**, so a chain A hides B → C (which depends on B) falls back to its default.
4. **Hidden fields keep their raw value** in fill state, so it's restored if the field is shown again. It's excluded from validation, calculations, submission and the PDF while hidden.

**Operator semantics**
- Text: trimmed, case-insensitive. `contains` = substring.
- Number: `withinRange` is inclusive (`min ≤ x ≤ max`).
- Date: string comparison of `YYYY-MM-DD` (local dates, no time zones).
- Multi Select: set semantics on option ids.

**Calculation**
- Uses visible, non-empty sources only. Hidden or empty sources are skipped.
- All sources empty or hidden → `null` (displayed as "—", not 0).
- `average` = the mean of the counted sources. The result is rounded to `decimalPlaces` for display and storage.
- Read-only input in Fill Mode. Calculations can have visibility rules but are never required.

---

## 5. Field behaviour in Fill Mode

| Type | Behaviour |
|---|---|
| Single Line Text | Prefix/suffix as static adornments. `maxLength` is a hard stop (native) with a "42 / 50" counter; `minLength` validated |
| Multi-line Text | `rows` visible rows; same length rules as Single Line Text |
| Number | `<input type="text" inputmode="decimal">` accepting only digits, `-` and one `.`. The parsed value is committed on change (calculations update live); incomplete text (`-`, `.`) counts as empty. On blur it is rounded (half away from zero) to `decimalPlaces` and shown formatted; `normalizeValue` rounds again before storing. min/max validated |
| Date | Native `<input type="date">` with `min`/`max`. Pre-fill uses today's local date **even if out of range** (it then shows the range error) |
| Single Select | **Radio** (stacked), **Dropdown** (native select with an empty "— Select —" option), **Tiles** (horizontal wrapping cards, `role="radiogroup"`). Same value, same validation. Optional + has a value → "Clear selection" link (radio/tiles) |
| Multi Select | Checkboxes. When `maxSelections` is reached, the remaining options are disabled with the hint "Maximum N selected". `minSelections` is validated (only when non-empty or required) |
| File Upload | `accept` from `allowedTypes`. Wrong-type files rejected with a message per file; files beyond `maxFiles` aren't added ("Only N files allowed"); valid files are kept. Listed with name and size, plus a remove button |
| Section Header | xs→h6, sm→h5, md→h4, lg→h3, xl→h2 (h1 = form title). Hiding a header hides **only the header**, not the fields below it |
| Calculation | Read-only, live, formatted to `decimalPlaces` |

**Error timing (all types):** an error shows after the field is blurred (touched) or after a Submit attempt, then updates live. Required check: visible, effectively required and empty → "This field is required". Optional and empty → no length/range/selection errors.

---

## 6. Builder rules

### 6.1 Config validation (blocks Save)
- Template title non-empty; at least one field.
- Every field label non-empty (including the Section Header text).
- Selects: at least 1 option; option labels non-empty and unique within the field.
- `min ≤ max` for length, value, date and selection count; `maxSelections ≤ option count`; `decimalPlaces` 0–4; `maxFiles ≥ 1`.
- Calculation: at least 1 source; sources must be Number fields (never Calculations, enforced by the picker too).
- Conditions: complete (target, operator, value); `withinRange` has `min ≤ max`; multi-select value list non-empty.
- **No self-conditions and no cycles.** The target picker excludes the field itself and any field that would create a cycle; Save re-checks.
- Warning only (not blocking): Date "Pre-fill today" when today is outside min/max.

### 6.2 Reference maintenance (one reducer action each)
- **Delete field** → confirm, then remove the conditions that target it and remove it from calculation sources.
- **Rename option** → no-op for rules (they store option ids).
- **Delete option** → warn. Single Select conditions using it are removed. Multi Select conditions drop the id, and a condition whose value list becomes empty is removed.
- **Reorder** → doesn't affect rules (dependencies are by id, not position).

---

## 7. PDF export (browser-native)

**Mechanism:** `buildExportModel(response)` (uses the response's own form copy) → `renderExportHtml(model)` (all text HTML-escaped) → a hidden `<iframe srcdoc>` → `contentWindow.print()` → the user picks "Save as PDF". The iframe is removed on `afterprint`. The iframe `<title>` is set to `"<Form title> – <YYYY-MM-DD>"` so it becomes the suggested file name.

**Content** (document style, not a copy of the form UI):
- A header block: the form title (as submitted, from the response's form copy), "Submitted 26 Nov 2026, 14:32", and a short response id.
- Fields in form order, **visible-at-submit fields only**. Section Headers render as headings; other fields as label/value rows.
- Value formatting via the registry's `formatForExport`:
  - Text: prefix + value + suffix. Multi-line keeps its line breaks.
  - Number: `Intl.NumberFormat` with the configured decimals, plus prefix/suffix.
  - Date: "26 Nov 2026". Single Select: the option label. Multi Select: a comma-separated list of labels.
  - Files: "invoice.pdf (240 KB)", followed by a muted line "File not embedded".
  - Calculation: a formatted number.
  - Empty optional fields: "—".
- Print CSS: A4, sensible margins, rows avoid breaking across pages (`break-inside: avoid`). Page numbers via `@page` margin boxes where the browser supports them (best effort; documented).

The same export model renders the in-app read-only response view.

---

## 8. Persistence (`storage/`)

Two keys, each a `Record<id, …>`, validated with **zod** on read:

```ts
'formBuilder:v1:templates' → Record<TemplateId, {
  id, title, fields: Field[], createdAt, updatedAt
}>

'formBuilder:v1:responses' → Record<ResponseId, {
  id, templateId,
  submittedAt,                         // ISO string
  form: { title, fields: Field[] },    // full copy of the form at submit time
  visibleFieldIds: FieldId[],          // frozen at submit, in form order (includes Section Headers)
  values: Record<FieldId, FieldValue>  // only visible fields that hold values; calculations stored computed
}>
```

- **Why a full copy per response:** old responses always render exactly as submitted (labels, options, title), however the template is edited later. It's simpler than template versioning (no version list, no "new version only if responses exist" rule, no missing-version checks). The cost is a few KB per response, which is fine at localStorage scale. (This replaces the earlier versioning decision; see INTERVIEW.md, Q37 revision.)
- **Why `visibleFieldIds` + computed calculation values:** the response freezes what the user saw. Re-exporting never re-runs the engine, so later engine changes can't alter history.
- **Bad data:** each record is validated on its own. Invalid records are skipped (left in storage, not deleted), and a dismissible banner says "N items couldn't be loaded". If a whole key is unparseable JSON, it loads as empty (counted as 1 skipped item) and is replaced on the next save.
- **Versioned key prefix (`v1`)** leaves room for future migrations.
- Not handled: multi-tab sync, quota-exceeded recovery (only a basic error toast).

---

## 9. Decisions (go into the README)

1. Multiple conditions → a per-group **ALL/ANY** toggle (default ALL), separate for Visibility and Required.
2. A condition's effect is always the **opposite of the field's default**, so conflicting effects can't happen.
3. A condition whose target is **empty or hidden never matches** (including "does not equal"/"contains none of").
4. Hidden fields count as **empty everywhere downstream**: chained conditions, calculations, submission, PDF.
5. Hidden values are **kept in memory** and restored if the field is shown again; they're never submitted.
6. **Cycles are prevented in the builder**; the engine evaluates in topological order.
7. Text comparisons are **trimmed and case-insensitive**; numeric `withinRange` is **inclusive**.
8. Condition targets are limited to the spec table; Calculation, File Upload and Section Header can't be targets.
9. Every field gets visibility rules; only input fields get Required/Required rules.
10. Hiding a **Section Header hides only the header**; there's no implicit grouping.
11. Deleting a referenced field → **confirm and cascade**; option rules use **stable ids** (a rename is safe, a delete cascades).
12. Field type is **immutable** after creation.
13. Calculation **skips empty and hidden sources**; all empty → "—".
14. Number decimals are **rounded on blur**; Number uses a text input with a decimal keyboard.
15. Errors appear **on blur or submit, then live**.
16. Text `maxLength` is a hard stop with a counter; Multi Select `max` disables the remaining options; File Upload rejects invalid files on the spot.
17. Date pre-fill applies even if today is out of range (it then shows the range error; the builder gets a warning).
18. Optional single selects can be **cleared**.
19. Each response stores a **full copy of the form** as submitted; editing a template never changes existing responses. (Chosen over template versioning as simpler.)
20. **No drafts**: nothing is saved before Submit. After Submit → the responses list, with the new row highlighted.
21. PDF via the **print dialog** in a hidden iframe (a trade-off: one extra click, in exchange for real typography and Unicode with no libraries). Pre-submit PDF export is not offered; "Submit & download PDF" covers the spec.
22. Invalid builder config **blocks Save**; stored templates are always valid.
23. Unsaved builder changes → a **confirm on leave**; no autosave.
24. Corrupt localStorage records are **skipped with a notice** and never deleted (only a key that is not valid JSON at all is replaced on the next save).
25. Extras: view and delete individual responses. No template delete/duplicate.
26. Whitespace-only text counts as **empty** (it fails a required check and exports as "—").

---

## 10. Testing

Test-first, **without pausing for confirmation** (tests are shown in the step summary):
- `engine/`: each operator per type; ALL/ANY; chains (A hides B → C stays at its default); hidden-required doesn't block submit and is excluded from output; empty/hidden targets; a missing target doesn't crash; cycle detection; topological order; calculation aggregations, empty/hidden sources, rounding.
- `fields/<type>/`: validateValue, validateConfig, formatForExport, initialValue (date prefill).
- `builder/builderReducer.ts`: add/insert position, reorder, delete with cascade, option delete cascade, select.
- `storage/`: round trip; invalid records skipped and kept; a response's form copy survives template edits.
- `export/buildExportModel`: order, hidden excluded, section headers, empty "—", file note.
- UI behaviour tests: a conditional show/hide; submit with a hidden required field succeeds; a live calculation update.

`npm run check` must pass at the end of every phase.

---

## 11. Workflow

- **Mode: Build** (Q45). Implement step by step in plan order without pausing for review, validating each step. Afterwards, **walk the user through each step** so they can explain and defend it.
- Small commits with specific messages, proposed for confirmation as per CLAUDE.md.
- `AI_USAGE_LOG.md` is written by the user. Flag log-worthy moments with `Log-worthy: …`.

## 12. Later (not built unless asked)
Dark mode · drafts / autosave · template delete & duplicate · multi-tab sync · touch drag-and-drop · "is empty" operator · Calculation as a condition target · field type conversion · a true one-click PDF download (hand-written PDF bytes) · response numbering.
