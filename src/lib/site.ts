export const REPO = "https://github.com/zilhak/tasty";
/** The repository that holds this site and the design source. */
export const SITE_REPO = "https://github.com/zilhak/tasty-page";

/** Join a site path to the configured deployment base. */
export const url = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
