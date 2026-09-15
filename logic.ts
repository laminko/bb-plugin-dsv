// Pure delimited-text logic: parser, delimiter and header detection, dtype
// inference, filters, search. No DOM and no React, so `node --test` runs it.

export type Dtype = "int" | "float" | "bool" | "date" | "string";
export type Order = "dmy" | "mdy" | "ymd";
/** How one column writes values: a decimal comma or not, and the date part order. */
export interface Reading {
  comma: boolean;
  order: Order;
}
/** The user's read-format choices. "auto" is decided per column. */
export interface Format {
  decimal: "auto" | "." | ",";
  order: "auto" | Order;
}
export const FORMAT: Format = { decimal: "auto", order: "auto" };
const PLAIN: Reading = { comma: false, order: "ymd" };

export type Op =
  | "contains" | "equals" | "starts" | "empty" | "notempty"
  | "eq" | "ne" | "gt" | "ge" | "lt" | "le" | "between"
  | "true" | "false";
export interface Filter {
  col: number;
  op: Op;
  a: string;
  b: string;
}
export interface Table {
  names: string[];
  rows: string[][];
  dtypes: Dtype[];
  reads: Reading[];
  /** Lower-cased joined rows, built on the first all-column search. */
  lower?: string[];
  /** Lower-cased columns, each built on the first search that picks it. */
  lowerCols?: string[][];
  /** Sort ranks, each built on the first sort by its column. */
  ranks?: Int32Array[];
}

const LF = 10;
const CR = 13;

/** Index of the next delimiter or line break at or after `i`. */
function fieldEnd(text: string, i: number, d: number): number {
  for (const n = text.length; i < n; i++) {
    const c = text.charCodeAt(i);
    if (c === d || c === LF || c === CR) break;
  }
  return i;
}

const keep = (row: string[]) => row.length > 1 || !!row[0];

/**
 * RFC 4180: quoted fields, doubled-qualifier escapes, CRLF / LF / CR, line
 * breaks inside quotes, a leading BOM, and ragged rows (kept as-is). Blank
 * lines are dropped. `quote` is the text qualifier: `"`, `'`, or "" for none.
 */
export function parse(text: string, delim: string, quote = '"'): string[][] {
  const d = delim.charCodeAt(0);
  const q = quote ? quote.charCodeAt(0) : -1;
  const n = text.length;
  const rows: string[][] = [];
  let row: string[] = [];
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  while (i < n) {
    let field: string;
    if (text.charCodeAt(i) === q) {
      field = "";
      let j = i + 1;
      for (;;) {
        const k = text.indexOf(quote, j);
        if (k < 0) {
          field += text.slice(j);
          i = n;
          break;
        }
        field += text.slice(j, k);
        if (text.charCodeAt(k + 1) === q) {
          field += quote;
          j = k + 2;
          continue;
        }
        i = k + 1;
        break;
      }
      // Lenient: text between a closing quote and the next delimiter stays.
      const e = fieldEnd(text, i, d);
      field += text.slice(i, e);
      i = e;
    } else {
      const e = fieldEnd(text, i, d);
      field = text.slice(i, e);
      i = e;
    }
    row.push(field);
    if (i >= n) break;
    if (text.charCodeAt(i) === d) {
      i++;
      if (i === n) row.push("");
      continue;
    }
    i += text.charCodeAt(i) === CR && text.charCodeAt(i + 1) === LF ? 2 : 1;
    if (keep(row)) rows.push(row);
    row = [];
  }
  if (keep(row)) rows.push(row);
  return rows;
}

/** The file's first line break: "CRLF", "LF", "CR", or "none". */
export function recordDelimiter(text: string): string {
  const i = text.search(/[\r\n]/);
  return i < 0 ? "none" : text[i] === "\n" ? "LF" : text[i + 1] === "\n" ? "CRLF" : "CR";
}

export const DELIMITERS = [",", "\t", ";", "|"];
const BY_EXT: Record<string, string> = { csv: ",", tsv: "\t", tab: "\t", psv: "|", ssv: ";" };
const SAMPLE = 65536;

/**
 * The extension's delimiter when it splits the first 50 rows consistently;
 * otherwise the candidate with the most consistent column count above 1.
 */
