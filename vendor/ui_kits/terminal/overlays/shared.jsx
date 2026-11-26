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

// ── Popup focus edge — the bar a popup narrower than the window lights across the top of its frame while it
// holds key focus (vendor/RULES.md "Popup focus"). Inside the 1px border, over the content margin, clipped by the frame's
// radius (the frame clips its overflow), so nothing in the popup moves. Unfocused: not drawn. top: an offset for a frame
// whose top row is already taken (the file picker's remote border mode draws its own 2px info row there).
function PopupFocusEdge({ lit = true, top = 0 }) {
  if (!lit) return null;
  return <div data-popup-focus-edge="lit" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top, zIndex: 1,
    height: "var(--tasty-popup-focus-edge-width)", background: "var(--tasty-popup-focus-edge-focused)", pointerEvents: "none" }} />;
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
      <div className="tasty-kit-scrim__room" onClick={closeOnSelf} style={{ justifyContent: align === "top" ? "flex-start" : "center" }}>{children}</div>
    </div>
  );
}

export { Scrim, Spinner, PopupFocusEdge };
