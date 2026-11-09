import React from "react";
import { WorkflowLayout } from "../components/diagrams/WorkflowLayout.jsx";
import { renderToStaticMarkup } from "react-dom/server";
import { WindowAnatomy } from "../components/diagrams/WindowAnatomy.jsx";
import { SettingsAnatomy } from "../components/diagrams/SettingsAnatomy.jsx";
import { dictionaryFor } from "./i18n/index.mjs";

/** Replace marked code blocks with diagrams from the vendor/ kit.
 * The ASCII drawings remain in Markdown for readers on GitHub. */
const DIAGRAMS = {
  "workflow-layout": (copy) => <WorkflowLayout copy={copy} />,
  "background-task": (copy) => <WorkflowLayout copy={copy} background />,
  "window-anatomy": (copy) => <WindowAnatomy labels={copy.windowAnatomy} />,
  "settings-window": () => <SettingsAnatomy />,
};

export const isDiagram = (name) => Object.hasOwn(DIAGRAMS, name);

/** Return static diagram HTML, or null for an unknown name. The Markdown
 * processor runs outside Vite, so Astro config supplies the deployment base. */
export function renderDiagram(name, lang, base = "") {
  const make = DIAGRAMS[name];
  if (!make) return null;
  const html = renderToStaticMarkup(make(dictionaryFor(lang).diagrams));
  const prefix = base.replace(/\/$/, "");
  return prefix ? html.replace(/(\s(?:src|href)=")\//g, `$1${prefix}/`) : html;
}
