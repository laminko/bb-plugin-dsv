# TASKS — bb-plugin-dsv

Chunk size: one plan step. 3 chunks. Stop if chunk 1 is red.

- [x] 1. `logic.ts` + `logic.test.ts` → A1: 24 of 24 pass (Node v24.18.0, 2026-09-11)
- [x] 2. `app.tsx` + no-op `server.ts` + manifest → `bb plugin build` (6 of 6 artifacts; `tsc` exit 0; installed `dsv@0.1.0 running`)
- [x] 3. Install → 100k × 20 file in thread storage → A2 < 2 s, A3 < 300 ms, A4 < 60 rows
      A2 744 ms click → paint · A3 86 ms worst of 15 steps · A4 35 data rows max of 47 positions

## v1.1 (0.2.0)

Plan sections: "Proposal v1.1", its 3 addenda, "v1.1 build order", "Handoff v1.1" (approved `go`, 2026-09-11).
Chunk size: one build-order chunk. 2 chunks. Stop if chunk 1 is red. Thread: thr_nsupnfj4kf.

- [x] 1. `logic.ts` + 11 new tests → A1: 35 of 35 pass (Node v24.18.0, 2026-09-11)
- [x] 2. UI (Format popover, Search-in popover, go to line, icon toggles) + build + live check → A2–A4 and 4 live checks
      `tsc` exit 0 · 6 of 6 artifacts · `dsv@0.2.0 running`
      A2 722 ms click → paint · A3 78 ms worst of 20 steps · A4 34 data rows max of 47 positions
      Format 3 of 3 selects · Search in 5 columns · go to line 50,001 in 7 ms, top row, marked · icons 2 of 2
- [x] 0.2.1 Filter button: funnel icon in place of `+` → `tsc` exit 0 · A1 35 of 35 · `dsv@0.2.1 running`
      svg 1 of 1 · 3 of 3 clicks add a filter row · A3 75 ms · A4 34 · A2 not re-measured
- [x] 0.2.2 `#` = data row number from 1; box renamed "Go to row", row N → `tsc` exit 0 · A1 34 of 34 · `dsv@0.2.2 running`
      A2 795 ms (before the rename) · A3 114 ms · A4 34 · first row 1 · row 50,001 at the top in 22 ms, marked
- [x] 0.2.3 header distinct from rows → `tsc` exit 0 · A1 34 of 34 · `dsv@0.2.3 running`
      H1–H4 pass in light and dark · A2 746 ms · A3 76 ms · A4 34
- [x] 0.3.0 Code view = raw text (`experimental_SourceCode`) → `tsc` exit 0 · A1 34 of 34 · `dsv@0.3.0 running`
      C1 3 of 3 · C2 495 ms worst of 3 · A2 621 ms · A3 78 ms · A4 34 · C4 not built

## v1.3 (0.4.0)

Plan: "Proposal v1.3" and "Decisions v1.3" (approved `go, here`, 2026-09-11). Thread: thr_nsupnfj4kf.
Chunk size: one plan chunk. 3 chunks. Stop if chunk 1 is red.

- [x] 1. `logic.ts` + 5 tests (TSV, selection) → A1 39 of 39 pass · `tsc` exit 0 (2026-09-11)
- [x] 2. Selection (mouse, keyboard, look), Copy menu, Format and Copy icons → S1–S12, K1, I1: all pass · `dsv@0.4.0 running`
      S4 20 ms · S9 95 ms (100,000 × 20) · K1 6 of 6 keys · S12 choice kept after a reload
- [x] 3. Column resize → R1 +100 px · R2 automatic width back · R3 17 ms longest frame · A2 833 ms · A3 110 ms · A4 34

## v1.4 (0.5.0)

Plan: "Proposal v1.4", its ⌘F / ⌘G addendum, and "Decisions v1.4" (approved `go, here`, 2026-09-11). Thread: thr_nsupnfj4kf.
Chunk size: one plan chunk. 2 chunks. Stop if chunk 1 is red.

- [x] 1. `logic.ts` (`ENCODINGS`, `decode()`) + 2 tests → A1 41 of 41 pass · `tsc` exit 0 (2026-09-11)
- [x] 2. Loader, Encoding select, status bar, ⌘F / ⌘G, Thai test file → E1–E3 and K2–K4 pass · `dsv@0.5.0 running`
      E1 34 unreadable → `กรุงเทพ` exact · E2 52 ms / 46 ms · A2 677 ms · A3 64 ms · A4 33

