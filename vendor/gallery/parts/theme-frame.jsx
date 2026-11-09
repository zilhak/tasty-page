// One theme's ground, for a specimen that shows Mocha and Latte side by side whatever the page theme is.
import React from "react";

export function ThemeFrame({ theme, label, children }) {
  return (
    <div data-theme={theme} style={{ flex: "1 1 var(--tasty-size-320)", minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)",
      padding: "var(--tasty-space-md)", background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
      <div style={{ fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-secondary)" }}>{label}</div>
      {children}
    </div>
  );
}

// Both themes, one frame each. render(theme) draws the same content in each.
export function ThemePair({ render }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)", width: "100%" }}>
      <ThemeFrame theme="mocha" label="Mocha">{render("mocha")}</ThemeFrame>
      <ThemeFrame theme="latte" label="Latte">{render("latte")}</ThemeFrame>
    </div>
  );
}
