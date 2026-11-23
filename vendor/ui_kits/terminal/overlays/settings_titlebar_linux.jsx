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
// closeState forces the close button's look for frozen frames: "rest" · "hover" · "press".
// Without it the button follows the pointer.

const CSS = `
.stl-lin { display:flex; align-items:center; justify-content:flex-end; flex:none;
  height:var(--tasty-titlebar-height); padding:0 var(--tasty-space-sm);
  background:var(--tasty-titlebar-bg); box-shadow:inset 0 calc(-1 * var(--tasty-border-width)) 0 var(--tasty-titlebar-border);
  -webkit-user-select:none; user-select:none; }
.stl-lin[data-active="false"] { background:var(--tasty-titlebar-bg-inactive); }
.stl-lin__drag { flex:1; align-self:stretch; min-width:0; }
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
.stl-lin .stl-lin__close:hover, .stl-lin .stl-lin__close:active,
.stl-lin .stl-lin__close[data-state="hover"], .stl-lin .stl-lin__close[data-state="press"] {
  background:var(--tasty-titlebar-close-hover-bg); color:var(--tasty-titlebar-close-hover-fg); }
.stl-lin__close:focus-visible { outline:var(--tasty-focus-ring-width) solid var(--tasty-border-focus); }
`;

(function ensure() {
  if (typeof document !== "undefined" && !document.getElementById("stl-lin-css")) {
    const el = document.createElement("style"); el.id = "stl-lin-css"; el.textContent = CSS; document.head.appendChild(el);
  }
})();

function SettingsTitleBarLinux({ active = true, closeState, onClose }) {
  return (
    <div className="stl-lin" data-active={active} data-part="settings-titlebar">
      <div className="stl-lin__drag" />
      <button type="button" className="stl-lin__close" data-state={closeState} onClick={onClose}>
        <Icon name="close" data-part="glyph" />
      </button>
    </div>
  );
}

export { SettingsTitleBarLinux };