export function detectDelimiter(text: string, ext = "", quote = '"'): string {
  const head = text.slice(0, SAMPLE);
  const score = (d: string) => {
    const rows = parse(head, d, quote);
    if (text.length > SAMPLE) rows.pop(); // the sample may cut the last row
    const sample = rows.slice(0, 50);
    const freq = new Map<number, number>();
    for (const r of sample) freq.set(r.length, (freq.get(r.length) ?? 0) + 1);
    let count = 0;
    let width = 0;
    for (const [w, c] of freq) {
      if (c > count || (c === count && w > width)) {
        count = c;
        width = w;
      }
    }
    // Share of rows at the modal width; a wider split breaks ties.
    return width < 2 ? 0 : count / sample.length + width * 1e-6;
  };
  const fromExt = BY_EXT[ext.toLowerCase()];
  if (fromExt && score(fromExt) >= 0.9) return fromExt;
  let best = fromExt ?? ",";
  let top = 0;
  for (const d of DELIMITERS) {
    const s = score(d);
    if (s > top) {
      top = s;
      best = d;
    }
  }
  return best;
}

const INT = /^[-+]?\d+$/;
const FLOAT = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
const FLOAT_COMMA = /^[-+]?(\d+,?\d*|,\d+)(e[-+]?\d+)?$/i;
const BOOL = /^(true|false)$/i;
const DATE =
  /^(\d{1,4})([-/.])(\d{1,2})\2(\d{1,4})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i;
const ORDERS: Order[] = ["ymd", "dmy", "mdy"];

// ponytail: time-zone offsets are ignored; parse them when a file mixes zones.
/**
 * UTC milliseconds for a date in part order `order`, else NaN. The year has 4
 * digits. The parts are split by `-`, `/`, or `.`, the same one twice. A time may follow.
 */
export function toDate(v: string, order: Order = "ymd"): number {
  const m = DATE.exec(v.trim());
  if (!m) return NaN;
  const [, a, , b, c] = m;
  const ymd = order === "ymd";
  if ((ymd ? a : c).length !== 4 || (ymd ? c : a).length > 2) return NaN;
  const [y, mo, d] = ymd ? [a, b, c] : order === "dmy" ? [c, b, a] : [c, a, b];
  if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return NaN;
  return Date.UTC(+y, +mo - 1, +d, +(m[5] ?? 0), +(m[6] ?? 0), +(m[7] ?? 0));
}

/** A cell as a number. With `comma`, "1,5" is 1.5 and any "." makes it NaN. */
const toNumber = (v: string, comma = false) =>
  !v.trim() || (comma && v.includes(".")) ? NaN : Number(comma ? v.replace(",", ".") : v);

/** Whether a trimmed value is of dtype `t` when read with `r`. */
function fits(t: Dtype, r: Reading, v: string): boolean {
  switch (t) {
    case "bool": return BOOL.test(v);
    case "int": return INT.test(v);
    case "float": return (r.comma ? FLOAT_COMMA : FLOAT).test(v);
    case "date": return !Number.isNaN(toDate(v, r.order));
    case "string": return true;
  }
}

/**
 * The first of bool, int, float, date that ≥95% of up to 1,000 non-empty
 * values match, else string. Empty cells are nulls. Auto decimal tries "."
 * then ",". Auto date order takes the order that reads the most values; a
 * tie (every day and month ≤ 12) goes to DMY.
 */
export function inferColumn(values: string[], f: Format = FORMAT): { dtype: Dtype; read: Reading } {
  const sample: string[] = [];
  for (const v of values) {
    const s = v.trim();
    if (s) sample.push(s);
    if (sample.length === 1000) break;
  }
  const base: Reading = { comma: f.decimal === ",", order: f.order === "auto" ? "ymd" : f.order };
  if (!sample.length) return { dtype: "string", read: base };
  const hits = (t: Dtype, r: Reading) => {
    let k = 0;
    for (const v of sample) if (fits(t, r, v)) k++;
    return k;
  };
  const enough = (k: number) => k >= sample.length * 0.95;
  if (enough(hits("bool", base))) return { dtype: "bool", read: base };
  if (enough(hits("int", base))) return { dtype: "int", read: base };
  for (const comma of f.decimal === "auto" ? [false, true] : [base.comma]) {
    const read = { ...base, comma };
    if (enough(hits("float", read))) return { dtype: "float", read };
  }
  let best = base;
  let top = 0;
  for (const order of f.order === "auto" ? ORDERS : [base.order]) {
    const read = { ...base, order };
    const k = hits("date", read);
    if (k > top) {
      top = k;
      best = read;
    }
  }
  return top && enough(top) ? { dtype: "date", read: best } : { dtype: "string", read: base };
}

