# CHANGELOG — bb-plugin-dsv

## 0.9.7 — 2026-09-19

The user's report: "command + C does not seem to be working, test and verify it". Built in thread thr_c7bw37g5fy. Branch `fix/copy-focus` from `main` = `bd9fa95` (0.9.6, not pushed).

### Found

- ⌘C / Ctrl+C copied the grid selection only while the grid box had the focus. After a click on the Record tab, the Cell tab, a record button, the layout switch, or the Viewer button, ⌘C copied nothing. The status bar stayed at "1 × 1 selected", with no message. Measured: 1 of 6 cases copied.

### Fixed

- The Grid root handles ⌘C / Ctrl+C too. With cells selected, ⌘C copies them from anywhere in the plugin, and the status bar says "copied …".
- A text box (Search, Go to row, a filter) and selected text keep the browser's own copy. So a value selected on the Record or Cell tab still copies as text.
- `README.md`: ⌘C is in the list of keys that work anywhere in the plugin.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| Focus | a real click on a cell, one real action, a real ⌘C: no action, Record tab, Next record, Cell tab, layout switch 2 times, Viewer button 2 times | 6 of 6 grid copies | 6 of 6 (was 1 of 6); status "copied 1 × 1" |
| Control | the same after a click in the Search box | the browser's copy; no grid copy | 0 grid copies; 1 browser copy event |
| CP1–CP3 | text copy on the Record tab, pane right and below | 6 of 6; 0 grid writes | 6 of 6; 0 grid writes |
| V1–V4, R1–R8, I5 | pane on the right / pane below | 18 of 18 each | 18 of 18 / 18 of 18 |
| P2 / A2 / A3 / A4 | V runs | < 300 ms / < 2 s / < 300 ms / < 60 | 18 ms / 185–687 ms (6 loads) / 67 ms / 34 |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse and key input through CDP. ⌘C is sent as Meta+C with the `copy` editing command, as Chrome on a Mac sends it. Scripts in `thr_c7bw37g5fy`: `ck2-check.mjs` (new), `cp-check.mjs`, `v-check.mjs`.
`ck-check.mjs` tried to read the clipboard back with `navigator.clipboard.readText()`. Headless Chrome denied every read ("Read permission denied"), also after `Browser.grantPermissions`. So the evidence that the browser took the text is the resolved write: the status bar says "copied 1 × 1".

### Not tested

- The system clipboard (`pbpaste`). Headless Chrome has its own clipboard. A test in a visible Chrome window would overwrite your clipboard.
- The bb desktop app.

## 0.9.6 — 2026-09-17

The user's requests: "use separator border and splitter border, resizer border a bit think, right now cannot distinguish between toolbar, grid view, and record panel", and "make it vertically scrollable for textarea instead of '...'", with an image of a cut value. Built in thread thr_c7bw37g5fy. Branch `feat/borders` from `fix/record-empty-close` (0.9.5, not merged).

### Changed

