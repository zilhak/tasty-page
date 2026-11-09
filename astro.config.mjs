// @ts-check
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { satteri } from "@astrojs/markdown-satteri";
import { createGuideLinkPlugin, outsideLinks } from "./src/lib/satteri-guide-links.mjs";
import { createDiagramPlugin } from "./src/lib/satteri-diagrams.mjs";
import { createTableWrapPlugin } from "./src/lib/satteri-table-wrap.mjs";
import { BASE, SITE } from "./src/lib/base.mjs";
import { rowOfContentPath } from "./src/lib/langs.mjs";

const CONTENT_ROOT = fileURLToPath(new URL("content", import.meta.url));

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [
    // React 18's Node stream renderer flushes its whole 2048-byte buffer when the
    // next multibyte character does not fit, leaving NUL bytes in the HTML.
    react({ experimentalDisableStreaming: true }),
    {
      // Guide links to Markdown files outside content/ are only warnings while
      // rendering. Fail the build once every page has rendered.
      name: "tasty-guide-outside-links",
      hooks: {
        "astro:build:done": () => {
          if (outsideLinks.size === 0) return;
          throw new Error(
            `${outsideLinks.size} guide link(s) point outside content/:\n` +
              [...outsideLinks].map((m) => `  - ${m}`).join("\n"),
          );
        },
      },
    },
  ],
  vite: {
    plugins: [{
      name: "tasty-isolate-dependency-cache",
      config(_config, { command, mode }) {
        // A build may run while the preview dev server is still open.
        // React's development JSX runtime must not reuse production prebundles.
        return { cacheDir: fileURLToPath(new URL(`./node_modules/.vite-tasty/${command}-${mode}/`, import.meta.url)) };
      },
    }],
  },
  markdown: {
    processor: satteri({
      hastPlugins: [
        createGuideLinkPlugin(CONTENT_ROOT),
        createTableWrapPlugin(),
        // A diagram's labels are in the language of the tree its file sits in.
        createDiagramPlugin((url) => rowOfContentPath(url ? relative(CONTENT_ROOT, fileURLToPath(url)) : "").code, BASE),
      ],
    }),
  },
  outDir: "./dist",
  build: { format: "directory" },
  devToolbar: { enabled: false },
});
