import assert from "node:assert/strict";
import { test } from "node:test";
import { USAGE, parseArgs } from "./contrast-args.mjs";

const none = { json: null, page: null, siteOnly: false, galleryOnly: false };

test("parseArgs reads each option and leaves the rest at their defaults", () => {
  assert.deepEqual(parseArgs([]), none);
  assert.deepEqual(parseArgs(["--json", "out.json"]), { ...none, json: "out.json" });
  assert.deepEqual(parseArgs(["--site-only"]), { ...none, siteOnly: true });
  assert.deepEqual(parseArgs(["--gallery-only"]), { ...none, galleryOnly: true });
  assert.deepEqual(parseArgs(["--page", "icons"]), { ...none, page: "icons", galleryOnly: true });
});

test("parseArgs takes the allowed combinations in any order and passes a path as given", () => {
  const both = { ...none, json: "out.json", page: "icons", galleryOnly: true };
  assert.deepEqual(parseArgs(["--json", "out.json", "--page", "icons"]), both);
  assert.deepEqual(parseArgs(["--page", "icons", "--json", "out.json"]), both);
  assert.deepEqual(parseArgs(["--gallery-only", "--page", "tokens"]), { ...none, page: "tokens", galleryOnly: true });
  assert.deepEqual(parseArgs(["--page", "tokens", "--gallery-only"]), { ...none, page: "tokens", galleryOnly: true });
  assert.deepEqual(parseArgs(["--site-only", "--json", "r.json"]), { ...none, json: "r.json", siteOnly: true });
  assert.deepEqual(parseArgs(["--json", "./--r.json"]), { ...none, json: "./--r.json" });
  assert.deepEqual(parseArgs(["--json", "a dir/-r.json"]), { ...none, json: "a dir/-r.json" });
});

const refuses = (argv, pattern) => assert.throws(() => parseArgs(argv), pattern, JSON.stringify(argv));

test("parseArgs refuses an unknown or positional argument, and the npm separator passed twice", () => {
  refuses(["--gallery_only"], /Unknown argument: "--gallery_only"/);
  refuses(["icons"], /Unknown argument: "icons"/);
  refuses(["--page", "icons", "tokens"], /Unknown argument: "tokens"/);
  refuses(["--", "--site-only"], /Unknown argument: "--"/);
});

test("parseArgs refuses a value option with no value, an empty value or another option as its value", () => {
  refuses(["--page"], /^Error: --page needs a value/);
  refuses(["--json"], /^Error: --json needs a value/);
  refuses(["--page", "--json", "out.json"], /^Error: --page needs a value/);
  refuses(["--json", "--page", "icons"], /^Error: --json needs a value/);
  refuses(["--page", ""], /^Error: --page needs a value/);
  refuses(["--json", ""], /^Error: --json needs a value/);
  refuses(["--json", "--report.json"], /^Error: --json needs a value/);
});

test("parseArgs refuses an option given twice", () => {
  refuses(["--page", "icons", "--page", "tokens"], /--page is given more than once/);
  refuses(["--json", "a.json", "--json", "b.json"], /--json is given more than once/);
  refuses(["--site-only", "--site-only"], /--site-only is given more than once/);
  refuses(["--gallery-only", "--gallery-only"], /--gallery-only is given more than once/);
});

test("parseArgs refuses --site-only with --gallery-only or --page, in either order", () => {
  refuses(["--site-only", "--gallery-only"], /--site-only and --gallery-only/);
  refuses(["--gallery-only", "--site-only"], /--site-only and --gallery-only/);
  refuses(["--site-only", "--page", "icons"], /--site-only and --page/);
  refuses(["--page", "icons", "--site-only"], /--site-only and --page/);
});

test("the usage line passes the npm separator once and shows which options go together", () => {
  assert.equal(USAGE.match(/ -- /g).length, 1);
  assert.match(USAGE, /--page goes with --gallery-only, not with --site-only/);
});
