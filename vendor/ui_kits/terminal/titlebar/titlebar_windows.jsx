import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

// Tasty UI kit — CSD titlebar · Windows
// ─────────────────────────────────────────────────────────────────────────
// Tasty's MAIN window on Windows draws its own titlebar (Client-Side
//   Decoration): it is created with WindowAttributes::with_decorations(false)
//   and the undecorated shadow on, and the host handles the caption buttons,
//   the titlebar drag and the edge resize. This kit is that titlebar. Other
//   windows keep the OS frame on Windows: the settings window, for one, uses
//   the native titlebar (only Linux draws its own there).
//
// Windows conventions: caption buttons (minimize · maximize/restore · close) on
// the RIGHT, each ~46px wide and full titlebar height; close-hover paints the
// system red (#c42b1c via --tasty-accent-window-close) with a white glyph.
// Snap Layouts: the OS shows its flyout over the maximize button only when the
// window answers WM_NCHITTEST with HTMAXBUTTON on that button's rect. The
// design keeps that target; the app does not answer it yet (2026-11-25).
// All color/size from --tasty-* tokens.

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

// cells marks parts of a gallery frame as contract cells for the gallery check:
// { title | min | max | close: { contract, state, host, parts } }. parts, a list of part names, becomes data-parts, so
// the cell measures only those rows of its contract. Each cell wraps one element: the title text or one button, so
// '— tasty' and the unmarked buttons stay in the general check. The mark is a display:contents wrapper, so the
// layout and the button's own data-state are untouched. The data-part attributes only locate parts for the check.
// The tabs variant has no title text, so it ignores cells.title.
function ContractCell({ cell, children }) {
  if (!cell) return children;
  return <span style={{ display: "contents" }} data-contract={cell.contract} data-state={cell.state} data-host={cell.host}
    data-parts={cell.parts ? JSON.stringify(cell.parts) : undefined}>{children}</span>;
}

function TitlebarWindows({ active = true, variant = "split", title = "agents-prod", maximized = false, tabs = ["build · cargo", "README.md", "scratch"], states = {}, cells = {} }) {
  // states freezes buttons for gallery frames: { min | max | close: "hover" | "press" }. A frozen button no
  // longer follows the pointer; the others still do.
  // Glyphs come from the icon set at titlebar-caption-glyph-size (the .tb-win__btn .tasty-icon rule). Minimize and
  // close are shared with the Linux title bar; maximize and restore are the Windows caption shapes.
  const G = { min: "windowMinimize", max: "captionMaximize", restore: "captionRestore", close: "close" };
  const caption = (
    <div className="tb-win__caption">
      <ContractCell cell={cells.min}>
        <button className="tb-win__btn" data-part="button" data-state={states.min} title="Minimize"><Icon name={G.min} /></button>
      </ContractCell>
      {/* Snap Layouts: this rect is reported to the OS via WM_NCHITTEST → HTMAXBUTTON */}
      <ContractCell cell={cells.max}>
        <button className="tb-win__btn" data-part="button" data-snap-target="true" data-state={states.max} title="Maximize"><Icon name={maximized ? G.restore : G.max} /></button>
      </ContractCell>
      <ContractCell cell={cells.close}>
        <button className="tb-win__btn tb-win__btn--close" data-part="button" data-state={states.close} title="Close"><Icon name={G.close} data-part="glyph" /></button>
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
        <ContractCell cell={cells.title}>
          <span data-part="title" style={{ fontSize: "var(--tasty-font-size-term-sm)", color: fg }}>{title}</span>
        </ContractCell>
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
