// A1: node --test logic.test.ts  →  41 of 41 must pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cells, decode, detectDelimiter, detectHeader, floorIndex, FORMAT, inferColumn, parse, predicate, query,
  recordDelimiter, step, toDate, toTable, toTsv,
  type Dtype, type Format, type Op, type Reading, type Sel,
} from "./logic.ts";

const pick = (values: string[], dtype: Dtype, op: Op, a = "", b = "", r?: Reading) => {
  const p = predicate({ col: 0, op, a, b }, dtype, r);
  assert.ok(p, `${op} should be complete`);
  return values.filter(p);
};
const inferDtype = (values: string[], f?: Format) => inferColumn(values, f).dtype;

// Parser
test("parse: plain rows", () => {
  assert.deepEqual(parse("a,b\n1,2", ","), [["a", "b"], ["1", "2"]]);
});
test("parse: quoted field keeps the delimiter", () => {
  assert.deepEqual(parse('"a,b",c', ","), [["a,b", "c"]]);
});
test("parse: doubled quotes unescape", () => {
  assert.deepEqual(parse('"say ""hi""",x', ","), [['say "hi"', "x"]]);
});
test("parse: CRLF line endings", () => {
  assert.deepEqual(parse("a,b\r\n1,2\r\n", ","), [["a", "b"], ["1", "2"]]);
});
test("parse: line break inside quotes", () => {
  assert.deepEqual(parse('"line1\nline2",x\ny,z', ","), [["line1\nline2", "x"], ["y", "z"]]);
  assert.deepEqual(parse('h\r\n"a\r\nb",1\n\nd,2\r"e\re",3', ","), [["h"], ["a\r\nb", "1"], ["d", "2"], ["e\re", "3"]]);
});
test("parse: BOM stripped", () => {
  assert.equal(parse("﻿a,b\n1,2", ",")[0][0], "a");
});
test("parse: ragged rows kept, blank lines and trailing newline dropped, trailing delimiter kept", () => {
  assert.deepEqual(parse("a,b,c\n1\n\n2,3\n", ","), [["a", "b", "c"], ["1"], ["2", "3"]]);
  assert.deepEqual(parse("a,", ","), [["a", ""]]);
  assert.deepEqual(parse("a,\nb,c", ","), [["a", ""], ["b", "c"]]);
});

// Delimiter detection
test("delimiter: extension wins when it splits consistently", () => {
  const text = "a,x\tb\n1,y\t2";
  assert.equal(detectDelimiter(text, "tsv"), "\t");
  assert.equal(detectDelimiter(text, ""), ",");
});
test("delimiter: semicolon .csv falls back to consistency", () => {
  assert.equal(detectDelimiter("a;b;c\n1,5;2;3\n4;5,5;6", "csv"), ";");
});
test("delimiter: pipe with no extension", () => {
  assert.equal(detectDelimiter("a|b|c\n1|2|3", ""), "|");
});
test("delimiter: commas inside quotes do not count", () => {
  assert.equal(detectDelimiter('"a,b,c";d\n"e,f,g";h\n"i,j,k";l', "csv"), ";");
});

// Header detection
test("header: text row over a numeric body is a header", () => {
  const r = detectHeader(parse("name,price\nfoo,1.5\nbar,2\n", ","));
  assert.equal(r.header, true);
  assert.match(r.reason, /row 1 is text, rows 2\+ are float/);
});
test("header: numeric row 1 like the body is data", () => {
  assert.equal(detectHeader(parse("1,2\n3,4\n5,6", ",")).header, false);
});
test("header: all text — unique labels on, repeated value off", () => {
  assert.equal(detectHeader(parse("first,last\nAnn,Lee\nBob,Ray", ",")).header, true);
  assert.equal(detectHeader(parse("Ann,Lee\nBob,Lee\nCid,Lee", ",")).header, false);
});

