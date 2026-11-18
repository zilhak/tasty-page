// Foundations: the type specimens. The large samples are specimens above the 14px UI cap, and they say so.
import React from "react";
import { Icon } from "../../components/index.js";
import { Spec, Stage, Meta, Note } from "../parts/specimen.jsx";

const MONO = "var(--tasty-font-mono)";

function C({ ink, children }) {
  return <span style={{ color: `var(--tasty-${ink})` }}>{children}</span>;
}

export function MonospaceSpec() {
  return (
    <Spec id="monospace-d2coding" title="Monospace — D2Coding"
      when={<>The brand typeface for terminal content, code and metadata, shown on the terminal ground where it is used. Terminal cells are outside the 14px UI cap.</>}>
      <Stage variant="solo column" style={{ gap: "var(--tasty-space-sm)", background: "var(--tasty-surface-terminal-focused-bg)", color: "var(--tasty-surface-terminal-focused-fg)", fontFamily: MONO }}>
        <div style={{ fontSize: "var(--tasty-font-size-brand-display)", fontWeight: "var(--tasty-font-weight-bold)" }}>D2Coding ligature</div>
        <div style={{ fontSize: "var(--tasty-font-size-term)", color: "var(--tasty-text-muted)" }}>ABCDEFG abcdefg 0123456789 &amp;@#$%&lt;&gt;=*  가나다 ライ</div>
        <pre style={{ margin: "var(--tasty-space-sm) 0 0", font: "inherit", fontSize: "var(--tasty-font-size-term)", lineHeight: "var(--tasty-line-height-140)" }}>
          <C ink="text-muted">{"// ligatures: "}<C ink="accent-info-raised">{"->  =>  !=  >=  ==  ::  |>"}</C></C>{"\n"}
          <C ink="accent-agent-raised">pub fn</C> <C ink="accent-primary-raised">surface</C>(<C ink="accent-attention-raised">id</C>: &amp;str) <C ink="accent-info-raised">{"->"}</C> &amp;SurfaceTheme {"{"}{"\n"}
          {"    "}<C ink="accent-agent-raised">self</C>.themes.get(id).unwrap_or(<C ink="accent-success-raised">"fallback"</C>){"\n"}
          {"}"}
        </pre>
      </Stage>
      <Meta
        specs={[["family", <span className="tok">--tasty-font-mono</span>], ["name sample", <span className="tok">--tasty-font-size-brand-display</span>], ["code and glyphs", <span className="tok">--tasty-font-size-term</span>], ["ligatures", "-> => != >= == :: |>"]]}
        tokens={[
          { tok: "--tasty-accent-agent-raised", use: "keyword", color: "var(--tasty-accent-agent-raised)" },
          { tok: "--tasty-accent-primary-raised", use: "function", color: "var(--tasty-accent-primary-raised)" },
          { tok: "--tasty-accent-success-raised", use: "string", color: "var(--tasty-accent-success-raised)" },
          { tok: "--tasty-accent-attention-raised", use: "number, parameter", color: "var(--tasty-accent-attention-raised)" },
          { tok: "--tasty-accent-info-raised", use: "ligature", color: "var(--tasty-accent-info-raised)" },
          { tok: "--tasty-text-muted", use: "comment, glyph row", color: "var(--tasty-text-muted)" },
        ]} />
      <Note>Gallery pages load D2Coding font files from this site and render the specimen’s name line and ligature row in D2Coding, the first family in <span className="tok">--tasty-font-mono</span>. Until the font file arrives, another available family in the stack renders the name line and ligature row, showing how that family draws the character pairs.</Note>
    </Spec>
  );
}

const SANS = [
  ["--tasty-font-size-max", "14 / 600", "max", "var(--tasty-font-weight-semibold)", "Appearance settings"],
  ["--tasty-font-size-heading", "13 / 600", "heading", "var(--tasty-font-weight-semibold)", "Restore layout on startup"],
  ["--tasty-font-size-body", "13 / 400", "body", "var(--tasty-font-weight-normal)", "Switch to this workspace when the agent attaches."],
  ["--tasty-font-size-caption", "11 / 400", "caption", "var(--tasty-font-weight-normal)", "Language change takes effect after restart."],
];

