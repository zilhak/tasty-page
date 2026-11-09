// Foundations: color specimens that sit inside the elevation, accent and terminal sections.
import React from "react";
import { Spec, Stage, Meta, Note } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { Swatch, SwatchGrid } from "./swatch.jsx";

const MONO = "var(--tasty-font-mono)";
const SMALL = "var(--tasty-font-size-caption)";
const MICRO = "var(--tasty-font-size-micro)";

const GROUNDS = [
  ["bg-app", "window"], ["bg-sidebar", "sidebar"], ["bg-panel", "panel"],
  ["surface-raised", "raised"], ["surface-hover", "hover"], ["surface-active", "active"],
];

// Six grounds side by side, so the step between neighbours can be judged. The stack above shows them nested.
export function SemanticElevationSpec() {
  return (
    <Spec id="semantic-elevation-and-text" title="Semantic — elevation & text"
      when={<>Semantic roles are what UI code references. Compare the grounds side by side to judge the step between them.</>}>
      <Stage variant="tight" style={{ gap: 0, flexWrap: "wrap" }}>
        {GROUNDS.map(([tok, name]) => (
          <div key={tok} style={{ background: `var(--tasty-${tok})`, flex: "1 1 var(--tasty-size-120)", minWidth: 0, padding: "var(--tasty-space-lg) var(--tasty-space-md)" }}>
            <div style={{ fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{name}</div>
            <div style={{ fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)", overflowWrap: "anywhere" }}>--tasty-{tok}</div>
          </div>
        ))}
      </Stage>
      <Note>Text reads <span className="tok">--tasty-text-primary</span>, <span className="tok">--tasty-text-secondary</span>, <span className="tok">--tasty-text-muted</span>, <span className="tok">--tasty-text-disabled</span> and <span className="tok">--tasty-text-placeholder</span> on these grounds (Color — text).</Note>
    </Spec>
  );
}

function OverlayCell({ wash, name, label }) {
  return (
    <div style={{ flex: "1 1 var(--tasty-size-88)", minWidth: 0 }}>
      <div style={{ background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
        <div style={{ background: wash ? `var(${wash})` : "transparent", height: "var(--tasty-size-56)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: SMALL, color: "var(--tasty-text-secondary)" }}>{name}</div>
      </div>
      <div style={{ marginTop: "var(--tasty-space-xs)", fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)", textAlign: "center", overflowWrap: "anywhere" }}>{label}</div>
    </div>
  );
}

export function OverlayStatesSpec() {
  return (
    <Spec id="states-overlays" title="States — overlays"
      when={<>Hover and active states apply a wash over the ground. They do not create a new surface. The theme's lightness determines the wash: white in Mocha, black in Latte. See the terminal palette below for terminal selection.</>}>
      <Stage variant="solo">
        <ThemePair render={() => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-sm)" }}>
            <OverlayCell name="rest" label="--tasty-surface-raised" />
            <OverlayCell wash="--tasty-overlay-hover" name="hover" label="--tasty-overlay-hover · 8%" />
            <OverlayCell wash="--tasty-overlay-active" name="active" label="--tasty-overlay-active · 12%" />
          </div>
        )} />
      </Stage>
      <Meta tokens={[
        { tok: "--tasty-overlay-hover", use: "white 8% in Mocha, black 8% in Latte" },
        { tok: "--tasty-overlay-active", use: "white 12% in Mocha, black 12% in Latte" },
      ]} />
    </Spec>
  );
}

const ROLES = [
  ["primary", "--tasty-accent-primary", "blue"], ["info", "--tasty-accent-info", "sky"], ["success", "--tasty-accent-success", "green"],
  ["warning", "--tasty-accent-warning", "yellow"], ["attention", "--tasty-accent-attention", "peach"], ["danger", "--tasty-accent-danger", "red"],
  ["agent", "--tasty-accent-agent", "mauve"], ["occupied · soft", "--tasty-accent-occupied-soft", "green"], ["occupied · hard", "--tasty-accent-occupied-hard", "peach"],
];

export function AccentMapSpec() {
  return (
    <Spec id="semantic-accent-roles" title="Semantic — accent roles"
      when={<>Status and agent accent mapping. Each band shows the role's base accent. Text and glyph rows above use its <span className="ic">-raised</span> ink. In Latte, that ink is a mix, not the raw hue.</>}>
      <Stage variant="solo" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(var(--tasty-size-120), 1fr))", gap: "var(--tasty-space-sm)" }}>
        {ROLES.map(([role, tok, hue]) => (
          <div key={tok} style={{ minWidth: 0, background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
            <div style={{ height: "var(--tasty-size-8)", background: `var(${tok})` }} />
            <div style={{ padding: "var(--tasty-space-sm)" }}>
              <div style={{ fontSize: SMALL, fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{role}</div>
              <div style={{ fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}>{hue}</div>
            </div>
          </div>
        ))}
      </Stage>
      <Meta tokens={[
        { tok: "--tasty-accent-occupied-soft", use: "occupied, cooperative: no write restriction", color: "var(--tasty-accent-occupied-soft)" },
        { tok: "--tasty-accent-occupied-hard", use: "occupied surface notices, split from attention", color: "var(--tasty-accent-occupied-hard)" },
      ]} />
    </Spec>
  );
}

const ANSI = [
  ["black", "ansi-black"], ["red", "ansi-red"], ["green", "ansi-green"], ["yellow", "ansi-yellow"],
  ["blue", "ansi-blue"], ["magenta", "ansi-magenta"], ["cyan", "ansi-cyan"], ["white", "ansi-white"],
  ["br.black", "ansi-bright-black"], ["br.red", "ansi-bright-red"], ["br.green", "ansi-bright-green"], ["br.yellow", "ansi-bright-yellow"],
  ["br.blue", "ansi-bright-blue"], ["br.magenta", "ansi-bright-magenta"], ["br.cyan", "ansi-bright-cyan"], ["br.white", "ansi-bright-white"],
];

export function AnsiSixteenSpec() {
  return (
    <Spec id="ansi-16" title="ANSI 16"
      when={<>Normal and bright terminal colors, with each color's value in both themes. The running program chooses the color for each cell.</>}>
      <Stage variant="solo">
        <ThemePair render={(theme) => (
          <SwatchGrid>
            {ANSI.map(([name, tok]) => <Swatch key={tok} token={tok} theme={theme} name={name} />)}
          </SwatchGrid>
        )} />
      </Stage>
      <Meta specs={[["token", "ansi-<color>, ansi-bright-<color>"], ["short name", "br.<color> for bright"]]} />
    </Spec>
  );
}
