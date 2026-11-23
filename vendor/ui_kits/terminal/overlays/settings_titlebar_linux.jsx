import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";

// Tasty UI kit — the Linux settings window title bar (client-drawn).
// ─────────────────────────────────────────────────────────────────────────
// On Linux the settings window drops the OS decoration and draws this row on top, above the
// L1 band. It is the main window's Linux title bar with the settings window's content:
// · no title text: the L1 band's "Settings" label already names the window, on every OS;
// · one button, close, at the right end (no minimize or maximize, so a double click does nothing);
// · the rest of the row is the drag area.
// It draws what the main window's Linux title bar draws: the window button part of the Title bar and
// Title bar (inactive) contracts at rest (titlebar-fg, titlebar-fg-inactive), the Window close button
// under the pointer (RULES.md section 9), a glyph titlebar-window-glyph-size wide stroked at
// border-width, and the button centered on the full 36 row with the 1px line drawn inside it, at its
// bottom. When the compositor forces
// server-side decorations, this row is not drawn and the window keeps settings-window-height.
//
// closeState freezes the close button for gallery frames: "rest" · "hover" · "press" · "focus". With it set,
// the pointer and the keyboard no longer change the look. Without it the button follows them.
// onClose: the close button (the app closes the settings window and drops the draft, like Cancel).
// onDrag(dx, dy): the pointer moved by dx, dy since it went down on the drag area; the host moves the
// window by that much. A double click on the drag area does nothing. The button's accessible name and
// tooltip are the app's titlebar.close ("Close").

const CSS = `
.stl-lin { display:flex; align-items:center; justify-content:flex-end; flex:none;
  height:var(--tasty-titlebar-height); padding:0 var(--tasty-space-sm);
  background:var(--tasty-titlebar-bg); box-shadow:inset 0 calc(-1 * var(--tasty-border-width)) 0 var(--tasty-titlebar-border);
  -webkit-user-select:none; user-select:none; }
.stl-lin[data-active="false"] { background:var(--tasty-titlebar-bg-inactive); }
.stl-lin__drag { flex:1; align-self:stretch; min-width:0; cursor:default; touch-action:none; }
.stl-lin__close { width:var(--tasty-titlebar-window-button-size); height:var(--tasty-titlebar-window-button-size); flex:none;
  display:grid; place-items:center; padding:0; border:0; border-radius:var(--tasty-radius-pill); cursor:pointer;
  background:transparent; color:var(--tasty-titlebar-fg);
  transition:background var(--tasty-motion-ui-fast) var(--tasty-ease-ui), color var(--tasty-motion-ui-fast) var(--tasty-ease-ui); }
.stl-lin[data-active="false"] .stl-lin__close { color:var(--tasty-titlebar-fg-inactive); }
/* The close glyph is the close icon with its X spanning titlebar-window-glyph-size (the path covers half the
   icon box) and a 1px stroke whatever the box size. */
.stl-lin__close .tasty-icon { width:calc(var(--tasty-titlebar-window-glyph-size) * 2); height:calc(var(--tasty-titlebar-window-glyph-size) * 2);
  stroke-width:var(--tasty-border-width); }
.stl-lin__close .tasty-icon path { vector-effect:non-scaling-stroke; }
.stl-lin .stl-lin__close:not([data-state]):hover, .stl-lin .stl-lin__close:not([data-state]):active,
.stl-lin .stl-lin__close[data-state="hover"], .stl-lin .stl-lin__close[data-state="press"] {
  background:var(--tasty-titlebar-close-hover-bg); color:var(--tasty-titlebar-close-hover-fg); }
/* Keyboard focus: the standard 2px focus ring around the round button, at rest colors. */
.stl-lin__close:not([data-state]):focus-visible, .stl-lin__close[data-state="focus"] {
  outline:var(--tasty-focus-ring-width) solid var(--tasty-border-focus); }
`;

(function ensure() {
  if (typeof document !== "undefined" && !document.getElementById("stl-lin-css")) {
    const el = document.createElement("style"); el.id = "stl-lin-css"; el.textContent = CSS; document.head.appendChild(el);
  }
})();

function SettingsTitleBarLinux({ active = true, closeState, onClose, onDrag }) {
  const start = React.useRef(null);
  const down = (e) => {
    if (e.button !== 0 || !onDrag) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!start.current) return;
    onDrag(e.clientX - start.current.x, e.clientY - start.current.y);
  };
  const up = (e) => {
    if (!start.current) return;
    start.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (onDrag) onDrag(null);
  };
  return (
    <div className="stl-lin" data-active={active} data-part="settings-titlebar">
      <div className="stl-lin__drag" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <button type="button" className="stl-lin__close" data-state={closeState} onClick={onClose} aria-label="Close" title="Close">
        <Icon name="close" data-part="glyph" />
      </button>
    </div>
  );
}

export { SettingsTitleBarLinux };
