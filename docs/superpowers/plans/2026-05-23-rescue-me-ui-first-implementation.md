# Rescue Me UI-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Feature 04 only after the Rescue Me UI source contract is frozen and all native screens can be checked against the accepted design references.

**Architecture:** The design contract is owned by `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/README.md`, with `/Users/brunobrizolara/src/sleep-app/docs/design/screens/home/home.png` as the Home entry context. Native work must keep the zero-friction launch path local-first and must not add account, paywall, permission, network, or setup surfaces before the orb.

**Tech Stack:** Expo Router, React Native, TypeScript, Jest component/unit tests, iOS simulator screenshots, Graphify, ClickUp.

---

### Task 1: Freeze Source Contract (`04.UI.00`)

**Files:**
- Create: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/README.md`
- Create: `/Users/brunobrizolara/src/sleep-app/docs/superpowers/plans/2026-05-23-rescue-me-ui-first-implementation.md`
- Modify: `/Users/brunobrizolara/src/sleep-app/docs/features/04-rescue-me.md`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-active.html`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-active.png`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-active2.png`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-phase-2.png`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-complete.png`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-handoff.png`
- Track: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-handoff-2.png`
- Track if changed: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/home/home.png`

- [ ] **Step 1: Confirm source files exist**

Run:

```bash
find docs/design/screens/rescue-me -maxdepth 1 -type f -print | sort
file docs/design/screens/rescue-me/* docs/design/screens/home/home.png
```

Expected: the seven accepted Rescue Me files exist, and every PNG reports valid PNG image data.

- [ ] **Step 2: Confirm alias mapping is documented**

Run:

```bash
rg -n "rescue-me-active-launch|rescue-me-active-reassurance|rescue-me-complete|rescue-me-sound-handoff" docs/design/screens/rescue-me/README.md
```

Expected: every downstream alias is present in the source contract.

- [ ] **Step 3: Confirm no native app code changed**

Run:

```bash
git diff --name-only -- apps packages
```

Expected: no output for this ticket.

- [ ] **Step 4: Update Graphify**

Run:

```bash
graphify update .
```

Expected: command exits 0 and graph metadata is current.

- [ ] **Step 5: Commit and push the frozen contract**

Run:

```bash
git add docs/features/04-rescue-me.md docs/design/screens/home/home.png docs/design/screens/rescue-me docs/superpowers/plans/2026-05-23-rescue-me-ui-first-implementation.md
git commit -m "Freeze Rescue Me UI handoff"
git push origin main
```

Expected: `main` receives the design-only handoff commit.

### Task 2: Home Rescue Me Entry UI Parity (`04.UI.01`)

**Files:**
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/home/home.png`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/README.md`
- Modify if needed: `/Users/brunobrizolara/src/sleep-app/apps/mobile/src/home/home-screen.tsx`
- Modify if needed: `/Users/brunobrizolara/src/sleep-app/apps/mobile/src/home/home-actions.ts`
- Test: `/Users/brunobrizolara/src/sleep-app/apps/mobile/tests/home-screen.component.jest.test.tsx`

- [ ] **Step 1: Re-read the frozen source contract**

Run:

```bash
sed -n '1,220p' docs/design/screens/rescue-me/README.md
```

Expected: Home entry constraints, Ember usage, and downstream parity requirements are visible before editing.

- [ ] **Step 2: Verify or write the Home quick-action contract test**

Test contract:

```ts
expect(screen.getByText("Rescue Me")).toBeTruthy();
expect(screen.getByText("Immediate")).toBeTruthy();
expect(screen.getByText("Sounds")).toBeTruthy();
expect(screen.getByText("Breathe")).toBeTruthy();
expect(screen.getByRole("link", { name: "Rescue Me quick action" })).toBeTruthy();
```

Run:

```bash
pnpm --filter @nidoru/mobile test:component -- home-screen.component.jest.test.tsx
```

Expected: the row structure and route-aware accessibility contract pass.

- [ ] **Step 3: Adjust only Home quick-action UI if parity is off**

Touch only the Home quick-action card, icon box, spacing, or text styles needed to match `home.png`.
Do not implement active Rescue Me screens in this task.

- [ ] **Step 4: Capture iOS simulator proof**

Use the running simulator to capture Home with the Rescue Me, Sounds, and Breathe quick-action row visible.

Expected: screenshot shows equal-width quick actions aligned to the Home content column, with Ember only on the Rescue Me entry.

- [ ] **Step 5: Run verification**

Run:

```bash
pnpm --filter @nidoru/mobile test:component -- home-screen.component.jest.test.tsx
pnpm --filter @nidoru/mobile typecheck
pnpm --filter @nidoru/mobile lint
graphify update .
```

Expected: all commands exit 0.

### Task 3: Active, Reassurance, Completion, and Sound-Handoff UI Parity (`04.UI.02`)

**Files:**
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/README.md`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-active.html`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-active.png`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-active2.png`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-phase-2.png`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-complete.png`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-handoff.png`
- Inspect: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/rescue-me-handoff-2.png`
- Modify if needed: `/Users/brunobrizolara/src/sleep-app/apps/mobile/src/app/(tabs)/rescue-me.tsx`
- Add or modify if needed: `/Users/brunobrizolara/src/sleep-app/apps/mobile/tests/rescue-me-screen.component.jest.test.tsx`

- [ ] **Step 1: Re-read accepted aliases and constraints**

Run:

```bash
sed -n '1,240p' docs/design/screens/rescue-me/README.md
```

Expected: accepted file list covers launch, active phase, reassurance, completion, and sound handoff.

- [ ] **Step 2: Write focused UI contract tests before native parity work**

Minimum contracts to cover:

```ts
expect(screen.queryByText(/account|paywall|permission|choose|pick|setup/i)).toBeNull();
expect(screen.getByText("That took courage to start.")).toBeTruthy();
expect(screen.getByText("You completed 5 breath cycles.")).toBeTruthy();
expect(screen.getByText("Continue with a calming sound")).toBeTruthy();
expect(screen.getByText("Rain is playing")).toBeTruthy();
expect(screen.getByText("Works offline. You can stop anytime.")).toBeTruthy();
```

Run:

```bash
pnpm --filter @nidoru/mobile test:component -- rescue-me-screen.component.jest.test.tsx
```

Expected before implementation: the test fails only because the native UI is not implemented yet.

- [ ] **Step 3: Implement visual UI only**

Match the accepted references. Keep launch immediate, use the full-screen orb, keep reassurance as low-contrast bottom copy only, and avoid runtime persistence, analytics, audio playback, auth, network, paywall, permission, and storage implementation.

- [ ] **Step 4: Capture iOS simulator proof for every state**

Capture screenshots for active launch, active phase, reassurance, completion, and sound handoff.

Expected: screenshots are pixel-by-pixel comparable to the frozen references and use no Ember outside the Home entry.

- [ ] **Step 5: Run verification**

Run:

```bash
pnpm --filter @nidoru/mobile test:component -- rescue-me-screen.component.jest.test.tsx
pnpm --filter @nidoru/mobile typecheck
pnpm --filter @nidoru/mobile lint
graphify update .
```

Expected: all commands exit 0.

### Task 4: Implementation Follow-Through (`04.IMP.*`)

**Files:**
- Inspect before editing: `/Users/brunobrizolara/src/sleep-app/docs/features/04-rescue-me.md`
- Inspect before editing: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me/README.md`
- Modify only inside the specific downstream implementation ticket scope.

- [ ] **Step 1: Keep UI gates ahead of runtime gates**

Run:

```bash
git log --oneline -- docs/design/screens/rescue-me docs/design/screens/home/home.png | head
```

Expected: the frozen UI handoff commit exists before deeper `04.IMP.*` implementation starts.

- [ ] **Step 2: Preserve zero-friction security and privacy boundaries**

Before adding runtime code, verify the implementation does not call auth, paywall, permission, network, analytics, or sync before the orb is visible.

Expected: app behavior remains local-first and setup-free until the active Rescue Me session is visible.

- [ ] **Step 3: Use implementation-ticket verification gates**

Run only the commands named by the active downstream ticket, then run:

```bash
graphify update .
```

Expected: each implementation ticket has fresh test, typecheck, lint, and Graphify evidence before status moves to complete.
