import assert from "node:assert/strict";
import { test } from "node:test";
import { missingCellRows, pageLib } from "./contrast-page.mjs";
import { measureGallery } from "./contrast-gallery.mjs";
import { FOCUS_FRAMES, FOCUS_PAGES, belowRecord, chromeFailures, emptySiteTally, measureRest, mismatchRecord, printChromeFailures, reportChrome, summarize, walkFocus } from "./contrast-site.mjs";

const { selectParts, validateParts, expectedTheme } = pageLib();
const key = { component: "Title bar", state: "rest", host: "crust" };
const rows = ["title", "button", "window button"].map((part) => ({ ...key, part }));

test("a cell without data-parts selects all matching rows", () => {
  const { parts } = validateParts(null, rows);
  assert.deepEqual(selectParts(rows, parts), rows);
});

test("a part name containing a space selects only that row", () => {
  const { parts } = validateParts('["window button"]', rows);
  assert.deepEqual(selectParts(rows, parts), [rows[2]]);
});

test("an unknown part rejects the entire list including known names", () => {
  assert.deepEqual(validateParts('["title", "typo"]', rows), { error: 'unknown parts ["typo"]' });
});

test("an empty array is invalid", () => {
  assert.deepEqual(validateParts("[]", rows), { error: "expected at least one part name" });
});

test("a non-JSON value is invalid", () => {
  assert.deepEqual(validateParts("window button", rows), { error: "expected a JSON array of part names" });
});

test("a JSON string and an array with a non-string entry are invalid", () => {
  const invalid = { error: "expected a JSON array of part names" };
  assert.deepEqual(validateParts('"title"', rows), invalid);
  assert.deepEqual(validateParts('["title", 1]', rows), invalid);
});

test("a list on a cell with no matching rows is invalid", () => {
  assert.deepEqual(validateParts('["title"]', []), { error: 'unknown parts ["title"]' });
});

function measurementResults(selected, status = "ok") {
  return selected.map(({ component, ...row }) => ({ ...row, contract: component, status }));
}

test("one cell leaves the unselected parts of the same contract key missing", () => {
  const measured = measurementResults(selectParts(rows, ["title"]));
  assert.deepEqual(missingCellRows(rows, measured), ["Title bar|rest|crust|button", "Title bar|rest|crust|window button"]);
});

test("two cells can cover different parts of one contract key", () => {
  const first = selectParts(rows, ["title", "button"]);
  const second = selectParts(rows, ["window button"]);
  const measured = [...measurementResults(first), ...measurementResults(second)];
  assert.deepEqual(missingCellRows(rows, measured), []);
});

test("an unlocated result is not also reported as a missing cell", () => {
  const measured = measurementResults(selectParts(rows, ["window button"]), "unlocated");
  assert.deepEqual(missingCellRows(rows, measured), ["Title bar|rest|crust|title", "Title bar|rest|crust|button"]);
});

function themedElement(theme, parent = null) {
  const ownerDocument = parent?.ownerDocument ?? {};
  const el = {
    ownerDocument,
    closest(selector) {
      assert.equal(selector, "[data-theme]");
      return theme === undefined ? parent?.closest(selector) ?? null : el;
    },
    getAttribute(name) {
      assert.equal(name, "data-theme");
      return theme;
    },
  };
  if (parent === null) ownerDocument.documentElement = el;
  return el;
}

test("a null closest match uses the run theme", () => {
  const root = themedElement(undefined);
  assert.equal(expectedTheme(themedElement(undefined, root), "mocha"), "mocha");
});

test("a closest match on the document root uses the run theme", () => {
  const root = themedElement("latte");
  assert.equal(expectedTheme(themedElement(undefined, root), "mocha"), "mocha");
});

test("a null closest match preserves a Latte run theme", () => {
  const root = themedElement(undefined);
  assert.equal(expectedTheme(themedElement(undefined, root), "latte"), "latte");
});

test("a closest match on a Mocha document root preserves a Latte run theme", () => {
  const root = themedElement("mocha");
  assert.equal(expectedTheme(themedElement(undefined, root), "latte"), "latte");
});

test("a cell can inherit Latte from its nearest themed ancestor", () => {
  const root = themedElement("mocha");
  const frame = themedElement("latte", root);
  assert.equal(expectedTheme(themedElement(undefined, frame), "mocha"), "latte");
});

test("a cell's own theme takes precedence over its ancestors", () => {
  const root = themedElement(undefined);
  const frame = themedElement("mocha", root);
  assert.equal(expectedTheme(themedElement("latte", frame), "mocha"), "latte");
});

test("a scoped theme value other than latte maps to Mocha", () => {
  const root = themedElement("latte");
  const frame = themedElement("other", root);
  assert.equal(expectedTheme(themedElement(undefined, frame), "latte"), "mocha");
});

