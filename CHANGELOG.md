# CHANGELOG — bb-plugin-dsv

## Docs — 2026-09-14

- `README.md`: description, features, keys, requirements, install, develop, limits, and credits.
- `screenshot.png`: only the dsv plugin, on the synthetic 100,000-row sample file (2,228 × 1,544 px, 554,035 bytes). The user reviewed it before the commit.
- The capture used a clip of the plugin area, never the full window. Checks inside the clip: 0 outside page texts (75 compared), 0 thread IDs, 0 of 3,430 points not in the plugin. A 5 px strip of bb's panel resize handle was cut from the left edge.
- The install commands were run: `bb plugin build` on a fresh clone with no `npm install`, and `bb plugin install <path> --yes` on this repo. A clone over HTTPS was not tested.
- Script: `thr_eksuvt3xcn/readme-shot.mjs` in bb thread storage, not in the repo.

## 0.7.1 — 2026-09-14

Request: "add sort icon in "Sort" button". Branch `feat/sort-icon`.

### Changed

- The Sort button shows the Font Awesome Free 6.7.2 `sort` icon before its word, like Filter, Copy, and Format. The word, the level count, and the title stay.
- The path is copied from Font Awesome's `svgs/solid/sort.svg` at tag 6.7.2. The `filter` path from the same source equals the one in `app.tsx`. The CC BY 4.0 note names the new icon.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 49 of 49 | 49 of 49 |
| T1 | `tsc` | exit 0 | exit 0 |
| I2 | Sort button in the live grid | icon, word, title | 1 `<svg>`, 14 × 14 px as on Filter; text "Sort"; title "Sort by several columns"; 62 × 28 px |
| — | plugin | running | `dsv@0.7.1 running` |

## Repo location — 2026-09-14

The repo is `~/Gondor/GitHub/bb-plugin-dsv`, on `main`. The installed `dsv@0.7.0` runs from it.
After 0.7.0, the user tried a new clone at `~/Gondor/GitHub/bb-plugins/bb-plugin-dsv`, and `800eb03` recorded that move. The user then chose `~/Gondor/GitHub/bb-plugin-dsv` again.
`bb plugin install <path> --yes` moves the installed plugin and keeps its settings. After each move: A1 49 of 49, `tsc` exit 0, and the build output has the v1.6 code.
The new clone's working tree first held the 0.5.0 files of `bb-plugin-dsv.archived` (6 of 6 files identical). They were restored to the committed files. Nothing from them was committed.
The `bb-plugins/bb-plugin-dsv` clone stays on disk. It is not used.

## 0.7.0 — 2026-09-14

Plan: "Proposal v1.6" and "Decisions v1.6" in `thr_huv4udkmb8/csv-plugin-plan.md`. The user approved it (`go`, defaults 1–3) in thread thr_eksuvt3xcn.

### Added

- Sort by several columns. Level 1 sorts first. Level 2 sorts only rows that are equal in level 1, and so on. Rows equal in all levels keep the file order.
- Header sort button. A click makes the column the only level: ascending → descending → off. Shift+click adds the column as the last level, ascending. Shift+click on a column in the list changes its direction in place. After descending, the level is removed.
- With 2 or more levels, each sorted button shows its arrow and level number, for example `↑1` and `↓2`. With 1 level, it shows only the arrow.
- Sort panel: a "Sort" button after Filter. The label shows the count, for example `Sort (2)`. One line per level: number, column, direction, move up, move down, remove. "Add level" adds the first unused column, ascending. "Clear" removes all levels. A column select disables the columns of the other levels. Hidden columns are listed too.
- The status bar lists all levels: `sorted by category ↑, price ↓`. Only the level-1 header has `aria-sort`.

### Changed

