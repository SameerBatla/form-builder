# Project

React 19 + TypeScript (strict) + Vite. Tests: Vitest + React Testing Library (jsdom).

Commands:
- `npm run dev`
- `npm test` · `npm run test:watch`
- `npm run typecheck` · `npm run lint` · `npm run format`
- `npm run check` (typecheck + lint + test; run it before saying done)

**Principle: build the simplest correct solution that can be completed, understood, demonstrated and defended in a
45-minute interview.** Don't optimize for impressive architecture. Optimize for working software and clear engineering
decisions. Correctness, clarity and my understanding matter more than architectural sophistication.

## Round workflow

1. Read `TASK.md` (the problem as given; never edit it).
2. Inspect the existing project, especially `App.tsx`, `types.ts`, `index.css` and existing components.
3. Write `PLAN.md` using the template below. No application code yet.
4. Ask once: **"Steps or Build?"** Record the answer in `PLAN.md`. I can switch at any time: "Go step by step now" /
   "Just build the rest".
5. First build step: delete the example `components/Counter/` and its use in `App`, if present.

### Both modes

- Implement one complete, user-visible behavior at a time: a working vertical slice, not all the UI first and all the
  logic later. Keep the application runnable after every step.
- Before introducing non-trivial logic, briefly explain the approach.
- Run `npm test` after logic changes. Run `npm run check` before declaring the MVP complete.
- Never dump large amounts of code at once. Don't silently rewrite existing working code. When modifying it, explain
  what changed and why.

### Steps

After each step, stop with exactly four lines, then wait for me:

**Changed:** files · **Where:** `file → function` · **See it:** what to click and expect · **Note:** one gotcha or tradeoff.

### Build

Build means **I don't pause for review between steps**. It does **not** mean writing everything at once. The
"Both modes" rules still apply. For each MVP step, in plan order:

1. Implement only that step's feature, and nothing from later steps.
2. Validate it: run `npm test` if logic changed, and make sure the app still builds and runs.
3. Tick it in `PLAN.md` and post one progress line: `Step N done: <what works now>`.
4. If validation fails, fix it before moving on. If you can't fix it quickly, stop and tell me.

After the last step, run `npm run check`, give one summary line per step (**Changed · Where · See it**), and wait for me
before starting anything under Later.

### MVP first

- Build only the problem's explicit requirements.
- Persistence (localStorage), routing, extra filters or views, animations, loading skeletons, refactors and polish go
  under Later until I ask.
- If a requirement is ambiguous, take the simplest reasonable interpretation and say so in one line.
- No new dependencies. No refactors I didn't ask for. Never commit; I commit from VS Code.

### "I'll write this"

Leave `// TODO(me):` with the function signature and a one-line hint. Don't implement it. Stop and let me write it,
then review my implementation when I share it.

## Interview mode

| Time | Activity |
|---|---|
| 0–5 min | Understand requirements and inspect the project |
| 5–8 min | Define the MVP and the implementation plan |
| 8–30 min | Implement core functionality |
| 30–38 min | Handle important edge cases |
| 38–43 min | Tests, debugging and validation |
| 43–45 min | Review the implementation and explain tradeoffs |

These are flexible timeboxes, not strict deadlines.

- Don't spend excessive time planning. Get a working vertical slice early.
- Prefer one working feature over several unfinished ones, and core requirements over optional polish.
- If time is running short, explicitly identify what should be deferred.
- Never claim a command passed unless it actually succeeded.

### Understanding

I must be able to explain and defend the implementation during the interview. Explain important decisions, not every
line of straightforward code. Help me understand:
- why a particular state structure was chosen
- how state changes affect rendering
- why a particular event handler or function is needed
- how important edge cases are handled
- why a particular implementation approach was selected
- how the implementation could be extended if the interviewer changes the requirements

If several approaches are valid, choose the simplest, briefly mention the alternative, and explain why the chosen one
is sufficient.

## PLAN.md template

