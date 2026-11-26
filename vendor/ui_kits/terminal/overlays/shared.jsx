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

function Scrim({ onClose, children, align = "center" }) {
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)",
      backdropFilter: "blur(var(--tasty-scrim-blur))", display: "flex", alignItems: align === "top" ? "flex-start" : "center",
      justifyContent: "center", paddingTop: align === "top" ? "var(--tasty-overlay-top-offset)" : 0, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export { Scrim, Spinner, PopupFocusEdge };