- `logic.ts`: `SortKey { col, dir }`. `sortHits(t, hits, keys)` takes a list of levels. Empty and unreadable cells stay last inside each level. The rank cache is unchanged. A1 has 49 tests.
- A plain click on a column that is already a level steps its direction, and the other levels go. Example: `↑2`, then a click, gives `↓` as the only level. The plan did not name the direction. This follows its "Click" rule.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 49 of 49 | 49 of 49 |
| T1 | `tsc` | exit 0 | exit 0 |
| M1 | click `category`, shift+click `price` 2 times | 0 of 99,999 pairs out of order | 0 of 99,999 |
| M2 | the same state | `↑1`, `↓2`; `sorted by category ↑, price ↓` | `↑1`, `↓2`; same text; `aria-sort` on `category` only |
| M3 | shift+click `price` again | level removed; `category` shows `↑` | `↑` and `↕`; `sorted by category ↑` |
| M4 | plain click on `name` | the only level is `name ↑` | `name ↑`; 1 of 20 buttons not `↕` |
| M5 | panel: `country ↑`, `city ↓`, `total ↑`, move `total` to level 1 | 0 of 99,999; header numbers match the panel | 0 of 99,999; panel 1 total ↑, 2 country ↑, 3 city ↓; headers `↑1`, `↑2`, `↓3`; `Sort (3)` |
| M6 | panel column selects | other levels' columns disabled | 3 of 3 lines |
| M7 | first level on a string column (`email`); its direction change | < 500 ms; < 300 ms | 202 ms; 54 ms |
| A2 / A3 / A4 | open, search and filter, scroll | < 2 s / < 300 ms / < 60 | 297 ms click → paint / 62 ms worst of 20 steps / 33 rows max of 47 positions |

The v1.5 checks O1–O5 and G1 were measured in the same run. They are in the 0.6.0 table.

How measured: headless Chrome on port 9333, bb's web UI `127.0.0.1:38886`, viewport 1440×913, grid 671 px tall, file `thr_8twbr93gzu/dsv-100k.csv`. Script: `thr_eksuvt3xcn/v16.mjs`, with real mouse input through CDP. An order check selects all rows, runs "Copy data" (clipboard stubbed), and tests every adjacent pair. Ties must keep the file order (`id`). The first 10 copied ids equal the grid's top 10 rows. Screenshots: `thr_eksuvt3xcn/dsv-v16-levels.png`, `dsv-v16-panel.png`.

### Found

- The first `v16.mjs` run failed G1. The defect was in my check, not in the plugin. It compared `style.top` with `scrollTop + 28`, and Chrome reads a large `top` back with 6 significant digits (`2.71144e+06px`). The check now uses the screen position. The rerun passed 13 of 13.
- A2 is 297 ms. Earlier runs measured 621–833 ms. Not explained; the browser may have cached the file.
- The live run could not see bb's storage list in the DOM. `v16.mjs` opens the file from its restored tab. A2 clicked the storage entry at (958, 387), not at y = 351.
- The "Recovery" entry names `~/Gondor/GitHub/bb-plugins/bb-plugin-dsv`. The repo is at `~/Gondor/GitHub/bb-plugin-dsv`. Corrected after 0.7.0, in a separate commit.

### Not included

- Drag to reorder levels, saved sort presets, a sort that stays after the tab closes, a maximum number of levels.
- Not tested live: a level on a hidden column, shift+click from the keyboard, dark mode, the Electron window. A paste into another app was not tested.

## 0.6.0 — 2026-09-14

Plan: "Proposal v1.5" in `thr_huv4udkmb8/csv-plugin-plan.md`. The user approved it (`go`) in thread thr_eksuvt3xcn.

### Added

- Sort by column. Each column name has a sort button. A click goes: ascending → descending → file order. The button shows ↕, ↑, or ↓.
- Numbers and dates sort by value, with the decimal symbol and date order of the column. Text sorts numbers as numbers ("item 2" before "item 10"). Case has no effect. Bool: false first.
- Empty cells, and cells that do not read as the column dtype, stay last in both directions. Equal values keep the file order.
- The sort applies to the search and filter hits. Copy gives the rows in the sorted order.
- The status bar shows `sorted by <name> ↑` or `↓`. The header cell has `aria-sort`.

### Changed

