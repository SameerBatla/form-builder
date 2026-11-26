# Spec Interview: Questions & Answers

Questions asked while turning the assignment brief into `SPEC.md`. Each one notes the option picked (✅) and the alternatives considered.

## Round 1: Conditional logic semantics

**Q1. When a field has multiple conditions, how should they combine?**
- ✅ Per-field "Match ALL / ANY" toggle (default ALL)
- Always AND
- Always OR
- Per-effect grouping with a fixed rule

**Q2. Conflicting or redundant effects (e.g. "Hide" when the default is already hidden; Show and Hide both matching)?**
- ✅ The builder only offers the effect that is the opposite of the default (default hidden → only "Show", default visible → only "Hide"; same for required). Conflicts can't happen.
- Allow all effects, last match wins
- Allow all effects, fixed precedence (Hide beats Show, Require beats Unrequire)

**Q3. Chained conditions: if A hides B, what value does C (which depends on B) see?**
- ✅ A hidden field counts as empty downstream, so C falls back to its default. Evaluate in dependency order.
- A hidden field keeps its value for downstream logic

**Q4. A field is filled, hidden, then shown again. What happens to its value?**
- ✅ Keep it in memory and restore it when shown again. While hidden it's excluded from submit, PDF and downstream logic.
- Clear it on hide

## Round 2: Rule structure, cycles, targets, text matching

**Q5. Is ALL/ANY one toggle for the whole field, or one per rule group (Visibility / Required)?**
- ✅ Per group: `visibility: { default, match, conditions[] }` and `required: { default, match, conditions[] }`
- One toggle per field

**Q6. Dependency cycles (A depends on B, B depends on A)?**
- ✅ Block them in the builder: the target dropdown excludes fields that would create a cycle, and Save is blocked if one exists. The engine evaluates in topological order.
- Only allow fields above this one as targets
- Allow them and let the engine iterate to a fixed point

**Q7. Which fields can be condition targets beyond the spec table (Calculation, File Upload, an "is empty" operator)?**
- ✅ None. Stick to the spec table (Text, Multiline, Number, Single Select, Multi Select, Date).

**Q8. How do the text operators match?**
- ✅ Case-insensitive and trimmed
- Exact match

## Round 3: Broken references and operator details

**Q9. The builder deletes field A, which other fields use in conditions or as a Calculation source. What happens?**
- ✅ Confirm, then cascade: a dialog lists the conditions and calculation sources that use A, and deleting A removes them in the same action. No dangling references are ever saved.
- Block the deletion
- Leave the references, flag them as broken

**Q10. A dropdown option used in a rule (e.g. "Show if Colour = Red") is renamed or deleted. What happens to the rule?**
- ✅ Options have stable IDs, so a rename keeps the rule working. Deleting the option warns the builder and removes the rule.
- Rename keeps the rule; deleting the option marks the rule broken
- Rules store the option text (a rename silently breaks them)

**Q11. Can a field's type be switched after it's created (e.g. Single Line → Multi-line)?**
- ✅ No. The type is fixed; delete and re-add instead (keeps the code simple and the config type-safe).
- Yes, between similar types only

**Q12. Number "is within range" 18–65: do 18 and 65 count?**
- ✅ Yes, both ends are included (18 ≤ x ≤ 65). Both bounds are required and min ≤ max.
- Inclusive, with either end optional
- Exclusive

## Round 4: Calculation and Number fields

**Q13. Average of Q1=10, Q2=20, Q3 empty. What does the Calculation show?**
- ✅ 15. Empty sources are skipped. If every source is empty, show "—" (not 0).
- 10 (treat empty as 0)

**Q14. A Calculation source is hidden by a rule but still has a value. Is it counted?**
- ✅ No. Hidden counts as empty everywhere, and the result updates the moment the source hides.
- Yes, keep counting it

**Q15. A Number field has 2 decimal places and the user types 3.14159. What happens?**
- ✅ It rounds to 3.14 when the user leaves the field (no error)
- Block extra digits while typing
- Show a validation error

**Q16. When do validation errors appear (e.g. 150 in a 0–100 field)?**
- ✅ When the user leaves the field (or presses Submit), then live while they fix it. Same rule for every field type.
- Only on Submit
- Live while typing

