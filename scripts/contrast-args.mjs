// Command line options of check-contrast.mjs. Kept apart from it because importing that file starts a run.

export const USAGE = "Usage: npm run check-contrast -- [--json <file>] [--site-only | --gallery-only] [--page <key>] (--page goes with --gallery-only, not with --site-only)";

const VALUE = new Set(["--json", "--page"]);
const FLAG = new Set(["--site-only", "--gallery-only"]);

// Reads argv (process.argv without node and the script) into { json, page, siteOnly, galleryOnly }. --page implies
// galleryOnly. Throws an Error naming the option on an unknown or positional argument, an option given twice, a value that
// is missing, empty or another option, and --site-only with --gallery-only or --page. A file name that starts with -- goes
// as ./--name. Whether the page key exists is checked against the build, in check-contrast.mjs.
export function parseArgs(argv) {
  const seen = new Set();
  const opts = { json: null, page: null, siteOnly: false, galleryOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!VALUE.has(arg) && !FLAG.has(arg)) throw new Error(`Unknown argument: ${JSON.stringify(arg)}.`);
    if (seen.has(arg)) throw new Error(`${arg} is given more than once.`);
    seen.add(arg);
    if (FLAG.has(arg)) {
      if (arg === "--site-only") opts.siteOnly = true;
      else opts.galleryOnly = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value === "" || value.startsWith("--")) throw new Error(`${arg} needs a value.`);
    i += 1;
    if (arg === "--json") opts.json = value;
    else opts.page = value;
  }
  if (opts.siteOnly && opts.galleryOnly) throw new Error("--site-only and --gallery-only cannot go together.");
  if (opts.siteOnly && opts.page !== null) throw new Error("--site-only and --page cannot go together.");
  if (opts.page !== null) opts.galleryOnly = true;
  return opts;
}
