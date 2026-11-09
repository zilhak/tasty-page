import type { Lang } from "./guide";
import { dictionaryFor } from "./i18n/index.mjs";
import { DEFAULT_LANG, langRow } from "./langs.mjs";
import { RELEASES_URL, releaseVersion } from "./release";
import { REPO, absolute } from "./site";

/** Facts about the app, not the page: the languages are those built into the app. */
const softwareApplication = (lang: Lang) => {
  const version = releaseVersion(process.cwd());
  return {
    "@type": "SoftwareApplication",
    name: "Tasty",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    url: absolute(langRow(lang).landing),
    description: dictionaryFor(lang).meta.description,
    downloadUrl: RELEASES_URL,
    // Only the published release: it is the version visitors can download.
    ...(version ? { softwareVersion: version } : {}),
    // USD is only the unit schema.org requires to state a price of zero.
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    sameAs: REPO,
    inLanguage: ["en", "ko", "ja"],
  };
};

const webSite = () => ({ "@type": "WebSite", name: "Tasty", url: absolute("") });

/** JSON-LD for a landing page, safe to place inside a script element. WebSite belongs on the first page only. */
export const landingJsonLd = (lang: Lang) =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@graph": langRow(lang).code === DEFAULT_LANG ? [softwareApplication(lang), webSite()] : [softwareApplication(lang)],
  }).replace(/</g, "\\u003c");
