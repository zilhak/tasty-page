/**
 * The shape of the landing-page copy. The values live in the language dictionaries.
 *
 * Describe the terminal first, then extension and agent integration, in concrete terms.
 */
import { dictionaryFor } from "./i18n/index.mjs";

export interface Card {
  /** A name from the design system's icon registry. */
  icon: string;
  title: string;
  body: string;
  /** Guide page this card leads to, relative to the guide root. */
  href: string;
}
export interface GuideLink {
  label: string;
  /** Guide page, relative to the guide root. */
  href: string;
}
export interface Copy {
  badge: string;
  tagline: string;
  titleLead: string;
  titleAccent: string;
  titleTail: string;
  body: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaOther: string;
  /** Primary button label once the visitor's OS is known; `{os}` is replaced. */
  dlFor: string;
  installNote: string;
  shellCaption: string;

  layoutTitle: string;
  layoutBody: string;
  layoutCaption: string;
  layoutLink: GuideLink;

  featuresTitle: string;
  featuresBody: string;
  cards: Card[];
  moreLinks: GuideLink[];

  agentsTitle: string;
  /** Rendered as HTML, so it may hold inline `<code>`. */
  agentsBody: string;
  agentsIntegration: string;
  agentsNote: string;
  agentsLinks: GuideLink[];
  agentsCaption: string;

  platformTitle: string;
  platformBody: string;

  ctaTitle: string;
  ctaBody: string;
  ctaDownload: string;
  ctaInstall: string;

  /** Strings rendered inside the app mockup itself. */
  shellHeading: string;
  shellTask: string;
  /** The document beside the terminal in the app mockup's split tab. */
  shellDoc: { splitTitle: string; splitBody: string; togetherTitle: string; togetherBody: string };
}

/** The landing copy of a language code. An unknown code is an error, not a fallback. */
export const copyFor = (lang: string): Copy => dictionaryFor(lang).landing;