It must be readable in 30 seconds: one line per item, no paragraphs or notes. Explanations go in chat.
The **Architecture** section tells me and the interviewer how the code will be organized before any is written:
3–6 one-line decisions, each as `decision · why`. Cover where state lives, the files and folders to create, and any
hook, context, lib or persistence choice. If a decision changes mid-round, update its line.

```md
# Plan
**Mode:** Steps | Build
**MVP:** <one sentence: what the user can do when it's done>

## Architecture
- State: <what> in <component or hook> · <why it lives there>
- Files: `lib/<domain>.ts` (<functions>), `components/<Name>`, … · <why this split>
- <Other decision, e.g. search debounce in `hooks/useDebouncedValue.ts`> · <why>

## MVP
- [ ] 1. <verb + visible result, max ~12 words>
- [ ] 2. <verb + visible result, max ~12 words>
(3–5 steps in total)

## Later (not built unless I ask)
- <one line each>

## Code map
| Feature | Logic (lib/ → function) | UI (components/) |
|---|---|---|
```

Tick each step (`[x]`) when it's completed. Add a code map row for every feature built, including contexts
(`Leave state → context/LeaveContext.tsx → LeaveProvider, useLeave`).

## Where code lives

Use this structure as a default, not a mandatory template.
Group files by feature or domain when that improves discoverability.
Don't introduce new architectural layers without a clear benefit.
Don't create files just to satisfy a convention.

```text
src/
  App.tsx                 Page composition and state that coordinates multiple features
  types.ts                Shared data types (the domain model). Read this first to understand the app
  index.css               Global only: reset, CSS variables, page layout
  components/<Name>/
    <Name>.tsx              Default export, props type declared above it
    <Name>.module.css
    <Name>.test.tsx
    index.ts                export { default } from './<Name>'
  hooks/use<Name>.ts      Cohesive reusable stateful logic, or related state and handlers
                          when extracting them makes the component easier to understand
  context/<Domain>Context.tsx  Only for widely shared state
  lib/<domain>.ts         Pure business logic, no React. Tests next to it in <domain>.test.ts
  lib/dates.ts            Date math and parsing only
  lib/format.ts           Display formatting only
  data/seed.ts            Sample or mock data
  api/<resource>.ts       Fetch calls with typed responses (only if the task has an API)
  test/setup.ts           Test setup. Never imported by the app
  test/fixtures.ts        Fake data builders shared by 2+ test files
```

| If it's… | It goes in… |
|---|---|
| Filtering, sorting, validating or calculating | `lib/<domain>.ts`, as a named function |
| UI-only behavior (open/closed, hover, active tab) | The component |
| State and event handlers | Component or hook that owns the behavior; lift to the lowest common ancestor when shared |
| Reusable logic with state or timers (debounce, fetching, intervals) | `hooks/use<Name>.ts` |
| State shared by distant components | `context/<Domain>Context.tsx` |
| A data shape | `types.ts` |
| A visible piece of UI and its styles | `components/<Name>/` |
| Colors, spacing, fonts, reset | `index.css` |
| Date math and display formatting | `lib/dates.ts` and `lib/format.ts` |
| Sample data and shared test fixtures | `data/seed.ts` and `test/fixtures.ts` |

## Code rules

### Components and data flow

- Use plain idiomatic React: `useState` and props first. Lift state only when needed. No clever abstractions.
- **Derived data is never state.** Compute it at the top of `App`'s render with named constants and pass it down:
  `const visibleRequests = filterRequestsByCountry(requests, country)`.
- **Where logic goes:** if it filters, sorts, validates or calculates, it goes in `lib/`. If it only toggles UI
  (open/closed, hover, active tab), it can stay in the component. Components otherwise just render and call callbacks.
- Join or look up data once in `App`, then pass ready-to-render data down.
- Name functions after what they do (`filterRequestsByCountry`, `findOverlaps`). Never use `helpers`, `utils` or
  `process`. Use one domain noun per lib file (`lib/leave.ts`).
- Import components from their folder: `import RequestCard from './components/RequestCard'`.
- Validate external data (API, localStorage) where it enters the app.