- `logic.ts` adds `sortHits()`. It caches the ranks of each sorted column on the table (`ranks`). A1 has 46 tests.
- Go to row finds the row with a scan (`indexOf`). A sort puts the hits out of file order, so the binary search no longer works.
- A click on a sort button does not select the column.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 46 of 46 | 46 of 46 |
| T1 | `tsc` | exit 0 | exit 0 |
| O1 | click the `price` sort button 3 times | minimum, maximum, file order | row 1: 0.00 `↑`, 500.00 `↓`, row 1 `↕` |
| O2 | first sort of `name` | click → paint < 500 ms | 109 ms; 0 of 99,999 pairs out of order |
| O3 | direction change on `name` | click → paint < 300 ms | 44 ms |
| O4 | search `oslo` while sorted | the order stays; < 300 ms | 72 ms; 10,092 rows, 0 of 10,091 pairs out of order |
| O5 | click the `city` name | column selected; sort unchanged | `100,000 × 1 selected`; `sorted by name ↓` stays |
| G1 | go to row 50,001 while sorted | at the top, marked | marked, 28 px under the header; 59 ms |
| A2 / A3 / A4 | open, search and filter, scroll | < 2 s / < 300 ms / < 60 | 297 ms / 62 ms / 33 rows |

Measured on 0.7.0 with 1 sort level, in the v1.6 run (see 0.7.0). The 0.6.0 build itself was not measured live.

## Recovery — 2026-09-14

The source was lost. It was in the personal workspace `env_2ias83ucbe`, and bb deleted that workspace on 2026-09-11 when its threads were archived.
The files were rebuilt from 3 Claude transcripts. 119 Write and Edit calls were replayed: 118 applied and 1 skipped, because it had failed in the original session.
New location: `~/Gondor/GitHub/bb-plugin-dsv`. The first copy went to `~/Gondor/GitHub/bb-plugins/bb-plugin-dsv`. No code changed. A1: 41 of 41 tests pass.
Not recovered: files made only by shell commands, for example the Thai test file for E1.

## 0.5.0 — 2026-09-11

Plan: "Proposal v1.4", its ⌘F / ⌘G addendum, and "Decisions v1.4". The user approved them ("go, here"), relayed by thread thr_8twbr93gzu.

### Added

- Encoding: the first select in the Format popover. Default UTF-8. 12 choices, all built into `TextDecoder`: UTF-8, UTF-16 LE, UTF-16 BE, Windows-874 (Thai, TIS-620), Windows-1252, Windows-1250, Windows-1251, Shift_JIS, EUC-JP, GB18030, Big5, EUC-KR.
- The file is fetched once as bytes. A new encoding decodes the bytes again with no new fetch, and the grid state starts over.
- The status bar shows the encoding. When characters cannot be read (U+FFFD), it adds "N characters could not be read — try another encoding".
- The Code view shows the decoded text.
- ⌘F / Ctrl+F focuses the Search box and selects its text. ⌘G / Ctrl+G focuses "Go to row". Both work only in Grid view, while the focus is in the dsv tab. The placeholders show the keys.

### Changed

- `load()` returns bytes, or text when bb has already decoded the file (the environment-diff source without base64). Then the Encoding select is disabled, and the status bar says "encoding set by bb".
- `logic.ts` adds `ENCODINGS` and `decode()`. A1 has 41 tests.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 41 of 41 | 41 of 41 |
| E1 | Thai Windows-874 file: UTF-8, then Windows-874 | a warning under UTF-8; the exact Thai cell and no warning under Windows-874 | 34 characters could not be read; `กรุงเทพ` exact; warning gone; 35 ms |
| E2 | 100k UTF-8 file: to Windows-1252 and back | each < 1 s; the grid equals the first load | 52 ms, 46 ms; equal |
| E3 | Code view after E1 | shows the Thai cell | `กรุงเทพ` in the viewer |
| K2 | ⌘F in the grid | Search focused, text selected, bb unchanged | yes; selection 0–4 |
| K3 | ⌘G | Go to row focused | yes |
| K4 | ⌘F in bb's chat composer | the dsv Search box does not get focus | yes |
| A2 / A3 / A4 | < 2 s / < 300 ms / < 60 | | 677 ms / 64 ms / 33 rows |

Conflict check, before the build: `bb settings keyboard list` gave 100 effective bindings and 0 overrides. ⌘F is bb's `browser.find`, only while bb's built-in browser has focus. ⌘G has no binding.

### Not included

- Auto-detect, a free-text encoding label, and saving the choice per file.
- The "encoding set by bb" path (environment-diff source without base64) was not tested live.

## 0.4.0 — 2026-09-11