- The toolbar rows, the filter rows, the status bar, and the Viewer header have 2 px separators (were 1 px). The grid row lines stay 1 px.
- The Viewer pane edge next to the grid is 4 px (was 1 px). The resize handle sits over it, so a press on the line starts a resize.
- A long Record value scrolls inside its field. The field is at most 6 lines high. Before, the value was cut at 6 lines with "…".
- The line colour is still bb's `border` colour. Only the thickness changed.
- `README.md`: the Viewer bullet says that a long value scrolls inside its box.
- `screenshot.png` shows the thicker lines. It is a clip of the dsv plugin only, 2,228 × 1,744 px.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| BD1 | full-width separators outside the grid, and the Viewer header | 2 px | 3 of 3 and the header at 2 px; grid row lines 1 px |
| BD2 | the pane splitter, pane on the right and below | 4 px; a press hits the handle; a drag and a reset work | 4 px and 4 px; 2 of 2 hits; 360 → 320 px; reset 360 px |
| SC1 | a 689-character value, pane on the right | at most 6 lines high; it scrolls | 121.4 px = 6 lines; content 379 px; `overflow-y: auto`; no line clamp |
| SC2 | the text in that field | the whole value, no "…" | 689 of 689 characters |
| SC3 | a real mouse wheel over that field | the field scrolls | scrollTop 0 → 60 px |
| EH1 / EH2 / close | the 0.9.5 checks | 4 of 4 on each side / 4 of 4 / 2 of 2 | 4 of 4 / 4 of 4 / 2 of 2 |
| Labels | label offset after the scroll change | unchanged | 1.6 px before and after |
| L1–L5 · RZ1–RZ6 | switch and resize checks | 5 of 5 · 6 of 6 | 5 of 5 · 6 of 6 |
| RF1–RF5 · CP1–CP3 | form and copy checks | 5 of 5 · 6 of 6 | 5 of 5 · 6 of 6 |
| V1–V4, R1–R8, I5 | pane on the right / pane below | 18 of 18 each | 18 of 18 / 18 of 18 |
| P2 / A2 / A3 / A4 | all runs | < 300 ms / < 2 s / < 300 ms / < 60 | 15–20 ms / 185–727 ms / 82 ms / 33 |
| S2 | the screenshot | form; pane on the right; row 1 | pane 360 px; `Record 1 of 100,000`; 20 of 20 fields boxed |
| P1–P3 (image) | the dsv plugin only | 0 / 0 / 0 | 0 of 85 outside texts / 0 thread IDs / 0 of 3,850 points |
| P5 | PNG metadata | 0 chunks | 0 |
| P4 | the user reviews the image | approved | approved |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse input through CDP. Scripts in `thr_c7bw37g5fy`: `bd-check.mjs` (new), `eh-check.mjs` (SC1–SC3 added), `l-check.mjs`, `rz-check.mjs`, `rf-check.mjs`, `cp-check.mjs`, `v-check.mjs`, `readme-shot2.mjs`. The L and RZ checks ran on the border change; the other checks ran on both changes.
The grid scrollbars now take 11 px in the test browser. The 0.9.5 build measures the same 11 px, so the code did not cause it. `l-check.mjs` now reads the grid width with `offsetWidth`.
3 first runs failed on script defects, not the app: a name clash in `bd-check.mjs`, a drag that tried to grow the pane in a 559 px area, and the L width read without the scrollbar.

### Not tested

- The bb desktop app, and the dark theme.
- Keyboard scrolling inside a field. A field does not take focus with Tab.
- A darker line colour. It is not built.

## 0.9.5 — 2026-09-17

The user's request, with an image of empty fields: "should be same height for empty value" and "add close button beside toggle h/v layout in record view". Built in thread thr_c7bw37g5fy. Branch `fix/record-empty-close` from `main` = `e7ffa47`.

### Fixed

- An empty Record field has the height of a one-line field, and its label lines up as on the other lines. Before, an empty field was a thin box, and its label sat lower.
- The field gets a space from CSS `::after` when it is empty. The field text stays empty, so a copy gets no hidden character.

### Added

- A close button in the Viewer header, to the right of the layout switch. It shows the Font Awesome Free `xmark` icon, and its title and label are "Close the Viewer".
- The close button closes the pane, like the Viewer button. The Viewer button opens it again on the same tab and side.

### Changed

- `screenshot.png` shows the close button. It is a clip of the dsv plugin only, 2,228 × 1,744 px.
- `README.md`: the Viewer bullet names the close button.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| EH1 | row 2 of `dsv-empty.csv`, pane on the right: empty field height and label offset = those of a one-line field, ± 0.5 px | 4 of 4 | 4 of 4: 28.6 px and 23.6 px, the same as the filled field |
| EH1 | the same, pane below | 4 of 4 | 4 of 4 |
| EH2 | the text of the empty fields | `""`, 4 of 4 | 4 of 4; `::after` content `" "` |
| CB | pane right and pane below: 1 button next to the switch, 1 icon, label and title; a real click closes the pane; the Viewer button opens it on the same tab and side | 2 of 2 | 2 of 2 |
| RF1–RF5 · L1–L5 | form and switch checks | 5 of 5 · 5 of 5 | 5 of 5 · 5 of 5 |
| CP1–CP3 · RZ1–RZ6 | copy and resize checks | 6 of 6 · 6 of 6 | 6 of 6 · 6 of 6 |
| V1–V4, R1–R8, I5 | pane on the right / pane below | 18 of 18 each | 18 of 18 / 18 of 18 |
| P1 | pane open, 100,000 rows | A3 < 300 ms; A4 < 60 | right: 40 ms, 34 rows; below: 38 ms, 24 rows |
| P2 | Last → paint | < 300 ms | right: 15 ms; below: 18 ms |
| A2 / A3 / A4 | all runs | < 2 s / < 300 ms / < 60 | 198–581 ms (14 loads) / 61 ms / 34 |
| S2 | the screenshot | form; pane on the right; row 1 | pane 360 px; `Record 1 of 100,000`; 20 of 20 fields boxed; 4 record buttons |
| P1–P3 (image) | the dsv plugin only | 0 / 0 / 0 | 0 of 86 outside texts / 0 thread IDs / 0 of 3,850 points |
| P5 | PNG metadata | 0 chunks | 0 (IHDR, 163 IDAT, IEND) |
| P4 | the user reviews the image | approved | approved |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse input through CDP. Scripts in `thr_c7bw37g5fy`: `eh-check.mjs` (new), `rf-check.mjs`, `l-check.mjs`, `cp-check.mjs`, `rz-check.mjs`, `v-check.mjs`, `readme-shot2.mjs`.
The sample has 0 of 2,000,000 empty cells, so EH uses a new file `thr_8twbr93gzu/dsv-empty.csv` (3 rows × 5 columns; row 2 has 4 empty values). Its tab was added to that thread with `bb thread tabs set` for the run, and the 3 original tabs were restored after it.
The first EH run loaded `dsv-thai-874.csv`, which also has 3 rows. The script now waits for "3 of 3 rows · 5 of 5 columns". The app did not change before the second run.

