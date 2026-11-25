import assert from "node:assert/strict";
import { test } from "node:test";
import { orderFound, recordFound } from "./contrast-site.mjs";

const pages = ["", "guide/", "guide/agents/claude-codex/", "guide/agents/cli/"];
const rank = new Map(pages.map((p, i) => [p, i]));
const rankOf = (p) => rank.get(p);

test("recordFound keeps the earliest page whatever order the tabs finish in", () => {
  const key = "table-row-hover\n.table-wrap tbody tr:hover";
  const a = {};
  recordFound(a, [key], "guide/agents/cli/", rankOf);
  recordFound(a, [key], "guide/agents/claude-codex/", rankOf);
  const b = {};
  recordFound(b, [key], "guide/agents/claude-codex/", rankOf);
  recordFound(b, [key], "guide/agents/cli/", rankOf);
  assert.deepEqual(a, b);
  assert.equal(a[key], "guide/agents/claude-codex/");
});

test("recordFound keeps the root page, whose path is empty", () => {
  const key = "lang-hover\n.lang-switch summary:hover";
  const found = {};
  recordFound(found, [key], "", rankOf);
  recordFound(found, [key], "guide/", rankOf);
  assert.equal(found[key], "");
});

test("orderFound lists rows in rule order and each row's alternatives in selector order", () => {
  const rows = [
    { id: "a", selector: ".x:hover, .y:hover" },
    { id: "b", selector: ".z:hover" },
  ];
  const found = { "b\n.z:hover": "guide/", "a\n.y:hover": "", "a\n.x:hover": "guide/", "other\n.q": "" };
  assert.deepEqual(Object.keys(orderFound(found, rows)), ["a\n.x:hover", "a\n.y:hover", "b\n.z:hover", "other\n.q"]);
  assert.deepEqual(orderFound(found, rows), found);
});