Plan: "Proposal v1.3" and "Decisions v1.3". The user approved it ("go, here"), relayed by thread thr_8twbr93gzu.

### Added

- Selection, as in Excel. Click a cell for the active cell. Drag or shift+click for a range. Click or drag `#` cells for whole rows, and column names for whole columns. The top-left `#` selects all. A drag past an edge scrolls the grid.
- Keys in the focused grid: arrows move the active cell, shift+arrows extend the range, ⌘A / Ctrl+A selects all, Esc clears. A handled key does not reach bb.
- Look: the range has a light `primary` fill and a 1 px border. The active cell has a 2 px outline. The row numbers and column names of the range turn `primary`.
- Copy button (Font Awesome Free `clipboard` icon) with a menu: "Copy data", and "Copy data with field names" (the first line is the names of the copied columns). ⌘C / Ctrl+C runs "Copy data". The "⌘C copies" choice in the menu changes that, and `localStorage` keeps it.
- The copied text is TSV: a tab between cells, a line feed between rows. A cell with a tab, a line break, or `"` is quoted. Hidden columns are never copied. The status bar shows the selection size and "copied R × C".
- Resize columns: drag the right edge of a column name (minimum 40 px). Double-click the edge for the automatic width. Widths reset when the file opens again.
- Format button: Font Awesome Free `paintbrush` icon plus the word.

### Changed

- A selection is by position on screen. A change to search, filters, or shown columns clears it.
- One `Icon` component draws all 5 icons. Buttons use `inline-flex` with a gap, so an icon and its word line up.
- `logic.ts` adds `Sel`, `bounds()`, `step()`, `cells()`, and `toTsv()`. A1 has 39 tests.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 39 of 39 | 39 of 39 |
| S1 | click row 1 `id`, shift+click row 3 `email`, ⌘C | exact 3 × 3 TSV | pass |
| S2 | `#` 5 to `#` 7, `email` hidden | 3 lines × 19 fields | 3 × 19 |
| S3 | filter `city equals Oslo`, click `city` | lines = rows shown, all `Oslo` | 10,092 = 10,092, all `Oslo` |
| S4 | `email` column, 100,000 rows | < 1 s | 20 ms |
| S5 | selected vs unselected cell background | different | oklab(… / 0.1) vs transparent |
| S6 | drag row 1 `id` to row 3 `email` | same as S1 | pass |
| S7 | drag past the bottom edge, hold 2 s | the grid scrolls, the range grows | 6,120 px, 244 rows |
| S8 | shift+→ ×2, shift+↓ ×2 | same as S1 | pass |
| S9 | ⌘A, then ⌘C, 100,000 × 20 | < 2 s | 95 ms |
| S10 | "Copy data" | 3 lines, no names | pass |
| S11 | "Copy data with field names" | 4 lines, names first | pass |
| S12 | "⌘C copies" = with field names, ⌘C, reload | names line; choice kept | pass; kept after the reload |
| K1 | arrows, shift+↓, ⌘A, ⌘C, Esc in the grid | only the grid changes | 6 of 6 |
| I1 | Copy and Format buttons | icon, word, title | 2 of 2 |
| R1 | drag the `name` edge +100 px | +100 ±1, header = body | 112 → 212, 212 = 212 |
| R2 | double-click the edge | automatic width | 112 |
| R3 | longest frame during the drag | < 50 ms | 17 ms |
| A2 / A3 / A4 | < 2 s / < 300 ms / < 60 | | 833 ms / 110 ms / 34 rows |

The clipboard was stubbed in the headless page: the checks read the text given to `navigator.clipboard.writeText`. A paste into another app was not tested. S4 and S9 time the key press to that call.

### Found

- The first `v13.mjs` run failed 7 checks. `a3-a4.js` had run first and left a search and 3 filters on, so the copies were right for a 1,028-row view, not for the file rows the checks expected. `v13.mjs` now reloads and reopens the file first. The re-run passed all 17 checks.

### Not included

- ⌘-click for several ranges, cell editing and the fill handle, copy as CSV with the file's delimiter, saved column widths, column reorder.

## 0.3.0 — 2026-09-11