### Not tested

- The bb desktop app, and the dark theme.
- A value that is only spaces. It is not `:empty`, so it keeps its own height.
- Keyboard use of the close button.

## 0.9.4 — 2026-09-17

The user's request: "remove click on each field on record view because i cannot make any copy from there". Built in thread thr_c7bw37g5fy. Branch `fix/record-select` from `main` = `6bf2eb1`.

### Changed

- The Record lines take no clicks. You can select a value with the mouse and copy it with ⌘C / Ctrl+C.
- Each line is a `<div>`, not a `<button>`. Before, a click opened the Cell tab, and the button did not let you select its text.
- The field background does not change on hover, because a click on the line does nothing.
- To see a whole value in the Cell tab, click the cell in the grid, then click the Cell tab.
- `README.md`: the Viewer bullet says that you can select and copy a value.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| CP1 | Record lines that are a button or inside one | 0 of 20 | 0 of 20 |
| CP2 | real drag across a field, pane on the right: the selection is the value | 2 of 2 (`email`, `price`) | 2 of 2; the Record tab stays |
| CP3 | real ⌘C after that selection: a native copy of the value, and no grid copy | 2 of 2; 0 grid writes | 2 of 2; `defaultPrevented` false; 0 grid writes |
| CP2 / CP3 | the same with the pane below (`city`) | 1 of 1; 0 grid writes | 1 of 1; 0 grid writes |
| Control | ⌘C after a click on a grid cell | the grid copy runs once | 1 grid write; the grid has focus |
| R3 (changed) | a real click on the `price` field | the Record tab and the active cell stay | pass on both sides; 0 line buttons |
| RF1–RF5 | the form checks | 5 of 5 | 5 of 5 |
| L1–L5 | the switch checks | 5 of 5 | 5 of 5 |
| V1–V4, R1–R8, I5 | pane on the right / pane below | 18 of 18 each | 18 of 18 / 18 of 18 |
| P1 | pane open, 100,000 rows | A3 < 300 ms; A4 < 60 | right: 40 ms, 34 rows; below: 40 ms, 24 rows |
| P2 | Last → paint | < 300 ms | right: 15 ms; below: 15 ms |
| A2 / A3 / A4 | all runs | < 2 s / < 300 ms / < 60 | 190–526 ms (11 loads) / 83 ms / 34 |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse and key input through CDP. The ⌘C key event carries the `copy` editing command. Scripts in `thr_c7bw37g5fy`: `cp-check.mjs` (new), `rf-check.mjs`, `l-check.mjs`, `v-check.mjs` (R3 rewritten for this change).
The first run of `cp-check.mjs` stopped on its first line: it read `localStorage` on `about:blank`. The script was fixed, and the app did not change before run 2.

### Not tested

- The bb desktop app, and Ctrl+C on Windows or Linux.
- A value longer than 6 lines. The form cuts it at 6 lines, so a mouse selection there may not reach the rest. The Cell tab shows the whole value.
- Keyboard-only selection in the form.

## 0.9.3 — 2026-09-16

Plan: "Proposal v1.7.3" in `thr_huv4udkmb8/csv-plugin-plan.md`. The user approved it with `go, here`, with the defaults 1–4. Built in thread thr_c7bw37g5fy. Branch `feat/viewer-resize` from `main` = `907d094`.