## v1.5 (0.6.0)

Plan: "Proposal v1.5" (approved `go`, 2026-09-14). Thread: thr_eksuvt3xcn. Branch `feat/sort`.
Chunk size: one plan chunk. 2 chunks. Stop if chunk 1 is red.

- [x] 1. `logic.ts` (`sortHits()`, cached ranks) + 5 tests → A1 46 of 46 pass · T1 `tsc` exit 0 (Node v24.18.0, 2026-09-14)
- [x] 2. `app.tsx` (sort button, status bar, `aria-sort`, go to row by `indexOf`) → O1–O5, G1, A2–A4 · `dsv@0.6.0 running`
      code done: `tsc` exit 0 · A1 46 of 46 · `dsv@0.6.0 running` · dist has `data-sort`
      measured on 0.7.0 with 1 level, in the v1.6 run: O1–O5 and G1 pass · O2 109 ms · O3 44 ms · O4 72 ms · G1 59 ms · A2 297 ms · A3 62 ms · A4 33

## v1.6 (0.7.0)

Plan: "Proposal v1.6" and "Decisions v1.6" (approved `go`, 2026-09-14, defaults 1–3, in thr_eksuvt3xcn). Built in thread thr_3tdnaaba2e. Branch `feat/sort`.
Chunk size: one plan chunk. 3 chunks. Stop if a chunk is red.

- [x] 1. `logic.ts` (`SortKey`, `sortHits()` takes a list of levels) + 3 tests; the 5 v1.5 sort tests use the list form → A1 49 of 49 pass · T1 `tsc` exit 0 (Node v24.18.0, 2026-09-14)
      `app.tsx` gets a one-line change (`[sort]`) so that T1 compiles. v1.5 behaviour is unchanged.
- [x] 2. `app.tsx` (levels state, shift+click, level numbers, Sort panel, status bar) → T1 · `bb plugin reload dsv` · `dsv@0.7.0 running`
      T1 `tsc` exit 0 · A1 49 of 49 · `dsv@0.7.0 running` · `dist/app.js` has "Sort by several columns" (1 match)
- [x] 3. Live checks M1–M7, O1–O5, G1, A2–A4 (headless Chrome, port 9333) → "Result v1.6" in the plan
      `thr_eksuvt3xcn/v16.mjs` 13 of 13 (run 1: 12 of 13, a defect in my G1 check) · M1 and M5 0 of 99,999 pairs out of order · M6 3 of 3 · M7 202 ms / 54 ms · A2 297 ms · A3 62 ms · A4 33
- [x] Merge and push: `main` fast-forwarded to `feat/sort` and pushed
- [x] Repo move to `~/Gondor/GitHub/bb-plugins/bb-plugin-dsv` (user's choice, 2026-09-14), recorded and pushed in the commit "Record the repo move to bb-plugins/bb-plugin-dsv"
      working tree restored to `HEAD` (it held the 0.5.0 files) · A1 49 of 49 · `tsc` exit 0 · `bb plugin install <path> --yes` → `dsv@0.7.0 running` from the new path
- [x] Back to `~/Gondor/GitHub/bb-plugin-dsv` (user's choice, 2026-09-14): `main` fast-forwarded to `origin/main`; `feat/sort` was already in `main`
      A1 49 of 49 · `tsc` exit 0 · build has the v1.6 code · `bb plugin install <path> --yes` → `dsv@0.7.0 running` from this clone
- [x] 0.7.1 Sort button: Font Awesome Free `sort` icon (branch `feat/sort-icon`) → `tsc` exit 0 · A1 49 of 49 · `dsv@0.7.1 running`
      svg 1 of 1 · icon 14 × 14 px, as on Filter · text "Sort" and title kept
- [x] README.md + screenshot.png (branch `feat/sort-icon`) → P1 0 · P2 0 · P3 0 of 3,430 points · P4 reviewed by the user · D1 image link → committed file
      fresh clone: `bb plugin build` works with no `npm install` · the header reason note stays (user's choice)
- [x] Author and signature fix (user's request, 2026-09-14): all commits rewritten with the `laminko` author and signed with the personal key; commit IDs changed