Plan: "Proposal v1.2 — Code view shows raw text". The user chose option 1 of "Request 0.2.3b" (`go` on v1.2), relayed by thread thr_8twbr93gzu.

### Changed

- The Code view shows the raw file text in bb's source viewer, `experimental_SourceCode`, in place of bb's preview (`Original`). bb's preview table, which numbered rows from 2 and showed 500 rows, is gone. The raw text keeps file line numbers: the header is line 1.
- The Code view uses the text that the grid already loaded. It does not fetch the file again.
- "Loading…" and load errors now show in both views. Before, they showed only in the grid view.
- The component is imported as `SourceCode`. JSX reads a lowercase tag such as `<experimental_SourceCode>` as a plain HTML element.
- `features-2.js` looks for `id,name,email` inside the source viewer, not in the whole page. The page's chat now contains that text too.

bb's viewer shows the first 3,493 of 100,001 lines, plus a "Load full file" button.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| C1 | raw `id,name,email` in the Code view | yes | 3 of 3 opens, inside the viewer's shadow DOM |
| C2 | Code view first paint, 100k file | < 2 s | 495 ms worst of 3 opens (the others: 54 ms, 53 ms) |
| C3 | A1 | 34 of 34 | 34 of 34 |
| C4 | optional: Go to row highlighted in the Code view | — | not built: it needs file lines, which 0.2.2 removed |
| A2 / A3 / A4 | open, search and filter, scroll | < 2 s / < 300 ms / < 60 | 621 ms / 78 ms / 34 rows |

Also measured: "Load full file" renders all 100,001 lines in 4,066 ms.

### Found

- bb's source viewer draws the lines inside the shadow DOM of `<diffs-container>`. The light DOM holds only the footer. My first C2 probe read the light DOM and wrongly reported "no text after 30 s".

## 0.2.3 — 2026-09-11

Plan: "Handoff 0.2.3" in the plan file. The user approved it and chose to build it in thread thr_nsupnfj4kf.

### Changed

- The grid header now stands out from the rows. Background `bg-muted` (was `bg-card`). Text `font-semibold` (was `font-medium`). Bottom border 2 px (was 1 px). The `#` header cell matches.
- The dtype badges use `bg-background`, so they stay visible on the `bg-muted` header.

Cause, measured on 0.2.2 in light mode: the header (`bg-card`) and a row's `#` cell (`bg-background`) were both rgb(247, 251, 253). The jarvis theme defines neither token, so bb derives them.

### Verified

| # | Check | Target | Light | Dark |
|---|---|---|---|---|
| H1 | header background vs a row's `#` cell | different | oklch(0.899 0.007 242) vs rgb(247, 251, 253) | oklch(0.270 0.021 227) vs rgb(5, 11, 18) |
| H2 | header `font-weight` | 600 | 600 | 600 |
| H3 | header `border-bottom-width` | 2px | 2px | 2px |
| H4 | badge vs header background | different | rgb(247, 251, 253) vs oklch(0.899 …) | rgb(5, 11, 18) vs oklch(0.270 …) |
| H5 | A1 | 34 of 34 | 34 of 34 | — |
| H6 | A2 / A3 / A4 | < 2 s / < 300 ms / < 60 | 746 ms click → paint / 76 ms / 34 rows | not measured |

Dark mode was measured by adding the `dark` class to `<html>` in the headless page, as bb does.

## 0.2.2 — 2026-09-11

### Changed

- The `#` column shows the data row number. The first data row is 1, with or without a header. A row keeps its number when search or filters hide other rows. The user chose this over "position on screen".
- The box is renamed "Go to row". Row N moves to the top and is marked. A number past the last row gives "no row N". A row that search or filters hide gives "row N is hidden by the search or filters". The rename came from the user through thread thr_8twbr93gzu.
- Removed the file-line tracking from 0.2.0: `parse(…, lines)`, `Table.starts`, `rowAtLine()`, `breaks()`. Nothing used it after this change.
- Tests: the 2 file-line tests are removed, and 1 test for `floorIndex()` is added. Their parser cases (CR row breaks, CR and CRLF inside quotes, a blank line) moved into "parse: line break inside quotes". A1 is now 34 of 34.

### Verified