### Added

- Drag the edge of the Viewer pane to resize it. The handle is the pane edge next to the grid: the left edge when the pane is on the right, the top edge when it is below.
- The handle is 6 px. It shows the `col-resize` or `row-resize` cursor, and it turns `primary` on hover, like a column edge.
- A drag leaves the pane and the grid at least 200 px each. A double-click on the handle gives the default size back: 360 px on the right, 40% below.
- Each side keeps its own size in `localStorage` (`dsv.viewerSize`). A new tab opens the pane at the saved size.

### Changed

- The Record form labels look like the column headers: the name is semibold, and the type is a badge. The badge has a muted background, because the pane is white. The user asked for this with an image of a column header.
- The default pane size has no limit, so it does not change by itself. In a 559 px area, the grid beside a 360 px pane is 199 px, as in 0.9.2. A saved size is at most the area less 200 px.
- `screenshot.png` shows the new labels. The frame is 2,228 × 1,744 px (was 2,228 × 1,544 px), so all 20 form lines fit without a pane scrollbar.
- `README.md`: the Viewer bullet (drag and double-click) and the limits (the side and the size are kept).

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| Labels | the name and the badge, compared with a column header | same size and weight | name 13 px, 600; badge 10 px, 600, radius 4 px, padding 4 px |
| RZ1 | real drag of the handle, −120 px, pane on the right, 799 px area | 480 px ± 1; grid −120 px ± 1 | 360 → 480 px; −120 px |
| RZ2 | drags past both limits | 200 px; area − 200 px | 200 px; 599 of 599 px |
| RZ3 | drag, reload, open; 2 times | the saved size: 2 of 2 | 2 of 2 |
| RZ4 | pane below, real drag of the top edge, −100 px | +100 px ± 1 | 288.8 → 389 px; grid −100.2 px |
| RZ5 | double-click the handle | 40% below; 360 px on the right | 289 of 289 px; 360 px; saved `{}` |
| RZ6 | the handle | 1 per side; a cursor; a title | 1 and 1; `col-resize` and `row-resize`; title set |
| RF1–RF5 | the 0.9.2 form checks | 5 of 5 | 5 of 5 |
| L1–L5 | the switch checks | 5 of 5 | 5 of 5; L1 pane 360 px, grid 199 of 559 px |
| V1–V4, R1–R8, I5 | pane on the right | 18 of 18 | 18 of 18 |
| V1–V4, R1–R8, I5 | pane below | 18 of 18 | 18 of 18 |
| P1 | pane open, 100,000 rows | A3 < 300 ms; A4 < 60 | right: 40 ms, 34 rows; below: 37 ms, 24 rows |
| P2 | Last → paint | < 300 ms | right: 17 ms; below: 17 ms |
| A2 / A3 / A4 | all runs | < 2 s / < 300 ms / < 60 | 338–588 ms (13 loads) / 75 ms / 34 |
| S2 | the screenshot | the form; pane on the right; row 1 | pane 360 px on the right; `Record 1 of 100,000`; 20 of 20 fields boxed; 4 buttons |
| P1–P3 (image) | the screenshot shows the dsv plugin only | 0 / 0 / 0 | 0 of 85 outside texts / 0 thread IDs / 0 of 3,850 points |
| P5 | PNG metadata | 0 chunks | 0 (IHDR, 163 IDAT, IEND) |
| P4 | the user reviews the image | approved | approved |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse and key input through CDP. Scripts in `thr_c7bw37g5fy`: `rz-check.mjs` (new), `rf-check.mjs`, `l-check.mjs`, `v-check.mjs` (`SIDE=right` and `SIDE=below`), `readme-shot2.mjs` (`HEIGHT=920`).
The first run of chunk 1 failed RZ1, RZ5, L1, and L3. The 200 px grid limit cut the default pane to 359 px in a 559 px area. The user chose to limit drags only. RZ1–RZ3 run in a 1,920 px viewport, which gives a 799 px area.
The script loader (`lib.mjs`) got 2 fixes. bb had saved the file panel as closed, so the plugin rendered off the right edge. The loader now opens the panel and makes the file tab active before a load.

### Not tested

- The bb desktop app, the dark theme, and touch input.
- A window that gets narrower after a size is saved. The CSS limit is in the code, but no check measured it.
- Resize with the keyboard. It is not built.

