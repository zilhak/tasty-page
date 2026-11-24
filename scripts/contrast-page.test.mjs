import assert from "node:assert/strict";
import { test } from "node:test";
import { missingCellRows, pageLib } from "./contrast-page.mjs";

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
