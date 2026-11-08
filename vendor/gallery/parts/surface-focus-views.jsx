// Tasty Gallery: the focused and unfocused frames of one surface, with the edge the host paints above it. Used by each kind's page.
// Rules: RULES.md section 4, Surface focus. All kinds side by side, in both themes: layouts#surface-focus-edge-every-kind.
import React from "react";
import { SurfaceLeaf } from "../../ui_kits/terminal/surface_focus.jsx";
import { Views, View } from "./specimen.jsx";

export function focusViews(name, surface, style) {
  return (
    <Views>
      <View name={`${name}-focused`} label="Focused"><SurfaceLeaf focused style={style}>{surface}</SurfaceLeaf></View>
      <View name={`${name}-unfocused`} label="Unfocused"><SurfaceLeaf focused={false} style={style}>{surface}</SurfaceLeaf></View>
    </Views>
  );
}