### Types

- No `any`. Use union types for variants (`type Status = 'pending' | 'approved'`).
- Type props and API responses. Shared data shapes live in `types.ts`.

### Component splitting

- Split components by independent responsibilities, not arbitrary line counts: when a component has several
  responsibilities or becomes hard to understand. Don't create extra components just to reduce line count.
- Keep `App.tsx` focused on page composition and state that genuinely coordinates multiple features.
- Avoid premature custom hooks and abstractions.
- Keep feature-specific state and behavior near the feature unless multiple components need to share it.

### Readable over clever

The code should look simple to someone reading it for the first time.

- Use full names (`request`, `employee`, `event`). Never `r`, `e`, `o` or `rs`.
- **Functions:** use `function` declarations for components and exported `lib/` functions. Use arrow functions for
  handlers and callbacks.
- **Handlers:** `handle<Action>` arrow functions with a block body, defined before the JSX
  (`const handleApprove = (requestId: string) => { … }`). Props that receive them
  are named `on<Action>`. Inline arrows in JSX are only for one-call wrappers (`onClick={() => onApprove(request.id)}`).
- **Callbacks:** extract complex callbacks into named functions.
  Nested iteration is allowed when it is the clearest solution.
- **No clever one-liners:** nested iteration, `Object.fromEntries`, Map/Set operations and dynamic lookups like
  `styles[status]` are allowed when they improve clarity. Prefer `for...of` and explicit `if` statements when they
  improve readability.
- Use optional chaining only when a value can genuinely be missing.
- Comments explain why, never what. No tutorial comments about React basics (keys, controlled inputs, htmlFor).

### State updates

When the new state depends on the previous state, always use the updater form with a block body. Name the variables
`prev<State>` and `next<State>`:

```tsx
setRequests((prevRequests) => {
  const nextRequests = setStatus(prevRequests, id, 'approved')
  return nextRequests
})
```

Use plain `setX(value)` only when the new value doesn't depend on the old one: `setView('calendar')`.

### Shared state (context)

Start without context: state in `App`, passed down as props.

- Use context only when the task asks for it, or props pass through 2+ components that don't use them. Say which
  reason applies in chat.
- One context per domain (`LeaveContext`, `AuthContext`), never one big `AppContext`. Each file exports only
  `<Domain>Provider` and `use<Domain>()`.
- Type the value: `createContext<LeaveContextValue | null>(null)`, where `LeaveContextValue` lists the state and
  the `on<Action>` handlers.
- The hook calls `useContext` and, if the result is `null`, throws `use<Domain> must be used inside <Domain>Provider`.
  Components never call `useContext` directly.
- Inside the provider, use `useState` and named `handle<Action>` handlers that call `lib/` functions when appropriate.
  Expose them as `on<Action>`: `const value = { requests, onApprove: handleApprove }`.
- `useReducer` is a last resort. Use it only if the task asks for it, or one action must update several separate pieces
  of state together, and ask me first.
- Derived data is never stored in context.

### Styling

- Each component with its own styles gets a `<Name>.module.css`, imported as
  `import styles from './<Name>.module.css'`. Skip it if the component has no styles of its own.
- Use camelCase class names.
- `index.css` holds only the reset, CSS variables and page layout. Never put component styles in it.
- Use CSS variables (`var(--space-2)`) instead of hard-coded colors or sizes.
- No inline `style={{}}` except for genuinely dynamic values (e.g. a computed width).
- Keep styling functional and consistent. Don't spend interview time on unnecessary visual polish.
- Prettier formats automatically (no semicolons, single quotes). Match that style in code you write.

## Testing and validation

Tests sit next to the code they cover (`<Name>.test.tsx`, `<domain>.test.ts`).

Prioritize:
- core user interactions
- important business rules and edge cases
- non-trivial state transitions

Avoid:
- excessive tests for trivial implementation details
- tests coupled to implementation internals
- spending more time testing than implementing the MVP

Fix failures before claiming completion. If time runs out, clearly state which validations were skipped.
