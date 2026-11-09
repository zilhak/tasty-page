import { DEFAULT_LANG, LANGS, langRow } from "./langs.mjs";

/** The design zone apart from its home is English in every language. */
export const DESIGN_LANG = "en";
export const DESIGN_MENU_LABEL = "Design";
export const PAGE_NAV_LABELS = { prev: "Previous page", next: "Next page" };

/** One page of the design zone. The groups give the menu, and their order gives previous and next. */
export interface DesignPage {
  /** Names the page in code. A gallery page's key matches its folder in vendor/gallery/. */
  key: string;
  /** Route under `design/`, with its trailing slash. "" is the section root. */
  slug: string;
  label: string;
  /** Whether the page's own content follows the page's language. Otherwise it is DESIGN_LANG. */
  translated: boolean;
  /** Which language paths search engines should index. Only a translated page has language versions to announce. */
  indexed: "every-language" | "default-language" | "none";
  /** Follows the page title in the document title. */
  titleSuffix: string;
}

const galleryPage = (key: string, slug: string, label: string): DesignPage => ({
  key,
  slug: `gallery/${slug}`,
  label,
  translated: false,
  indexed: "none",
  titleSuffix: "Tasty Gallery",
});

export const DESIGN_GROUPS: { group: string; pages: DesignPage[] }[] = [
  {
    group: "Guidelines",
    pages: [
      { key: "overview", slug: "", label: "Design overview", translated: true, indexed: "every-language", titleSuffix: "Tasty Design System" },
      { key: "tokens", slug: "tokens/", label: "Design tokens", translated: false, indexed: "default-language", titleSuffix: "Tasty Design System" },
    ],
  },
  {
    group: "Foundations",
    pages: [
      galleryPage("foundations", "", "Foundations"),
      galleryPage("icons", "icons/", "Icons"),
      galleryPage("rules", "rules/", "Rules"),
      galleryPage("rules-map", "rules-map/", "Location map"),
    ],
  },
  {
    group: "Components",
    pages: [galleryPage("components", "components/", "Components")],
  },
  {
    group: "Overlays",
    pages: [
      galleryPage("overlays-dialogs", "overlays-dialogs/", "Dialogs"),
      galleryPage("overlays-windows", "overlays-windows/", "Windows"),
      galleryPage("overlays-popups", "overlays-popups/", "Popups and menus"),
      galleryPage("overlays-banners", "overlays-banners/", "Banners"),
      galleryPage("overlays-tutorial", "overlays-tutorial/", "Tutorial"),
    ],
  },
  {
    group: "Shell",
    pages: [
      galleryPage("layouts", "layouts/", "Layouts"),
      galleryPage("loading", "loading/", "Startup"),
    ],
  },
  {
    group: "Surfaces",
    pages: [
      galleryPage("dag", "dag/", "Task DAG"),
      galleryPage("plugins", "plugins/", "Plugin surfaces"),
      galleryPage("explorer-ops", "explorer-ops/", "Explorer file ops"),
    ],
  },
];

export const DESIGN_PAGES: DesignPage[] = DESIGN_GROUPS.flatMap((g) => g.pages);

/** The page of a key. An unknown key is an error. */
export const designPage = (key: string): DesignPage => {
  const page = DESIGN_PAGES.find((candidate) => candidate.key === key);
  if (!page) throw new Error(`Unknown design page: ${key}`);
  return page;
};

/** Whether search engines should index a design page on one language path. */
export const isIndexed = (page: DesignPage, code: string) =>
  page.indexed === "every-language" || (page.indexed === "default-language" && code === DEFAULT_LANG);

/** Route of a design page in one language. */
export const designPath = (slug: string, lang: string) => `${langRow(lang).prefix}design/${slug}`;

/** Route of a gallery page in one language. */
export const galleryPath = (slug: string, lang: string) => designPath(`gallery/${slug}`, lang);

/** One static path per language for a route under `[...locale]`. The language without a prefix has no locale segment. */
export const localePaths = () =>
  LANGS.map((row) => ({
    params: { locale: row.prefix.replace(/\/$/, "") || undefined },
    props: { lang: row.code },
  }));

/** Introductory copy for the site; specimen content comes from the design kit. */
export const GALLERY_INTROS: Record<string, string> = {
  "foundations": "See how Tasty's colours, spacing, and typography work in context. Each example shows where a token is used and what it controls.",
  "icons": "Find an icon by its name or purpose. Hover over a tile to learn its role, and use the shared Icon component to keep icons consistent across the app.",
  "rules": "See which colours text and icons use on each ground. Work through the nine groups to compare role tokens and contrast in the current theme.",
  "rules-map": "See which ground belongs at each location and which grounds it can contain. Compare Mocha and Latte side by side to see the same structure in both themes.",
  "components": "Explore reusable components, from buttons and fields to lists and scrollbars. Try the demos, compare the fixed states, then check the usage notes, dimensions, and tokens.",
  "overlays-dialogs": "Explore dialogs for confirming an action or editing a value. Check their messages, actions, and dismissal, then compare the scrim and frame over different grounds.",
  "overlays-windows": "Browse the larger windows used for settings, launchers, and data tables. Compare their navigation, dimensions, and tab views to choose a layout for your content.",
  "overlays-popups": "Explore menus, search bars, switch overlays, and modifier hints. Check their placement and dismissal, and compare opaque overlays above a web page.",
  "overlays-banners": "See how banners bring messages and actions into the work area. Compare their scopes and queues, and try mouse actions that leave keyboard focus with your work.",
  "overlays-tutorial": "Explore tutorial markers, callouts, and the topic list. See how these elements work together to guide someone through the parts of the app.",
  "layouts": "Explore how sidebars, tabs, split regions, status bars, and title bars form the app shell. Compare states and views, then check dimensions and tokens in the always-visible Specs.",
  "loading": "Explore startup screens through to readiness, first-run shell setup, shutdown, and boot errors. Compare the guidance and progress indicators at each stage.",
  "dag": "Inspect a task graph in a tab or workspace popup. Compare execution states, edges, lists, and detail views. Create and edit tasks through the CLI.",
  "plugins": "Explore the Explorer and the Markdown, HTML, and image viewers. These tools sit alongside terminals in the work area, so you can read files and check results without leaving your workspace.",
  "explorer-ops": "See how the Explorer creates, moves, and inspects files. Compare examples of search, remote writes, deletion, progress, name conflicts, properties, and operation results.",
};
