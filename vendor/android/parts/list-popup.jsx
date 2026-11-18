// Android part: the list popup. Every menu on Android uses this one form: a list in the middle of the window over a
// scrim, not a context menu at the finger as on the desktop. That covers a long press (the tab menu) and the logo
// (the Tasty menu). An open on-screen keyboard stays open and is never pushed away: the popup centres in the window
// area above it, and its rows scroll when that area is short.
// Drawn here, not taken from vendor/components, because its shape differs from the desktop menu. Colors and type are
// canon tokens; sizes are declared below, each pointing at a canon token. Icons come from vendor/icons through Icon.
import React from "react";
import { Icon } from "../../components/index.js";

export const LIST_POPUP_DECLARED = [
  ["android-popup-max-width", "size-320", "Widest the popup gets. Narrower windows keep the side margin instead"],
  ["android-popup-margin", "space-lg", "Least space between the popup and the edge of the area it sits in, on every side"],
  ["android-popup-title-height", "size-48", "Title row: the name of what was pressed"],
  ["android-popup-row-height", "size-48", "One row, and its target. The row is the full popup width"],
  ["android-popup-heading-height", "size-32", "Group heading, such as Workspaces. Not a target"],
  ["android-popup-padding-x", "space-lg", "Inset of the title, headings and row labels"],
  ["android-popup-font-size", "font-size-max", "Title and row labels"],
];
export const listPopupVars = Object.fromEntries(LIST_POPUP_DECLARED.map(([name, from]) => [`--${name}`, `var(--tasty-${from})`]));

// A row. disabled: shown in place and not tappable, never hidden, so rows do not move between openings.
// current: the one row that is already in effect, such as the workspace on screen.
export function ListPopupRow({ label, pressed, disabled, current }) {
  return (
    <div role="menuitem" aria-disabled={disabled || undefined} aria-current={current || undefined}
      {...(disabled ? { "data-ink-grade": "none", "data-ink-why": "disabled" } : null)}
      style={{ position: "relative", flex: "none", height: "var(--android-popup-row-height)", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
        padding: "0 var(--android-popup-padding-x)", fontSize: "var(--android-popup-font-size)",
        color: disabled ? "var(--tasty-text-disabled)" : "var(--tasty-text-primary)",
        fontWeight: current ? "var(--tasty-font-weight-semibold)" : undefined,
        background: pressed && !disabled ? "var(--tasty-overlay-active)" : "transparent" }}>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {current && <span style={{ flex: "none", display: "inline-flex", color: "var(--tasty-accent-primary)" }}><Icon name="check" size="var(--tasty-icon-size-md)" /></span>}
    </div>
  );
}

export function ListPopupHeading({ label }) {
  return (
    <div role="presentation" style={{ flex: "none", height: "var(--android-popup-heading-height)", display: "flex", alignItems: "flex-end", padding: "0 var(--android-popup-padding-x) var(--tasty-space-xs)",
      fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-secondary)" }}>{label}</div>
  );
}

export function ListPopupSeparator() {
  return <div role="separator" style={{ flex: "none", height: "var(--tasty-border-width)", background: "var(--tasty-menu-separator)" }} />;
}

// The popup over a window. under is the app window's content, inert while the popup is open. keyboard is the height of
// an open on-screen keyboard in px, or 0: the keyboard stays where it is, outside the scrim, and the popup centres in
// what is left above it. When the rows do not fit, the title stays and the rows scroll.
export function ListPopup({ title, children, under, keyboard = 0, scrollTo = 0 }) {
  const body = React.useRef(null);
  React.useEffect(() => { if (body.current) body.current.scrollTop = scrollTo; }, [scrollTo]);
  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div data-audit-exempt="under-scrim" style={{ height: "100%" }}>{under}</div>
        <div style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--android-popup-margin)", boxSizing: "border-box" }}>
          <div role="menu" aria-label={title} style={{ width: "100%", maxWidth: "var(--android-popup-max-width)", maxHeight: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box",
            background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)",
            fontFamily: "var(--tasty-font-ui)", overflow: "hidden" }}>
            <div style={{ flex: "none", height: "var(--android-popup-title-height)", display: "flex", alignItems: "center", padding: "0 var(--android-popup-padding-x)",
              fontSize: "var(--android-popup-font-size)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)", borderBottom: "var(--tasty-border-width) solid var(--tasty-menu-separator)" }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            </div>
            <div ref={body} style={{ minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>{children}</div>
          </div>
        </div>
      </div>
      {keyboard > 0 && (
        // A stand-in for the system keyboard, which Tasty does not draw. It marks the space the popup leaves alone.
        <div style={{ flex: "none", height: `${keyboard}px`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
          background: "var(--tasty-bg-sidebar)", border: "var(--tasty-border-width) dashed var(--tasty-border-control)",
          fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>On-screen keyboard, stays open</div>
      )}
    </div>
  );
}