## Round 5: Responses and template edits

**Q17. A template is edited after responses exist (field deleted, label renamed). What does an old response's PDF show?**
- ✅ Exactly what was submitted: each response keeps the form as it was at submit time
- Today's version of the form (old records silently change)
- Lock template editing once responses exist

**Q18. The user half-fills a New Response, then closes the tab. What happens?**
- ✅ Nothing is saved until Submit. "Filled instances" = submitted responses.
- Auto-save drafts

**Q19. What does the user see after Submit?**
- ✅ The responses list for that template, with the new response highlighted
- A read-only "Submitted" view
- A fresh blank form

**Q20. Can the user Download PDF before submitting?**
- ✅ No. It's available only after Submit (the PDF needs a submission timestamp). Before that the button is disabled, with a tooltip.
- Allow it, marked as a draft

## Round 6: PDF export

**Q21. How do we make a PDF without libraries?**
- ✅ Print dialog: render a styled export document into a hidden iframe → `print()` → the user picks "Save as PDF"
- A hand-written PDF file (raw PDF objects + Helvetica → Blob download)
- Canvas pages → an image-only PDF

**Q22. How does an optional field left empty appear in the PDF?**
- ✅ Its label with "—"
- Omit empty fields

**Q23. Overall PDF look?**
- ✅ Document style: a header block (title, submitted timestamp, response ID), Section Headers as headings, label/value rows, files listed as "name (size), file not embedded", multi-select as a comma list, page numbers
- Looks like the filled form

**Q24. Fill Mode goes to the responses list after Submit. How does Fill Mode offer the PDF?**
- ✅ Two buttons: "Submit" and "Submit & download PDF" (both validate and save first)
- PDF only from the responses list
- Auto-download on every submit

## Round 7: Builder experience

**Q25. How are fields reordered and added by drag?**
- ✅ Native HTML5 drag-and-drop (no library) plus ↑/↓ buttons for the keyboard and as a fallback. Dragging from the palette uses the same mechanism.
- The dnd-kit library (a new dependency)
- Up/down buttons only

**Q26. Save is clicked with invalid config (empty label, select with no options)?**
- ✅ Block save. Problem fields get a red dot and the message says "N fields need attention". Stored templates are always valid.
- Save anyway with warnings, and block New Response until fixed

**Q27. Leaving the builder with unsaved changes?**
- ✅ Warn: an "Unsaved changes" indicator, plus a confirm dialog on in-app navigation and `beforeunload`. No autosave.
- Auto-save as you go
- Silently discard

**Q28. Where does a field added from the palette go?**
- ✅ Below the selected field (or at the end if none is selected), and the new field is auto-selected
- Always at the end

## Round 8: Field-specific details

**Q29. A Section Header is hidden by a rule. What disappears?**
- ✅ Only the header itself (no implicit grouping; each field needs its own rule)
- The header and every field up to the next header

**Q30. Multi Select with max 3: the user tries to tick a 4th?**
- ✅ The remaining options are disabled, with the hint "Maximum 3 selected". Min is still validated on blur/submit.
- Allow it and show an error

**Q31. How does the user deselect an optional Single Select (radio/tiles)?**
- ✅ A "Clear selection" link when the field is optional and has a value; the dropdown has an empty "— Select —" option
- Click the selected option again to unselect it
- No way to clear

**Q32. File Upload (.pdf, .png, max 2): the user picks 3 files, one of them a .docx?**
- ✅ The picker uses `accept`; wrong-type files are rejected with a message, files beyond the max aren't added ("Only 2 files allowed"), and valid files are kept
- Add them all and show an error

## Round 9: More field details

**Q33. Date "Pre-fill with today" is on, but today is outside the allowed min/max range?**
- ✅ Pre-fill anyway; the normal range error shows on blur/submit, and the builder's config panel warns "Today is outside the allowed range"
- Skip the pre-fill when out of range
- Block saving this combination

**Q34. A text field has max length 50?**
- ✅ Hard stop (native `maxLength`) plus a "42 / 50" counter. Min length is validated on blur/submit.
- Allow typing past the max and show an error

