// Opens delimited text (csv, tsv, …) as a typed grid: search, AND filters, multi-column sort,
// column picker, go to row. "Code" shows the raw text in bb's source viewer. Pure logic is in logic.ts.
import {
  definePluginApp,
  experimental_SourceCode as SourceCode,
  type PluginFileOpenerProps,
  type PluginFileOpenerSource,
} from "@get-bb/plugin-sdk/app";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
} from "react";
import {
  arity, bounds, cells, decode, DELIMITERS, detectDelimiter, detectHeader, ENCODINGS, family, floorIndex, FORMAT, longest, OPS, parse, query,
  recordDelimiter, sortHits, step, toDelimited, toTable, toTsv,
  type Dir, type Filter, type Format, type Op, type Sel, type SortKey, type Table,
} from "./logic.ts";

export default definePluginApp((app) => {
  app.slots.fileOpener({
    id: "dsv-table",
    title: "Table",
    extensions: ["csv", "tsv", "tab", "psv", "dsv", "ssv"],
    component: DsvOpener,
  });
});

const FIELD = "h-7 rounded-md border border-border bg-background px-1.5 text-sm text-foreground";
const BUTTON = "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2 text-sm hover:bg-muted disabled:opacity-50";
const ROW_H = 28;
const OVERSCAN = 4;
const GUTTER = 64;
const MIN_W = 40; // narrowest column a drag can make
const MAC = /Mac|iPhone|iPad/.test(navigator.userAgent);
const COPY_KEY = "dsv.copyDefault"; // localStorage: what ⌘C copies, "data" or "names"
const ARROWS: Record<string, [number, number] | undefined> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
// ⌘F / Ctrl+F and ⌘G / Ctrl+G: the box each key focuses. ⌘S / Ctrl+S: the button it clicks.
const MOD_KEYS: Record<string, string | undefined> = { f: 'input[type="search"]', g: 'input[aria-label="Go to row"]', s: "button[data-dsv-save]" };

// Icons "clipboard", "paintbrush", "filter", "sort", "floppy-disk", "table-cells", and "code": Font Awesome Free 6.7.2 by Fonticons, Inc.
// License CC BY 4.0, https://fontawesome.com/license/free
const ICONS = {
  clipboard: {
    name: "Copy",
    box: "0 0 384 512",
    d: "M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM112 192l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z",
  },
  paintbrush: {
    name: "Format",
    box: "0 0 576 512",
    d: "M339.3 367.1c27.3-3.9 51.9-19.4 67.2-42.9L568.2 74.1c12.6-19.5 9.4-45.3-7.6-61.2S517.7-4.4 499.1 9.6L262.4 187.2c-24 18-38.2 46.1-38.4 76.1L339.3 367.1zm-19.6 25.4l-116-104.4C143.9 290.3 96 339.6 96 400c0 3.9 .2 7.8 .6 11.6C98.4 429.1 86.4 448 68.8 448L64 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0c61.9 0 112-50.1 112-112c0-2.5-.1-5-.2-7.5z",
  },
  filter: {
    name: "Add filter",
    box: "0 0 512 512",
    d: "M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z",
  },
  sort: {
    name: "Sort",
    box: "0 0 320 512",
    d: "M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8L32 224c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8l256 0c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z",
  },
  save: {
    name: "Save",
    box: "0 0 448 512",
    d: "M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
  },
  grid: {
    name: "Grid",
    box: "0 0 512 512",
    d: "M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm88 64l0 64-88 0 0-64 88 0zm56 0l88 0 0 64-88 0 0-64zm240 0l0 64-88 0 0-64 88 0zM64 224l88 0 0 64-88 0 0-64zm232 0l0 64-88 0 0-64 88 0zm64 0l88 0 0 64-88 0 0-64zM152 352l0 64-88 0 0-64 88 0zm56 0l88 0 0 64-88 0 0-64zm240 0l0 64-88 0 0-64 88 0z",
  },
  code: {
    name: "Code",
    box: "0 0 640 512",
    d: "M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z",
  },
} as const;

// Where to fetch the file: copied from bb's builtin pdf-preview.
type Target = { kind: "raw" | "workspace-json"; url: string };
const seg = (p: string) => p.split("/").map(encodeURIComponent).join("/");
const withQuery = (url: string, q: Record<string, string>) => `${url}?${new URLSearchParams(q)}`;