const column = (rows: string[][], c: number) => rows.map((r) => r[c] ?? "");

/**
 * Typed columns decide: text in row 1 over a typed body means a header. For
 * all-text data, unique row-1 labels that do not recur below mean a header.
 */
export function detectHeader(rows: string[][], f: Format = FORMAT): { header: boolean; reason: string } {
  if (rows.length < 2) return { header: false, reason: "only one row" };
  const first = rows[0];
  const body = rows.slice(1, 1001);
  let typed = false;
  for (let c = 0; c < first.length; c++) {
    const { dtype, read } = inferColumn(column(body, c), f);
    if (dtype === "string") continue;
    typed = true;
    const v = first[c].trim();
    if (v && !fits(dtype, read, v)) return { header: true, reason: `row 1 is text, rows 2+ are ${dtype} in column ${c + 1}` };
  }
  if (typed) return { header: false, reason: "row 1 has the same types as rows 2+" };
  const seen = new Set<string>();
  for (let c = 0; c < first.length; c++) {
    const v = first[c].trim();
    if (!v || seen.has(v) || body.some((r) => r[c]?.trim() === v)) {
      return { header: false, reason: "row 1 looks like data" };
    }
    seen.add(v);
  }
  return { header: true, reason: "row 1 labels are unique and not repeated below" };
}

/** Names, body rows, and a dtype and reading per column inferred from the first 1,000 body rows. */
export function toTable(all: string[][], header: boolean, f: Format = FORMAT): Table {
  const rows = header ? all.slice(1) : all;
  let width = 0;
  for (const r of all) if (r.length > width) width = r.length;
  const sample = rows.slice(0, 1000);
  const names: string[] = [];
  const dtypes: Dtype[] = [];
  const reads: Reading[] = [];
  for (let c = 0; c < width; c++) {
    names.push((header && all[0][c]?.trim()) || `column ${c + 1}`);
    const col = inferColumn(column(sample, c), f);
    dtypes.push(col.dtype);
    reads.push(col.read);
  }
  return { names, rows, dtypes, reads };
}

export type Family = "string" | "number" | "date" | "bool";
export const family = (t: Dtype): Family => (t === "int" || t === "float" ? "number" : t);

/** Operators per dtype family, as [op, label]. */
export const OPS: Record<Family, [Op, string][]> = {
  string: [["contains", "contains"], ["equals", "equals"], ["starts", "starts with"], ["empty", "is empty"], ["notempty", "not empty"]],
  number: [["eq", "="], ["ne", "≠"], ["gt", ">"], ["ge", "≥"], ["lt", "<"], ["le", "≤"], ["between", "between"]],
  date: [["lt", "before"], ["gt", "after"], ["between", "between"]],
  bool: [["true", "is true"], ["false", "is false"]],
};

/** How many values an operator takes. */
export const arity = (op: Op) =>
  op === "between" ? 2 : op === "empty" || op === "notempty" || op === "true" || op === "false" ? 0 : 1;

/**
 * Cell test for one filter, or null while the filter is incomplete, so the
 * caller ignores it. Text tests ignore case. Empty cells fail number and date
 * tests. Cells are read with `r`. The operands come from native inputs, so
 * they are always ISO dates and "." decimals.
 */