| Check | Target | Measured |
|---|---|---|
| A1 | 34 of 34 | 34 of 34 |
| A2 | < 2 s | 795 ms click → paint; 685 ms mount → paint. Measured before the rename. After it, bb restored the tab, so A2 could not arm |
| A3 | < 300 ms | 114 ms worst of 20 steps after the rename (73 ms before) |
| A4 | < 60 | 34 data rows max over 47 scroll positions |
| First row number, header on | 1 | 1 |
| Go to row 50,001 | row 50,001 at the top, < 300 ms | 22 ms. Top row 50001 (id 50001), marked |
| Go to row 1 | row 1 | top row 1, marked |
| Row 100,005 of 100,000 | "no row" | "no row 100005" |
| Row hidden by filter `id > 60000` | notice, grid does not move | "row 50001 is hidden by the search or filters", scroll stays at 0 |

## 0.2.1 — 2026-09-11

### Changed

- The Filter button shows the Font Awesome Free 6.7.2 `filter` (funnel) icon in place of `+`. The word "Filter" stays. Its tooltip is "Add filter".
- `a3-a4.js` and `v11-checks.js` find the button by its `title`.

### Verified

| Check | Target | Measured |
|---|---|---|
| A1 | 35 of 35 | 35 of 35 |
| Filter button | icon, text, adds a filter | `<svg>` yes, text "Filter", title "Add filter", 68 × 28 px. 3 of 3 clicks added a filter row |
| A3 | < 300 ms | 75 ms worst of 20 steps |
| A4 | < 60 | 34 data rows max over 47 scroll positions |

A2 was not re-measured. bb restores the open `dsv-100k.csv` tab on page load, so the grid was in the DOM before `a2-arm.js` ran, and the load marks did not fire. The icon does not touch the load path.

## 0.2.0 — 2026-09-11

Plan: same file, sections "Proposal v1.1", its 3 addenda, "v1.1 build order", "Handoff v1.1" (approved `go`). Thread: thr_nsupnfj4kf.

### Added

- Format popover next to Delimiter and Header: Text qualifier `"` · `'` · none. Decimal symbol Auto · `.` · `,`. Date order Auto · DMY · MDY · YMD.
- Auto decimal, per column: float with `.` first, then float with `,`, each at ≥95%. Ints stay int.
- Auto date order, per column: the order that reads the most values. A tie (all days and months ≤ 12) goes to DMY.
- Date delimiter `.`, for example `31.12.2023`. One date must use the same separator twice.
- Status bar: `record delimiter CRLF | LF | CR | none`, from the file's first line break.
- Search in: a checkbox popover. All columns, or any set of columns. A row matches when any picked column contains the text. Each picked column is lower-cased and cached on first use.
- Go to line box. The `#` gutter shows the file line where each row starts, as in bb's Code view. A quoted field with line breaks makes one row span several lines.
- Go to line moves the row that covers the line to the top and marks it (`aria-current`). For the header, a blank line, or a line past the end, the status bar says "no data row at line N". For a row that search or filters hide, it says "line N is hidden by the search or filters", and the grid does not move.
- Grid and Code toggles show the Font Awesome Free 6.7.2 icons `table-cells` and `code` as inline SVG. The CC BY 4.0 attribution is in `app.tsx`. Each toggle keeps `aria-label` and `title`.

### Changed

- `query()` takes a list of columns. An empty list means all columns.
- `inferDtype()` became `inferColumn()`. It also returns the column's reading: decimal comma, date order.
- Filter operands come from native inputs, so they stay ISO dates and `.` decimals. Cells use their column's reading.
- A forced date order is strict. Under DMY or MDY, an ISO column becomes string.
- In a decimal-comma column, a cell with `.` is not a number. Thousands separators are still not read.
- One `Popover` component serves Columns, Search in, and Format.
- Live-check scripts in `thr_8twbr93gzu/`: the toggles are found by `aria-label`, with a text fallback. `a3-a4.js` uses the Search-in popover and adds a 5-column search. New: `thr_nsupnfj4kf/v11-checks.js`.

### Verified

