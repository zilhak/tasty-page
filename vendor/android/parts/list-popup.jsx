// Android part: the list popup. Every menu that a long press opens on Android uses this one form: a list in the middle
// of the screen over a scrim, not a context menu at the finger as on the desktop. Drawn here, not taken from
// vendor/components, because its shape differs from the desktop menu. Colors and type are canon tokens; sizes are
// declared below, each pointing at a canon token.
import React from "react";

export const LIST_POPUP_DECLARED = [
  ["android-popup-max-width", "size-320", "Widest the popup gets. Narrower windows keep the side margin instead"],
  ["android-popup-margin", "space-lg", "Least space between the popup and the window edge, on every side"],
  ["android-popup-title-height", "size-48", "Title row: the name of what was long-pressed"],
  ["android-popup-row-height", "size-48", "One row, and its target. The row is the full popup width"],
  ["android-popup-padding-x", "space-lg", "Inset of the title and row labels"],
  ["android-popup-font-size", "font-size-max", "Title and row labels"],
];
export const listPopupVars = Object.fromEntries(LIST_POPUP_DECLARED.map(([name, from]) => [`--${name}`, `var(--tasty-${from})`]));

const dashed = { outline: "var(--tasty-border-width) dashed var(--tasty-border-control)", outlineOffset: "calc(-1 * var(--tasty-border-width))" };

// A row. candidate marks a row that is not decided yet: drawn with a dashed edge and a label, for the gallery only.
export function ListPopupRow({ label, pressed, candidate }) {
  return (
    <div role="menuitem" style={{ position: "relative", flex: "none", height: "var(--android-popup-row-height)", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
      padding: "0 var(--android-popup-padding-x)", color: "var(--tasty-text-primary)", fontSize: "var(--android-popup-font-size)",
      background: pressed ? "var(--tasty-overlay-active)" : "transparent", ...(candidate ? dashed : null) }}>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {candidate && <span style={{ flex: "none", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>Candidate</span>}
    </div>
  );
}

export function ListPopupSeparator() {
  return <div role="separator" style={{ flex: "none", height: "var(--tasty-border-width)", background: "var(--tasty-menu-separator)" }} />;
}

// The popup over a window. children is what lies under the scrim, inert while the popup is open. The popup sits in the
// middle of the window; when the rows do not fit, the title stays and the rows scroll.
export function ListPopup({ title, children, under }) {
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div data-audit-exempt="under-scrim" style={{ height: "100%" }}>{under}</div>
      <div style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--android-popup-margin)", boxSizing: "border-box" }}>
        <div role="menu" aria-label={title} style={{ width: "100%", maxWidth: "var(--android-popup-max-width)", maxHeight: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box",
          background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)",
          fontFamily: "var(--tasty-font-ui)", overflow: "hidden" }}>
          <div style={{ flex: "none", height: "var(--android-popup-title-height)", display: "flex", alignItems: "center", padding: "0 var(--android-popup-padding-x)",
            fontSize: "var(--android-popup-font-size)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)", borderBottom: "var(--tasty-border-width) solid var(--tasty-menu-separator)" }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          </div>
          <div style={{ minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
