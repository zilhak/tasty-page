import React from "react";
import { Icon, Checkbox, Input } from "../../components/index.js";

// Tasty Gallery — Settings › Appearance font rows.

// 2026-10-06 — Settings › Appearance › <surface> › Font override. Same idiom as the colour-override rows:
// label (settings-label-width) · control (its field-width) · trailing Checkbox "Use default". Preview is a
// separate block BELOW the grid at every window width — no side column to collide with.
function FontOverrideG({ long = false }) {
  const ud = long ? "既定値を使用" : "Use default";
  const rows = [
    ["Font family", <span style={{ display: "flex", width: "var(--tasty-field-width-lg)" }}><Input block defaultValue="D2Coding" icon={<Icon name="search" />} /></span>, false],
    ["Custom font file", <span style={{ display: "flex", width: "var(--tasty-field-width-lg)" }}><Input block mono readOnly /></span>, true],
    ["Font size", <span style={{ display: "flex", width: "var(--tasty-field-width-xs)" }}><Input block mono defaultValue="14" addon="px" /></span>, false],
    ["Line height", <span style={{ display: "flex", width: "var(--tasty-field-width-xs)" }}><Input block mono readOnly defaultValue="1.2" /></span>, true],
    ["Font DPI scaling", <span style={{ display: "flex", width: "var(--tasty-field-width-md)" }}><Input block readOnly defaultValue="Follow display" /></span>, true],
  ];
  // 2026-10-06 (b2) — preview content: the surface's EFFECTIVE background + effective font, four sample lines
  // (latin · hangul · digits · kana), inside the kit box edge. bg-app / bg-panel are stand-ins for the runtime
  // surface colours (Terminal default: Focused #000000, Unfocused = base).
  const pv = (focused) => (
    <div style={{ flex: "1 1 var(--tasty-font-preview-min-width)", minWidth: "var(--tasty-font-preview-min-width)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
      <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{focused ? "Focused" : "Unfocused"}</span>
      <div style={{ display: "flex", flexDirection: "column", padding: "var(--tasty-font-preview-padding-y) var(--tasty-font-preview-padding-x)", background: focused ? "var(--tasty-bg-app)" : "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid " + (focused ? "var(--tasty-border-strong)" : "var(--tasty-separator)"), borderRadius: "var(--tasty-radius)",
        fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-term)", lineHeight: "var(--tasty-font-preview-line-height)", color: "var(--tasty-text-primary)", whiteSpace: "nowrap", overflow: "hidden" }}>
        <span>AaBbCcDdEeFfGg</span><span>가나다라마바사</span><span>1234567890</span><span>アカサタナハマラヤワ</span>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-lg)", maxWidth: "var(--tasty-settings-content-max-width)" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map(([label, ctl, def]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: "var(--tasty-space-lg)", rowGap: "var(--tasty-space-xs)", minHeight: "var(--tasty-settings-row-min-height)", padding: "var(--tasty-space-xs) 0" }}>
            <span style={{ flex: "none", width: "var(--tasty-settings-label-width)", fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)" }}>{label}</span>
            <span style={{ flex: "none", display: "flex" }}>{ctl}</span>
            <Checkbox label={ud} checked={def} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Preview</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)" }}>{pv(true)}{pv(false)}</div>
        <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Font: D2Coding / 14.0px</span>
      </div>
    </div>
  );
}

export { FontOverrideG };
