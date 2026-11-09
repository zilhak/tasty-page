// Foundations: the parts that show a raw value. A value is read from the token in its theme at render, so a label
// cannot drift from the fill. Inside a ThemeFrame a Mocha chip stays Mocha on a Latte page.
import React, { useEffect, useState } from "react";
import { resolveToken } from "../parts/state-grid.jsx";

// The value of one token in one theme, as a hex.
export function Hex({ name, theme }) {
  const [value, set] = useState("");
  useEffect(() => { set(resolveToken(name, theme)); }, [name, theme]);
  return <>{value}</>;
}

export function SwatchGrid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(var(--tasty-size-96), 1fr))", gap: "var(--tasty-space-xs)" }}>{children}</div>;
}

// name: the short name. sub: an optional second name, such as the primitive step.
export function Swatch({ token, theme, name, sub }) {
  return (
    <div style={{ minWidth: 0, background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      <div style={{ height: "var(--tasty-size-48)", background: `var(--tasty-${token})`, borderBottom: "var(--tasty-border-width) solid var(--tasty-border-default)" }} />
      <div style={{ padding: "var(--tasty-space-xs) var(--tasty-space-sm)" }}>
        <div style={{ fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{name}</div>
        {sub && <div style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)", overflowWrap: "anywhere" }}>{sub}</div>}
        <div style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}><Hex name={token} theme={theme} /></div>
      </div>
    </div>
  );
}
