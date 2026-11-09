// Foundations: the spacing scale at a glance, fixed heights and motion.
import React from "react";
import { Spec, Stage, Meta, Note } from "../parts/specimen.jsx";

const MONO = "var(--tasty-font-mono)";
const MICRO = "var(--tasty-font-size-micro)";

const STEPS = [
  ["xs", "4px", "icon gaps"], ["sm", "8px", "control gaps"], ["md", "12px", "card pad"], ["lg", "16px", "sections"], ["xl", "24px", "regions"],
];

export function GridSpec() {
  return (
    <Spec id="four-px-grid" title="4px grid"
      when={<>Every gap is a multiple of 4 — xs/sm/md/lg/xl only. The five steps side by side, each with its job. The next specimen shows each one at work.</>}>
      <Stage variant="solo" style={{ alignItems: "flex-end", gap: "var(--tasty-space-xl)" }}>
        {STEPS.map(([step, px, job]) => (
          <div key={step} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <div style={{ width: `var(--tasty-space-${step})`, height: `var(--tasty-space-${step})`, background: "var(--tasty-border-control)" }} />
            <div style={{ fontFamily: MONO, fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-primary)" }}>{step} {px}</div>
            <div style={{ fontSize: MICRO, color: "var(--tasty-text-muted)" }}>{job}</div>
          </div>
        ))}
      </Stage>
    </Spec>
  );
}

const HEIGHTS = [
  ["tree row", "--tasty-control-height-tree", "--tasty-control-height-tree · 22px", null],
  ["button / input / menu", "--tasty-control-height", "--tasty-control-height · 28px", null],
  ["tab", "--tasty-control-height-tab", "--tasty-control-height-tab · 24px · --tasty-tab-width 150px", "var(--tasty-tab-width)"],
];

export function HeightsSpec() {
  return (
    <Spec id="interactive-heights" title="Interactive heights"
      when={<>Fixed row heights for tree / control / tab, drawn at their real size. A tab also has a fixed width. The tree row, at 22px, is the one off-grid height.</>}>
      <Stage variant="solo column" style={{ gap: "var(--tasty-space-md)" }}>
        {HEIGHTS.map(([name, tok, label, width]) => (
          <div key={tok} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--tasty-space-sm) var(--tasty-space-md)" }}>
            <div style={{ flex: "none", boxSizing: "border-box", display: "flex", alignItems: "center", height: `var(${tok})`, width: width || "auto", padding: "0 var(--tasty-space-md)", background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-primary)" }}>{name}</div>
            <span style={{ fontFamily: MONO, fontSize: MICRO, color: "var(--tasty-text-muted)" }}>{label}</span>
          </div>
        ))}
      </Stage>
      <Meta specs={[["tree row", <span className="tok">--tasty-control-height-tree</span>], ["control", <span className="tok">--tasty-control-height</span>], ["tab height", <span className="tok">--tasty-control-height-tab</span>], ["tab width", <span className="tok">--tasty-tab-width</span>]]} />
    </Spec>
  );
}

const MOTION = [
  ["0ms", "--tasty-accent-danger-raised", "Terminal content", "Cells & scroll never animate — input responsiveness wins."],
  ["90–120ms", "--tasty-accent-primary-raised", "UI widgets", "Short feedback only, on direct user input. Eased with --tasty-ease-ui."],
  ["snap OK", "--tasty-accent-info-raised", "State vs transition", "Rest / hover / active / focus states are canonical. The fade between them is decorative — immediate-mode may snap. Focus ring & invalid stay instant."],
];

export function MotionSpec() {
  return (
    <Spec id="motion" title="Motion"
      when={<>Terminal = 0ms. UI feedback = 90–120ms. Resting states canonical; transitions decorative. Reveals are slower and are not feedback: they answer a pause, not an input.</>}>
      <Stage variant="solo" style={{ gap: "var(--tasty-space-md)", alignItems: "stretch" }}>
        {MOTION.map(([key, ink, title, body]) => (
          <div key={key} style={{ flex: "1 1 var(--tasty-size-200)", minWidth: 0, padding: "var(--tasty-space-md) var(--tasty-space-lg)", background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
            <div style={{ fontFamily: MONO, fontSize: "var(--tasty-font-size-max)", fontWeight: "var(--tasty-font-weight-bold)", color: `var(${ink})` }}>{key}</div>
            <div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{title}</div>
            <div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{body}</div>
          </div>
        ))}
      </Stage>
      <Meta tokens={[
        { tok: "--tasty-motion-term", use: "0ms, terminal content" },
        { tok: "--tasty-motion-ui-fast", use: "90ms, feedback" },
        { tok: "--tasty-motion-ui", use: "120ms, feedback" },
        { tok: "--tasty-motion-ui-med", use: "150ms, tooltip show delay, unhurried reveals" },
        { tok: "--tasty-motion-ui-fade", use: "200ms, discoverability fade-in and show delays" },
        { tok: "--tasty-ease-ui", use: "the one UI easing" },
      ]} />
      <Note>Spinner rotation is a period and not feedback: <span className="tok">--tasty-spinner-duration</span> is 900ms.</Note>
    </Spec>
  );
}
