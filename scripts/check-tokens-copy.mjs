// Check that vendor/tokens.css only repeats tier 1 values from vendor/tokens/primitives.css.
//
// The token tools read the primitive tier from primitives.css alone, so nothing else
// would notice tokens.css drifting away from it. Every --tasty-* declaration in
// tokens.css must exist in primitives.css with the same name and value, in the same
// theme: the Latte block against the Latte block, everything else against the base.
// Values are compared after collapsing whitespace.
//
// Exits 1 and lists every difference.

import { readFileSync } from "node:fs";

const COPY = "vendor/tokens.css";
const SOURCE = "vendor/tokens/primitives.css";

/** Lower bound on parsed declarations, so that two empty parses cannot pass. */
const PARSE_FLOOR = 100;

// Same tokenizer as scripts/design-tokens/gen_tokens_json.py: comments, block openers,
// block closers and custom property declarations.
const DECL = /\/\*[\s\S]*?\*\/|([^{}/;]*?)\{|\}|(--[\w-]+)\s*:\s*((?:[^;/]|\/(?!\*))*?);/g;

/** -> Map("base" | "latte" -> Map(name -> value)) of --tasty-* declarations. */
function parse(path, problems) {
  const out = new Map([["base", new Map()], ["latte", new Map()]]);
  let scope = null;
  for (const m of readFileSync(path, "utf8").matchAll(DECL)) {
    if (m[2]) {
      if (!m[2].startsWith("--tasty-")) continue;
      const theme = scope !== null && scope.includes('data-theme="latte"') ? "latte" : "base";
      const value = m[3].replace(/\s+/g, " ").trim();
      const decls = out.get(theme);
      if (decls.has(m[2])) problems.push(`${path}: ${m[2]} is declared twice in the ${theme} theme`);
      decls.set(m[2], value);
    } else if (m[1] !== undefined) {
      scope = m[1].trim();
    } else if (m[0] === "}") {
      scope = null;
    }
  }
  return out;
}

const problems = [];
const copy = parse(COPY, problems);
const source = parse(SOURCE, problems);

let total = 0;
for (const [theme, decls] of copy) {
  const want = source.get(theme);
  total += decls.size;
  for (const [name, value] of decls) {
    if (!want.has(name)) problems.push(`${name} (${theme}) is in ${COPY} but not in ${SOURCE}`);
    else if (want.get(name) !== value) problems.push(`${name} (${theme}): ${COPY} has "${value}", ${SOURCE} has "${want.get(name)}"`);
  }
}
if (total < PARSE_FLOOR) problems.push(`read only ${total} --tasty-* declarations from ${COPY} (floor ${PARSE_FLOOR})`);

if (problems.length) {
  console.error(`${COPY} does not repeat ${SOURCE} (${problems.length} problem(s)):\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
const count = (t) => copy.get(t).size;
console.log(`${COPY}: ${count("base")} base and ${count("latte")} Latte declarations match ${SOURCE}`);
