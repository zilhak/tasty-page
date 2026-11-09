import { fileURLToPath } from "node:url";
import { posix, relative, resolve, sep } from "node:path";

/**
 * Rewrite Markdown links to guide routes.
 * Keep guide links relative so a body means the same under every language path.
 * Compute paths between routes: using/terminal.md becomes using/terminal/,
 * while plugins/index.md becomes plugins/.
 * A link to a Markdown file outside the content tree is recorded in
 * outsideLinks and left unchanged, because the site serves no such page.
 * The build checks the list when it finishes and fails if it is not empty.
 */

/** Messages for links to Markdown files outside the content tree. */
export const outsideLinks = new Set();

const toPosix = (p) => (sep === "/" ? p : p.split(sep).join("/"));

/** Route of a content file, relative to the guide root and without the `en/` tree prefix. */
function routeOf(absFile, contentRoot) {
  let rel = toPosix(relative(contentRoot, absFile)).replace(/\.md$/, "");
  if (rel.startsWith("en/")) rel = rel.slice(3);
  else if (rel === "en") rel = "";
  return rel.replace(/(^|\/)index$/, "$1").replace(/\/$/, "");
}

export function createGuideLinkPlugin(contentRoot) {
  return {
    name: "guide-md-links",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== "string" || !ctx.fileURL) return;
        if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/") || href.startsWith("#")) return;

        const hashAt = href.indexOf("#");
        const path = hashAt === -1 ? href : href.slice(0, hashAt);
        const hash = hashAt === -1 ? "" : href.slice(hashAt);
        if (!path.endsWith(".md")) return;

        const self = fileURLToPath(ctx.fileURL);
        const target = resolve(self, "..", path);

        // The content tree is the only source of pages.
        const inTree = target === contentRoot || target.startsWith(contentRoot + sep);
        if (!inTree) {
          const site = resolve(contentRoot, "..");
          const message =
            `Link "${href}" in ${toPosix(relative(site, self))} points to ${toPosix(relative(site, target))}, ` +
            "a Markdown file outside content/. Link to a guide page or use a full URL.";
          if (!outsideLinks.has(message)) console.warn(`[guide-md-links] ${message}`);
          outsideLinks.add(message);
          return;
        }

        const from = routeOf(self, contentRoot);
        const to = routeOf(target, contentRoot);
        const rel = posix.relative(from, to);
        ctx.setProperty(node, "href", (rel === "" ? "./" : `${rel}/`) + hash);
      },
    },
  };
}