export function UiSansSpec() {
  return (
    <Spec id="ui-sans-chrome" title="UI sans — chrome"
      when={<>Native system sans for app chrome, capped at 14px. Compare the scale across four lines.</>}>
      <Stage variant="solo column" style={{ gap: "var(--tasty-space-md)" }}>
        {SANS.map(([tok, size, name, weight, sample]) => (
          <div key={tok} style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--tasty-space-xs) var(--tasty-space-lg)" }}>
            <span style={{ flex: "0 0 var(--tasty-size-140)", fontFamily: MONO, fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>--{name} · {size}</span>
            <span style={{ fontSize: `var(${tok})`, fontWeight: weight, color: "var(--tasty-text-primary)" }}>{sample}</span>
          </div>
        ))}
      </Stage>
      <Meta tokens={[
        { tok: "--tasty-font-ui", use: "native system sans" },
        { tok: "--tasty-font-size-max", use: "14px, the hard ceiling for UI chrome" },
        { tok: "--tasty-font-size-heading", use: "13px, weight 600" },
        { tok: "--tasty-font-size-body", use: "13px, weight 400" },
        { tok: "--tasty-font-size-caption", use: "11px, weight 400" },
      ]} />
    </Spec>
  );
}

// The heading and one settings section from the app's language files.
const LABEL_FAMILY = [
  ["en", "font-mono", "Workspaces", "Attach connections"],
  ["ko", "font-mono", "워크스페이스", "Attach 연결"],
  ["ja", "font-ui", "ワークスペース", "アタッチ接続"],
  ["zh-Hans", "font-ui", "工作区", "附加连接"],
];

// A category heading beside its count. "Projects" is a name the user typed, so Latin reaches these languages.
const LABEL_FAMILY_ROWS = [
  ["ja", "ワークスペース", 1],
  ["ja", "Projects", 0],
  ["zh-Hans", "工作区", 1],
  ["zh-Hans", "Projects", 0],
];

function LabelFamilyRow({ lang, name, count }) {
  return (
    <div lang={lang} style={{ display: "flex", alignItems: "baseline", gap: "var(--tasty-space-xs)",
      padding: "var(--tasty-sidebar-category-header-pad-y) var(--tasty-sidebar-category-header-pad-x)",
      background: "var(--tasty-sidebar-category-header-bg)",
      borderTop: "var(--tasty-border-width) solid var(--tasty-sidebar-category-header-border)",
      borderBottom: "var(--tasty-border-width) solid var(--tasty-sidebar-category-header-border)" }}>
      <span style={{ display: "inline-flex", alignSelf: "center", color: "var(--tasty-sidebar-category-header-fg)" }}><Icon name="chevronDown" size="var(--tasty-icon-size-xs)" /></span>
      <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-sidebar-section-heading-font-size)", textTransform: "uppercase",
        letterSpacing: "var(--tasty-sidebar-section-heading-tracking)", color: "var(--tasty-sidebar-category-header-fg)" }}>{name}</span>
      <span style={{ fontFamily: MONO, fontSize: "var(--tasty-sidebar-category-header-count-font-size)", color: "var(--tasty-sidebar-category-header-count-fg)" }}>{count}</span>
    </div>
  );
}

