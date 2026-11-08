// Renders the share images: node vendor/share/render.mjs
//
// Each tasty-share-<lang>.html becomes a 1200x630 PNG beside it. The PNG is committed, so the site needs no browser or font.
// The title must come from the one named font. Any other face means the machine lacks it, and the run stops without writing.
// Browser: CHROMIUM_PATH, else the Playwright browser.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const FONT = "NotoSansCJKkr-Bold";
const WIDTH = 1200;
const HEIGHT = 630;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
const cdp = await page.context().newCDPSession(page);

try {
  for (const lang of ["en", "ko"]) {
    await page.goto(pathToFileURL(join(here, `tasty-share-${lang}.html`)).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    // One call covers a node's own text, not all of its descendants, so ask for each.
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "h1, h1 *" });
    const fonts = (await Promise.all(nodeIds.map((nodeId) => cdp.send("CSS.getPlatformFontsForNode", { nodeId })))).flatMap((r) => r.fonts);
    const wrong = fonts.filter((f) => f.postScriptName !== FONT);
    if (fonts.length === 0 || wrong.length > 0) {
      throw new Error(`${lang}: the title must use only ${FONT}, got ${JSON.stringify(wrong)}`);
    }

    const size = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
    if (size.w !== WIDTH || size.h !== HEIGHT) throw new Error(`${lang}: the page is ${size.w}x${size.h}`);

    const path = join(here, `tasty-share-${lang}.png`);
    await page.screenshot({ path });
    console.log(`${lang}: ${FONT}, ${fonts.length} runs checked`);
  }
} finally {
  await browser.close();
}
