# Form Builder

A browser-only form builder: design form templates with 10 field types, conditional logic and calculations, fill them in, and export responses as PDF. Everything is stored in `localStorage`.

React 19 · TypeScript (strict, no `any`) · Vite · react-router · zod · Vitest + Testing Library. No PDF library, no backend.

---

## Run it

Requires Node 20.19+ (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + UI tests (Vitest, jsdom)
npm run check      # typecheck + lint + tests
npm run build      # production build
```

**Quick tour:** **New template** → click or drag field types from the left → configure them on the right (**Settings** / **Logic** tabs) → **Preview** to try it → **Save**. On the templates list, **New response** opens Fill Mode. **Submit & download PDF** saves the response and opens the print dialog ("Save as PDF"). **Responses** lists submissions, with View, Re-download PDF and Delete.

---

## Field types

| Type | Highlights |
|---|---|
| Single line text | Placeholder, min/max length (a hard stop with a counter), prefix/suffix |
| Multi-line text | Visible rows, min/max length |
| Number | Min/max, 0–4 decimals (rounded on blur), prefix/suffix |
| Date | Pre-fill with today (local date), min/max date |
| Single select | Radio, dropdown or tiles: one value, identical validation |
| Multi select | Min/max selections; at the max, the remaining options are disabled |
| File upload | Allowed types (`.pdf`, `image/*`), max files; **metadata only** |
| Section header | XS–XL headings (h6–h2); display only |
| Calculation | Sum / average / min / max of Number fields, read-only, live |
| Conditional logic | Not a field: every field has **Visibility** and (input fields) **Required** rules |

---

## localStorage schema

Two keys, each an object of `id → record`, validated with **zod** per record on every read.

```ts
'formBuilder:v1:templates' → {
  [templateId]: { id, title, fields: Field[], createdAt, updatedAt }
}

'formBuilder:v1:responses' → {
  [responseId]: {
    id, templateId, submittedAt,
    form: { title, fields: Field[] },     // full copy of the form at submit time
    visibleFieldIds: FieldId[],           // what the user saw, in form order
    values: { [fieldId]: FieldValue }     // only visible fields that hold a value
  }
}
```

**Why this shape:**
- **One record per id inside one key** keeps reads simple and writes cheap. A save rewrites only its own record, and **invalid records are skipped (with a notice) and left untouched**, so one corrupt template never hides the others or gets deleted. A key that isn't JSON at all loads as empty.
- **Each response stores a full copy of the form.** Editing or renaming a template later never changes how old responses or their PDFs look. I first planned template versioning, then replaced it: same guarantee, much less logic (no version list, no "new version only if responses exist" rule). The cost is a few KB per response, which is fine at localStorage scale.
- **`visibleFieldIds` and computed calculation values are frozen at submit.** Re-exporting never re-runs the rules, so a later engine change can't rewrite history, and a hidden field can't leak into a PDF.
- **The `v1` key prefix** leaves room for a migration if the shape changes.
- **Types come from the zod schemas** (`z.infer`), so the stored shape and the TypeScript types can't drift apart. zod checks *shape*; business rules (e.g. "a label is required") live in the field registry and block Save, so stored templates are always valid.

---

## Architecture

```
pages/  →  builder/ · fill/ · export/  →  fields/ · engine/ · storage/  →  lib/ · ui/
```
Dependencies only point downwards. `engine/` and `fields/logicRegistry.ts` never import React components.

| Folder | Responsibility |
|---|---|
| `fields/` | One folder per field type: schema, logic, settings panel, fill input, tests. Two registries. |
| `engine/` | Pure form logic: conditions, dependency order, `evaluateForm`, validation, reference cascades |
| `builder/` | Builder screen; `builderReducer` (pure, tested) |
| `fill/` | `FormFiller`, used by Fill Mode and by the builder's Preview |
| `export/` | Export model → document component → print iframe |
| `storage/` | zod schemas, per-record read/write |

### Field registry: adding an 11th field type

Nothing outside `fields/` switches on `field.type`. Builder, fill, engine and export ask the registry. A new type is:

1. **A folder** `fields/<type>/` with `<type>Schema.ts` (config + value schemas), `<type>Logic.ts` (a `FieldDefinition`), `<Type>Config.tsx`, `<Type>Input.tsx`, and tests.
2. **One line** in `fields/logicRegistry.ts` and **one entry** in `fields/uiRegistry.ts`.
3. **Its schemas** added to the union lists in `fields/fieldUnion.ts`.

Both registries are **mapped types** (`{ [T in FieldType]: FieldDefinition<T> }`), so forgetting a definition or a UI entry is a **compile error**. `fields/allFieldTypes.test.tsx` renders every registered type in the builder and in Fill Mode. While building this, Multi Select and File Upload were added touching only their folders and those lines.

The `FieldDefinition` contract (`fields/logicTypes.ts`): `createField`, `initialValue`, `validateConfig`, `isEmpty`, `validateValue`, `formatForExport`, `valueSchema`, plus optional capabilities: `conditionKinds` (can be a rule target), `getOptions`, `normalizeValue` (Number rounding), `computeValue` / `referencedFieldIds` / `removeFieldReference` (Calculation), `isCalculationSource`.

### Conditional logic

**Model.** Each field has a visibility group `{ defaultState: 'visible' | 'hidden', match: 'all' | 'any', conditions }`, and input fields also have a required group. **When a group matches, the state flips to the opposite of its default.** There's no per-condition effect, so conflicting effects ("show" and "hide" both matching) can't be represented. The builder shows this as a sentence: *This field is [Hidden]. Show it when [all] of these match: …*

**Evaluation (`engine/evaluateForm.ts`):**
1. Fields are sorted **topologically** by what they depend on (rule targets and calculation sources), using Kahn's algorithm with form order as the tie-break. A target is always evaluated before the rules that read it, whatever the form order.
2. A condition whose target is **hidden, empty or missing never matches**, for every operator, including "does not equal" and "contains none of". That's the spec's "no value → default state".
3. Because a hidden field counts as "no value", **chains collapse correctly**: A hides B → B has no value → C (shown when B = y) stays hidden.
4. **Hidden ⇒ never required.** `isRequired` is only computed for visible fields, and `buildSubmission` and the PDF only include visible fields.
5. It's **real time** because nothing derived is stored: `FormFiller` keeps only the typed values (plus "touched" and "tried to submit"), and re-runs `evaluateForm` on every render.

**Loops and self-references** can't be built: the target picker excludes the field itself and every field that already depends on it. Save also rejects loops as a safety net, and hand-edited data with a loop still evaluates (the looping fields use their defaults) instead of crashing.

**Multiple conditions: AND or OR?** Both. Each group has an **ALL/ANY** toggle, defaulting to ALL.

### Calculation

The Calculation definition computes its value through the registry's `computeValue` hook. It uses **only visible, non-empty sources** (untouched fields aren't treated as 0, so Average and Minimum stay meaningful) and shows "—" when nothing counts. Sources must be Number fields; Number sets `isCalculationSource` and Calculation doesn't, so a calculation can't use another one. The dependency order puts a calculation after its sources even if it appears above them. The result is stored computed in the response.

### PDF export (browser-native)

`buildExportModel(response)` builds the content from the response's own form copy and `visibleFieldIds` only. Each field type formats its answer: text with prefix/suffix, numbers with decimals, dates like "26 Nov 2026", option labels, files as "name (size)" with a "contents not embedded" note. One `ExportDocument` React component renders the model:
- **In the app** for the read-only response view.
- **For the PDF**, `renderToStaticMarkup` (part of `react-dom`) produces HTML, which is written into a **hidden iframe**, followed by `print()`. The user picks "Save as PDF". React escapes every value.

The document has a header (title, submission time, a short response reference), section headings, label/value rows, "—" for empty answers, and page numbers via `@page` margin boxes in browsers that support them.

### Type safety

- Discriminated unions everywhere: fields by `type`, conditions by `kind`, so an operator that doesn't fit its value family can't be represented. Values are typed per field type (`FieldValueOf<T>`).
- Display-only fields have **no `required` property at all**, so the type system enforces "a Section Header or Calculation is never required".
- **No `any`. Type casts exist only in the registry:** the three dispatchers that pair "some field" with its type's definition or components (TypeScript can't link `registry[field.type]` and `field`, a "correlated union"), plus `Object.keys(...) as FieldType[]`. Each is commented. No other code uses a type cast.

---

## Decisions (where the spec was open)

**Conditional logic**
- Multiple conditions use a per-group **ALL/ANY** toggle (default ALL).
- A condition's effect is the **opposite of the default**. Changing the default keeps the conditions and flips the sentence.
- Hidden, empty or deleted targets never match. **Hidden counts as empty everywhere downstream** (chains, calculations, submission, PDF).
- A hidden field's typed value is **kept in memory** and restored if it's shown again; it's never submitted.
- Text comparisons are **trimmed and case-insensitive**; "is within range" is **inclusive**.
- Targets are limited to the spec's table (text, number, date, single and multi select). Calculation, File Upload and Section Header can't be targets.
- Rules may target fields **above or below** (evaluation follows dependencies, so reordering never breaks rules). Loops are prevented.
- Hiding a **Section Header hides only the header**; there's no implicit grouping.

**Builder**
- Deleting a field that rules or calculations use → a **confirm dialog lists them**, then they're removed in the same reducer action. An unreferenced field is deleted without asking.
- Options have **stable ids**: renaming never breaks rules or answers. Removing an option used in rules asks first, then removes (single select) or trims (multi select) those rules.
- A field's type is **fixed** after creation.
- Invalid settings **block Save**, with reasons and links to the fields. That includes everything storage would reject (e.g. a length of `-1`). Half-written rules are allowed while editing.
- **Unsaved changes** → confirm on in-app navigation and `beforeunload`. No autosave.
- Preview renders the **unsaved** builder state; its Submit validates but never saves.

**Fill and validation**
- Errors appear **after blur or a submit attempt, then update live**. Submit focuses the first invalid field.
- Whitespace-only text counts as empty. Optional empty fields skip length, range and selection rules.
- Text `maxLength` is a **hard stop with a counter**. A Multi Select at its max **disables** the remaining options. File Upload **rejects** wrong types and extra files with a message and keeps the valid ones.
- Number accepts only digits, `-` and one `.`. Incomplete input (`-`) counts as empty, and values are **rounded half away from zero** on blur and again before storing.
- Date pre-fill applies even if today is out of range (it then shows the range error, and the builder shows a warning).
- An optional single select can be cleared ("Clear selection" or "— Select —").
- Calculations skip empty and hidden sources and use each source as stored (after its own rounding).

**Responses and storage**
- Responses store a **full form copy**; template edits never change history.
- **No drafts**: nothing is saved before Submit. The card's "filled instances" counts submitted responses. After Submit you land on the responses list, with the new row highlighted.
- **PDF via the print dialog** (one extra click, in exchange for real typography and any language without a library). Download is offered only for submitted responses ("Submit & download PDF"), because the PDF needs a submission time.
- Corrupt storage records are **skipped with a notice and never deleted**. Stored values that don't match their field's type export as "—".
- Extras: view and delete individual responses. Template delete/duplicate is out of scope.

---

## Testing

256 tests in 34 files, next to the code they cover.
- **Engine (test-first):** every operator per type, ALL/ANY, chained conditions in any form order, hidden-but-required, deleted targets, loops, dependency order, calculation aggregation with empty or hidden sources and rounding, Save validation, reference cascades.
- **Field types:** defaults, config validation, value validation, export formatting, and helpers (rounding, file matching, option toggling).
- **Storage:** round trip, invalid records skipped and preserved, unparseable JSON, a response's form copy surviving template edits.
- **UI behaviour (Testing Library):** builder add, select, edit, reorder (buttons and drag), save, guard, preview and rule editor; a conditional field showing and hiding live; submitting with a hidden required field; a Calculation updating live; all three Single Select displays behaving the same; responses list, view and PDF actions (print mocked).

The PDF output itself was checked by rendering the generated print HTML to a real PDF in headless Chrome.

---

## What I'd improve with more time

- **A one-click PDF download.** Generate the PDF bytes directly (text objects, built-in fonts, manual pagination) to skip the print dialog. That's a lot more code and only covers Latin text, so it's a deliberate trade-off.
- **Accessibility:** arrow-key navigation inside the Tiles radio group, focus trapping in dialogs, and touch-friendly drag-and-drop (native HTML5 drag doesn't work on touch; the ↑/↓ buttons are the fallback).
- **Drafts / autosave** of half-filled responses, and **template delete/duplicate** (duplicating means remapping field ids inside rules and calculation sources).
- **Multi-tab sync** via the `storage` event, and graceful handling of the localStorage quota.
- **"is empty" / "is not empty" operators**, and Calculation as a rule target.
- **Dark mode** (colours are already CSS variables).
- Performance for very large forms: `evaluateForm` re-runs on every keystroke. It's instant at realistic sizes but could be memoised per change.

---

## AI usage

See `AI_USAGE_LOG.md`.
