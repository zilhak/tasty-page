import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

// Tasty UI kit — CSD titlebar · Windows
// ─────────────────────────────────────────────────────────────────────────
// ⚠ NON-PRODUCT / EXPLORATION. Shipping Tasty uses the NATIVE Windows titlebar.
//   This designs the Client-Side-Decoration alternative. Adopting it needs
//   WindowAttributes::with_decorations(false) + custom drag + WM_NCHITTEST
//   handling (HTMAXBUTTON on the maximize rect for Snap Layouts).
//
// Windows conventions: caption buttons (minimize · maximize/restore · close) on
// the RIGHT, each ~46px wide and full titlebar height; close-hover paints the
// system red (#c42b1c via --tasty-accent-window-close) with a white glyph.
// The maximize button must expose its hit-rect to the OS so the Snap-Layouts
// flyout appears on hover. All color/size from --tasty-* tokens.

const TB_WIN_CSS = `
.tb-win { display:flex; align-items:stretch; height:var(--tasty-titlebar-height); flex:none;
  background:var(--tasty-titlebar-bg); border-bottom:var(--tasty-border-width) solid var(--tasty-titlebar-border);
  -webkit-user-select:none; user-select:none; }
.tb-win[data-active="false"] { background:var(--tasty-titlebar-bg-inactive); }
.tb-win__title { display:flex; align-items:center; gap:var(--tasty-space-sm); padding:0 var(--tasty-space-md); -webkit-app-region:drag; }
.tb-win__caption { display:flex; align-items:stretch; flex:none; }
.tb-win__btn { width:var(--tasty-titlebar-caption-width); display:grid; place-items:center;
  border:0; background:transparent; color:var(--tasty-titlebar-button-fg); cursor:pointer;
  transition:background var(--tasty-motion-ui-fast) var(--tasty-ease-ui), color var(--tasty-motion-ui-fast) var(--tasty-ease-ui); }
/* The app's Windows caption glyphs: each spans titlebar-caption-glyph-size (the shapes cover half the icon box)
   with a 1px stroke at any size, as the Linux window button glyphs do. */
.tb-win__btn .tasty-icon { width:calc(2 * var(--tasty-titlebar-caption-glyph-size)); height:calc(2 * var(--tasty-titlebar-caption-glyph-size));
  stroke-width:var(--tasty-border-width); }
.tb-win__btn .tasty-icon > * { vector-effect:non-scaling-stroke; }
/* Title bar contracts, button: the inactive ink is for rest only. Under the pointer the glyph takes
   titlebar-button-fg-hover in an active or inactive window, and press changes only the fill. The hover rules
   are as specific as the inactive one and come after it, so they win in an inactive window too. */
.tb-win[data-active="false"] .tb-win__btn { color:var(--tasty-titlebar-fg-inactive); }
/* A button with data-state is frozen for a gallery frame: it shows that state and ignores the pointer. A pressed
   button is also under the pointer, so press keeps the hover ink and changes the fill. */
.tb-win .tb-win__btn:not([data-state]):hover, .tb-win .tb-win__btn[data-state="hover"], .tb-win .tb-win__btn[data-state="press"] {
  background:var(--tasty-titlebar-button-hover-bg); color:var(--tasty-titlebar-button-fg-hover); }
.tb-win .tb-win__btn:not([data-state]):active, .tb-win .tb-win__btn[data-state="press"] { background:var(--tasty-titlebar-button-active-bg); }
.tb-win .tb-win__btn--close:not([data-state]):hover, .tb-win .tb-win__btn--close[data-state="hover"], .tb-win .tb-win__btn--close[data-state="press"] {
  background:var(--tasty-titlebar-close-hover-bg); color:var(--tasty-titlebar-close-hover-fg); }
`;

// cells marks frozen buttons as contract cells for the gallery check: { min | max | close: { contract, state, host } }.
// The mark is a display:contents wrapper, so the button's layout and its own data-state are untouched.
function ContractCell({ cell, children }) {
  if (!cell) return children;
  return <span style={{ display: "contents" }} data-contract={cell.contract} data-state={cell.state} data-host={cell.host}>{children}</span>;
}

function TitlebarWindows({ active = true, variant = "split", title = "agents-prod", maximized = false, tabs = ["build · cargo", "README.md", "scratch"], states = {}, cells = {} }) {
  // states freezes buttons for gallery frames: { min | max | close: "hover" | "press" }. A frozen button no
  // longer follows the pointer; the others still do.
  // Glyphs come from the icon set at titlebar-caption-glyph-size (the .tb-win__btn .tasty-icon rule). Minimize and
  // close are shared with the Linux title bar; maximize and restore are the Windows caption shapes.
  const G = { min: "windowMinimize", max: "captionMaximize", restore: "captionRestore", close: "close" };
  const caption = (
    <div className="tb-win__caption">
      <button className="tb-win__btn" data-state={states.min} title="Minimize"><Icon name={G.min} /></button>
      {/* Snap Layouts: this rect is reported to the OS via WM_NCHITTEST → HTMAXBUTTON */}
      <button className="tb-win__btn" data-snap-target="true" data-state={states.max} title="Maximize"><Icon name={maximized ? G.restore : G.max} /></button>
      <ContractCell cell={cells.close}>
        <button className="tb-win__btn tb-win__btn--close" data-state={states.close} title="Close"><Icon name={G.close} data-part="glyph" /></button>
      </ContractCell>
    </div>
  );
  const fg = active ? "var(--tasty-titlebar-fg)" : "var(--tasty-titlebar-fg-inactive)";

  if (variant === "tabs") {
    return (
      <div className="tb-win" data-active={active}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", padding: "0 var(--tasty-space-sm) 0 var(--tasty-space-md)", flex: "none", WebkitAppRegion: "drag" }}>
          <img src={`${BASE}tasty-icon.png`} width="16" height="16" alt="" />
        </div>
        <div style={{ display: "flex", gap: "var(--tasty-space-xs)", alignItems: "flex-end", flex: 1, minWidth: 0 }}>
          {tabs.map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", padding: "0 var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-term-sm)", maxWidth: "var(--tasty-tab-width)",
              color: i === 0 ? "var(--tasty-titlebar-fg)" : "var(--tasty-text-muted)",
              background: i === 0 ? "var(--tasty-bg-panel)" : "transparent",
              borderRadius: "var(--tasty-radius) var(--tasty-radius) 0 0", height: "calc(100% - var(--tasty-space-xs))" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t}</span>
            </div>
          ))}
          <div style={{ flex: 1, WebkitAppRegion: "drag" }} />
        </div>
        {caption}
      </div>
    );
  }
  return (
    <div className="tb-win" data-active={active}>
      <div className="tb-win__title" style={{ flex: 1, minWidth: 0 }}>
        <img src={`${BASE}tasty-icon.png`} width="16" height="16" alt="" />
        <span style={{ fontSize: "var(--tasty-font-size-term-sm)", color: fg }}>{title}</span>
        <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>— tasty</span>
      </div>
      {caption}
    </div>
  );
}

(function ensure() {
  if (typeof document !== "undefined" && !document.getElementById("tb-win-css")) {
    const el = document.createElement("style"); el.id = "tb-win-css"; el.textContent = TB_WIN_CSS; document.head.appendChild(el);
  }
})();

export { TitlebarWindows };
