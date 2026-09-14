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
- [ ] 2. `app.tsx` (sort button, status bar, `aria-sort`, go to row by `indexOf`) → O1–O5, G1, A2–A4 · `dsv@0.6.0 running`
