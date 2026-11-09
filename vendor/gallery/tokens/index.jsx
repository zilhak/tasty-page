// The token system: primitive → semantic → component. Every name, reference and value comes from
// tokens/tasty.tokens.json when the page renders, so a chain shows what the tokens say. Rows only choose what to
// show. The page needs no client script: render it without hydration and both themes are already in the HTML.
import React from "react";
import data from "../../tokens/tasty.tokens.json";
import { Icon } from "../../components/index.js";
import { PageStates, Section, Spec, Stage, Note } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";

const THEMES = [["mocha", "Mocha"], ["latte", "Latte"]];
const MONO = "var(--tasty-font-mono)";
const CAPTION = "var(--tasty-font-size-caption)";
const MICRO = "var(--tasty-font-size-micro)";

const INDEX = {};
["primitive", "semantic", "component"].forEach((tier) => Object.entries(data[tier]).forEach(([name, node]) => { INDEX[name] = node; }));

function own(name, theme) {
  const node = INDEX[name];
  const latte = node.$extensions && node.$extensions["com.tasty.mode"] && node.$extensions["com.tasty.mode"].latte;
  return String(theme === "latte" && latte !== undefined ? latte : node.$value);
}
// [name, next, next, ...] down to the token that holds the value.
function path(name, theme) {
  const out = [name];
  for (;;) {
    const m = /^\{\w+\.([\w-]+)\}$/.exec(own(out[out.length - 1], theme));
    if (!m) return out;
    out.push(m[1]);
  }
}
const last = (list) => list[list.length - 1];
const valueOf = (name, theme) => own(last(path(name, theme)), theme);
const isColor = (name) => INDEX[name].$type === "color";
// A font stack or a mix is long. Show how it starts.
const short = (v) => (v.length > 22 && v.includes(",") ? `${v.split(",")[0]} …` : v);

function Chip({ name, theme, size = "var(--tasty-icon-size-xs)" }) {
  return <span data-theme={theme} style={{ display: "inline-block", flex: "none", width: size, height: size, background: `var(--tasty-${name})`, border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius-sm)" }} />;
}

function Name({ children }) {
  return <div style={{ fontFamily: MONO, fontSize: CAPTION, color: "var(--tasty-text-primary)", overflowWrap: "anywhere" }}>{children}</div>;
}

// A token's value in each theme, on one line when they match.
function Values({ name }) {
  const [m, l] = [valueOf(name, "mocha"), valueOf(name, "latte")];
  const lines = m === l ? [["mocha", null]] : THEMES;
  return lines.map(([theme, label]) => (
    <div key={theme} style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}>
      {isColor(name) && <Chip name={name} theme={theme} />}
      <span>{label && `${label} `}{short(valueOf(name, theme))}</span>
    </div>
  ));
}

// The tier 1 cell. A semantic token may point at another primitive in Latte, so each theme names its own.
function PrimitiveCell({ start }) {
  const [m, l] = [last(path(start, "mocha")), last(path(start, "latte"))];
  if (m === l) return <><Name>{m}</Name><Values name={m} /></>;
  return THEMES.map(([theme, label]) => {
    const prim = last(path(start, theme));
    return (
      <div key={theme} style={{ marginBottom: "var(--tasty-space-xs)" }}>
        <Name>{prim}</Name>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}>
          {isColor(prim) && <Chip name={prim} theme={theme} />}<span>{label} {short(own(prim, theme))}</span>
        </div>
      </div>
    );
  });
}

