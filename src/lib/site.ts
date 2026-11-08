import { SITE } from "./base.mjs";

export const REPO = "https://github.com/zilhak/tasty";
/** The repository that holds this site and the design source. */
export const SITE_REPO = "https://github.com/zilhak/tasty-page";

/** Join a site path to the configured deployment base. */
export const url = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

/** Public address of a site path, for anything read outside the site: crawlers and link previews. */
export const absolute = (path: string) => new URL(url(path), SITE).href;
