// Surface focus. A surface whose bed belongs to Tasty swaps its bed. A surface whose bed belongs to someone else, html or a plugin, gets the edge. See RULES.md section 4.
import React from "react";

export const surfaceBed = (focused) => (focused ? "var(--tasty-surface-bed-focused)" : "var(--tasty-surface-bed-unfocused)");

export function SurfaceFocusEdge({ focused, style, ...rest }) {
  return (
    <div aria-hidden="true" {...rest} style={{ flex: "none", height: "var(--tasty-surface-focus-edge-width)",
      background: focused ? "var(--tasty-surface-focus-edge-focused)" : "var(--tasty-surface-focus-edge-unfocused)", ...style }} />
  );
}

// An html or plugin leaf: the edge on top, then whatever the kind draws. The edge keeps its row in both states, so focus never moves the content.
export function SurfaceLeaf({ focused, style, children, ...rest }) {
  return (
    <div {...rest} style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden", ...style }}>
      <SurfaceFocusEdge focused={focused} />
      {children}
    </div>
  );
}