export function predicate(f: Filter, t: Dtype, r: Reading = PLAIN): ((v: string) => boolean) | null {
  const { op } = f;
  const a = f.a.trim().toLowerCase();
  switch (op) {
    case "contains": return a ? (v) => v.toLowerCase().includes(a) : null;
    case "equals": return a ? (v) => v.trim().toLowerCase() === a : null;
    case "starts": return a ? (v) => v.trimStart().toLowerCase().startsWith(a) : null;
    case "empty": return (v) => !v.trim();
    case "notempty": return (v) => !!v.trim();
    case "true": return (v) => v.trim().toLowerCase() === "true";
    case "false": return (v) => v.trim().toLowerCase() === "false";
  }
  const date = t === "date";
  const x = date ? toDate(f.a) : toNumber(f.a);
  const y = date ? toDate(f.b) : toNumber(f.b);
  if (Number.isNaN(x) || (op === "between" && Number.isNaN(y))) return null;
  const lo = Math.min(x, y);
  const hi = Math.max(x, y);
  const conv = date ? (v: string) => toDate(v, r.order) : (v: string) => toNumber(v, r.comma);
  const cmp = (p: (n: number) => boolean) => (v: string) => {
    const n = conv(v);
    return !Number.isNaN(n) && p(n);
  };
  switch (op) {
    case "eq": return cmp((n) => n === x);
    case "ne": return cmp((n) => n !== x);
    case "gt": return cmp((n) => n > x);
    case "ge": return cmp((n) => n >= x);
    case "lt": return cmp((n) => n < x);
    case "le": return cmp((n) => n <= x);
    case "between": return cmp((n) => n >= lo && n <= hi);
  }
}

/**
 * Indices of rows where any `scope` column (an empty scope = all columns)
 * contains `search`, and every complete filter passes.
 */
export function query(t: Table, search: string, scope: number[], filters: Filter[]): number[] {
  const q = search.toLowerCase();
  const tests: [number, (v: string) => boolean][] = [];
  for (const f of filters) {
    const p = predicate(f, t.dtypes[f.col] ?? "string", t.reads[f.col]);
    if (p) tests.push([f.col, p]);
  }
  // Lower-cased text to search, cached on the table: the joined rows for all
  // columns, else one array per picked column.
  const hay = !q ? [] : scope.length
    ? scope.map((c) => ((t.lowerCols ??= [])[c] ??= t.rows.map((r) => (r[c] ?? "").toLowerCase())))
    : [(t.lower ??= t.rows.map((r) => r.join(" ").toLowerCase()))];
  const out: number[] = [];
  next: for (let i = 0; i < t.rows.length; i++) {
    if (q && !hay.some((h) => h[i].includes(q))) continue;
    const r = t.rows[i];
    for (const [c, p] of tests) if (!p(r[c] ?? "")) continue next;
    out.push(i);
  }
  return out;
}

export type Dir = "asc" | "desc";

const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const LAST = 0x7fffffff; // the rank of empty and unreadable cells

/** A cell as a sort key for dtype `t` read with `r`, or null when it is empty or does not read as `t`. */
function sortKey(t: Dtype, r: Reading, v: string): number | string | null {
  const s = v.trim();
  if (!s) return null;
  let n: number;
  switch (t) {
    case "string": return s;
    case "bool": return BOOL.test(s) ? Number(s.toLowerCase() === "true") : null;
    case "date": n = toDate(s, r.order); break;
    default: n = toNumber(s, r.comma);
  }
  return Number.isNaN(n) ? null : n;
}

/**
 * The sort rank of every row in column `c`, cached on the table. Text compares
 * with numbers as numbers and case ignored. Equal values share a rank. Empty
 * and unreadable cells rank LAST.
 */
function rank(t: Table, c: number): Int32Array {
  const ranks = (t.ranks ??= []);
  if (ranks[c]) return ranks[c];
  const type = t.dtypes[c] ?? "string";
  const read = t.reads[c] ?? PLAIN;
  const keys = t.rows.map((row) => sortKey(type, read, row[c] ?? ""));
  const cmp = type === "string"
    ? (a: number, b: number) => COLLATOR.compare(keys[a] as string, keys[b] as string)
    : (a: number, b: number) => (keys[a] as number) - (keys[b] as number);
  const valid: number[] = [];
  keys.forEach((k, i) => {
    if (k !== null) valid.push(i);
  });
  valid.sort(cmp);
  const out = new Int32Array(keys.length).fill(LAST);
  let k = 0;
  for (let j = 0; j < valid.length; j++) {
    if (j && cmp(valid[j - 1], valid[j])) k++;
    out[valid[j]] = k;
  }
  return (ranks[c] = out);
}

/** One sort level: a column and its direction. */
export interface SortKey {
  col: number;
  dir: Dir;
}

/**
 * `hits` sorted by the levels in `keys`, as a new array. Level 2 orders only
 * rows equal in level 1, and so on. Rows equal in all levels keep their order.
 * In each level, empty and unreadable cells stay last in both directions.
 */