## 0.9.2 — 2026-09-16

Plan: "Proposal v1.7.2" and "Decisions v1.7.2" in `thr_huv4udkmb8/csv-plugin-plan.md`. The user approved it with `go` in thread thr_zg2iba5z4v, with the defaults 1–3. Built in thread thr_c7bw37g5fy. Branch `feat/record-form` from `fix/viewer-layout`.

### Changed

- The Record tab is a read-only form in one column. Each line has a label on the left and a boxed field on the right.
- The label is the column name, then its type in small muted text. The label is right-aligned. A long name is cut with "…", and its title shows the whole name.
- The label column is as wide as the longest label, at most 40% of the form. All fields start at one left edge.
- The field has a border, rounded corners, and a light muted background. Numbers align right with `tabular-nums`, as in the grid. A long value wraps, up to 6 lines.
- The field of the active column has a `primary` border. Hover makes the field background darker. Before, the active line had a muted background, and the values had no box.
- Each line is still one `<button>`. A click opens the Cell tab for that column, as before. The form is the same with the pane on the right and below.
- `screenshot.png` shows the Record tab as a form, with the pane on the right and row 1 active. It is a clip of the dsv plugin only, in the same 2,228 × 1,544 px frame.
- `README.md`: the Viewer bullet, the image alt text, and the image text.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| RF1 | Record tab, row 1, pane on the right: label right edge ≤ field left edge, field border ≥ 1 px | 20 of 20 lines | 20 of 20; borders 1 px; 20 of 20 lines are a `<button>` |
| RF2 | fields at one left edge ± 1 px; labels at one right edge ± 1 px; label column ≤ 40% of the pane | 20 of 20; 20 of 20; ≤ 144 px | 20 of 20; 20 of 20; 76 px |
| RF3 | text in the fields: position ± 1 px and `text-align` | 9 of 9 number columns right; 11 of 11 others left | 9 of 9; 11 of 11 |
| RF4 | fields with the `primary` border, active column `city` | 1 of 20 | 1 of 20 (`city`) |
| RF5 | pane below the grid: fields at one left edge ± 1 px | 20 of 20 | 20 of 20 |
| L1–L5 | the switch checks of 0.9.1 | 5 of 5 | 5 of 5 |
| V1–V4, R1–R8, I5 | the 0.9.0 checks, pane on the right | 18 of 18 | 18 of 18 |
| V1–V4, R1–R8, I5 | the 0.9.0 checks, pane below | 18 of 18 | 18 of 18; the pane was below in 5 of 5 open views |
| P1 | pane open, 100,000 rows | A3 < 300 ms; A4 < 60 | right: 41 ms, 34 rows; below: 39 ms, 24 rows |
| P2 | Last → paint | < 300 ms | right: 19 ms; below: 18 ms |
| A2 / A3 / A4 | all runs | < 2 s / < 300 ms / < 60 | 199–820 ms (10 loads) / 94 ms / 34 |
| S2 | the screenshot | the Record tab as a form; pane on the right; row 1 | pane 360 px on the right; `Record 1 of 100,000`; 20 lines; 20 of 20 fields boxed |
| P1–P3 (image) | the screenshot shows the dsv plugin only | 0 / 0 / 0 | 0 of 75 outside texts / 0 thread IDs / 0 of 3,430 points |
| P5 | PNG metadata | 0 chunks | 0 (IHDR, 149 IDAT, IEND) |
| P4 | the user reviews the image | approved | approved |

Also measured, not in the plan: hover changed the field background on 1 of 1 line; 20 of 20 names have a title; the label and the field text share one baseline (0 px apart).
How measured: headless Chrome (port 9333) on bb's web UI, real mouse and key input through CDP. Scripts in `thr_c7bw37g5fy`: `rf-check.mjs` (new), `l-check.mjs`, `v-check.mjs` (`SIDE=right` and `SIDE=below`), `readme-shot2.mjs`. The first run of each script passed.

### Not tested

- The bb desktop app, and the dark theme.
- A name longer than the label limit. The longest sample label is 76 px, so no "…" cut showed.
- A value longer than 6 lines, a value with line breaks, and keyboard-only use of the form lines.

## 0.9.1 — 2026-09-16

Plan: "Proposal v1.7.1" and its 3 addenda in `thr_huv4udkmb8/csv-plugin-plan.md`. The user approved it with `go, here` and chose a remembered side. Built in thread thr_zg2iba5z4v. Branch `fix/viewer-layout`.

