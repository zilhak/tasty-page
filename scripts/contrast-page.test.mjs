import assert from "node:assert/strict";
import { test } from "node:test";
import { missingCellRows, pageLib } from "./contrast-page.mjs";
import { measureGallery } from "./contrast-gallery.mjs";
import { belowRecord, emptySiteTally, measureRest, mismatchRecord } from "./contrast-site.mjs";

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
  constructor(tag, { style = {}, cls = [], attrs = {}, box = [10, 10], ns } = {}, children = []) {
    this.tagName = tag.toUpperCase();
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
  get textContent() { return ""; }
  get className() { return this.cls.join(" "); }
  get childNodes() { return []; }
}
const el = (tag, opts, children) => new Node_(tag, opts, children);
globalThis.getComputedStyle = (node) => node.style;

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
  // Title bar restore: a rect and a path, the path's stroke off the token.
  const restore = el("svg", { attrs: { "data-part": "restore" } }, [el("rect", stroke("rgb(166, 173, 200)")), el("path", stroke("rgb(255, 255, 255)"))]);
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
  restore.children[1].style.stroke = "rgb(166, 173, 200)";
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
  delete globalThis.window;
  delete globalThis.document;
});