export function LabelFamilySpec() {
  const label = { fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-sidebar-section-heading-font-size)", textTransform: "uppercase", letterSpacing: "var(--tasty-sidebar-section-heading-tracking)", color: "var(--tasty-text-muted)" };
  const cap = { fontFamily: MONO, fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" };
  return (
    <Spec id="label-family" title="Label family"
      when={<>Use for small translated labels: section and column headings, tags and status words. English and Korean use mono; Japanese and Simplified Chinese use UI sans because mono lacks some of their Han glyphs; paths, IDs and other values stay mono in every language.</>}>
      <Stage variant="solo column" style={{ gap: "var(--tasty-space-sm)", alignItems: "stretch" }}>
        {LABEL_FAMILY.map(([lang, family, heading, section]) => (
          <div key={lang} style={{ display: "grid", gridTemplateColumns: "var(--tasty-size-64) var(--tasty-size-140) 1fr 1fr", alignItems: "baseline", gap: "var(--tasty-space-sm)" }}>
            <span style={cap}>{lang}</span>
            <span style={cap}>{"--tasty-" + family}</span>
            <span lang={lang} style={label}>{heading}</span>
            <span lang={lang} style={label}>{section}</span>
          </div>
        ))}
        {LABEL_FAMILY_ROWS.map(([lang, name, count]) => (
          <div key={lang + name} style={{ display: "grid", gridTemplateColumns: "var(--tasty-size-64) 1fr", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
            <span style={cap}>{lang}</span>
            <LabelFamilyRow lang={lang} name={name} count={count} />
          </div>
        ))}
      </Stage>
      <Meta specs={[["family", <span className="tok">--tasty-font-label</span>], ["language rule", "tokens/base.css · RULES section 8"], ["size, ink, tracking, uppercase", "the label's own, in every language"], ["line height, baseline in ja, zh-Hans", "font-mono's at the same size, measured in the app"], ["count", "same baseline as the label"], ["icon", "centred in the row"], ["Latin in ja, zh-Hans", "UI sans, no second face"]]}
        tokens={[
          { tok: "--tasty-sidebar-category-header-fg", use: "heading and icon ink", color: "var(--tasty-sidebar-category-header-fg)" },
          { tok: "--tasty-sidebar-category-header-count-fg", use: "count ink", color: "var(--tasty-sidebar-category-header-count-fg)" },
          { tok: "--tasty-font-label", use: "words in a small label" },
          { tok: "--tasty-font-mono", use: "en, ko; values in every language" },
          { tok: "--tasty-font-ui", use: "ja, zh-Hans" },
          { tok: "--tasty-sidebar-section-heading-font-size", use: "10px in this specimen" },
          { tok: "--tasty-sidebar-section-heading-tracking", use: "0.07em in this specimen" },
        ]} />
    </Spec>
  );
}

const WEIGHTS = [["normal", 400], ["medium", 500], ["semibold", 600], ["bold", 700]];

export function WeightsSpec() {
  return (
    <Spec id="weights-and-casing" title="Weights & casing"
      when={<>Compare four weights in the UI sans. The specimen exceeds the size cap so you can judge the weight steps. Use small caps for micro-labels only.</>}>
      <Stage variant="solo" style={{ alignItems: "flex-end", gap: "var(--tasty-space-xl)" }}>
        {WEIGHTS.map(([name, weight]) => (
          <div key={name}>
            <div style={{ fontSize: "var(--tasty-font-size-brand-display)", fontWeight: `var(--tasty-font-weight-${name})`, color: "var(--tasty-text-primary)" }}>Aa</div>
            <div style={{ marginTop: "var(--tasty-space-xs)", fontFamily: MONO, fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{name} · {weight}</div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", textTransform: "uppercase", letterSpacing: "var(--tasty-letter-spacing-caps)", color: "var(--tasty-text-muted)" }}>Surface · Pane · Tab</div>
          <div style={{ marginTop: "var(--tasty-space-xs)", fontFamily: MONO, fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>micro-label caps</div>
        </div>
      </Stage>
      <Meta tokens={[
        { tok: "--tasty-font-weight-normal", use: "400" }, { tok: "--tasty-font-weight-medium", use: "500" },
        { tok: "--tasty-font-weight-semibold", use: "600" }, { tok: "--tasty-font-weight-bold", use: "700" },
        { tok: "--tasty-letter-spacing-caps", use: "0.04em: 0.44px at 11px, micro-label caps" },
      ]} />
    </Spec>
  );
}
