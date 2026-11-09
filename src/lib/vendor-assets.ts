/** Static files the site derives from vendor/ at build time. Nothing here is written into the source tree. */
const SOURCES = import.meta.glob("../../vendor/{components,ui_kits/terminal}/**/*.jsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const CSS_LITERAL = /^const (?:[A-Z][A-Z_]*_CSS|CSS)\s*=\s*`([^`]*)`;/gm;

/** The component rules, for pages rendered without client JavaScript. Hydrated pages also inject them at runtime. */
export const kitCss = () =>
  Object.keys(SOURCES)
    .sort()
    .flatMap((file) => [...SOURCES[file].matchAll(CSS_LITERAL)].map((m) => m[1].trim()))
    .join("\n\n");