function target(path: string, s: PluginFileOpenerSource): Target | null {
  const id = encodeURIComponent;
  switch (s.kind) {
    case "workspace":
      if (s.threadId !== null) {
        return { kind: "raw", url: `/api/v1/threads/${id(s.threadId)}/worktree/files/${seg(path)}` };
      }
      if (s.environmentId !== null) {
        const url = `/api/v1/environments/${id(s.environmentId)}/diff/file`;
        return { kind: "workspace-json", url: withQuery(url, { target: "uncommitted", path, side: "new" }) };
      }
      if (s.projectId !== null) {
        const q: Record<string, string> = { path };
        if (s.experimental_hostId) q.hostId = s.experimental_hostId;
        return { kind: "raw", url: withQuery(`/api/v1/projects/${id(s.projectId)}/files/content`, q) };
      }
      return null;
    case "host":
      if (s.threadId === null) return null;
      return { kind: "raw", url: withQuery(`/api/v1/threads/${id(s.threadId)}/host-files/content`, { path }) };
    case "thread-storage":
      if (s.threadId === null) return null;
      return { kind: "raw", url: `/api/v1/threads/${id(s.threadId)}/thread-storage/files/${seg(path)}` };
  }
}

/** The file as bytes, or as text when bb has already decoded it. Only bytes can take the Encoding choice. */
type Loaded = { bytes: Uint8Array } | { text: string };

async function load(t: Target, signal: AbortSignal): Promise<Loaded> {
  const res = await fetch(t.url, { credentials: "same-origin", signal });
  if (!res.ok) throw new Error(`File request failed with status ${res.status}.`);
  if (t.kind === "raw") return { bytes: new Uint8Array(await res.arrayBuffer()) };
  const { content, contentEncoding } = ((await res.json()) ?? {}) as { content?: unknown; contentEncoding?: unknown };
  if (typeof content !== "string") throw new Error("The workspace returned an invalid file response.");
  if (contentEncoding !== "base64") return { text: content };
  return { bytes: Uint8Array.from(atob(content), (c) => c.charCodeAt(0)) };
}

type File = { status: "loading" } | { status: "error"; message: string } | ({ status: "ready" } & Loaded);
type HeaderMode = "auto" | "on" | "off";
const show = (d: string) => (d === "\t" ? "tab" : d);