export function sortHits(t: Table, hits: number[], keys: SortKey[]): number[] {
  const levels = keys.map((k) => [rank(t, k.col), k.dir === "asc" ? 1 : -1] as const);
  return hits.slice().sort((a, b) => {
    for (const [r, sign] of levels) {
      const d = r[a] === LAST || r[b] === LAST ? r[a] - r[b] : sign * (r[a] - r[b]);
      if (d) return d;
    }
    return 0;
  });
}

/** Index of the last value ≤ x in an ascending array, or -1. */
export function floorIndex(sorted: number[], x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const m = (lo + hi) >>> 1;
    if (sorted[m] <= x) lo = m + 1;
    else hi = m;
  }
  return lo - 1;
}

/**
 * A selection by position on screen: the active cell (ar, ac) and the far
 * corner (fr, fc). Rows index the search and filter hits; columns index the shown columns.
 */
export interface Sel {
  ar: number;
  ac: number;
  fr: number;
  fc: number;
}

/** The selection as [top, left, bottom, right], inclusive. */
export const bounds = (s: Sel) =>
  [Math.min(s.ar, s.fr), Math.min(s.ac, s.fc), Math.max(s.ar, s.fr), Math.max(s.ac, s.fc)] as const;

/**
 * An arrow key: move the active cell and collapse the range, or with `extend`
 * move the far corner. Both stop at the edges of a rows × cols grid.
 */
export function step(s: Sel, dr: number, dc: number, extend: boolean, rows: number, cols: number): Sel {
  const clamp = (v: number, n: number) => Math.max(0, Math.min(n - 1, v));
  if (extend) return { ...s, fr: clamp(s.fr + dr, rows), fc: clamp(s.fc + dc, cols) };
  const r = clamp(s.ar + dr, rows);
  const c = clamp(s.ac + dc, cols);
  return { ar: r, ac: c, fr: r, fc: c };
}

/** The selected values, row by row. With `names`, the first line is the names of the selected columns. */
export function cells(t: Table, hits: number[], cols: number[], s: Sel, names = false): string[][] {
  const [top, left, bottom, right] = bounds(s);
  const picked = cols.slice(left, right + 1);
  const out = names ? [picked.map((c) => t.names[c])] : [];
  for (let k = top; k <= bottom; k++) {
    const r = t.rows[hits[k]];
    out.push(picked.map((c) => r[c] ?? ""));
  }
  return out;
}

/** The encodings the Format popover offers, as [TextDecoder label, name]. All are built into TextDecoder. */
export const ENCODINGS: [string, string][] = [
  ["utf-8", "UTF-8"],
  ["utf-16le", "UTF-16 LE"],
  ["utf-16be", "UTF-16 BE"],
  ["windows-874", "Windows-874 (Thai, TIS-620)"],
  ["windows-1252", "Windows-1252 (Western, ISO-8859-1)"],
  ["windows-1250", "Windows-1250 (Central European)"],
  ["windows-1251", "Windows-1251 (Cyrillic)"],
  ["shift_jis", "Shift_JIS (Japanese)"],
  ["euc-jp", "EUC-JP (Japanese)"],
  ["gb18030", "GB18030 (Simplified Chinese)"],
  ["big5", "Big5 (Traditional Chinese)"],
  ["euc-kr", "EUC-KR (Korean)"],
];

const REPLACEMENT = String.fromCharCode(0xfffd);

/** Bytes as text in the encoding `label`, and how many characters the decoder could not read (each became U+FFFD). */
export function decode(bytes: Uint8Array, label: string): { text: string; bad: number } {
  const text = new TextDecoder(label).decode(bytes);
  let bad = 0;
  for (let i = text.indexOf(REPLACEMENT); i >= 0; i = text.indexOf(REPLACEMENT, i + 1)) bad++;
  return { text, bad };
}

/** Delimited text: `d` between cells, a line feed between rows. A cell with `d`, a line break, or `"` is quoted, with `"` doubled. */
export const toDelimited = (rows: string[][], d: string) =>
  rows.map((r) => r.map((v) => (v.includes(d) || /[\n\r"]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)).join(d)).join("\n");

/** Spreadsheet clipboard text (TSV). */
export const toTsv = (rows: string[][]) => toDelimited(rows, "\t");