### Fixed

- You can drag and double-click the last column edge with the grid scrolled to the far right. The scroll content has 16 px of room after the last column. Before, bb's overlay scrollbar covered the right 14 px of the grid, and the edge was under it.
- The `#` header cell stays on top when the grid scrolls sideways. Before, the column headers showed over it.

### Added

- A switch in the Viewer pane moves the pane below the grid, and back. Below, the grid gets the full width, and the pane takes 40% of the height.
- The switch shows the `table-columns` icon, turned 90° when it would move the pane below. Its title and label name the side it moves the pane to.
- The side is saved in `localStorage` (`dsv.viewerSide`), like the ⌘C choice. A new tab opens the pane on the saved side.

### Changed

- `screenshot.png` shows the Viewer pane on the right, on the Record tab with row 1 active. It is a clip of the dsv plugin only, in the same 2,228 × 1,544 px frame.
- `README.md`: the Viewer bullet, the image text, and the limits.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| E1 | scrolled to the far right: pixels of the last edge that a click reaches | 6 of 6 (was 0 of 6) | 6 of 6 |
| E2 | a real double-click on the `note` edge there | the fit width ± 1 px | 216 → 157 px |
| E3 | real drags of the `note` edge | the drag works | −40 px and +12 px, each exact |
| H5 | scrolled 150 px: points in the `#` header cell that hit another dsv element | 0 of 75 (was 75 of 75) | 0 of 75; 5 of 75 hit bb's panel handle |
| F0–F5 | the fit checks of 0.9.0, real double-clicks on all 20 columns | pass | 6 of 6; 0 of 20 dispatched events |
| L1 | open the pane | right, 360 px | right, 360 px; grid 199 of 559 px |
| L2 | click the switch | below; full width; 40% high | grid 559 px wide; pane 273 of 682 px high |
| L3 | switch below and back, with a search, a sort, a selection, and a scroll | 4 of 4 unchanged each time | 4 of 4 and 4 of 4; the Record tab stays |
| L4 | the switch button | 1 `<svg>`; title and `aria-label` name the next side | pass on both sides; the icon turns |
| L5 | switch, reload, open; 2 times | the saved side: 2 of 2 | 2 of 2 |
| V1–V4, R1–R8, I5 | the 0.9.0 checks, pane on the right | 18 of 18 | 18 of 18 |
| V1–V4, R1–R8, I5 | the 0.9.0 checks, pane below | 18 of 18 | 18 of 18; the pane was below in 5 of 5 open views |
| P1 | pane below, 100,000 rows | A3 < 300 ms; A4 < 60 | 35 ms; 24 rows |
| P2 | Last → paint, pane below | < 300 ms | 17 ms |
| A2 / A3 / A4 | pane-right run; pane-below run | < 2 s / < 300 ms / < 60 | 255–631 ms / 65 ms / 34; 191–397 ms / 37 ms / 34 |
| S2 | the screenshot | the pane and the Record buttons show | pane 360 px on the right; Record tab; `Record 1 of 100,000`; 20 lines; 4 buttons |
| P1–P3 (image) | the screenshot shows the dsv plugin only | 0 / 0 / 0 | 0 of 75 outside texts / 0 thread IDs / 0 of 3,430 points |
| P5 | PNG metadata | 0 chunks | 0 (IHDR, 141 IDAT, IEND) |
| P4 | the user reviews the image | approved | approved |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse and key input through CDP. Scripts in `thr_zg2iba5z4v`: `e-check.mjs`, `f-check.mjs`, `l-check.mjs`, `v-check.mjs` (`SIDE=right` and `SIDE=below`), `readme-shot2.mjs`.
E3: the planned +40 px drag ends outside the 1,440 px window, so the drags were −40 px and +12 px.
The first `SIDE=below` run kept the pane on the right, because the script did not call its switch helper. The app code did not change before the second run.

### Not tested

- The bb desktop app.
- The dark theme, and keyboard-only use of the switch.

## 0.9.0 — 2026-09-15

Plan: "Proposal v1.7" and "Decisions v1.7" in `thr_huv4udkmb8/csv-plugin-plan.md`. The user approved it (`go`, defaults 1–5) in thread thr_nuuxhn6nnb. Built in thread thr_zg2iba5z4v. Branch `feat/viewer`.

### Added

