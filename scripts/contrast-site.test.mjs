import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { galleryPages, orderFound, recordFound } from "./contrast-site.mjs";

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

// A temporary dist with the given paths. A path ending in / is a folder, anything else a file.
function fakeDist(paths) {
  const dist = mkdtempSync(join(tmpdir(), "contrast-site-"));
  for (const p of paths) {
    if (p.endsWith("/")) mkdirSync(join(dist, p), { recursive: true });
    else {
      mkdirSync(join(dist, p, ".."), { recursive: true });
      writeFileSync(join(dist, p), "");
    }
  }
  return dist;
}
const withDist = (paths, check) => {
  const dist = fakeDist(paths);
  try {
    check(galleryPages(dist));
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
};
const FULL = ["design/gallery/index.html", "design/tokens/index.html"];

test("galleryPages lists foundations first, the built folders by name, then the specimen routes", () => {
  withDist([...FULL, "design/gallery/rules/index.html", "design/gallery/icons/index.html", "design/gallery/buttons/index.html"], (got) => {
    assert.deepEqual(got, {
      pages: [
        { key: "foundations", path: "design/gallery/" },
        { key: "buttons", path: "design/gallery/buttons/" },
        { key: "icons", path: "design/gallery/icons/" },
        { key: "rules", path: "design/gallery/rules/" },
        { key: "tokens", path: "design/tokens/" },
      ],
      missing: [],
    });
  });
});

test("galleryPages leaves out a folder without an index.html file", () => {
  withDist([...FULL, "design/gallery/icons/index.html", "design/gallery/empty/", "design/gallery/other/page.css", "design/gallery/odd/index.html/"], (got) => {
    assert.deepEqual(got.pages.map((p) => p.key), ["foundations", "icons", "tokens"]);
    assert.deepEqual(got.missing, []);
  });
});

test("galleryPages names each required page without an index.html file", () => {
  withDist(["design/gallery/icons/index.html", "design/tokens/"], (got) => {
    assert.deepEqual(got.missing, ["design/gallery/", "design/tokens/"]);
  });
  withDist(["design/gallery/index.html/", "design/gallery/icons/index.html", "design/tokens/index.html"], (got) => {
    assert.deepEqual(got.missing, ["design/gallery/"]);
  });
  withDist(["design/gallery/index.html", "design/gallery/icons/index.html", "design/tokens/index.html/"], (got) => {
    assert.deepEqual(got.missing, ["design/tokens/"]);
  });
});

test("galleryPages returns no pages when design/gallery is not built", () => {
  withDist(["design/tokens/index.html"], (got) => assert.deepEqual(got, { pages: null, missing: [] }));
});
