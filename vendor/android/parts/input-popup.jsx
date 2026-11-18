// Android part: the input popup, for a short text entry such as a new tab name. It is the list popup's sibling: the same
// frame in the middle of the free area over a scrim, the same title row, the same tokens. An open on-screen keyboard
// stays open and is never pushed away; the popup centres in the area above it. A cramped area gets no special
// handling: the keyboard and the window are the user's.
//
// Drawn here, not taken from vendor/components, because its shape differs from the desktop Input and popup. Colors come
// from canon roles (the input and button roles, selection-bg with text-on-active). Sizes are the
// --tasty-android-popup-* tokens: the field and each button are one row unit tall.
import React, { useLayoutEffect, useRef, useState } from "react";

// The field. value: its text. selected: the whole text is selected, as when the popup opens. caret: where the caret
// stands, "end" or none. The caret is the system's; the specimen only marks its place.
export function PopupField({ value, placeholder, selected, caret, focused = true }) {
  const empty = !value;
  return (
    <div role="textbox" aria-label={placeholder} aria-readonly="true"
      style={{ boxSizing: "border-box", height: "var(--tasty-android-popup-row-height)", display: "flex", alignItems: "center", padding: "0 var(--tasty-input-padding-x)",
        background: "var(--tasty-input-bg)", color: "var(--tasty-input-fg)", fontSize: "var(--tasty-android-popup-font-size)", borderRadius: "var(--tasty-input-radius)",
        border: `var(--tasty-border-width) solid ${focused ? "var(--tasty-input-border-focus)" : "var(--tasty-input-border)"}`,
        boxShadow: focused ? "0 0 0 var(--tasty-border-width) var(--tasty-input-border-focus)" : "none", overflow: "hidden", whiteSpace: "pre" }}>
      {empty && caret && <Caret />}
      {empty
        ? <span style={{ color: "var(--tasty-input-placeholder)", overflow: "hidden", textOverflow: "ellipsis" }}>{placeholder}</span>
        : selected
          ? <span style={{ background: "var(--tasty-selection-bg)", color: "var(--tasty-text-on-active)" }}>{value}</span>
          : <span style={{ minWidth: 0, overflow: "hidden", direction: caret === "end" ? "rtl" : undefined, textAlign: "left" }}><bdi>{value}</bdi></span>}
      {!empty && caret === "end" && <Caret />}
    </div>
  );
}

function Caret() {
  return <span aria-hidden="true" style={{ flex: "none", width: "var(--tasty-selection-edge-width)", height: "1.2em", background: "var(--tasty-text-primary)" }} />;
}

// A button in the popup's action row. primary: the confirming action, filled. disabled: shown in place, not tappable.
// focused: keyboard focus, from Tab on a hardware keyboard. pressed: a finger on it.
export function PopupButton({ label, primary, disabled, focused, pressed }) {
  const fill = disabled && primary ? "var(--tasty-state-disabled-fill)" : primary ? "var(--tasty-button-primary-bg)" : "transparent";
  const ink = disabled ? "var(--tasty-state-disabled-fg)" : primary ? "var(--tasty-button-primary-fg)" : "var(--tasty-text-primary)";
  return (
    <span role="button" aria-disabled={disabled || undefined} {...(disabled ? { "data-ink-grade": "none", "data-ink-why": "disabled" } : null)}
      style={{ position: "relative", flex: "none", boxSizing: "border-box", height: "var(--tasty-android-popup-row-height)", display: "inline-flex", alignItems: "center",
        padding: "0 var(--tasty-android-popup-padding-x)", borderRadius: "var(--tasty-radius)", fontSize: "var(--tasty-android-popup-font-size)",
        fontWeight: "var(--tasty-font-weight-semibold)", background: fill, color: ink,
        border: `var(--tasty-border-width) solid ${disabled && primary ? "var(--tasty-state-disabled-border)" : "transparent"}`,
        outline: focused ? "var(--tasty-focus-ring-width) solid var(--tasty-border-focus)" : "none", outlineOffset: "var(--tasty-border-width)" }}>
      {label}
      {pressed && !disabled && <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "var(--tasty-overlay-active)" }} />}
    </span>
  );
}

const px = (el, name) => parseFloat(getComputedStyle(el).getPropertyValue(name));

// The popup over a window. under: the app window's content, inert under the scrim. keyboard: the height of an open
// on-screen keyboard in px, or 0. children: the field. actions: the buttons, right-aligned, confirming one last.
// expanded: for the gallery, let the frame grow when the popup is taller than the free area. onFit reports whether
// the popup fits the frame's real free height: { fits }.
export function InputPopup({ title, children, actions, under, keyboard = 0, expanded = false, onFit }) {
  const area = useRef(null);
  const frame = useRef(null);
  const [grow, setGrow] = useState(0);
  useLayoutEffect(() => {
    const need = frame.current.offsetHeight + 2 * px(area.current, "--tasty-android-popup-margin");
    const free = area.current.clientHeight;
    if (onFit) onFit({ fits: need <= free });
    if (expanded && need > free) setGrow(need);
  }, [keyboard, expanded]);
  return (
    <div style={{ position: "relative", flex: 1, height: grow ? undefined : "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div ref={area} style={{ position: "relative", flex: grow ? "none" : 1, minHeight: 0, height: grow ? `${grow}px` : undefined }}>
        <div data-audit-exempt="under-scrim" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>{under}</div>
        <div style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "var(--tasty-android-popup-margin)", boxSizing: "border-box" }}>
          <div ref={frame} role="dialog" aria-label={title} style={{ width: "100%", maxWidth: "var(--tasty-android-popup-max-width)", flex: "none", display: "flex", flexDirection: "column",
            background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)",
            fontFamily: "var(--tasty-font-ui)", overflow: "hidden" }}>
            <div style={{ flex: "none", boxSizing: "border-box", height: "var(--tasty-android-popup-title-height)", display: "flex", alignItems: "center", padding: "0 var(--tasty-android-popup-padding-x)",
              fontSize: "var(--tasty-android-popup-font-size)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)", borderBottom: "var(--tasty-border-width) solid var(--tasty-menu-separator)" }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            </div>
            <div style={{ padding: "var(--tasty-android-popup-padding-x) var(--tasty-android-popup-padding-x) 0" }}>{children}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--tasty-space-sm)", padding: "var(--tasty-android-popup-padding-x)" }}>{actions}</div>
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