| # | Target | Measured |
|---|---|---|
| A1 | 35 of 35 | 35 of 35 (`node --test logic.test.ts`, Node v24.18.0) |
| A2 | < 2 s | 722 ms click → paint; 617 ms mount → paint |
| A3 | < 300 ms | 78 ms worst of 20 steps ("search 'lima' in 5 columns"). The 5 column picks: 13–27 ms |
| A4 | < 60 | 34 data rows max over 47 scroll positions (grid 687 px tall) |
| Format popover | 3 selects change the grid | Decimal `,` → price string, Auto → float. MDY and DMY → ISO `created` string, Auto → date. Qualifier none → 21 of 21 columns (223 ms), `"` → 20 of 20 |
| Search in | any of the picked columns | 5 columns picked; "lima" → 10,116 of 100,000 rows |
| Go to line 50,001 | row at the top in < 300 ms | 7 ms. The top row's gutter is 50001; 1 of 1 rows marked |
| Icon toggles | 2 of 2 | 2 of 2 have an `<svg>`, `aria-label`, and `title`; both switch views |

Also measured: line 1 and line 100,005 → "no data row". Line 50,001 behind filter `id > 60000` → "hidden", grid stays at 0 px. Line 70,002 behind the same filter → top row, marked.

### Found

- bb's `Original` now shows a "Preview" table of the first 500 rows, with a "Raw" tab. `features-2.js` looks for the text `id,name,email`, so it reports `codeShowsCsv: false`. The Code view shows the file's cells (screenshot `thr_nsupnfj4kf/dsv-code.png`).

### Not included

- Time delimiter, blank if zero, binary data encoding: skipped in the plan.
- The per-column result of Auto (decimal comma, date order) is not shown. Only the dtype badge shows it.
- The live check used the 100k file only (ISO dates, `.` decimals). DMY, MDY, decimal comma, and `'` qualifier parsing are covered by A1, not by a live file.
- The 64 px gutter was not tested with line numbers over 6 digits.
- `bb thread open --line` cannot reach the plugin. The opener props carry only `path`, `source`, and `Original`.
- Not measured in the Electron window.

## 0.1.0 — 2026-09-11

### Added

- File opener `dsv-table` ("Table") for `csv tsv tab psv dsv ssv`.
- Grid view with row windowing: 28 px rows, 4 rows of overscan on each side. Code view is bb's own preview (`Original`).
- Delimiter: auto (the extension, then column-count consistency over the first 50 rows for `,` tab `;` `|`), a dropdown, and a one-character custom box.
- Header: Auto / On / Off. Auto shows its reason.
- Typed columns: int, float, bool, date, string. Inferred from the first 1,000 body rows at ≥95% agreement. Numbers are right-aligned.
- Search in all columns or in one column. Case-insensitive substring.
- Filters: any number, AND-combined. Operators follow the column type.
- Column picker (native `popover`): a checkbox per column, Show all, Hide all.
- Status bar: rows shown of total, columns shown of total, delimiter, header mode.

### Fixed before release

- Code view unmounted the grid, so search, filters, and hidden columns were lost. The grid now stays mounted and hidden.
- The column picker could run past the right edge of the window, and its button labels wrapped. It now aligns to its button's right edge (1408 px = 1408 px in a 1440 px viewport). Buttons are 28 px tall, 2 of 2.
- A2–A4 were measured before this picker fix. The fix changes only the picker's position and one button class.

### Verified

| # | Target | Measured |
|---|---|---|
| A1 | 24 of 24 | 24 of 24 (`node --test logic.test.ts`, Node v24.18.0) |
| A2 | < 2 s | 744 ms click → paint; 631 ms mount → paint; 1,514 ms via `bb thread open` |
| A3 | < 300 ms | 86 ms worst of 15 steps; the other 14 are 3–59 ms |
| A4 | < 60 | 35 data rows max over 47 scroll positions (grid 723 px tall) |

### Not included

- The plan's "Left out of v1" list: sort, editing, regex filters, OR filters, column resize or reorder, export, `.txt`.
- Date time-zone offsets are ignored.
- The tab loads the file once. It does not reload when the file changes on disk.
- `NA` / `null` markers and thousands separators stay text.
- `logic.test.ts` is outside the `tsc` check, because `@types/node` was not approved.
- `skipLibCheck` is on. The SDK types import optional peers (`zod`, `better-sqlite3`, `hono`) that were not approved.
