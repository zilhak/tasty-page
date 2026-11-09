// The layout rules, the same as the desktop's (vendor/RULES.md section 10). Every value is read from a token.
import React from "react";
import { Section, Spec, Stage } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable, TokenValue } from "./kit.jsx";

const SPACES = ["space-xs", "space-sm", "space-md", "space-lg", "space-xl"];
const SHAPES = [["border-width", "One border everywhere"], ["focus-ring-width", "Focus ring"], ["selection-edge-width", "Selected row edge"], ["radius", "Every corner"], ["radius-sm", "Tiny inner parts"]];
const TYPE = [["font-size-micro", "Keycap, tag, meta"], ["font-size-caption", "Caption, hint"], ["font-size-body", "Default text"], ["font-size-heading", "Heading, at weight 600"], ["font-size-max", "Upper limit for UI text"]];
const WEIGHTS = ["font-weight-normal", "font-weight-medium", "font-weight-semibold"];
const MOTION = [["motion-term", "Terminal content"], ["motion-ui-fast", "Hover and press tint"], ["motion-ui", "UI feedback"], ["motion-ui-med", "Unhurried reveal"]];

// Place, height, inset, icon, type. The same rows as RULES.md section 10, for the parts this gallery shows.
const PLACES = [
  ["Control", "control-height", "button-padding-x", "icon-size-md", "font-size-body"],
  ["Small control", "button-height-sm", "space-sm", "icon-size-xs", "font-size-caption"],
  ["Tab bar", "tab-height", "tab-padding-x", "tab-icon-size", "font-size-body"],
  ["Tree row", "tree-row-height", "workspace-row-padding-x", "icon-size-sm", "font-size-body"],
  ["Menu row", "menu-item-height", "menu-item-padding-x", "icon-size-sm", "font-size-body"],
  ["Table cell", "table-cell-height", "table-cell-padding-x", "icon-size-sm", "font-size-body"],
  ["ListCtrl row", "listctrl-row-min-height", "listctrl-row-padding-x", "icon-size-md", "font-size-body"],
  ["Toast", "toast-min-height", "toast-padding-x", "icon-size-md", "font-size-body"],
  ["In-surface toolbar", "toolbar-height", "space-sm", "icon-size-md", "font-size-body"],
];
const named = (name) => <>{name} <TokenValue name={name} /></>;

export function LayoutSection() {
  return (
    <Section id="layout" title="Layout rules">
      <Spec id="layout-spacing" title="Spacing" when={COPY.layoutSpacingWhen}>
        <Stage eager variant="column">
          {SPACES.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-md)" }}>
              <span style={{ width: `var(--tasty-${name})`, height: "var(--tasty-space-lg)", background: "var(--tasty-accent-primary)" }} />
              <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)" }}>{name} <TokenValue name={name} /></span>
            </div>
          ))}
        </Stage>
      </Spec>
      <Spec id="layout-shape" title="Borders and corners" when={COPY.layoutShapeWhen}>
        <SpecTable head={["Token", "Value", "Use"]} mono={[0, 1]} rows={SHAPES.map(([name, use]) => [name, <TokenValue name={name} />, use])} />
      </Spec>
      <Spec id="layout-type" title="Type" when={COPY.layoutTypeWhen}>
        <Stage eager variant="column">
          {TYPE.map(([name, use]) => <div key={name} style={{ fontSize: `var(--tasty-${name})` }}>{use}</div>)}
          {WEIGHTS.map((name) => <div key={name} style={{ fontWeight: `var(--tasty-${name})` }}>{name.replace("font-weight-", "Weight ")}</div>)}
        </Stage>
        <SpecTable head={["Token", "Value", "Use"]} mono={[0, 1]}
          rows={[...TYPE.map(([name, use]) => [name, <TokenValue name={name} />, use]), ["line-height-ui", <TokenValue name="line-height-ui" />, "UI labels and wrapped text"]]} />
      </Spec>
      <Spec id="layout-places" title="Heights by place" when={COPY.layoutPlacesWhen}>
        <SpecTable head={["Place", "Height", "Inset", "Icon", "Type"]} mono={[1, 2, 3, 4]}
          rows={PLACES.map(([place, ...tokens]) => [place, ...tokens.map(named)])} />
        <Prose k="layoutPlacesNote" />
      </Spec>
      <Spec id="layout-motion" title="Motion" when={COPY.layoutMotionWhen}>
        <SpecTable head={["Token", "Value", "Use"]} mono={[0, 1]} rows={MOTION.map(([name, use]) => [name, <TokenValue name={name} />, use])} />
      </Spec>
    </Section>
  );
}
