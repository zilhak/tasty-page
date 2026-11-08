// The surface focus edge. The host paints it at the top of every surface leaf, whatever the kind. See RULES.md section 4.
import React from "react";

export function SurfaceFocusEdge({ focused, style, ...rest }) {
  return (
    <div aria-hidden="true" {...rest} style={{ flex: "none", height: "var(--tasty-surface-focus-edge-width)",
      background: focused ? "var(--tasty-surface-focus-edge-focused)" : "var(--tasty-surface-focus-edge-unfocused)", ...style }} />
  );
}

// A surface leaf: the edge on top, then whatever the kind draws. The edge keeps its row in both states, so focus never moves the content.
export function SurfaceLeaf({ focused, style, children, ...rest }) {
  return (
    <div {...rest} style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden", ...style }}>
      <SurfaceFocusEdge focused={focused} />
      {children}
    </div>
  );
}