**Q35. Which fields get which rule groups?**
- ✅ Every field (including Section Header and Calculation) gets Visibility rules; only the 7 input types get Required + Required rules. Declared per type in the registry.
- Rules on input fields only

**Q36. What kind of input does the Number field use?**
- ✅ `<input type="text" inputmode="decimal">` that accepts only digits, "-" and "."; the value is stored as `number | null`
- Native `type="number"`

## Round 10: Storage and app structure

**Q37. How are "form as submitted" snapshots stored?**
- ✅ Template versions: the template holds `versions`; a response stores `{ templateId, templateVersion }`, so responses to the same version share one copy
- A full copy of the template in each response

**Q38. Corrupted or old-format data in localStorage?**
- ✅ Validate with **zod** (a new dependency, approved here)
- Hand-written type guards, skipping bad records with a notice
- Reset everything

**Q39. Routing / surviving a refresh?**
- ✅ **react-router** (a new dependency, approved here)
- Hand-rolled hash routes
- State only (a refresh returns home)

**Q40. Management actions beyond the spec?**
- ✅ View a response (read-only, in the app)
- ✅ Delete a response
- ✗ Delete template
- ✗ Duplicate template

## Round 11: Versioning details and Preview

**Q41. When does Save create a new template version?**
- ✅ Only if the current version already has responses; otherwise Save overwrites it in place
- Every save

**Q42. One record in localStorage fails zod validation?**
- ✅ Skip it (it's left in storage, not deleted) and show a dismissible notice; responses whose template/version is missing are skipped too
- Skip silently
- A blocking error screen with "Reset data"

**Q43. How does the builder's Preview open?**
- ✅ A full-screen modal that renders the current, unsaved builder state in Fill Mode; Submit says "Preview — nothing saved"
- A Build/Preview tab toggle
- A live split view

**Q44. Is the template title versioned?**
- ✅ Yes. The title is part of the version, so old PDFs show the title as submitted.
- The title is always current

## Round 12: Workflow and finishing touches

**Q45. Steps or Build mode?**
- ✅ Build for now. "Help me understand the steps later": walk through each step afterwards.
- Steps

**Q46. Keep the "confirm test cases before implementing" gate?**
- ✅ No pauses. Write the tests first, show them in the summary, and keep going.
- Keep it for the engine only
- Keep it for everything

**Q47. Visual theme?**
- ✅ Light only, clean SaaS, with CSS variables (dark mode goes under "with more time")
- Light + dark

**Q48. What does each responses-list row show besides the timestamp and Re-download PDF?**
- ✅ A preview of the first answers (the first 2 non-empty visible values)
- ✗ A form version badge
- ✗ A sequential response number

## Revision (after Phase 1): simplification review

**Q49. "Are we sure we haven't over-engineered this?"** In review, template versioning (Q37, Q41) turned out to be the heavier option: a version list, a "new version only if responses exist" rule, missing-version checks.
- ✅ Switch to a **full copy of the form in each response**. Same guarantee (old responses show exactly what was submitted), noticeably less logic. Also dropped the `:backup` key for unparseable storage JSON.
- Keep template versioning

This **replaces Q37 and Q41**. Q44 (title as submitted) still holds, because the copy includes the title.

## Round 13: Visual design

**Q50. What does each field look like on the builder canvas?**
- ✅ A live mini-preview (label + a disabled version of the real input); the selected field is highlighted
- Compact one-line rows

**Q51. Fill Mode layout?**
- ✅ One card with a single column (max ~680px), Section Headers as dividers
- A card per field (Google Forms style)

**Q52. Where do a field's rules live in the builder?**
- ✅ Right panel tabs: Settings | Logic
- One long scrolling panel

**Q53. Icons?**
- ✅ Hand-written inline SVGs ("don't go for a lib for now")
- The lucide-react library
- Text glyph badges

**Q54. Visual direction?** The user shared three form-builder screenshots for inspiration and asked to use **Keychain's design system** (the company the assignment is for).
- ✅ Keychain's visual language, taken from keychain.com's computed styles: Inter, slate text, `#e2e8f0` borders, 6px corners, a yellow primary button with black text, uppercase eyebrow labels, yellow icon tiles, a yellow tab underline. Layout patterns come from the screenshots. Inspired by, not a copy of: no Keychain logo or name.