// A consumer that does not read the role directly says how it gets there, in the theme where that differs.
function Consumer({ name, role }) {
  const notes = [];
  const m = path(name, "mocha");
  const l = path(name, "latte");
  const hops = (list) => list.slice(1, list.indexOf(role));
  if (role) {
    if (m.includes(role) && hops(m).length > 0) notes.push(`via ${hops(m).join(" → ")}`);
    if (!l.includes(role)) notes.push(`Latte: → ${l.slice(1).join(" → ")}, not this role`);
    else if (hops(l).join() !== hops(m).join()) notes.push(`Latte: via ${hops(l).join(" → ")}`);
  }
  return (
    <div>
      <span style={{ fontFamily: MONO, fontSize: CAPTION, color: "var(--tasty-text-secondary)" }}>{name}</span>
      {notes.length > 0 && <span style={{ fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}> {notes.join(" · ")}</span>}
    </div>
  );
}

const Arrow = () => <td aria-hidden="true" style={{ color: "var(--tasty-text-muted)", fontFamily: MONO }}>→</td>;

// rows: [semantic or null, [consumers], primitive when there is no semantic]
function ChainTable({ rows }) {
  return (
    <div className="spec-table" tabIndex={0}>
      <table style={{ minWidth: "var(--tasty-size-700)" }}>
        <thead><tr><th>1 · Primitive</th><th aria-hidden="true" /><th>2 · Semantic</th><th aria-hidden="true" /><th>3 · Component tokens</th></tr></thead>
        <tbody>
          {rows.map(([role, consumers, prim]) => (
            <tr key={role || prim}>
              <td><PrimitiveCell start={role || prim} /></td>
              <Arrow />
              <td>{role ? <><Name>{role}</Name><Values name={role} /></> : <span style={{ fontSize: CAPTION, color: "var(--tasty-text-muted)" }}>No semantic alias: the primitive is used directly</span>}</td>
              <Arrow />
              <td>{consumers.map((c) => <Consumer key={c} name={c} role={role} />)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COLOR = [
  ["accent-primary", ["button-primary-bg", "tab-indicator", "checkbox-bg-checked", "switch-track-bg-on", "progress-fill-bg"]],
  ["accent-agent", ["button-agent-bg", "status-dot-agent", "toast-accent-agent"]],
  ["accent-danger", ["button-danger-bg", "input-border-invalid", "status-dot-danger", "toast-accent-danger"]],
  ["accent-success", ["status-dot-success", "toast-accent-success"]],
  ["accent-warning", ["status-dot-warning", "toast-accent-warning"]],
  ["surface-raised", ["button-secondary-bg", "input-bg", "badge-bg", "menu-bg", "kbd-bg"]],
  ["surface-active", ["tree-row-bg-active", "table-row-bg-selected", "badge-neutral-bg", "spinner-track"]],
  ["text-primary", ["button-fg", "input-fg", "tab-fg-active", "toast-fg"]],
  ["text-muted", ["input-icon-fg", "tab-fg", "table-header-fg", "select-chevron-fg"]],
  ["text-on-accent", ["button-primary-fg", "checkbox-check-fg", "switch-thumb-bg-on"]],
];
const DIM = [
  ["space-xs", ["badge-padding-x", "kbd-padding-x", "tag-gap"]],
  ["space-sm", ["button-gap", "input-gap", "tab-gap", "tag-padding-x", "toast-padding-y"]],
  ["space-md", ["button-padding-x", "input-padding-x", "menu-item-padding-x", "table-cell-padding-x"]],
  ["control-height", ["button-height", "input-height", "menu-item-height", "toast-min-height"]],
  ["control-height-tab", ["tab-height", "button-height-sm"]],
  ["control-height-tree", ["tree-row-height"]],
  [null, ["checkbox-size", "tab-close-size", "switch-track-height"], "size-16"],
  ["radius", ["button-radius", "input-radius", "toast-radius", "menu-radius"]],
  ["radius-sm", ["badge-radius", "tag-radius", "menu-item-radius", "tab-close-radius"]],
  ["radius-pill", ["switch-radius"]],
];
const TYPE = [
  ["font-size-body", ["button-font-size", "input-font-size", "table-font-size"]],
  ["font-size-caption", ["tooltip-font-size", "table-header-font-size", "banner-body-font-size"]],
  ["font-size-micro", ["badge-font-size", "tag-font-size", "kbd-font-size"]],
  ["font-weight-medium", ["button-font-weight", "table-header-font-weight"]],
  ["font-weight-semibold", ["drilldown-title-font-weight", "notification-item-title-weight"]],
  ["font-weight-bold", ["badge-font-weight"]],
  ["font-mono", ["kbd-font", "table-cell-font"]],
  ["motion-ui-fast", ["switch-overlay-fade"]],
  ["motion-ui", ["banner-fade"]],
  [null, ["spinner-duration"], "duration-900"],
];

const TIERS = [
  { n: 1, tier: "Primitive", title: "The only literals", good: false,
    body: "Context-free raw values on numeric scales. No roles, no opinions. Theme lives here (Mocha / Latte re-point the same names).",
    examples: [["color-blue", "value"], ["size-4", "value"], ["font-size-13", "value"]], rule: "never referenced by components or app code" },
  { n: 2, tier: "Semantic", title: "Roles & intent", good: true,
    body: "Every value points at a primitive — never a literal. This is what app code and the component layer read.",
    examples: [["accent-primary", "ref"], ["space-md", "ref"]], rule: "read these in app code" },
  { n: 3, tier: "Component", title: "Per-component knobs", good: true,
    body: "One token per styled part of one component, pointing at a semantic role. The contract an implementer copies.",
    examples: [["button-primary-bg", "ref"]], rule: "re-theme a component by overriding only its tokens" },
];

function TierCard({ tier }) {
  return (
    <div style={{ flex: "1 1 var(--tasty-size-240)", minWidth: 0, padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
      <div style={{ fontFamily: MONO, fontSize: CAPTION, fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-secondary)" }}>Tier {tier.n} · {tier.tier}</div>
      <div style={{ marginTop: "var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-max)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{tier.title}</div>
      <p style={{ margin: "var(--tasty-space-xs) 0 var(--tasty-space-md)", fontSize: CAPTION, color: "var(--tasty-text-muted)" }}>{tier.body}</p>
      <div style={{ padding: "var(--tasty-space-sm)", background: "var(--tasty-surface-raised)", borderRadius: "var(--tasty-radius-sm)", fontFamily: MONO, fontSize: CAPTION, color: "var(--tasty-text-secondary)", overflowWrap: "anywhere" }}>
        {tier.examples.map(([name, kind]) => {
          const next = kind === "ref" && /^\{\w+\.([\w-]+)\}$/.exec(own(name, "mocha"));
          return <div key={name}><b style={{ color: "var(--tasty-text-primary)", fontWeight: "var(--tasty-font-weight-semibold)" }}>--tasty-{name}</b>: {next ? `var(--tasty-${next[1]})` : own(name, "mocha")}</div>;
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", marginTop: "var(--tasty-space-md)", fontSize: CAPTION, color: "var(--tasty-text-muted)" }}>
        <span style={{ display: "inline-flex", flex: "none", color: tier.good ? "var(--tasty-accent-success-raised)" : "var(--tasty-accent-danger-raised)" }}><Icon name={tier.good ? "check" : "close"} size="var(--tasty-icon-size-xs)" /></span>
        <span>{tier.rule}</span>
      </div>
    </div>
  );
}

function FeatureCell({ tag, name, theme, line }) {
  return (
    <div style={{ flex: "1 1 var(--tasty-size-160)", minWidth: 0 }}>
      <div style={{ marginBottom: "var(--tasty-space-xs)", fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}>{tag}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
        <Chip name={name} theme={theme} size="var(--tasty-size-40)" />
        <div style={{ minWidth: 0 }}>
          <Name>--tasty-{name}</Name>
          <div style={{ fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}>{line}</div>
        </div>
      </div>
    </div>
  );
}

function TokenSystem() {
  return (
    <>
      <Section id="model" title="Three tiers">
        <Spec id="three-tiers-one-direction" title="Three tiers, one direction of reference"
          when={<>A <b>primitive</b> holds a raw value; a <b>semantic</b> token gives it a role; a <b>component</b> token wires that role to one part of one component. Implementers read the <span className="ic">--tasty-*</span> name — the value resolves down the chain.</>}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)" }}>
            {TIERS.map((t) => <TierCard key={t.n} tier={t} />)}
          </div>
        </Spec>
      </Section>

      <Section id="reading" title="Reading a chain">
        <Spec id="reading-a-chain" title="Follow one value through the tiers"
          when={<>The blue primitive becomes the primary accent, which the Button's primary background reads. Change <span className="ic">--tasty-color-blue</span> once and every consumer downstream follows. Latte re-points the primitive, so the same names resolve to another value.</>}>
          <Stage variant="solo" eager>
            <ThemePair render={(theme) => (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--tasty-space-md)" }}>
                <FeatureCell tag="1 · primitive" name="color-blue" theme={theme} line={valueOf("color-blue", theme)} />
                <span aria-hidden="true" style={{ color: "var(--tasty-text-muted)", fontFamily: MONO }}>→</span>
                <FeatureCell tag="2 · semantic" name="accent-primary" theme={theme} line="= var(--tasty-color-blue)" />
                <span aria-hidden="true" style={{ color: "var(--tasty-text-muted)", fontFamily: MONO }}>→</span>
                <FeatureCell tag="3 · component" name="button-primary-bg" theme={theme} line="= var(--tasty-accent-primary)" />
              </div>
            )} />
          </Stage>
          <Note>Same primary accent also reaches: <span className="ic">tab-indicator</span> <span className="ic">checkbox-bg-checked</span> <span className="ic">switch-track-bg-on</span> <span className="ic">progress-fill-bg</span>. A longer path is still one direction: <span className="ic">{path("spinner-indicator", "mocha").join(" → ")}</span>.</Note>
        </Spec>
      </Section>

      <Section id="color-chains" title="Color chains">
        <Spec id="color-chain-table" title="Color"
          when={<>Each theme's value is shown in the same row. A role can point at another primitive in Latte, and a consumer can reach its role through another token, or leave it in Latte: the row says so.</>}>
          <ChainTable rows={COLOR} />
        </Spec>
      </Section>

      <Section id="dimension-chains" title="Spacing · sizing · radius chains">
        <Spec id="dimension-chain-table" title="Spacing, sizing and radius" when={<>These have one value for both themes.</>}>
          <ChainTable rows={DIM} />
        </Spec>
      </Section>

      <Section id="type-chains" title="Type & motion chains">
        <Spec id="type-chain-table" title="Type and motion" when={<>These have one value for both themes. A long value, such as a font stack, shows how it starts.</>}>
          <ChainTable rows={TYPE} />
        </Spec>
      </Section>

      <Section id="naming" title="Naming">
        <Spec id="token-naming" title="How a name is built"
          when={<>Primitive: <span className="ic">{"--tasty-<category>-<scale>"}</span>. Semantic: <span className="ic">{"--tasty-<role>"}</span>. Component: <span className="ic">{"--tasty-<component>-<part>[-<state>]"}</span>. See <span className="ic">TOKENS.md</span> for the full do and don't.</>} />
      </Section>
    </>
  );
}

export const page = {
  active: "tokens",
  nav: [
    { id: "model", label: "Three tiers" },
    { id: "reading", label: "Reading a chain" },
    { id: "color-chains", label: "Color chains" },
    { id: "dimension-chains", label: "Spacing · sizing · radius" },
    { id: "type-chains", label: "Type & motion" },
    { id: "naming", label: "Naming" },
  ],
  head: {
    title: "Token system",
    intro: "Three tiers, one direction of reference. Follow a value from a primitive through a semantic role to one part of one component.",
  },
  content: <TokenSystem />,
};

export default function TokensRoute() {
  return <PageStates value={{}}>{page.content}</PageStates>;
}