- Fit a column to its content: double-click a column edge. The width is the widest of the column name and the 20 longest values in the rows you see.
- The fit measures pixels in the grid font. Search, filters, and hidden rows apply. The width is at most the visible grid width.
- Viewer button with the Font Awesome Free `table-columns` icon, after Save. It opens and closes a 360 px pane on the right of the grid.
- Viewer tab "Cell": the column name and type, the row number, and the whole value of the active cell. The value keeps its line breaks, and you can select it. The character count is below it.
- Viewer tab "Record": the active row, one line per shown column, with the name, type, and value. A long value shows up to 6 lines. A click on a line makes that cell active and opens the Cell tab.
- Record buttons First, Previous, Next, and Last, with the Font Awesome Free `backward-step`, `angle-left`, `angle-right`, and `forward-step` icons. Each moves the active cell to that row of the view. The column stays.
- `Record N of M` shows the position in the view. First and Previous are disabled on the first row, and Next and Last on the last row.
- With no active cell, First and Next go to row 1, and Previous and Last go to the last row.

### Changed

- A double-click on a column edge fits the content. Before, it set the automatic width again. The edge title is "Drag to resize. Double-click to fit the content."
- The first automatic width does not change: 200 rows, 72–320 px.
- Go to row also makes that row active, in the active column or the first shown column. So the Viewer pane follows it.
- `logic.ts`: `longest(t, hits, col, k)` gives the `k` longest values of one column in the given rows. A1 has 53 tests.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 53 of 53 | 53 of 53 |
| T1 | `tsc` | exit 0 | exit 0 |
| F0 | first automatic width | unchanged | 20 of 20 columns equal the 200-row formula |
| F1 | 20 columns, the 20 longest values of each | 0 of 400 cut, unless capped | 0 of 400; 0 columns capped (grid 559 px) |
| F2 | header names after a fit | 0 of 20 cut | 0 of 20 |
| F3 | double-click → paint, longest column | < 200 ms | 17 ms (`note`, 25 characters) |
| F4 | search `oslo`, then fit `email` | ≤ the F1 width | 170 px ≤ 176 px |
| F5 | drag after a fit, then fit again | the drag works; F1 width ± 1 px | 176 → drag 236 (+60) → fit 176 |
| I5 | Viewer button | icon, after Save, toggles | 1 `<svg>`; after Save; `aria-pressed` false → true; pane 360 px |
| V1 | click row 5, `email` | `email`, `string`, row 5, `ivy5@example.com` | the same; "16 characters" |
| V2 | the longest value of 10 columns | 10 of 10 | 10 of 10 |
| V3 | 5 arrow key steps | 5 of 5 | 5 of 5 |
| V4 | search, sort, selection, scroll; open and close the pane | 4 unchanged | open 4 of 4; closed 4 of 4 |
| R1 | Record tab on row 1 | 20 of 20 lines; names in order; values = row 1 | 20 of 20; in order; 20 of 20 values |
| R2 | hide `note`, sort `name ↑`, First | 19 lines; the first sorted row | 19 lines; row 34; 19 of 19 values |
| R3 | click the `price` line | active cell `price`; the Cell tab shows it | `price` in row 34; Cell tab `price`, `float`, `350.16` |
| R4 | on row 1: Next, Last, Previous, First | 4 of 4 | rows 2, 100,000, 99,999, 1; counters match: 4 of 4 |
| R5 | disabled buttons | 4 of 4 | row 1: First, Previous; last row: Next, Last: 4 of 4 |
| R6 | the 4 buttons | 1 `<svg>`, title, `aria-label`: 4 of 4 | 4 of 4 |
| R7 | search `oslo`, then Last | the last row of the view; `Record 10,092 of 10,092` | row 99,983, the last hit; `Record 10,092 of 10,092` |
| R8 | no active cell: Next; then Esc and Last | row 1; then the last row | row 1; Esc cleared it; row 100,000 |
| P1 | pane open, 100,000 rows | A3 < 300 ms; A4 < 60 | 40 ms; 34 rows |
| P2 | Last on 100,000 rows | click → paint < 300 ms | 19 ms |
| A2 | first paint | < 2 s | 195–489 ms, 3 loads |
| A3 | search change | < 300 ms | 69 ms, worst of 10 |
| A4 | rows in the DOM | < 60 | 34, max of 47 scroll positions |

