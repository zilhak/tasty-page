// How the canon's tokens apply on Android. Colors and lengths are read from the desktop tokens and never declared here.
import React from "react";
import { Section, Spec, Stage } from "../../gallery/parts/specimen.jsx";
import { ThemePair } from "../../gallery/parts/theme-frame.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable, TokenValue } from "./kit.jsx";

const GROUNDS = ["bg-sidebar", "bg-app", "bg-panel", "surface-raised", "surface-active"];
const INKS = ["text-primary", "text-secondary", "text-muted"];
const ACCENTS = ["accent-primary", "accent-info", "accent-success", "accent-warning", "accent-danger", "accent-agent"];
const COLOR_ROWS = [...GROUNDS, ...INKS, "border-default", "border-focus", ...ACCENTS, "overlay-hover", "overlay-active", "scrim-bg"];

function Grounds() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
      {GROUNDS.map((ground) => (
        <div key={ground} style={{ background: `var(--tasty-${ground})`, border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", padding: "var(--tasty-space-sm) var(--tasty-space-md)" }}>
          <div style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>{ground}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)" }}>
            {INKS.map((ink) => <span key={ink} style={{ color: `var(--tasty-${ink})` }}>{ink.replace("text-", "")}</span>)}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-sm)", marginTop: "var(--tasty-space-xs)" }}>
        {ACCENTS.map((accent) => (
          <span key={accent} title={accent} style={{ width: "var(--tasty-space-xl)", height: "var(--tasty-space-xl)", borderRadius: "var(--tasty-radius)", background: `var(--tasty-${accent})` }} />
        ))}
      </div>
    </div>
  );
}

const UNIT_ROWS = [
  ["Spacing", "space-md", "dp"],
  ["Control and row heights", "control-height", "dp"],
  ["Border width", "border-width", "dp"],
  ["Radius", "radius", "dp"],
  ["Icon size", "icon-size-md", "dp"],
  ["Type size", "font-size-body", "sp"],
  ["Line height", "line-height-ui", "Multiplies the type size, so the result is in sp"],
  ["Weight", "font-weight-medium", "Unchanged"],
  ["Motion", "motion-ui", "Unchanged"],
];

export function TokensSection() {
  return (
    <Section id="tokens" title="Tokens">
      <Spec id="token-color" title="Color" when={COPY.tokenColorWhen}>
        <Stage eager><ThemePair render={() => <Grounds />} /></Stage>
        <SpecTable head={["Token", "Mocha", "Latte"]} mono={[0, 1, 2]}
          rows={COLOR_ROWS.map((name) => [name, <TokenValue name={name} theme="mocha" />, <TokenValue name={name} theme="latte" />])} />
        <Prose k="tokenColorNote" />
      </Spec>
      <Spec id="token-units" title="Units" when={COPY.tokenUnitsWhen}>
        <SpecTable head={["Kind", "Example token", "Token value", "On Android"]} mono={[1, 2]}
          rows={UNIT_ROWS.map(([kind, name, unit]) => [kind, name, <TokenValue name={name} />, unit])} />
        <Prose k="tokenUnitsNote" />
      </Spec>
    </Section>
  );
}