// Dtype inference
test("dtype: int", () => {
  assert.equal(inferDtype(["1", "-2", "+30", " 4 "]), "int");
});
test("dtype: float, including mixed ints", () => {
  assert.equal(inferDtype(["1", "2.5", "-3e2", ".5"]), "float");
});
test("dtype: bool and date", () => {
  assert.equal(inferDtype(["true", "False", "TRUE"]), "bool");
  assert.equal(inferDtype(["2024-01-05", "2024/2/9", "2024-03-01T10:00:00Z"]), "date");
});
test("dtype: 95% threshold, empties ignored, 1,000-value cap", () => {
  const n = (k: number, v: string) => Array<string>(k).fill(v);
  assert.equal(inferDtype([...n(96, "1"), ...n(4, "x")]), "int");
  assert.equal(inferDtype([...n(90, "1"), ...n(10, "x")]), "string");
  assert.equal(inferDtype(["1", "", " ", "2"]), "int");
  assert.equal(inferDtype(["", ""]), "string");
  assert.equal(inferDtype([...n(1000, "1"), ...n(2000, "x")]), "int");
});

// Operators
test("ops: string — contains, equals, starts with, is empty, not empty", () => {
  const v = ["Apple", "banana", "", "Pineapple ", "apple"];
  assert.deepEqual(pick(v, "string", "contains", "APP"), ["Apple", "Pineapple ", "apple"]);
  assert.deepEqual(pick(v, "string", "equals", "apple"), ["Apple", "apple"]);
  assert.deepEqual(pick(v, "string", "starts", "pine"), ["Pineapple "]);
  assert.deepEqual(pick(v, "string", "empty"), [""]);
  assert.deepEqual(pick(v, "string", "notempty"), ["Apple", "banana", "Pineapple ", "apple"]);
});
test("ops: number — = ≠ > ≥ < ≤ between (numeric, not text, order)", () => {
  const v = ["1", "2", "3", "10", "", "2.5"];
  assert.deepEqual(pick(v, "float", "eq", "2"), ["2"]);
  assert.deepEqual(pick(v, "float", "ne", "2"), ["1", "3", "10", "2.5"]);
  assert.deepEqual(pick(v, "float", "gt", "2"), ["3", "10", "2.5"]);
  assert.deepEqual(pick(v, "float", "ge", "2"), ["2", "3", "10", "2.5"]);
  assert.deepEqual(pick(v, "float", "lt", "2"), ["1"]);
  assert.deepEqual(pick(v, "float", "le", "2"), ["1", "2"]);
  assert.deepEqual(pick(v, "float", "between", "2", "3"), ["2", "3", "2.5"]);
  assert.deepEqual(pick(v, "float", "between", "3", "2"), ["2", "3", "2.5"]);
});
test("ops: date — before, after, between", () => {
  const v = ["2024-01-05", "2024-02-10", "2024/03/01", "2024-02-10 08:30", ""];
  assert.deepEqual(pick(v, "date", "lt", "2024-02-10"), ["2024-01-05"]);
  assert.deepEqual(pick(v, "date", "gt", "2024-02-10"), ["2024/03/01", "2024-02-10 08:30"]);
  assert.deepEqual(pick(v, "date", "between", "2024-01-01", "2024-02-10"), ["2024-01-05", "2024-02-10"]);
});
test("ops: bool — is true, is false", () => {
  const v = ["true", "FALSE", "True", "", "false"];
  assert.deepEqual(pick(v, "bool", "true"), ["true", "True"]);
  assert.deepEqual(pick(v, "bool", "false"), ["FALSE", "false"]);
});
test("ops: incomplete filter is ignored", () => {
  assert.equal(predicate({ col: 0, op: "gt", a: "", b: "" }, "int"), null);
  assert.equal(predicate({ col: 0, op: "between", a: "1", b: "" }, "int"), null);
  assert.equal(predicate({ col: 0, op: "contains", a: " ", b: "" }, "string"), null);
  const t = toTable(parse("x\n1\n2", ","), true);
  assert.deepEqual(query(t, "", [], [{ col: 0, op: "gt", a: "", b: "" }]), [0, 1]);
});

// Search + filters
test("query: search all vs one column, filters AND-combined", () => {
  const t = toTable(parse("name,city,age\nAnn,Oslo,30\nBob,Lima,41\nCid,Oslo,25\n", ","), true);
  assert.deepEqual(t.names, ["name", "city", "age"]);
  assert.deepEqual(t.dtypes, ["string", "string", "int"]);
  assert.deepEqual(query(t, "O", [1], []), [0, 2]);
  assert.deepEqual(query(t, "o", [], []), [0, 1, 2]);
  const oslo = { col: 1, op: "equals" as const, a: "OSLO", b: "" };
  assert.deepEqual(query(t, "", [], [oslo, { col: 2, op: "gt", a: "26", b: "" }]), [0]);
  assert.deepEqual(query(t, "o", [], [{ col: 2, op: "lt", a: "35", b: "" }]), [0, 2]);
});

