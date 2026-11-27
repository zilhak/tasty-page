import React from "react";
import * as _TDS from "../../../components/index.js";

// Tasty UI kit — shared overlay scaffolding: modal Scrim + Spinner fallback.
// Every popup in this folder composes these. Load BEFORE the other overlay files.

// Spinner is a newly-added DS component. Until the bundle recompiles to include
// it (first turn after it was added), fall back to an equivalent local copy so
// this kit never hard-crashes. Once present, the DS component is used verbatim.
const Spinner = _TDS.Spinner || (() => {
  if (typeof document !== "undefined" && !document.getElementById("tasty-fallback-spin-css")) {
    const el = document.createElement("style");
    el.id = "tasty-fallback-spin-css";
    el.textContent = "@keyframes tasty-fallback-spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(el);
  }
  return function Spinner({ size = 16, stroke = 2 }) {
    const r = 12 - stroke;
    return (
      <span style={{ width: size, height: size, display: "inline-block", flex: "none", color: "var(--tasty-text-muted)" }} role="status" aria-label="Loading">
        <svg viewBox="0 0 24 24" fill="none" style={{ width: "100%", height: "100%", animation: "tasty-fallback-spin 0.9s linear infinite" }}>
          <circle cx="12" cy="12" r={r} stroke="currentColor" strokeWidth={stroke} opacity="0.22" />
          <path d={`M12 ${12 - r} a ${r} ${r} 0 0 1 ${r} ${r}`} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
        </svg>
      </span>
    );
  };
})();

// ── Popup focus border — the color of the 1px border a popup narrower than the window draws (vendor/RULES.md "Popup
// focus"). focused: the popup holds key focus, so the shell keeps its own border, the token passed as own (border-frame on
// a dialog shell, search-bar-border on the search bar). Unfocused: popup-border-unfocused. Only the color changes, so
// nothing in the popup moves. A window-scope popup, or one shown over the window, passes focused={true} in every state.
function popupBorderColor(focused, own = "var(--tasty-border-frame)") {
  return focused ? own : "var(--tasty-popup-border-unfocused)";
}
// The data attribute a popup shell carries, so a specimen's state can be read from the page.
function popupFocusAttr(focused) {
  return { "data-popup-focus": focused ? "focused" : "unfocused" };
}

// As the app's popup clamp_to_screen: a window is drawn at its own size, cut down to the room the scrim leaves, and
// placed inside it. The room is the scrim's content box: the box under the window fills it, so its size is known,
// and the window itself takes max-width and max-height of that room. The room is a column, so a window whose own
// max-height is set inline (ports) still shrinks along it. A window wider or taller than the room shrinks
// to it, both ways, and its frame clips the content; a window whose body is a flex column with a scrolling middle
// (settings) keeps its footer at the bottom edge. The window keeps its own width and height wherever it fits.
const SCRIM_CSS = `
.tasty-kit-scrim__room { flex: 1 1 0; align-self: stretch; min-width: 0; min-height: 0; display: flex; flex-direction: column; align-items: center; }
.tasty-kit-scrim__room > * { max-width: 100%; max-height: 100%; min-width: 0; min-height: 0; }
`;
function ensureScrimCss() {
  if (typeof document === "undefined" || document.getElementById("tasty-kit-scrim-css")) return;
  const el = document.createElement("style");
  el.id = "tasty-kit-scrim-css";
  el.textContent = SCRIM_CSS;
  document.head.appendChild(el);
}

function Scrim({ onClose, children, align = "center" }) {
  ensureScrimCss();
  // A click on the scrim or on the empty room around the window closes; a click inside the window does not.
  const closeOnSelf = (e) => { e.stopPropagation(); if (e.target === e.currentTarget && onClose) onClose(e); };
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)",
      backdropFilter: "blur(var(--tasty-scrim-blur))", display: "flex",
      paddingTop: align === "top" ? "var(--tasty-overlay-top-offset)" : 0, zIndex: 50 }}>
      <ScrimRoom onClick={closeOnSelf} align={align}>{children}</ScrimRoom>
    </div>
  );
}

// The room inside the scrim that holds and bounds the window (max 100% of the room, as clamp_to_screen). The gallery
// sets one in a box of a chosen size to draw a window on a small screen with the kit's own layout.
function ScrimRoom({ align = "center", style, children, ...rest }) {
  ensureScrimCss();
  return <div className="tasty-kit-scrim__room" {...rest} style={{ justifyContent: align === "top" ? "flex-start" : "center", ...style }}>{children}</div>;
}

export { Scrim, ScrimRoom, Spinner, popupBorderColor, popupFocusAttr };
