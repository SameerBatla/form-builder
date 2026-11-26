# AI Usage Log

**Tool:** Claude Code, with two models:
- **Claude Opus 5.5 for planning:** the spec interview, `SPEC.md`, the design direction, the build plan, and the over-engineering reviews.
- **Claude Sonnet 5.5 for coding:** implementing each phase, writing the tests, and fixing what the tests and my manual testing found.
**How I worked:** I made the product decisions, the AI implemented them in small phases, and I approved each phase (with a commit) after reviewing its summary and checking the app myself. `npm run check` (typecheck + lint + tests) had to pass before every commit.

> Drafted with Claude from the session record, then reviewed and edited by me.

---

## 1. Turning the brief into a spec: an interview, not a build

**Prompt:**
> "Read the Task.md file and interview me in detail using the AskUserQuestion tool about literally anything: technical implementation, UI and UX, concerns, tradeoffs. Make sure the questions are not obvious. Be very in-depth and continue interviewing me until the specification is complete."

**What the AI produced:** 48 questions in 12 rounds (conditional-logic semantics, calculation edge cases, storage, PDF approach, builder UX), which became `SPEC.md`.

**What I checked or changed:**
- **I rejected a round as unclear.** It used jargon like "IDs + cascade on delete". I asked for it again, and it came back as concrete scenarios ("a dropdown has Red/Blue; a rule says show if = Red; you rename Red…"), which I could actually decide on.
- **I didn't take every recommendation:**
  - After Submit, I chose to go to the responses list rather than a read-only view.
  - I chose react-router and zod over hand-rolled routing and type guards.
  - I kept the AI's suggested ALL/ANY-per-group model for multiple conditions.

**Why it mattered:** the brief grades decisions on what the spec leaves open. Deciding them up front meant the build never stalled on ambiguity, and every decision is now listed in the README.

---

## 2. Checking for over-engineering, twice

**Prompt** (I asked once after Phase 1, and again at the end):
> "rereview for over engineering"

**What the AI produced:**
- **After Phase 1:** it admitted that **template versioning, which it had recommended earlier, was the heavier option**. That meant a version list, a "new version only if responses exist" rule, and checks for missing versions.
- **Second time:** a ranked list of six candidates to cut.

**What I changed or rejected:**
- I replaced versioning with **a full copy of the form inside each response**. It gives the same guarantee (old responses never change) with much less logic, and it was cheap to change after Phase 1.
- From the second review I applied two items: **File Upload matches extensions only** (as in the spec's example) and the **confirm dialogs moved out of `TemplateBuilder`**. I kept the rest. One was my own earlier decision (blocking Save when rules loop); the others were cheap polish.
- I also caught a small one myself: the decimal-places dropdown showed "1 (0.0), 2 (0.00)…". *"this seems overengg, lol"*. It became a plain 0–4.

---

## 3. Understanding a dependency before accepting it

**Prompts:**
> "what is zod? how much it impacts the project?" → "help me understand the usecase, i didnt get that"

**What the AI produced:** first a technical explanation, which didn't land. Then a concrete scenario: data saved in Phase 2 lacks a field added in Phase 5, so a refresh would crash with a white screen. That showed why localStorage has to be validated as untrusted input.

**What I checked:** I accepted zod only after understanding its job. It validates data at runtime where it enters the app (reading from localStorage, and again before exporting a stored answer), and the TypeScript types are derived from the same schemas, so the two can't drift apart. I didn't measure its bundle size separately. The README records why each of the two dependencies was added.

---

## 4. The visual design

**Prompt:** three reference screenshots of form builders, plus:
> "take inferances from such designs, not saying build these exact, but just have an impression from real products, also u can use design system of https://www.keychain.com/ as assignment is for them"

**What the AI did:**
- The site blocked automated fetching, so instead of guessing the brand it opened the site in a temporary, separate Chrome window and read the real computed styles: Inter, slate text colours, 6px corners, a yellow primary button with black text.
- It wrote `DESIGN.md` from those styles and the screenshots, without using Keychain's logo or name.

**What I rejected:** an icon library (*"dont go for a lib for now"*), so all icons are hand-written inline SVG.

---

## 5. A bug I found by hand: Preview and the Back button

**Prompt** (with a screenshot of "Discard unsaved changes?" showing over the Preview):
> "this is a bug right? why it is not allowing me to go back, if i back back from here i go to templates"

**What happened:** the automated tests covered Preview, but not the browser's Back button. I found the problem by using the app.

**AI's explanation and fix:** the unsaved-changes guard worked as designed. The real issue was that Preview looked like a page but wasn't in the browser history, so Back tried to leave the builder. The fix puts Preview in the URL (`?preview=1`), so Back closes it and the guard doesn't fire. It came with a test for my exact case.

**Lesson:** a passing test suite doesn't replace clicking through the app myself.

---

## 6. Plausible but incorrect AI output

Each of these looked right and was wrong. All were caught before committing.

1. **False technical claim.** The AI said writing the registry's contract as TypeScript methods would avoid a type cast. The type checker disproved it (the field type uses a conditional type, `Extract<…>`). Fixed with one documented cast and a corrected code comment.
2. **Wrong algorithm.** The first loop detector reported only one field of a three-field loop. A test caught it, and it was rewritten as: a field is in a loop if one of its dependencies depends back on it.
3. **Tests contradicting the documented rules:**
   - A test expected −1.25 to round to −1.2 under the rule "round half away from zero" (correct: −1.3).
   - A Calculation test ignored that a 0-decimal Number field rounds its value first.

   The code was right both times; the tests were fixed, with the reason stated.
4. **Bugs caught by tests:**
   - A `?? initialValue` fallback would have re-filled a date the user had cleared.
   - A Calculation showed "—" while typing.
5. **Wrong diagnosis.** A frozen headless browser was blamed on an infinite render loop. The debugger showed the app was fine; a stale browser profile was the cause.
6. **Over-claims in the README.** A final review found a false statement about prop chains, a claim about PDF file names that couldn't be verified, and stale test counts. All were corrected or removed.

---

## How AI output was verified

- **Me:** answering every spec question myself; reviewing each phase summary before approving its commit; testing the app by hand (which found the Preview/Back bug and the over-built dropdown); asking about behaviour I didn't understand (e.g. *"how are we applying all vs any check here"*, where the ALL/ANY picker appears only once there are two conditions; I kept that).
- **Automated:** 262 tests (engine rules written test-first from the spec), strict TypeScript with no `any`, lint, and `npm run check` before every commit.
- **Verification artifacts:** screenshots captured in headless Chrome for the implemented screens, plus a rendered PDF, inspected to confirm its layout and readability.