// v1.1 — read format
test("format: ' qualifier", () => {
  assert.deepEqual(parse("'a,b',c\n'it''s',d", ",", "'"), [["a,b", "c"], ["it's", "d"]]);
  assert.deepEqual(parse('"x,y",z', ",", "'"), [['"x', 'y"', "z"]]);
  assert.equal(detectDelimiter("'a;b',c\n'd;e',f\n'g;h',i", "", "'"), ",");
});
test("format: no qualifier", () => {
  assert.deepEqual(parse('"a,b",c\n\'d\',e', ",", ""), [['"a', 'b"', "c"], ["'d'", "e"]]);
});
test("format: decimal comma — auto per column, forced, and in filters", () => {
  const t = toTable(parse("id;price;code\n1;1,5;7\n2;2;8\n3;-3,25;9", ";"), true);
  assert.deepEqual(t.dtypes, ["int", "float", "int"]);
  assert.equal(t.reads[1].comma, true);
  assert.deepEqual(query(t, "", [], [{ col: 1, op: "gt", a: "1.4", b: "" }]), [0, 1]);
  assert.equal(inferDtype(["1,5", "2,25"], { ...FORMAT, decimal: "." }), "string");
  assert.equal(inferColumn(["1.5", "2"]).read.comma, false);
  assert.equal(detectHeader(parse("name;price\nfoo;1,5\nbar;2", ";")).header, true);
});
test("format: date order DMY auto, ambiguous → DMY", () => {
  const c = inferColumn(["13/01/2024", "05/02/2024"]);
  assert.deepEqual([c.dtype, c.read.order], ["date", "dmy"]);
  assert.equal(toDate("05/02/2024", "dmy"), Date.UTC(2024, 1, 5));
  assert.equal(inferColumn(["01/02/2024", "03/04/2024"]).read.order, "dmy");
  assert.deepEqual(pick(["13/01/2024", "05/02/2024"], "date", "lt", "2024-02-01", "", c.read), ["13/01/2024"]);
});
test("format: date order MDY auto", () => {
  const c = inferColumn(["12/25/2024", "01/05/2024 08:30"]);
  assert.deepEqual([c.dtype, c.read.order], ["date", "mdy"]);
  assert.equal(toDate("12/25/2024", "mdy"), Date.UTC(2024, 11, 25));
  assert.ok(Number.isNaN(toDate("12/25/2024", "dmy")));
  assert.equal(inferDtype(["12/25/2024"], { ...FORMAT, order: "dmy" }), "string");
});
test("format: . date delimiter", () => {
  assert.equal(inferDtype(["05.01.2024", "31.12.2023 08:30"]), "date");
  assert.equal(toDate("31.12.2023", "dmy"), Date.UTC(2023, 11, 31));
  assert.equal(toDate("2024.01.05"), Date.UTC(2024, 0, 5));
  assert.ok(Number.isNaN(toDate("2024.01-05")));
  assert.equal(inferDtype(["1.5", "2.25"]), "float");
});
test("format: record delimiter detection", () => {
  assert.equal(recordDelimiter("a,b\r\n1,2\r\n"), "CRLF");
  assert.equal(recordDelimiter("a,b\n1,2"), "LF");
  assert.equal(recordDelimiter("a,b\r1,2"), "CR");
  assert.equal(recordDelimiter("a,b"), "none");
});

// v1.1 — search in several columns
const people = () => toTable(parse("name,city,note\nAnn,Oslo,x\nBob,Lima,oslo trip\nCid,Rome,y", ","), true);
test("search: a match in any picked column", () => {
  assert.deepEqual(query(people(), "OSLO", [1, 2], []), [0, 1]);
});
test("search: unpicked columns ignored", () => {
  const t = people();
  assert.deepEqual(query(t, "oslo", [2], []), [1]);
  assert.deepEqual(query(t, "ann", [1, 2], []), []);
  assert.deepEqual(query(t, "ann", [], []), [0]);
});