// A small stand-in for the DOM the row paints are read from. Selectors are comma lists of tag names, .classes and
// [attributes]; a node's computed style is its style object over the defaults below. As in a browser a shape fills
// black unless its style says otherwise, and a shape under a display: none svg has no box.
const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_STYLE = { display: "inline", visibility: "visible", opacity: "1", stroke: "none", strokeWidth: "1px", strokeOpacity: "1", fill: "rgb(0, 0, 0)", fillOpacity: "1", color: "rgb(0, 0, 0)", backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none", content: "none", position: "static" };
class Node_ {
  constructor(tag, { style = {}, cls = [], attrs = {}, box = [10, 10], ns, pseudo = {} } = {}, children = []) {
    this.tagName = tag.toUpperCase();
    // A pseudo element's computed style, by name. One not given reads the node's own style.
    this.pseudoStyle = Object.fromEntries(Object.entries(pseudo).map(([name, st]) => [name, { ...DEFAULT_STYLE, ...st }]));
    this.namespaceURI = ns ?? (["svg", "path", "rect", "line", "circle", "g", "defs", "text", "use", "polyline", "polygon", "ellipse"].includes(tag) ? SVG_NS : "html");
    this.style = { ...DEFAULT_STYLE, ...style };
    this.cls = cls;
    this.attrs = attrs;
    this.box = box;
    this.children = children;
    this.parentElement = null;
    children.forEach((c) => { c.parentElement = this; });
  }
  simple(sel) {
    sel = sel.trim();
    if (sel === "*") return true;
    if (sel.startsWith(".")) return this.cls.includes(sel.slice(1));
    if (sel.startsWith("[")) {
      const [name, value] = sel.slice(1, -1).split("=");
      return name in this.attrs && (value === undefined || this.attrs[name] === value.replace(/"/g, ""));
    }
    return this.tagName.toLowerCase() === sel.toLowerCase();
  }
  matches(sel) { return sel.split(",").some((s) => this.simple(s)); }
  closest(sel) { for (let e = this; e; e = e.parentElement) if (e.matches(sel)) return e; return null; }
  descendants() { return this.children.flatMap((c) => [c, ...c.descendants()]); }
  querySelectorAll(sel) { return this.descendants().filter((e) => e.matches(sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  getBoundingClientRect() { return { width: this.box[0], height: this.box[1], left: 0, top: 0 }; }
  getAttribute(name) { return name in this.attrs ? this.attrs[name] : null; }
  get dataset() { return Object.fromEntries(Object.entries(this.attrs).filter(([k]) => k.startsWith("data-")).map(([k, v]) => [k.slice(5), v])); }
  get ownerDocument() { return globalThis.document; }
  scrollIntoView() {}
  appendChild(c) { c.parentElement = this; this.children.push(c); }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentElement = null; }
  get textContent() { return ""; }
  get className() { return this.cls.join(" "); }
  get childNodes() { return []; }
}
const el = (tag, opts, children) => new Node_(tag, opts, children);
// A color that reads a custom property resolves through the nearest ancestor's vars, as a browser's computed color does.
globalThis.getComputedStyle = (node, pseudo) => {
  const st = (pseudo && node.pseudoStyle[pseudo]) || node.style;
  const m = /^var\((--[\w-]+)\)$/.exec(st.color || "");
  if (!m) return st;
  for (let e = node.parentElement; e; e = e.parentElement) if (e.vars && m[1] in e.vars) return { ...st, color: e.vars[m[1]] };
  return { ...st, color: "" };
};

const lib = pageLib();
const WHITE = [[255, 255, 255, 1]];
const stroke = (color, extra = {}) => ({ style: { stroke: color, fill: "none", ...extra } });

test("judgeInks: a second paint off the token fails the token, the record is that paint", () => {
  const j = lib.judgeInks([[0, 0, 0, 1], [64, 64, 64, 1]], WHITE, [0, 0, 0, 1], 3);
  assert.equal(j.inks, 2);
  assert.equal(j.off, 1);
  assert.equal(j.tokenOk, false);
  assert.equal(j.gradeOk, true);
  assert.deepEqual(j.mismatch, { ratio: 10.37, got: "#404040", ground: "#ffffff" });
});

test("judgeInks: a second paint below the grade inside the token tolerance fails only the grade", () => {
  // #949494 and #959595 are within one step of each other, at 3.03 and 2.995 on white.
  const j = lib.judgeInks([[148, 148, 148, 1], [149, 149, 149, 1]], WHITE, [148, 148, 148, 1], 3);
  assert.equal(j.off, 0);
  assert.equal(j.tokenOk, true);
  assert.equal(j.gradeOk, false);
  // The grade is judged before rounding: 2.995 shows as 3 but is below it.
  assert.deepEqual(j.worst, { ratio: 3, got: "#959595", ground: "#ffffff" });
});

test("judgeInks: every paint on the token and above the grade passes", () => {
  const j = lib.judgeInks([[0, 0, 0, 1], [1, 1, 1, 1]], WHITE, [0, 0, 0, 1], 3);
  assert.equal(j.tokenOk, true);
  assert.equal(j.gradeOk, true);
  assert.equal(j.mismatch, null);
});

test("judgeInks: each paint is compared with the token on its own lowest ground", () => {
  // Half black over grey or white: the lowest ratio is on grey, where the token #404040 matches.
  const j = lib.judgeInks([[0, 0, 0, 0.5]], [[128, 128, 128, 1], [255, 255, 255, 1]], [64, 64, 64, 1], null);
  assert.equal(j.tokenOk, true);
  assert.equal(j.worst.ground, "#808080");
  assert.equal(j.gradeOk, true);
});

test("judgeInks: no token value skips the token, no grade skips the grade, and no paint is reported as none", () => {
  const j = lib.judgeInks([[200, 200, 200, 1]], WHITE, null, null);
  assert.equal(j.tokenOk, null);
  assert.equal(j.off, 0);
  assert.equal(j.gradeOk, true);
  const none = lib.judgeInks([], WHITE, [0, 0, 0, 1], 3);
  assert.deepEqual([none.inks, none.off, none.tokenOk, none.gradeOk, none.worst], [0, 0, true, true, null]);
});

test("rowInks: an element reads every svg inside it, a hidden first svg reads nothing", () => {
  const moon = el("svg", { style: { display: "none" } }, [el("path", { ...stroke("rgb(0, 0, 0)"), box: [0, 0] })]);
  const sun = el("svg", {}, [el("path", stroke("rgb(10, 10, 10)"))]);
  const chevron = el("svg", {}, [el("path", stroke("rgb(20, 20, 20)"))]);
  const button = el("button", {}, [moon, sun, chevron]);
  assert.deepEqual(lib.rowInks(button, () => {}).map((p) => p.ink[0]), [10, 20]);
});

test("rowInks: an svg reads only its own shapes, a shape reads itself, defs are left out", () => {
  const inner = el("svg", {}, [el("path", stroke("rgb(30, 30, 30)"))]);
  const own = el("rect", stroke("rgb(40, 40, 40)"));
  const def = el("defs", {}, [el("path", stroke("rgb(50, 50, 50)"))]);
  const outer = el("svg", {}, [own, inner, def]);
  const wrap = el("span", {}, [outer]);
  assert.deepEqual(lib.rowInks(outer, () => {}).map((p) => p.ink[0]), [40]);
  assert.deepEqual(lib.rowInks(wrap, () => {}).map((p) => p.ink[0]), [40, 30]);
  assert.deepEqual(lib.rowInks(own, () => {}).map((p) => p.ink[0]), [40]);
});

test("rowInks: paint keeps one property and does not count the other as a paint server", () => {
  const shape = el("path", { style: { stroke: "url(#g)", fill: "rgba(0, 0, 0, 0.5)" } });
  const svg = el("svg", {}, [shape]);
  let servers = 0;
  assert.equal(lib.rowInks(svg, () => { servers += 1; }).length, 1);
  assert.equal(servers, 1);
  servers = 0;
  assert.deepEqual(lib.rowInks(svg, () => { servers += 1; }, "fill").map((p) => p.ink[3]), [0.5]);
  assert.equal(servers, 0);
  assert.deepEqual(lib.rowInks(svg, () => { servers += 1; }, "stroke"), []);
  assert.equal(servers, 1);
});

test("rowShown: a line with a box in one direction is shown, a box-less element is not", () => {
  const line = el("line", { ...stroke("rgb(0, 0, 0)"), box: [24, 0] });
  el("svg", {}, [line]);
  assert.equal(lib.rowShown(line), true);
  assert.equal(lib.visible(line), false);
  assert.equal(lib.rowShown(el("span", { box: [24, 0] })), false);
});

test("measureRows: a site glyph row fails on a second svg paint off the token", () => {
  const svg = el("svg", {}, [el("path", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(64, 64, 64)"))]);
  const button = el("button", { cls: ["icon-btn"], style: { backgroundColor: "rgb(255, 255, 255)" } }, [svg]);
  const body = el("body", { style: { backgroundColor: "rgb(255, 255, 255)" } }, [button]);
  globalThis.document = { querySelectorAll: (sel) => body.querySelectorAll(sel), documentElement: body };
  const row = { id: "header-icon", kind: "glyph", selector: ".icon-btn", token: "ink", grade: 3, state: "rest" };
  const [res] = lib.measureRows([row], [row], [], { ink: { mocha: "#000000" } }, "mocha");
  assert.equal(res.measured, 1);
  assert.equal(res.inkHits, 0);
  assert.equal(res.results.length, 1);
  assert.deepEqual([res.results[0].got, res.results[0].inks, res.results[0].off, res.results[0].inkOk, res.results[0].below], ["#404040", 2, 1, false, false]);
  delete globalThis.document;
});

test("judgeInks: each paint takes its own lowest ground, not the first paint's", () => {
  // Black is lowest on #202020, white on #e0e0e0: the white paint off the token is reported on #e0e0e0.
  const j = lib.judgeInks([[0, 0, 0, 1], [255, 255, 255, 1]], [[32, 32, 32, 1], [224, 224, 224, 1]], [0, 0, 0, 1], null);
  assert.equal(j.off, 1);
  assert.deepEqual(j.mismatch, { ratio: 1.32, got: "#ffffff", ground: "#e0e0e0" });
  assert.equal(j.worst.ground, "#202020");
});

test("judgeSvgPart: a gallery svg part fails on a second stroke off the token", () => {
  const svg = el("svg", {}, [el("rect", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(64, 64, 64)"))]);
  const black = [0, 0, 0, 1];
  assert.deepEqual(lib.judgeSvgPart(svg, undefined, [255, 255, 255, 1], black, 3, () => {}),
    { ratio: 10.37, got: "#404040", ground: "#ffffff", status: "mismatch", inks: 2, off: 1 });
  const same = el("svg", {}, [el("rect", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(0, 0, 0)"))]);
  assert.deepEqual(lib.judgeSvgPart(same, undefined, [255, 255, 255, 1], black, 3, () => {}),
    { ratio: 21, got: "#000000", ground: "#ffffff", status: "ok" });
  const below = el("svg", {}, [el("rect", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(224, 224, 224)"))]);
  assert.equal(lib.judgeSvgPart(below, undefined, [255, 255, 255, 1], null, 3, () => {}).status, "below");
  assert.deepEqual(lib.judgeSvgPart(el("span"), undefined, [255, 255, 255, 1], black, 3, () => {}),
    { status: "mismatch", got: "none", ground: "#ffffff", inks: 0, off: 0 });
});

const page = (children) => {
  const body = el("body", { style: { backgroundColor: "rgb(255, 255, 255)" } }, children);
  globalThis.document = { querySelectorAll: (sel) => body.querySelectorAll(sel), documentElement: body };
  return body;
};
const hovered = (node) => { const own = node.matches.bind(node); node.matches = (sel) => sel === ":hover" || own(sel); return node; };

test("measureAimed: a pointer row fails on a second svg paint off the token", () => {
  const svg = el("svg", {}, [el("path", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(64, 64, 64)"))]);
  const button = hovered(el("button", {}, [svg]));
  page([button]);
  globalThis.window = { __aimed: { pointer: button, target: button, pseudo: null } };
  const row = { id: "header-icon-hover", kind: "glyph", selector: ".x:hover", token: "ink", grade: 3, state: "hover" };
  const r = lib.measureAimed(row, { ink: { mocha: "#000000" } }, "mocha");
  assert.deepEqual([r.reached, r.measured, r.got, r.inks, r.off, r.inkOk], [true, true, "#404040", 2, 1, false]);
  delete globalThis.window;
  delete globalThis.document;
});

test("measureAimed: a line with a box in one direction is measured as the target", () => {
  const line = el("line", { ...stroke("rgb(0, 0, 0)"), box: [24, 0] });
  const button = hovered(el("button", {}, [el("svg", {}, [line])]));
  page([button]);
  globalThis.window = { __aimed: { pointer: button, target: line, pseudo: null } };
  const row = { id: "header-icon-hover", kind: "glyph", selector: ".x:hover", token: "ink", grade: 3, state: "hover" };
  const r = lib.measureAimed(row, { ink: { mocha: "#000000" } }, "mocha");
  assert.deepEqual([r.reached, r.measured, r.got, r.inks, r.inkOk], [true, true, "#000000", 1, true]);
  delete globalThis.window;
  delete globalThis.document;
});

test("site records: a token miss on one paint and a grade miss on another report each paint, without low", () => {
  const svg = el("svg", {}, [el("path", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(224, 224, 224)"))]);
  page([el("button", { cls: ["icon-btn"] }, [svg])]);
  const row = { id: "header-icon", kind: "glyph", selector: ".icon-btn", token: "ink", grade: 3, state: "rest" };
  const [res] = lib.measureRows([row], [row], [], { ink: { mocha: "#e0e0e0" } }, "mocha");
  const [r] = res.results;
  assert.deepEqual([r.inkOk, r.below], [false, true]);
  const pick = ({ got, ground, ratio, inks, off, low }) => ({ got, ground, ratio, inks, off, low });
  assert.deepEqual(pick(mismatchRecord(r)), { got: "#000000", ground: "#ffffff", ratio: 21, inks: 2, off: 1, low: undefined });
  assert.deepEqual(pick(belowRecord(r)), { got: "#e0e0e0", ground: "#ffffff", ratio: 1.32, inks: 2, off: 1, low: undefined });
  delete globalThis.document;
});

test("measureGallery: a contract row on an svg part fails on its second stroke off the token", () => {
  // Windows title bar restore: the part is the button, its svg draws a rect and a path, the path's stroke off the token.
  const glyph = el("svg", {}, [el("rect", stroke("rgb(166, 173, 200)")), el("path", stroke("rgb(255, 255, 255)"))]);
  const restore = el("button", { attrs: { "data-part": "restore" } }, [glyph]);
  const cell = el("div", { attrs: { "data-contract": "Title bar", "data-state": "rest", "data-host": "crust" }, style: { backgroundColor: "rgb(17, 17, 27)" } }, [restore]);
  const scope = el("div", { attrs: { "data-gallery-page": "" } }, [cell]);
  const root = el("html", {}, [scope]);
  globalThis.document = {
    documentElement: root,
    querySelectorAll: (sel) => (sel === "[data-gallery-page] [data-contract]" ? [cell] : []),
    querySelector: (sel) => (sel === "[data-gallery-page]" ? scope : null),
    createTreeWalker: () => ({ nextNode: () => null }),
  };
  globalThis.window = { __contrast: lib };
  globalThis.NodeFilter = { SHOW_TEXT: 4 };
  const row = { component: "Title bar", state: "rest", host: "crust", part: "restore", token: "glyph", role: "icon" };
  const args = { rows: [row], tokens: { glyph: { mocha: "#a6adc8" } }, grades: { icon: { grade: 3, kind: "glyph" } }, partMap: {}, exemptIds: [], noGradeTokens: [], theme: "mocha" };
  const [r] = measureGallery(args).rows;
  assert.deepEqual([r.status, r.got, r.ground, r.inks, r.off], ["mismatch", "#ffffff", "#11111b", 2, 1]);
  glyph.children[1].style.stroke = "rgb(166, 173, 200)";
  const [ok] = measureGallery(args).rows;
  assert.deepEqual([ok.status, ok.got, ok.inks], ["ok", "#a6adc8", undefined]);
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.NodeFilter;
});

test("aim: a pointer row takes a line with a box in one direction as its candidate", () => {
  const line = el("line", { ...stroke("rgb(0, 0, 0)"), box: [24, 0] });
  page([el("svg", {}, [line])]);
  globalThis.window = {};
  assert.notEqual(lib.aim("line:hover"), null);
  assert.equal(globalThis.window.__aimed.target, line);
  delete globalThis.window;
  delete globalThis.document;
});

test("measureRest: a row missing the token on one paint and the grade on another records each paint", async () => {
  const svg = el("svg", {}, [el("path", stroke("rgb(0, 0, 0)")), el("path", stroke("rgb(224, 224, 224)"))]);
  page([el("button", { cls: ["icon-btn"] }, [svg])]);
  const noScan = { text: 0, glyph: 0, inputs: 0, svgs: 0, pseudo: 0, paintServer: 0, below: [], picture: [], badExempt: [], exemptUses: {}, gradeNone: {} };
  globalThis.window = { __contrast: { measureRows: lib.measureRows, scan: () => noScan } };
  // The tab runs the page function here, against the stand-in DOM. Settling and installing the library do nothing.
  const tab = { evaluate: async (fn, a) => (a && a.rows ? fn(a) : undefined), addScriptTag: async () => {} };
  const row = { id: "header-icon", kind: "glyph", selector: ".icon-btn", token: "ink", grade: 3, state: "rest" };
  const rules = { rows: [row], family: new Set(), tokens: { ink: { mocha: "#e0e0e0" } }, noGrade: () => [], exemptIds: [], grades: {} };
  const t = emptySiteTally(rules);
  await measureRest(tab, t, rules, "mocha", "guide/", "wide");
  const pick = ({ got, ground, ratio, inks, off, low }) => ({ got, ground, ratio, inks, off, low });
  assert.deepEqual(t.rows["header-icon"].mismatch.map(pick), [{ got: "#000000", ground: "#ffffff", ratio: 21, inks: 2, off: 1, low: undefined }]);
  assert.deepEqual(t.rows["header-icon"].below.map(pick), [{ got: "#e0e0e0", ground: "#ffffff", ratio: 1.32, inks: 2, off: 1, low: undefined }]);
  const lines = [];
  const log = console.log;
  console.log = (line) => lines.push(line);
  try { summarize(t, rules, "mocha", 1, {}); } finally { console.log = log; }
  assert.ok(lines.includes("  below header-icon [wide] guide/ body > button.icon-btn: #e0e0e0 on #ffffff 1.32 < 3 (2 paints, 1 off the token)"), lines.join("\n"));
  assert.ok(lines.includes("  wrong ink header-icon [wide] guide/ body > button.icon-btn: #000000 on #ffffff, wants ink (2 paints, 1 off the token)"), lines.join("\n"));
  delete globalThis.window;
  delete globalThis.document;
});

// Two site rows and records shaped as mergeRow writes them.
const failRules = {
  rows: [
    { id: "header-icon", kind: "glyph", selector: ".icon-btn", token: "ink", grade: 3, state: "rest" },
    { id: "search-edge", kind: "edge", selector: ".search", token: "edge", grade: 3, state: "rest" },
  ],
  family: new Set(), tokens: {}, noGrade: () => [], exemptIds: [], grades: {},
};
const rec = (page, at, got, ratio, extra = {}) => ({ got, ground: "#1e1e2e", ratio, page, viewport: "gallery chrome", at, ...extra });
const captured = (fn) => {
  const lines = [];
  const log = console.log;
  console.log = (line) => lines.push(line);
  try { fn(); } finally { console.log = log; }
  return lines;
};

test("chromeFailures: below and wrong ink records fail with their row, details print five per row and kind", () => {
  const t = emptySiteTally(failRules);
  const icon = t.rows["header-icon"];
  // Six different below records and a repeat of the second, inside the first five lines.
  ["a", "b", "b", "c", "d", "e", "f"].forEach((n) => icon.below.push(rec(`p${n}/`, "button.icon-btn", "#45475a", 1.5)));
  icon.mismatch.push(rec("pa/", "button.icon-btn", "#ffffff", 17.56, { inks: 2, off: 1 }));
  t.rows["search-edge"].below.push(rec("pg/", "div.search", "#303043", 2.64));
  t.rows["search-edge"].found = 3; t.rows["search-edge"].measured = 3; t.rows["search-edge"].inkHits = 3;
  const f = chromeFailures(t, failRules);
  assert.deepEqual([f.records.below.length, f.records.mismatch.length], [8, 1]);
  assert.deepEqual(f.records.mismatch[0], { row: "header-icon", ...icon.mismatch[0] });
  assert.equal(f.records.below[7].row, "search-edge");
  const line = (p) => `  chrome below header-icon [gallery chrome] ${p}/ button.icon-btn: #45475a on #1e1e2e 1.5 < 3`;
  assert.deepEqual(captured(() => printChromeFailures(f)), [
    line("pa"), line("pb"), line("pc"), line("pd"), line("pe"),
    "  chrome below search-edge [gallery chrome] pg/ div.search: #303043 on #1e1e2e 2.64 < 3",
    "  chrome wrong ink header-icon [gallery chrome] pa/ button.icon-btn: #ffffff on #1e1e2e, wants ink (2 paints, 1 off the token)",
  ]);
});

test("reportChrome: the summary, the verdict and the report count every record, repeats included", () => {
  const t = emptySiteTally(failRules);
  t.pages = 16;
  const icon = t.rows["header-icon"];
  ["a", "b", "b", "c", "d", "e", "f"].forEach((n) => icon.below.push(rec(`p${n}/`, "button.icon-btn", "#45475a", 1.5)));
  icon.mismatch.push(rec("pa/", "button.icon-btn", "#ffffff", 17.56));
  t.rows["search-edge"].below.push(rec("pg/", "div.search", "#303043", 2.64));
  let res;
  const lines = captured(() => { res = reportChrome(t, failRules, "mocha"); });
  assert.equal(lines[0], "mocha gallery chrome: pages 16, text 0, shapes 0, below 0, row below 8, row wrong ink 1");
  assert.equal(lines.length, 1 + 6 + 1);
  assert.equal(res.bad, 9);
  const json = JSON.parse(JSON.stringify({ chromeRows: res.chromeRows }));
  assert.deepEqual([json.chromeRows.below.length, json.chromeRows.mismatch.length], [8, 1]);
  // The page scan's own counts still fail on their own.
  const scan = emptySiteTally(failRules);
  scan.picture.push({ at: "div", text: "x" });
  assert.equal(captured(() => { res = reportChrome(scan, failRules, "latte"); }).length, 1);
  assert.equal(res.bad, 1);
});

test("chromeFailures: rows with no records give nothing, whatever their found, measured and ink counts", () => {
  const t = emptySiteTally(failRules);
  assert.deepEqual(chromeFailures(t, failRules), { below: [], mismatch: [], records: { below: [], mismatch: [] } });
  t.rows["header-icon"].found = 2;
  t.rows["search-edge"].found = 4; t.rows["search-edge"].measured = 4; t.rows["search-edge"].inkHits = 0;
  assert.deepEqual(chromeFailures(t, failRules), { below: [], mismatch: [], records: { below: [], mismatch: [] } });
});

test("summarize: below lines of every row come first, then each row's wrong ink lines and its no element line", () => {
  const t = emptySiteTally(failRules);
  for (const id of ["header-icon", "search-edge"]) {
    const r = t.rows[id];
    r.found = 1; r.measured = 1; r.inkHits = 0;
    r.below.push(rec("guide/", id, "#45475a", 1.5));
    r.mismatch.push(rec("guide/", id, "#ffffff", 17.56));
  }
  const lines = captured(() => summarize(t, failRules, "mocha", 1, {})).filter((l) => /^ {2}(below|wrong ink) /.test(l));
  assert.deepEqual(lines, [
    "  below header-icon [gallery chrome] guide/ header-icon: #45475a on #1e1e2e 1.5 < 3",
    "  below search-edge [gallery chrome] guide/ search-edge: #45475a on #1e1e2e 1.5 < 3",
    "  wrong ink header-icon [gallery chrome] guide/ header-icon: #ffffff on #1e1e2e, wants ink",
    "  wrong ink header-icon: no element shows ink",
    "  wrong ink search-edge [gallery chrome] guide/ search-edge: #ffffff on #1e1e2e, wants edge",
    "  wrong ink search-edge: no element shows edge",
  ]);
});

// The focus row reads a frame's outline and an input's border. A frame given in frames must show a focus-visible ring.
const focusRow = { id: "focus", kind: "edge", selector: "a, button, input, .table-wrap", token: "ring", grade: 3, state: "focus" };
const ringTokens = { ring: { mocha: "#000000" } };
const ring = (extra = {}) => ({ style: { outlineColor: "rgb(0, 0, 0)", outlineStyle: "solid", outlineWidth: "2px", ...extra } });
const focusVisible = (node) => { const own = node.matches.bind(node); node.matches = (sel) => sel === ":focus-visible" || own(sel); return node; };
const focusOn = (node) => { page([node]); globalThis.document.activeElement = node; };

test("measureFocus: a frame with its ring shown is measured and names its frame", () => {
  focusOn(focusVisible(el("div", { cls: ["table-wrap"], ...ring() })));
  const r = lib.measureFocus(focusRow, ringTokens, "mocha", [".table-wrap"]);
  assert.deepEqual([r.frame, r.got, r.ground, r.ratio, r.inkOk, r.below], [".table-wrap", "#000000", "#ffffff", 21, true, false]);
  delete globalThis.document;
});

test("measureFocus: a frame whose ring is off or has no paint is a wrong ink record, not a skip", () => {
  const cases = [
    focusVisible(el("div", { cls: ["table-wrap"], ...ring({ outlineStyle: "none" }) })),
    focusVisible(el("div", { cls: ["table-wrap"], ...ring({ outlineWidth: "0px" }) })),
    focusVisible(el("div", { cls: ["table-wrap"], ...ring({ outlineColor: "rgba(0, 0, 0, 0)" }) })),
    el("div", { cls: ["table-wrap"], ...ring() }),
  ];
  for (const node of cases) {
    focusOn(node);
    const r = lib.measureFocus(focusRow, ringTokens, "mocha", [".table-wrap"]);
    assert.deepEqual([r.frame, r.got, r.inkOk, r.below], [".table-wrap", "none", false, false]);
  }
  delete globalThis.document;
});

test("measureFocus: an input keeps its border reading when the page samples frames", () => {
  focusOn(focusVisible(el("input", { style: { outlineStyle: "none", outlineWidth: "0px", borderTopColor: "rgb(0, 0, 0)" } })));
  const r = lib.measureFocus(focusRow, ringTokens, "mocha", [".table-wrap"]);
  assert.deepEqual([r.frame, r.got, r.inkOk], [undefined, "#000000", true]);
  delete globalThis.document;
});

// Tab stops of a page as measureFocus returns them; the fake tab hands out one per press and settles at once.
const tabOf = (stops) => {
  let i = -1;
  return { keyboard: { press: async () => { i += 1; } }, evaluate: async (fn, a) => (a && a.row ? stops[i] ?? null : undefined) };
};
const ok = (frame) => ({ ...(frame ? { frame } : {}), at: frame ?? "a", got: "#000000", ground: "#ffffff", ratio: 21, inkOk: true, below: false });
const off = (frame) => ({ frame, at: `${frame} 1`, got: "none", ground: "none", ratio: 0, inkOk: false, below: false });

test("walkFocus: a frame reached with its ring off fails though the next frame of its kind passes, and an unreached frame is missing", async () => {
  const page = "guide/customize/settings/";
  assert.deepEqual(FOCUS_FRAMES[page], [".anat-settings", ".table-wrap", "pre.astro-code"]);
  const rules = { rows: [focusRow], family: new Set(), tokens: ringTokens };
  const t = emptySiteTally(rules);
  // 14 ordinary stops, then a control the walk skips, both frames of the first two kinds, and no code block.
  const stops = [...Array.from({ length: 14 }, () => ok()), ok(), off(".table-wrap"), ok(".anat-settings"), ok(".table-wrap")];
  await walkFocus(tabOf(stops), t, rules, "mocha", page);
  const rec = t.rows.focus;
  assert.deepEqual([rec.found, rec.measured, rec.inkHits], [17, 17, 16]);
  assert.deepEqual(rec.mismatch.map((m) => [m.frame, m.got, m.page]), [[".table-wrap", "none", page]]);
  assert.deepEqual(t.focusMissing, [{ page, selector: "pre.astro-code", stops: 120 }]);
  const lines = [];
  const log = console.log;
  console.log = (line) => lines.push(line);
  try {
    assert.equal(summarize(t, rules, "mocha", 1, {}), false);
  } finally {
    console.log = log;
  }
  assert.ok(lines.includes("  focus frame not measured on guide/customize/settings/: pre.astro-code within 120 Tab stops"));
});

test("walkFocus: a page with no frames stops after the ordinary stops, and one with every frame measured has nothing missing", async () => {
  const rules = { rows: [focusRow], family: new Set(), tokens: ringTokens };
  const landing = emptySiteTally(rules);
  let presses = 0;
  const counting = tabOf(Array.from({ length: 40 }, () => ok()));
  const press = counting.keyboard.press;
  counting.keyboard.press = async () => { presses += 1; await press(); };
  await walkFocus(counting, landing, rules, "mocha", "");
  assert.deepEqual([presses, landing.rows.focus.measured, landing.focusMissing.length], [14, 14, 0]);
  const look = emptySiteTally(rules);
  const stops = [...Array.from({ length: 14 }, () => ok()), ok(".anat-window"), ok(".table-wrap"), ok()];
  await walkFocus(tabOf(stops), look, rules, "mocha", "guide/getting-started/first-look/");
  assert.deepEqual([look.rows.focus.measured, look.focusMissing.length], [16, 0]);
  // The same tally passes until a missing frame is its only failure.
  look.text = 1;
  const log = console.log;
  console.log = () => {};
  try {
    assert.equal(summarize(look, rules, "mocha", 1, {}), true);
    look.focusMissing.push({ page: "guide/getting-started/first-look/", selector: ".anat-window", stops: 120 });
    assert.equal(summarize(look, rules, "mocha", 1, {}), false);
  } finally {
    console.log = log;
  }
});

test("measureRows: the focus row does not excuse a frame's ink at rest, while another rest row still does", () => {
  const frame = el("div", { cls: ["table-wrap"], style: { borderTopWidth: "1px", borderTopColor: "rgb(128, 128, 128)", outlineColor: "rgb(128, 128, 128)" } });
  page([frame]);
  const edge = { id: "frame-edge", kind: "edge", selector: ".table-wrap", token: "edge", grade: 3, state: "rest" };
  const ringRow = { ...focusRow, token: "grey" };
  const tokens = { edge: { mocha: "#000000" }, grey: { mocha: "#808080" } };
  const [res] = lib.measureRows([edge], [edge, ringRow], [], tokens, "mocha");
  assert.deepEqual(res.results.map((r) => [r.got, r.inkOk, r.otherRow]), [["#808080", false, false]]);
  const restTwin = { id: "frame-edge-alt", kind: "edge", selector: ".table-wrap", token: "grey", grade: 3, state: "rest" };
  const [excused] = lib.measureRows([edge], [edge, ringRow, restTwin], [], tokens, "mocha");
  assert.deepEqual(excused.results.map((r) => r.otherRow), [true]);
  delete globalThis.document;
});

test("measureFocus: past the ordinary stops only a frame is judged", () => {
  focusOn(focusVisible(el("a", ring())));
  assert.equal(lib.measureFocus(focusRow, ringTokens, "mocha", [".table-wrap"], true), null);
  assert.equal(lib.measureFocus(focusRow, ringTokens, "mocha", [".table-wrap"], false).got, "#000000");
  focusOn(focusVisible(el("div", { cls: ["table-wrap"], ...ring() })));
  assert.equal(lib.measureFocus(focusRow, ringTokens, "mocha", [".table-wrap"], true).frame, ".table-wrap");
  delete globalThis.document;
});

test("walkFocus: a frame at the 120th stop is measured, one at the 121st is missing, and the walk stops once every kind is measured", async () => {
  const look = "guide/getting-started/first-look/";
  const rules = { rows: [focusRow], family: new Set(), tokens: ringTokens };
  const run = async (stops) => {
    const t = emptySiteTally(rules);
    const tab = tabOf(stops);
    let presses = 0;
    const press = tab.keyboard.press;
    tab.keyboard.press = async () => { presses += 1; await press(); };
    await walkFocus(tab, t, rules, "mocha", look);
    return { t, presses };
  };
  const stopsWith = (at) => { const s = Array.from({ length: 130 }, () => ok()); s[14] = ok(".anat-window"); s[at] = ok(".table-wrap"); return s; };
  const at120 = await run(stopsWith(119));
  assert.deepEqual([at120.presses, at120.t.focusMissing.length, at120.t.rows.focus.measured], [120, 0, 16]);
  const at121 = await run(stopsWith(120));
  assert.deepEqual([at121.presses, at121.t.focusMissing.map((m) => m.selector), at121.t.rows.focus.measured], [120, [".table-wrap"], 15]);
  const early = await run(stopsWith(20));
  assert.equal(early.presses, 21);
  const report = {};
  const log = console.log;
  console.log = () => {};
  try {
    summarize(at121.t, rules, "mocha", 1, report);
  } finally {
    console.log = log;
  }
  assert.deepEqual(report.site.mocha.focusMissing, [{ page: look, selector: ".table-wrap", stops: 120 }]);
});

test("walkFocus with the page library: past the ordinary stops the walk asks for frames only, and every focus page with frames is visited", async () => {
  for (const page of Object.keys(FOCUS_FRAMES)) assert.ok(FOCUS_PAGES.includes(page), page);
  // Tab moves focus through real stand-in nodes and the tab runs the page function against them.
  const link = () => focusVisible(el("a", ring()));
  const nodes = [...Array.from({ length: 14 }, link), link(), focusVisible(el("div", { cls: ["anat-window"], ...ring() })), focusVisible(el("div", { cls: ["table-wrap"], ...ring() }))];
  page(nodes);
  const calls = [];
  globalThis.window = { __contrast: { measureFocus: (...a) => { calls.push(a[4]); return lib.measureFocus(...a); } } };
  let i = -1;
  const tab = { keyboard: { press: async () => { i += 1; globalThis.document.activeElement = nodes[i]; } }, evaluate: async (fn, a) => (a && a.row ? fn(a) : undefined) };
  const row = { ...focusRow, selector: "a, .table-wrap, .anat-window" };
  const rules = { rows: [row], family: new Set(), tokens: ringTokens };
  const t = emptySiteTally(rules);
  // The 15th stop is an ordinary link: its style must not be read at all, so it is not judged and then dropped.
  const read = new Set();
  const style = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node, pseudo) => { read.add(node); return style(node, pseudo); };
  try {
    await walkFocus(tab, t, rules, "mocha", "guide/getting-started/first-look/");
  } finally {
    globalThis.getComputedStyle = style;
  }
  assert.equal(read.has(nodes[14]), false);
  assert.equal(read.has(nodes[13]), true);
  assert.deepEqual(calls, [...Array(14).fill(false), true, true, true]);
  assert.deepEqual([t.rows.focus.measured, t.rows.focus.inkHits, t.focusMissing.length], [16, 16, 0]);
  delete globalThis.window;
  delete globalThis.document;
});

// One frame whose border and background are grey, read by a row that wants black. Each candidate row below differs from an
// excusing twin (same kind, state and pseudo element, grey token) in one thing only.
const excusedBy = (measured, candidate) => {
  const frame = el("div", { cls: ["table-wrap"], style: { borderTopWidth: "1px", borderTopColor: "rgb(128, 128, 128)", backgroundColor: "rgb(128, 128, 128)" } });
  page([frame]);
  const tokens = { edge: { mocha: "#000000" }, grey: { mocha: "#808080" } };
  const [res] = lib.measureRows([measured], [measured, candidate], [], tokens, "mocha");
  delete globalThis.document;
  assert.equal(res.results.length, 1);
  return res.results[0].otherRow;
};
const frameRow = (over = {}) => ({ id: "frame-edge", kind: "edge", selector: ".table-wrap", token: "edge", grade: null, state: "rest", ...over });
const twin = (over = {}) => ({ id: "frame-twin", kind: "edge", selector: ".table-wrap", token: "grey", grade: null, state: "rest", ...over });

test("measureRows: a row of the same kind, state and pseudo element excuses the ink", () => {
  assert.equal(excusedBy(frameRow(), twin()), true);
});

test("measureRows: a row of another kind does not excuse the ink, though its own paint matches", () => {
  assert.equal(excusedBy(frameRow(), twin({ kind: "mark" })), false);
});

test("measureRows: a selected row excuses a rest row's ink on the selected item, not the other way round", () => {
  assert.equal(excusedBy(frameRow(), twin({ state: "selected" })), true);
  assert.equal(excusedBy(frameRow({ state: "selected" }), twin()), false);
});

test("measureRows: a pointer state row does not excuse a rest row's ink", () => {
  assert.equal(excusedBy(frameRow(), twin({ state: "hover", selector: ".table-wrap:hover" })), false);
});

test("measureRows: no focus row excuses an ink, even for another focus row", () => {
  assert.equal(excusedBy(frameRow({ state: "focus" }), twin({ state: "focus" })), false);
});

test("measureRows: a row naming a pseudo element does not excuse the element's own ink", () => {
  assert.equal(excusedBy(frameRow(), twin({ selector: ".table-wrap::before" })), false);
});

// The frame's own border is black and its ::before and ::after borders grey, so a row reads a different paint on each.
const pseudoFrame = () => {
  const grey = { borderTopWidth: "1px", borderTopColor: "rgb(128, 128, 128)" };
  const frame = el("div", { cls: ["table-wrap"], style: { borderTopWidth: "1px", borderTopColor: "rgb(0, 0, 0)" }, pseudo: { "::before": grey, "::after": grey } });
  page([frame]);
};
const excusedOnBefore = (candidate) => {
  pseudoFrame();
  const measured = frameRow({ selector: ".table-wrap::before" });
  const [res] = lib.measureRows([measured], [measured, candidate], [], { edge: { mocha: "#000000" }, grey: { mocha: "#808080" } }, "mocha");
  delete globalThis.document;
  assert.equal(res.results.length, 1);
  return res.results[0].otherRow;
};

test("measureRows: a row naming the same pseudo element excuses by that pseudo element's paint", () => {
  assert.equal(excusedOnBefore(twin({ selector: ".table-wrap::before" })), true);
});

test("measureRows: the pseudo element and the element must match in the same selector alternative", () => {
  assert.equal(excusedOnBefore(twin({ selector: ".absent::before, .table-wrap::after" })), false);
});

test("records: below and wrong ink records leave out otherRow, which only decides whether a wrong ink is recorded", async () => {
  const noScan = { text: 0, glyph: 0, inputs: 0, svgs: 0, pseudo: 0, paintServer: 0, below: [], picture: [], badExempt: [], exemptUses: {}, gradeNone: {} };
  const result = (at, otherRow) => ({ got: "#45475a", ground: "#1e1e2e", ratio: 1.5, picture: null, inkOk: false, below: true, at, otherRow });
  const measured = [{ id: "header-icon", found: [".icon-btn"], measured: 2, inkHits: 0, results: [result("a", true), result("b", false)] }];
  page([]);
  globalThis.window = { __contrast: { measureRows: () => measured, scan: () => noScan } };
  const tab = { evaluate: async (fn, a) => (a && a.rows ? fn(a) : undefined), addScriptTag: async () => {} };
  const t = emptySiteTally(failRules);
  await measureRest(tab, t, failRules, "mocha", "guide/", "wide");
  delete globalThis.window;
  delete globalThis.document;
  const icon = t.rows["header-icon"];
  // Both below, and only the one no other row excuses as a wrong ink.
  assert.deepEqual([icon.below.map((b) => b.at), icon.mismatch.map((b) => b.at), icon.inkHits], [["a", "b"], ["b"], 0]);
  const fields = { got: "#45475a", ground: "#1e1e2e", ratio: 1.5, picture: null, inkOk: false, below: true, page: "guide/", viewport: "wide" };
  assert.deepEqual([...icon.below, ...icon.mismatch], [{ ...fields, at: "a" }, { ...fields, at: "b" }, { ...fields, at: "b" }]);
  const report = {};
  captured(() => summarize(t, failRules, "mocha", 1, report));
  const site = JSON.parse(JSON.stringify(report.site.mocha.rows["header-icon"]));
  assert.deepEqual([site.below.length, site.mismatch.length], [2, 1]);
  [...site.below, ...site.mismatch].forEach((r) => assert.equal("otherRow" in r, false));
  let res;
  captured(() => { res = reportChrome(t, failRules, "mocha"); });
  const chrome = JSON.parse(JSON.stringify(res.chromeRows));
  assert.deepEqual([chrome.below.length, chrome.mismatch.length, res.bad], [2, 1, 3]);
  [...chrome.below, ...chrome.mismatch].forEach((r) => assert.equal("otherRow" in r, false));
});

// Annotation marks (measureMarks). The token resolves per element through vars, as the specimen.css re-point does on an
// active ground. The mark color is #7f849c (Mocha's default), on #1e1e2e it is 4.73, on #9399b2 it is 1.31.
const MARK = "rgb(127, 132, 156)";
const TOKEN_VAR = "--tasty-specimen-annotation-border";
const marksDoc = () => { globalThis.document = { createElement: (tag) => el(tag) }; };
const markTree = (children, { bg = "rgb(30, 30, 46)", vars = { [TOKEN_VAR]: MARK } } = {}) => {
  const scope = el("div", { style: { backgroundColor: bg } }, children);
  scope.vars = vars;
  return scope;
};
const runMarks = (scope, left = () => false) => {
  marksDoc();
  try {
    return lib.measureMarks(scope, left, () => "spec");
  } finally {
    delete globalThis.document;
  }
};
const dashedOutline = (offset = "0px", color = MARK, extra = {}) => ({ style: { outlineStyle: "dashed", outlineWidth: "1px", outlineColor: color, outlineOffset: offset, ...extra } });

test("measureMarks: a dashed outline in the token color above 3:1 is one mark and no record", () => {
  const r = runMarks(markTree([el("div", dashedOutline())]));
  assert.deepEqual([r.marks, r.judged, r.picture, r.below.length], [1, 1, 0, 0]);
});

test("measureMarks: a mark below 3:1 is an edge record naming what is dashed", () => {
  const r = runMarks(markTree([el("div", dashedOutline())], { bg: "rgb(147, 153, 178)" }));
  assert.equal(r.below.length, 1);
  assert.deepEqual(r.below[0], { kind: "edge", ratio: 1.31, grade: 3, got: "#7f849c", ground: "#9399b2", spec: "spec", text: "annotation outline" });
});

test("measureMarks: the grade is 3 judged before rounding", () => {
  // On white #949494 is 3.03 and #959595 is 2.995, which shows as 3 but is below it.
  const on = (c) => runMarks(markTree([el("div", dashedOutline("0px", c))], { bg: "rgb(255, 255, 255)", vars: { [TOKEN_VAR]: c } }));
  assert.equal(on("rgb(148, 148, 148)").below.length, 0);
  const low = on("rgb(149, 149, 149)");
  assert.deepEqual([low.below.length, low.below[0].ratio], [1, 3]);
});

test("measureMarks: an outline outside stands on the ground below, one inside on the element's own fill", () => {
  // The element fills #9399b2 (1.31 under the mark), the ground below is #1e1e2e (4.73).
  const fill = { backgroundColor: "rgb(147, 153, 178)" };
  const outside = runMarks(markTree([el("div", dashedOutline("0px", MARK, fill))]));
  const inside = runMarks(markTree([el("div", dashedOutline("-1px", MARK, fill))]));
  assert.deepEqual([outside.below.length, inside.below.length], [0, 1]);
  assert.equal(inside.below[0].ground, "#9399b2");
});

test("measureMarks: a dashed border stands on the element's own fill", () => {
  const border = { borderTopStyle: "dashed", borderTopWidth: "1px", borderTopColor: MARK, backgroundColor: "rgb(147, 153, 178)" };
  const r = runMarks(markTree([el("div", { style: border })]));
  assert.deepEqual([r.marks, r.below.length, r.below[0]?.text], [1, 1, "annotation top"]);
  const clear = runMarks(markTree([el("div", { style: { ...border, backgroundColor: "rgba(0, 0, 0, 0)" } })]));
  assert.deepEqual([clear.marks, clear.below.length], [1, 0]);
  // A fill clipped to the padding box does not reach under the border, so the ground below the element is read.
  for (const clip of ["padding-box", "content-box"]) {
    const r2 = runMarks(markTree([el("div", { style: { ...border, backgroundClip: clip } })]));
    assert.deepEqual([r2.marks, r2.below.length], [1, 0], clip);
  }
});

test("measureMarks: a border is judged on the matching side with the lowest ratio", () => {
  // On white #949494 is 3.03 and #959595 2.995; both are within the token's tolerance of #949494.
  const style = { borderTopStyle: "dashed", borderTopWidth: "1px", borderTopColor: "rgb(148, 148, 148)", borderRightStyle: "dashed", borderRightWidth: "1px", borderRightColor: "rgb(149, 149, 149)" };
  const r = runMarks(markTree([el("div", { style })], { bg: "rgb(255, 255, 255)", vars: { [TOKEN_VAR]: "rgb(148, 148, 148)" } }));
  assert.deepEqual([r.marks, r.below.length, r.below[0]?.got, r.below[0]?.text], [1, 1, "#959595", "annotation top,right"]);
});

test("measureMarks: the probe that resolves the token is removed again", () => {
  const mark = el("div", dashedOutline());
  runMarks(markTree([mark]));
  assert.equal(mark.children.length, 0);
});

test("measureMarks: one dashed side or four is one mark", () => {
  const side = (d) => ({ [`border${d}Style`]: "dashed", [`border${d}Width`]: "1px", [`border${d}Color`]: MARK });
  const right = runMarks(markTree([el("div", { style: side("Right") })]));
  const four = runMarks(markTree([el("div", { style: { ...side("Top"), ...side("Right"), ...side("Bottom"), ...side("Left") } })], { bg: "rgb(147, 153, 178)" }));
  assert.equal(right.marks, 1);
  assert.deepEqual([four.marks, four.below.length, four.below[0].text], [1, 1, "annotation top,right,bottom,left"]);
});

test("measureMarks: a solid line, another color, a transparent copy, outline none, a 0px dash or border and a hidden element are not marks", () => {
  const cases = [
    { style: { outlineStyle: "solid", outlineWidth: "1px", outlineColor: MARK, outlineOffset: "0px" } },
    dashedOutline("0px", "rgb(255, 0, 0)"),
    dashedOutline("0px", "rgba(127, 132, 156, 0)"),
    { style: { outlineStyle: "none", outlineWidth: "3px", outlineColor: MARK, outlineOffset: "0px" } },
    { style: { outlineStyle: "dashed", outlineWidth: "0px", outlineColor: MARK, outlineOffset: "0px" } },
    { style: { borderTopStyle: "dashed", borderTopWidth: "0px", borderTopColor: MARK } },
    { style: { borderTopStyle: "solid", borderTopWidth: "1px", borderTopColor: MARK } },
    { style: { ...dashedOutline().style, display: "none" } },
  ];
  for (const c of cases) assert.equal(runMarks(markTree([el("div", c)])).marks, 0, JSON.stringify(c.style));
});

test("measureMarks: what the caller leaves out is not a mark", () => {
  const cell = el("div", { attrs: { "data-contract": "x" } }, [el("div", dashedOutline())]);
  const r = runMarks(markTree([cell]), (e) => e.closest("[data-contract]") !== null);
  assert.equal(r.marks, 0);
});

test("measureMarks: the token resolves on each element, so a re-pointed scope compares its own color", () => {
  // An active ground re-points the token to #585b70. A mark there in the default color is not the token there, and a
  // mark in the re-pointed color is.
  const active = el("div", { style: { backgroundColor: "rgb(166, 173, 200)" } }, [el("div", dashedOutline("0px", "rgb(88, 91, 112)")), el("div", dashedOutline())]);
  active.vars = { [TOKEN_VAR]: "color(srgb 0.345098 0.356863 0.439216)" };
  const r = runMarks(markTree([active]));
  assert.deepEqual([r.marks, r.judged], [1, 1]);
});

test("measureMarks: a gradient of one color is a ground, a gradient of two colors or an image is a picture", () => {
  const solid = el("div", { style: { backgroundImage: "linear-gradient(rgb(147, 153, 178), rgb(147, 153, 178)), none" } }, [el("div", dashedOutline())]);
  const r = runMarks(markTree([solid]));
  assert.deepEqual([r.judged, r.picture, r.below.length, r.below[0]?.ground], [1, 0, 1, "#9399b2"]);
  const blend = el("div", { style: { backgroundImage: "linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))" } }, [el("div", dashedOutline())]);
  const b = runMarks(markTree([blend]));
  assert.deepEqual([b.marks, b.judged, b.picture, b.below.length], [1, 0, 1, 0]);
  const image = el("div", { style: { backgroundImage: "url(x.png)" } }, [el("div", dashedOutline())]);
  const p = runMarks(markTree([image]));
  assert.deepEqual([p.marks, p.judged, p.picture], [1, 0, 1]);
});

test("measureGallery: marks outside the frozen cells and exemptions are counted and judged", () => {
  const free = el("div", dashedOutline());
  const exempt = el("div", { attrs: { "data-audit-exempt": "demo" } }, [el("div", dashedOutline())]);
  const cell = el("div", { attrs: { "data-contract": "x", "data-state": "rest", "data-host": "base" } }, [el("div", dashedOutline())]);
  const scope = el("div", { attrs: { "data-gallery-page": "" }, style: { backgroundColor: "rgb(147, 153, 178)" } }, [free, exempt, cell]);
  scope.vars = { [TOKEN_VAR]: MARK };
  const root = el("html", {}, [scope]);
  globalThis.document = {
    documentElement: root,
    createElement: (tag) => el(tag),
    querySelectorAll: (sel) => (sel === "[data-gallery-page] [data-contract]" ? [] : []),
    querySelector: (sel) => (sel === "[data-gallery-page]" ? scope : null),
    createTreeWalker: () => ({ nextNode: () => null }),
  };
  globalThis.window = { __contrast: lib };
  globalThis.NodeFilter = { SHOW_TEXT: 4 };
  try {
    const m = measureGallery({ rows: [], tokens: {}, grades: {}, partMap: {}, exemptIds: ["demo"], noGradeTokens: [], theme: "mocha" });
    assert.deepEqual([m.marks, m.marksJudged, m.marksPicture], [1, 1, 0]);
    assert.deepEqual(m.below.map((b) => b.text), ["annotation outline"]);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.NodeFilter;
  }
});