// ponytail: loads once per open; add a reload button when files change under an open tab.
function DsvOpener({ path, source }: PluginFileOpenerProps) {
  const [file, setFile] = useState<File>({ status: "loading" });
  const [view, setView] = useState<"grid" | "code">("grid");
  const [delimMode, setDelimMode] = useState("auto"); // "auto" | a DELIMITERS entry | "custom"
  const [custom, setCustom] = useState("");
  const [headerMode, setHeaderMode] = useState<HeaderMode>("auto");
  const [quote, setQuote] = useState('"');
  const [format, setFormat] = useState<Format>(FORMAT);
  const [encoding, setEncoding] = useState("utf-8");
  const { kind, threadId, environmentId, projectId, experimental_hostId } = source;
  const where = useMemo(
    () => target(path, { kind, threadId, environmentId, projectId, experimental_hostId }),
    [path, kind, threadId, environmentId, projectId, experimental_hostId],
  );

  useEffect(() => {
    if (!where) {
      setFile({ status: "error", message: "This file location is not supported." });
      return;
    }
    const ac = new AbortController();
    setFile({ status: "loading" });
    load(where, ac.signal).then(
      (loaded) => setFile({ status: "ready", ...loaded }),
      (e: unknown) => {
        if (!ac.signal.aborted) setFile({ status: "error", message: e instanceof Error ? e.message : String(e) });
      },
    );
    return () => ac.abort();
  }, [where]);

  // Bytes decode with the chosen encoding. Text that bb already decoded is used as it is.
  const decoded = useMemo(
    () => (file.status !== "ready" ? { text: "", bad: 0 } : "bytes" in file ? decode(file.bytes, encoding) : { text: file.text, bad: 0 }),
    [file, encoding],
  );
  const text = decoded.text;
  const byBb = file.status === "ready" && !("bytes" in file);
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  const auto = useMemo(() => detectDelimiter(text, ext, quote), [text, ext, quote]);
  const delim = delimMode === "auto" ? auto : delimMode === "custom" ? custom || auto : delimMode;
  const rows = useMemo(() => parse(text, delim, quote), [text, delim, quote]);
  const detected = useMemo(() => detectHeader(rows, format), [rows, format]);
  const header = headerMode === "auto" ? detected.header : headerMode === "on";
  const table = useMemo(() => toTable(rows, header, format), [rows, header, format]);
  const eol = useMemo(() => recordDelimiter(text), [text]);
  const encName = ENCODINGS.find(([label]) => label === encoding)?.[1].split(" (")[0] ?? encoding;
  const encNote = byBb
    ? "encoding set by bb"
    : `encoding ${encName}${decoded.bad ? ` · ${decoded.bad.toLocaleString()} characters could not be read — try another encoding` : ""}`;
  const note = `delimiter "${show(delim)}" · record delimiter ${eol} · ${encNote} · header ${headerMode === "auto" ? "auto→" : ""}${header ? "on" : "off"}`;

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-background text-sm text-foreground"
      // ⌘F / Ctrl+F focuses Search, ⌘G / Ctrl+G focuses Go to row, ⌘S / Ctrl+S clicks Save: in Grid view, while the focus is in this tab.
      onKeyDown={(e) => {
        if (view !== "grid" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
        const target = MOD_KEYS[e.key.toLowerCase()];
        const el = target ? e.currentTarget.querySelector<HTMLElement>(target) : null;
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        if (el instanceof HTMLInputElement) {
          el.focus();
          el.select();
        } else if (el instanceof HTMLButtonElement && !el.disabled) el.click();
      }}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-2 py-1.5">
        {(["grid", "code"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-label={ICONS[v].name}
            title={ICONS[v].name}
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`flex h-7 items-center rounded-md px-2 ${view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon name={v} className="h-4 w-4" />
          </button>
        ))}
        {view === "grid" && (
          <>
            <label className="flex items-center gap-1 text-muted-foreground">
              Delimiter
              <select className={FIELD} value={delimMode} onChange={(e) => setDelimMode(e.target.value)}>
                <option value="auto">Auto ({show(auto)})</option>
                {DELIMITERS.map((d) => <option key={d} value={d}>{show(d)}</option>)}
                <option value="custom">Custom…</option>
              </select>
            </label>
            {delimMode === "custom" && (
              <input
                aria-label="Custom delimiter"
                className={`${FIELD} w-10 text-center`}
                maxLength={1}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            )}
            <label className="flex items-center gap-1 text-muted-foreground">
              Header
              <select className={FIELD} value={headerMode} onChange={(e) => setHeaderMode(e.target.value as HeaderMode)}>
                <option value="auto">Auto ({detected.header ? "on" : "off"})</option>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <Popover name="Format" title="Text qualifier, decimal symbol, date order" label={<><Icon name="paintbrush" />Format</>}>
              <div className="flex flex-col gap-1">
                <Choice name="Encoding" value={encoding} onChange={setEncoding} options={ENCODINGS} disabled={byBb} />
                <Choice name="Text qualifier" value={quote} onChange={setQuote} options={[['"', '"'], ["'", "'"], ["", "none"]]} />
                <Choice
                  name="Decimal symbol"
                  value={format.decimal}
                  onChange={(v) => setFormat({ ...format, decimal: v as Format["decimal"] })}
                  options={[["auto", "Auto"], [".", "."], [",", ","]]}
                />
                <Choice
                  name="Date order"
                  value={format.order}
                  onChange={(v) => setFormat({ ...format, order: v as Format["order"] })}
                  options={[["auto", "Auto"], ["dmy", "DMY"], ["mdy", "MDY"], ["ymd", "YMD"]]}
                />
              </div>
            </Popover>
            {headerMode === "auto" && <span className="text-xs text-muted-foreground">{detected.reason}</span>}
          </>
        )}
      </div>
      {file.status === "loading" ? (
        <p className="p-3 text-muted-foreground">Loading…</p>
      ) : file.status === "error" ? (
        <p className="p-3 text-destructive">{file.message}</p>
      ) : (
        <>
          {view === "code" && (
            <div className="min-h-0 flex-1 overflow-auto">
              <SourceCode content={text} path={path} />
            </div>
          )}
          {/* Hidden, not unmounted, in code view: search, filters, and columns survive the toggle. */}
          <div className={view === "code" ? "hidden" : "flex min-h-0 flex-1 flex-col"}>
            {/* A new delimiter, header, or format choice changes the columns or their types, so the grid state starts over. */}
            <Grid
              key={`${delim}|${header}|${quote}|${format.decimal}|${format.order}|${encoding}`}
              table={table}
              note={note}
              header={header}
              saveName={`${path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]*$/, "")}.view.csv`}
            />
          </div>
        </>
      )}
    </div>
  );
}

const arrow = (d: Dir) => (d === "asc" ? "↑" : "↓");
const blank = (t: Table, col: number): Filter => ({ col, op: OPS[family(t.dtypes[col] ?? "string")][0][0], a: "", b: "" });

function Grid({ table, note, header, saveName }: { table: Table; note: string; header: boolean; saveName: string }) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<number[]>([]); // empty = all columns
  const [filters, setFilters] = useState<Filter[]>([]);
  const [hidden, setHidden] = useState<ReadonlySet<number>>(new Set());
  const [jump, setJump] = useState<number | null>(null); // the row number typed in "Go to row"
  const [custom, setCustom] = useState<Record<number, number>>({}); // column → width from a drag
  const [copyKey, setCopyKeyState] = useState(() => (localStorage.getItem(COPY_KEY) === "names" ? "names" : "data"));
  const [sorts, setSorts] = useState<SortKey[]>([]); // sort levels, level 1 first
  const hits = useMemo(() => {
    const found = query(table, search, scope, filters);
    return sorts.length ? sortHits(table, found, sorts) : found;
  }, [table, search, scope, filters, sorts]);
  // A sort button click steps its column: ascending, descending, off. A plain click
  // makes the column the only level. Shift+click adds the column as the last level,
  // or steps its level in place.
  const sortBy = (c: number, add: boolean) => {
    const i = sorts.findIndex((k) => k.col === c);
    const next: SortKey[] = i < 0 ? [{ col: c, dir: "asc" }] : sorts[i].dir === "asc" ? [{ col: c, dir: "desc" }] : [];
    setSorts(!add ? next : i < 0 ? [...sorts, ...next] : [...sorts.slice(0, i), ...next, ...sorts.slice(i + 1)]);
  };
  const cols = table.names.map((_, c) => c).filter((c) => !hidden.has(c));
  const widths = useMemo(
    () =>
      table.names.map((name, c) => {
        let chars = name.length + table.dtypes[c].length + 2;
        for (const r of table.rows.slice(0, 200)) chars = Math.max(chars, (r[c] ?? "").length);
        return Math.min(320, Math.max(72, chars * 8 + 16));
      }),
    [table],
  );
  const w = (c: number) => custom[c] ?? widths[c];
  // Left edge of each shown column in the scrolled content. The last entry is the total width.
  const xs = [GUTTER];
  for (const c of cols) xs.push(xs[xs.length - 1] + w(c));
  const total = xs[xs.length - 1];
  const numeric = (c: number) => family(table.dtypes[c]) === "number";

  // Row windowing: only the rows in view, plus OVERSCAN each side, are in the DOM.
  const box = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = box.current!;
    setHeight(el.clientHeight);
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    box.current!.scrollTop = 0;
  }, [hits]);
  const first = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
  const last = Math.min(hits.length, Math.ceil((top + height) / ROW_H) + OVERSCAN);
  const cell = "shrink-0 truncate px-2";

  // Go to row N: row N moves to the top and is marked.
  // A row that the search or filters hide is only reported in the status bar.
  // A sort puts the hits out of file order, so this is a scan, not a binary search.
  const find = (row: number) => hits.indexOf(row);
  const go = (n: number) => {
    setJump(n);
    const k = find(n - 1);
    if (k >= 0) box.current!.scrollTop = k * ROW_H;
  };
  const notice = jump === null
    ? ""
    : jump > table.rows.length
      ? `no row ${jump}`
      : find(jump - 1) < 0 ? `row ${jump} is hidden by the search or filters` : "";
  const scopeLabel = !scope.length ? "all columns" : scope.length === 1 ? table.names[scope[0]] : `${scope.length} columns`;

  // Selection, as in Excel. It belongs to the hits and shown columns it was
  // made on, so a change to either clears it.
  const [picked, setPicked] = useState<{ s: Sel; hits: number[]; hidden: ReadonlySet<number> } | null>(null);
  const sel = picked && picked.hits === hits && picked.hidden === hidden ? picked.s : null;
  const setSel = (s: Sel | null) => setPicked(s && { s, hits, hidden });
  const [sTop, sLeft, sBottom, sRight] = sel ? bounds(sel) : [-1, -1, -2, -2];
  const [copied, setCopied] = useState<{ s: Sel; note: string } | null>(null);
  const copy = (names: boolean) => {
    if (!sel) return;
    const size = `${(sBottom - sTop + 1).toLocaleString()} × ${sRight - sLeft + 1}`;
    navigator.clipboard.writeText(toTsv(cells(table, hits, cols, sel, names))).then(
      () => setCopied({ s: sel, note: `copied ${size}${names ? " with field names" : ""}` }),
      (e: unknown) => setCopied({ s: sel, note: `copy failed: ${e instanceof Error ? e.message : String(e)}` }),
    );
  };
  const setCopyKey = (v: string) => {
    localStorage.setItem(COPY_KEY, v);
    setCopyKeyState(v === "names" ? "names" : "data");
  };

  // Save: the rows and columns on screen, in their order, as a CSV download.
  // The column names go first only when the file has a header. The BOM makes Excel read UTF-8.
  const save = () => {
    const out = hits.map((i) => cols.map((c) => table.rows[i][c] ?? ""));
    if (header) out.unshift(cols.map((c) => table.names[c]));
    const url = URL.createObjectURL(new Blob(["﻿", toDelimited(out, ",")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = saveName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  // The row and column under a point on screen, held to the grid's edges.
  const cellAt = (x: number, y: number) => {
    const el = box.current!;
    const b = el.getBoundingClientRect();
    return {
      r: Math.max(0, Math.min(hits.length - 1, Math.floor((y - b.top + el.scrollTop) / ROW_H) - 1)),
      c: Math.max(0, Math.min(cols.length - 1, floorIndex(xs, x - b.left + el.scrollLeft))),
    };
  };
  // Scroll so that a cell is in view, below the sticky header and right of the "#" column.
  const reveal = (r: number, c: number) => {
    const el = box.current!;
    const y = (r + 1) * ROW_H;
    if (y - ROW_H < el.scrollTop) el.scrollTop = y - ROW_H;
    else if (y + ROW_H > el.scrollTop + el.clientHeight) el.scrollTop = y + ROW_H - el.clientHeight;
    if (xs[c] - GUTTER < el.scrollLeft) el.scrollLeft = xs[c] - GUTTER;
    else if (xs[c + 1] > el.scrollLeft + el.clientWidth) el.scrollLeft = xs[c + 1] - el.clientWidth;
  };

  // Mouse, as in Excel: a press on a cell, a "#" cell (whole rows), or a column
  // name (whole columns) starts a range, and the top-left "#" selects all.
  // Shift extends from the active cell. While the button is down the range
  // follows the pointer, and past an edge the grid scrolls by the overshoot each frame.
  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = box.current!;
    const b = el.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    const R = hits.length - 1;
    const C = cols.length - 1;
    // Ignore other buttons, an empty grid, the scrollbars, the resize handles, and the sort buttons.
    if (e.button !== 0 || R < 0 || C < 0 || x >= el.clientWidth || y >= el.clientHeight) return;
    if ((e.target as Element).closest("[data-resize], [data-sort]")) return;
    e.preventDefault();
    el.focus({ preventScroll: true });
    if (y < ROW_H && x < GUTTER) {
      setSel({ ar: 0, ac: 0, fr: R, fc: C });
      return;
    }
    const mode = y < ROW_H ? "cols" : x < GUTTER ? "rows" : "cells";
    const p = cellAt(e.clientX, e.clientY);
    const a = e.shiftKey && sel ? { r: sel.ar, c: sel.ac } : p;
    const to = (q: { r: number; c: number }) =>
      setSel(
        mode === "rows" ? { ar: a.r, ac: 0, fr: q.r, fc: C }
        : mode === "cols" ? { ar: 0, ac: a.c, fr: R, fc: q.c }
        : { ar: a.r, ac: a.c, fr: q.r, fc: q.c },
      );
    to(p);
    let px = e.clientX;
    let py = e.clientY;
    let down = true;
    const move = (m: MouseEvent) => {
      px = m.clientX;
      py = m.clientY;
      to(cellAt(px, py));
    };
    const up = () => {
      down = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    const tick = () => {
      if (!down) return;
      const r = el.getBoundingClientRect();
      const dy = mode === "cols" ? 0 : Math.min(0, py - r.top - ROW_H) || Math.max(0, py - r.top - el.clientHeight);
      const dx = mode === "rows" ? 0 : Math.min(0, px - r.left - GUTTER) || Math.max(0, px - r.left - el.clientWidth);
      if (dy || dx) {
        el.scrollTop += dy;
        el.scrollLeft += dx;
        to(cellAt(px, py));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Keys, as in Excel: arrows move the active cell, shift+arrows extend the
  // range, ⌘A / Ctrl+A selects all, ⌘C / Ctrl+C copies, Esc clears. A handled
  // key stops here, so bb does not see it.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const R = hits.length;
    const C = cols.length;
    const mod = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;
    const arrow = ARROWS[e.key];
    if (!R || !C) return;
    if (arrow && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const next = sel ? step(sel, arrow[0], arrow[1], e.shiftKey, R, C) : { ar: 0, ac: 0, fr: 0, fc: 0 };
      setSel(next);
      reveal(next.fr, next.fc);
    } else if (mod && e.key.toLowerCase() === "a") {
      setSel({ ar: 0, ac: 0, fr: R - 1, fc: C - 1 });
    } else if (mod && e.key.toLowerCase() === "c" && sel) {
      copy(copyKey === "names");
    } else if (e.key === "Escape" && sel) {
      setSel(null);
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };

  // Drag a column's right edge. Pointer capture keeps the drag when the pointer leaves the handle.
  const resize = (e: ReactPointerEvent<HTMLDivElement>, c: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    const start = e.clientX;
    const from = w(c);
    el.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => setCustom((cur) => ({ ...cur, [c]: Math.max(MIN_W, Math.round(from + m.clientX - start)) }));
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("lostpointercapture", end);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("lostpointercapture", end);
  };

  // Double-click a column edge: fit the column to its 20 longest values in the rows in view and to its header.
  // Values are measured with a canvas in the body cell font, the header cell at its max-content width.
  // The width is at most the visible grid width.
  const fit = (c: number) => {
    const el = box.current!;
    const ci = cols.indexOf(c);
    const head = el.querySelectorAll<HTMLElement>('[role="columnheader"]')[ci];
    const s = getComputedStyle(el.querySelector("[data-row]")?.children[ci + 1] ?? head);
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    let need = 0;
    for (const v of longest(table, hits, c, 20)) need = Math.max(need, ctx.measureText(v).width);
    need += parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
    head.style.width = "max-content";
    need = Math.max(need, head.getBoundingClientRect().width);
    head.style.width = `${w(c)}px`;
    setCustom((cur) => ({ ...cur, [c]: Math.max(MIN_W, Math.min(el.clientWidth - GUTTER, Math.ceil(need))) }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-2 py-1.5">
        <input
          type="search"
          placeholder={`Search (${MAC ? "⌘F" : "Ctrl+F"})`}
          className={`${FIELD} w-56`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Popover name="Search in" label={`In: ${scopeLabel}`}>
          <label className="flex items-center gap-2 py-0.5">
            <input type="checkbox" checked={!scope.length} onChange={() => setScope([])} />
            All columns
          </label>
          {table.names.map((name, c) => (
            <label key={c} className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={scope.includes(c)}
                onChange={() => setScope(scope.includes(c) ? scope.filter((x) => x !== c) : [...scope, c])}
              />
              {name}
            </label>
          ))}
        </Popover>
        <button
          type="button"
          title={ICONS.filter.name}
          className={BUTTON}
          onClick={() => setFilters([...filters, blank(table, cols[0] ?? 0)])}
        >
          <Icon name="filter" />
          Filter
        </button>
        <SortPanel table={table} sorts={sorts} setSorts={setSorts} />
        <Columns table={table} hidden={hidden} setHidden={setHidden} />
        <Popover name="Copy" title="Copy the selection" label={<><Icon name="clipboard" />Copy</>}>
          <div className="flex flex-col gap-1">
            {([["data", "Copy data"], ["names", "Copy data with field names"]] as const).map(([v, text]) => (
              <button
                key={v}
                type="button"
                data-copy={v}
                disabled={!sel}
                className={`${BUTTON} justify-between`}
                onClick={(e) => {
                  copy(v === "names");
                  e.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();
                }}
              >
                {text}
                {copyKey === v && <kbd className="text-xs text-muted-foreground">{MAC ? "⌘C" : "Ctrl+C"}</kbd>}
              </button>
            ))}
            <Choice
              name={`${MAC ? "⌘C" : "Ctrl+C"} copies`}
              value={copyKey}
              onChange={setCopyKey}
              options={[["data", "Data"], ["names", "Data with field names"]]}
            />
          </div>
        </Popover>
        <button type="button" data-dsv-save title={`Save the rows you see as a CSV file (${MAC ? "⌘S" : "Ctrl+S"})`} className={BUTTON} disabled={!cols.length} onClick={save}>
          <Icon name="save" />
          Save
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(new FormData(e.currentTarget).get("row"));
            if (n > 0) go(n);
          }}
        >
          <input
            name="row"
            type="number"
            min={1}
            step={1}
            aria-label="Go to row"
            placeholder={`Go to row (${MAC ? "⌘G" : "Ctrl+G"})`}
            className={`${FIELD} w-36`}
          />
        </form>
      </div>
      {filters.map((f, i) => (
        <FilterRow
          key={i}
          table={table}
          filter={f}
          onChange={(next) => setFilters(filters.map((g, j) => (j === i ? next : g)))}
          onRemove={() => setFilters(filters.filter((_, j) => j !== i))}
        />
      ))}
      <div
        ref={box}
        data-dsv-grid=""
        tabIndex={0}
        className="min-h-0 flex-1 select-none overflow-auto outline-none"
        onScroll={(e) => setTop(e.currentTarget.scrollTop)}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
      >
        <div className="relative" style={{ width: total, height: (hits.length + 1) * ROW_H, lineHeight: `${ROW_H}px` }}>
          <div className="sticky top-0 z-10 flex border-b-2 border-border bg-muted font-semibold" style={{ height: ROW_H }}>
            <div
              title="Row number. Click to select all."
              className={`${cell} sticky left-0 bg-muted text-right text-muted-foreground`}
              style={{ width: GUTTER }}
            >
              #
            </div>
            {cols.map((c, ci) => {
              const level = sorts.findIndex((k) => k.col === c);
              const dir = level < 0 ? null : sorts[level].dir;
              return (
                <div
                  key={c}
                  role="columnheader"
                  title={`${table.names[c]} (${table.dtypes[c]})`}
                  // ARIA allows one sorted header at a time, so only level 1 gets aria-sort.
                  aria-sort={level !== 0 ? undefined : dir === "asc" ? "ascending" : "descending"}
                  className={`${cell} relative flex items-center gap-1 ${numeric(c) ? "justify-end" : ""} ${ci >= sLeft && ci <= sRight ? "text-primary" : ""}`}
                  style={{ width: w(c) }}
                >
                  <span className="truncate">{table.names[c]}</span>
                  <span className="rounded bg-background px-1 text-[10px] leading-4 text-muted-foreground">{table.dtypes[c]}</span>
                  <button
                    type="button"
                    data-sort=""
                    aria-label={`Sort by ${table.names[c]}`}
                    title={`Sort: ${!dir ? "ascending" : dir === "asc" ? "descending" : "file order"}. Shift+click to sort by several columns.`}
                    className={`mr-1 shrink-0 text-xs ${dir ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"}`}
                    onClick={(e) => sortBy(c, e.shiftKey)}
                  >
                    {!dir ? "↕" : `${arrow(dir)}${sorts.length > 1 ? level + 1 : ""}`}
                  </button>
                  <div
                    data-resize=""
                    title="Drag to resize. Double-click to fit the content."
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary"
                    onPointerDown={(e) => resize(e, c)}
                    onDoubleClick={() => fit(c)}
                  />
                </div>
              );
            })}
          </div>
          {hits.slice(first, last).map((ri, k) => {
            const r = table.rows[ri];
            const pos = first + k;
            const marked = ri + 1 === jump;
            const inRows = pos >= sTop && pos <= sBottom;
            return (
              <div
                key={ri}
                data-row=""
                aria-current={marked || undefined}
                className={`absolute left-0 flex border-b border-border ${marked ? "bg-accent text-accent-foreground" : ""}`}
                style={{ top: (pos + 1) * ROW_H, height: ROW_H, width: total }}
              >
                <div
                  className={`${cell} sticky left-0 z-[1] text-right ${marked ? "bg-accent" : "bg-background"} ${inRows ? "font-semibold text-primary" : marked ? "" : "text-muted-foreground"}`}
                  style={{ width: GUTTER }}
                >
                  {ri + 1}
                </div>
                {cols.map((c, ci) => {
                  const on = inRows && ci >= sLeft && ci <= sRight;
                  const active = sel !== null && pos === sel.ar && ci === sel.ac;
                  return (
                    <div
                      key={c}
                      title={r[c]}
                      className={`${cell} ${numeric(c) ? "text-right tabular-nums" : ""} ${on ? "bg-primary/10" : ""} ${active ? "outline-2 -outline-offset-2 outline-primary" : ""}`}
                      style={{ width: w(c) }}
                    >
                      {r[c] ?? ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {sel && (
            <div
              data-range=""
              className="pointer-events-none absolute border border-primary"
              style={{ left: xs[sLeft], top: (sTop + 1) * ROW_H, width: xs[sRight + 1] - xs[sLeft], height: (sBottom - sTop + 1) * ROW_H }}
            />
          )}
        </div>
      </div>
      <div className="border-t border-border px-2 py-1 text-xs text-muted-foreground">
        {hits.length.toLocaleString()} of {table.rows.length.toLocaleString()} rows · {cols.length} of {table.names.length}{" "}
        columns{sorts.length > 0 && ` · sorted by ${sorts.map((k) => `${table.names[k.col]} ${arrow(k.dir)}`).join(", ")}`} · {note}
        {sel && ` · ${(sBottom - sTop + 1).toLocaleString()} × ${sRight - sLeft + 1} selected`}
        {sel && copied?.s === sel && ` · ${copied.note}`}
        {notice && ` · ${notice}`}
      </div>
    </div>
  );
}

function FilterRow({ table, filter: f, onChange, onRemove }: {
  table: Table;
  filter: Filter;
  onChange: (f: Filter) => void;
  onRemove: () => void;
}) {
  const fam = family(table.dtypes[f.col] ?? "string");
  const type = fam === "date" ? "date" : fam === "number" ? "number" : "text";
  const n = arity(f.op);
  const value = (key: "a" | "b") => (
    <input
      aria-label={key === "a" ? "Value" : "Second value"}
      type={type}
      step={type === "number" ? "any" : undefined}
      className={`${FIELD} w-40`}
      value={f[key]}
      onChange={(e) => onChange({ ...f, [key]: e.target.value })}
    />
  );
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-2 py-1">
      <select aria-label="Column" className={FIELD} value={f.col} onChange={(e) => onChange(blank(table, Number(e.target.value)))}>
        {table.names.map((name, c) => <option key={c} value={c}>{name}</option>)}
      </select>
      <select aria-label="Operator" className={FIELD} value={f.op} onChange={(e) => onChange({ ...f, op: e.target.value as Op })}>
        {OPS[fam].map(([op, label]) => <option key={op} value={op}>{label}</option>)}
      </select>
      {n >= 1 && value("a")}
      {n === 2 && <span className="text-muted-foreground">and</span>}
      {n === 2 && value("b")}
      <button type="button" aria-label="Remove filter" className={BUTTON} onClick={onRemove}>×</button>
    </div>
  );
}

/**
 * The sort levels, one line each: a column, a direction, move up, move down,
 * and remove. A column is in one level at most. Hidden columns are listed too.
 */
function SortPanel({ table, sorts, setSorts }: {
  table: Table;
  sorts: SortKey[];
  setSorts: (s: SortKey[]) => void;
}) {
  const set = (i: number, k: SortKey) => setSorts(sorts.map((x, j) => (j === i ? k : x)));
  const swap = (i: number, j: number) => {
    const next = sorts.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setSorts(next);
  };
  const used = (c: number) => sorts.some((k) => k.col === c);
  const free = table.names.findIndex((_, c) => !used(c));
  return (
    <Popover name="Sort" title="Sort by several columns" label={<><Icon name="sort" />{sorts.length ? `Sort (${sorts.length})` : "Sort"}</>}>
      <div className="flex flex-col gap-1">
        {sorts.map((k, i) => (
          <div key={i} data-level={i + 1} className="flex items-center gap-2">
            <span className="w-4 text-right text-muted-foreground">{i + 1}</span>
            <select aria-label="Sort column" className={FIELD} value={k.col} onChange={(e) => set(i, { ...k, col: Number(e.target.value) })}>
              {table.names.map((name, c) => <option key={c} value={c} disabled={c !== k.col && used(c)}>{name}</option>)}
            </select>
            <select aria-label="Sort direction" className={FIELD} value={k.dir} onChange={(e) => set(i, { ...k, dir: e.target.value as Dir })}>
              <option value="asc">ascending</option>
              <option value="desc">descending</option>
            </select>
            <button type="button" aria-label="Move up" title="Move up" className={BUTTON} disabled={i === 0} onClick={() => swap(i, i - 1)}>↑</button>
            <button type="button" aria-label="Move down" title="Move down" className={BUTTON} disabled={i === sorts.length - 1} onClick={() => swap(i, i + 1)}>↓</button>
            <button type="button" aria-label="Remove level" title="Remove level" className={BUTTON} onClick={() => setSorts(sorts.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" className={BUTTON} disabled={free < 0} onClick={() => setSorts([...sorts, { col: free, dir: "asc" }])}>
            Add level
          </button>
          <button type="button" className={BUTTON} disabled={!sorts.length} onClick={() => setSorts([])}>Clear</button>
        </div>
      </div>
    </Popover>
  );
}

/** A button that opens a native popover panel, named `name`, under it. */
function Popover({ name, label, title, children }: { name: string; label: ReactNode; title?: string; children: ReactNode }) {
  const id = `dsv-pop-${useId().replace(/[^\w-]/g, "")}`;
  const panel = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        className={BUTTON}
        title={title}
        popoverTarget={id}
        // The popover opens in the top layer. Pin it under this button, right
        // edges aligned, so it grows left and stays inside the window.
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const right = document.documentElement.clientWidth - r.right;
          Object.assign(panel.current!.style, { top: `${r.bottom + 4}px`, left: "auto", right: `${right}px` });
        }}
      >
        {label}
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={name}
        className="m-0 max-h-80 overflow-auto rounded-md border border-border bg-popover p-2 text-sm text-popover-foreground shadow-md"
      >
        {children}
      </div>
    </>
  );
}

/** A Font Awesome Free icon from ICONS, coloured by the text colour. */
function Icon({ name, className = "h-3.5 w-3.5" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox={ICONS[name].box} aria-hidden="true" className={className} fill="currentColor">
      <path d={ICONS[name].d} />
    </svg>
  );
}

/** A labelled select for the Format and Copy popovers. */
function Choice({ name, value, options, onChange, disabled }: {
  name: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      {name}
      <select aria-label={name} className={FIELD} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
    </label>
  );
}

function Columns({ table, hidden, setHidden }: {
  table: Table;
  hidden: ReadonlySet<number>;
  setHidden: (s: ReadonlySet<number>) => void;
}) {
  const toggle = (c: number) => {
    const next = new Set(hidden);
    if (!next.delete(c)) next.add(c);
    setHidden(next);
  };
  return (
    <Popover name="Columns" label={`Columns ${table.names.length - hidden.size}/${table.names.length}`}>
      <div className="mb-1 flex gap-2">
        <button type="button" className={BUTTON} onClick={() => setHidden(new Set())}>Show all</button>
        <button type="button" className={BUTTON} onClick={() => setHidden(new Set(table.names.map((_, c) => c)))}>
          Hide all
        </button>
      </div>
      {table.names.map((name, c) => (
        <label key={c} className="flex items-center gap-2 py-0.5">
          <input type="checkbox" checked={!hidden.has(c)} onChange={() => toggle(c)} />
          {name}
          <span className="text-xs text-muted-foreground">{table.dtypes[c]}</span>
        </label>
      ))}
    </Popover>
  );
}