// Go to line: where a row sits among the search and filter hits
test("lookup: floorIndex finds a row among the hits", () => {
  const hits = [0, 2, 5, 9];
  assert.deepEqual([-1, 0, 1, 2, 5, 8, 9, 12].map((r) => floorIndex(hits, r)), [-1, 0, 0, 1, 2, 2, 3, 3]);
  assert.equal(floorIndex([], 3), -1);
});

// v1.3 — select and copy
const cities = () => toTable(parse("name,city,age\nAnn,Oslo,30\nBob,Lima,41\nCid,Oslo,25", ","), true);
test("copy: TSV quoting", () => {
  assert.equal(toTsv([["a", "b\tc"], ['say "hi"', "x\ny"], ["", "z"]]), 'a\t"b\tc"\n"say ""hi"""\t"x\ny"\n\tz');
});
test("copy: a cell rectangle, with and without field names", () => {
  const t = cities();
  const s: Sel = { ar: 1, ac: 2, fr: 0, fc: 1 };
  assert.deepEqual(cells(t, [0, 1, 2], [0, 1, 2], s), [["Oslo", "30"], ["Lima", "41"]]);
  assert.deepEqual(cells(t, [0, 1, 2], [0, 1, 2], s, true), [["city", "age"], ["Oslo", "30"], ["Lima", "41"]]);
});
test("copy: rows × shown columns", () => {
  assert.deepEqual(cells(cities(), [0, 1, 2], [0, 2], { ar: 0, ac: 0, fr: 1, fc: 1 }), [["Ann", "30"], ["Bob", "41"]]);
});
test("copy: columns × filtered rows", () => {
  const t = cities();
  const oslo = query(t, "", [], [{ col: 1, op: "equals", a: "oslo", b: "" }]);
  assert.deepEqual(oslo, [0, 2]);
  assert.deepEqual(cells(t, oslo, [0, 1, 2], { ar: 0, ac: 1, fr: 1, fc: 1 }), [["Oslo"], ["Oslo"]]);
});
test("select: arrow moves stop at the edges", () => {
  const s: Sel = { ar: 0, ac: 0, fr: 0, fc: 0 };
  assert.deepEqual(step(s, -1, -1, false, 3, 2), s);
  assert.deepEqual(step(s, 1, 1, true, 3, 2), { ar: 0, ac: 0, fr: 1, fc: 1 });
  assert.deepEqual(step({ ar: 0, ac: 0, fr: 2, fc: 1 }, 1, 1, true, 3, 2), { ar: 0, ac: 0, fr: 2, fc: 1 });
  assert.deepEqual(step({ ar: 0, ac: 0, fr: 2, fc: 1 }, 1, 0, false, 3, 2), { ar: 1, ac: 0, fr: 1, fc: 0 });
});

// v1.4 — encoding
const BAD = String.fromCharCode(0xfffd);
// Thai to Windows-874 bytes: U+0E01–U+0E5B are 0xA1–0xFB, and ASCII stays.
const tis = (s: string) =>
  Uint8Array.from([...s].map((ch) => {
    const c = ch.codePointAt(0)!;
    return c >= 0x0e01 && c <= 0x0e5b ? c - 0x0e00 + 0xa0 : c;
  }));
test("encoding: Windows-874 bytes give Thai text", () => {
  const s = "id,เมือง\n1,กรุงเทพ";
  assert.deepEqual(decode(tis(s), "windows-874"), { text: s, bad: 0 });
  assert.ok(decode(tis(s), "utf-8").bad > 0);
  assert.equal(decode(Uint8Array.of(0xff, 0xfe, 0x61, 0x00), "utf-16le").text, "a");
});
test("encoding: bad UTF-8 bytes are counted", () => {
  assert.deepEqual(decode(Uint8Array.of(0x61, 0xff, 0x62, 0xc3), "utf-8"), { text: `a${BAD}b${BAD}`, bad: 2 });
  assert.deepEqual(decode(new TextEncoder().encode("ok,é"), "utf-8"), { text: "ok,é", bad: 0 });
});