How measured: headless Chrome (port 9333) on bb's web UI, real mouse and key input through CDP. Scripts: `thr_zg2iba5z4v/f-check.mjs` and `thr_zg2iba5z4v/v-check.mjs` in bb thread storage.
A2 is measured in a new way. bb opens the file tab again after a page load, so a tab click loads nothing. A2 is the time from the file request start to the first painted status bar.
F1, F3: the edge of the last column, `note`, is under the grid scrollbar, so a real click cannot reach it. For `note`, the check sent the `dblclick` event to the edge. The other 19 columns got real double-clicks.
R8: after a click on a pane button, the focus is in the pane. The check moved the focus to the grid before Esc.

### Not tested

- The bb desktop app.
- A value with line breaks. The sample file has none.
- The dark theme, and keyboard-only use of the pane.

## 0.8.0 — 2026-09-15

Request: "add a save button". The user chose "Download current view". Second request: add shortcut for "Save" (cmd + S). Branch `feat/save-view`.

### Added

- Save button with the Font Awesome Free `floppy-disk` icon, after Copy. It saves the rows you see, in their order, with the shown columns, as `<file name>.view.csv`.
- The column names go first only when the file has a header. The file is UTF-8 with a BOM, so Excel reads it as UTF-8. A cell with a comma, a line break, or `"` is quoted.
- ⌘S / Ctrl+S clicks Save in Grid view, while the focus is anywhere in the plugin. The Save button title shows the key.

### Changed

- `logic.ts`: `toDelimited(rows, d)` writes CSV and TSV, and `toTsv` uses it. A1 has 50 tests.
- `screenshot.png` shows the Save button. It was captured again in the same 2,228 × 1,544 px frame.

### Verified

| # | Check | Target | Measured |
|---|---|---|---|
| A1 | tests | 50 of 50 | 50 of 50 |
| T1 | `tsc` | exit 0 | exit 0 |
| I3 | Save button | icon, word, title | 1 `<svg>`; "Save"; title "Save the rows you see as a CSV file" |
| W1 | search `oslo`, sort `name ↑`, `note` hidden, then Save | the file equals "Copy data with field names" of the same view | equal; 10,093 lines (names + 10,092 rows), 19 fields each; BOM; name `dsv-100k.view.csv`; 87 ms |
| W2 | all 100,000 rows, then Save | click → download complete < 2 s | 193 ms; 100,001 lines; about 13.7 MB |
| W3 | Header off, then Save | no column-name line | 100,001 data lines; line 1 is `id,name,email,…` |
| I4 | Save title | ends with "(⌘S)" | "Save the rows you see as a CSV file (⌘S)" |
| K8 | click a cell, ⌘F, then ⌘G | focus Search, then Go to row | Search; then Go to row |
| K5 | search `oslo`, focus in Search, ⌘S | 1 download; lines = rows shown + 1 | 1 completed; `dsv-100k.view.csv`; 10,093 lines = 10,092 + 1; 51 ms |
| K6 | click a cell, ⌘S | 1 download | 1 completed; 52 ms |
| K7 | Code view, ⌘S | 0 downloads in 2 s | 0 |
| S1 | README screenshot | Save shows; P1, P2, P3 = 0 | Save between Copy and Go to row; P1 0, P2 0, P3 0 of 3,430 points; 0 metadata chunks |

How measured: real downloads in headless Chrome (port 9333) on bb's web UI, through CDP `Browser.setDownloadBehavior`. Script: `thr_3tdnaaba2e/save-check.mjs` in bb thread storage.
I4 and K5–K8: real key presses through CDP `Input.dispatchKeyEvent`, script `thr_nuuxhn6nnb/key-check.mjs`. S1: script `thr_eksuvt3xcn/readme-shot.mjs`, same Chrome profile.

### Not tested

- The bb desktop app. Its code blocks downloads only in bb's built-in browser tabs (`will-download` on the tab session). No handler was found for the main window, so Electron's default Save dialog is expected, but it was not seen.
- ⌘S in the bb desktop app. Its menu has no plain ⌘S shortcut, so the key should reach the plugin, but this was not seen.
- I3 was measured before the Save title got "(⌘S)" at its end.

## History rewrite — 2026-09-14

All commits were rewritten to correct their author identity and signature. Their content did not change, but their IDs did.

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
After 0.7.0, the user tried a new clone at `~/Gondor/GitHub/bb-plugins/bb-plugin-dsv`, and the commit "Record the repo move to bb-plugins/bb-plugin-dsv" recorded that move. The user then chose `~/Gondor/GitHub/bb-plugin-dsv` again.
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
