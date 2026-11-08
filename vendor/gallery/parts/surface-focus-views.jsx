// Tasty Gallery: the focused and unfocused frames of one surface whose bed follows focus. Used by each kind's page.
// Rules: RULES.md section 4, Surface focus. All kinds side by side, in both themes: layouts#surface-focus-every-kind.
import React from "react";
import { Views, View } from "./specimen.jsx";

export function focusViews(name, render, style) {
  return (
    <Views>
      <View name={`${name}-focused`} label="Focused"><div style={style}>{render(true)}</div></View>
      <View name={`${name}-unfocused`} label="Unfocused"><div style={style}>{render(false)}</div></View>
    </Views>
  );
}
