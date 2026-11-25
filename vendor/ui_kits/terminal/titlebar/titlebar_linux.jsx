import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

// Tasty UI kit — CSD titlebar · Linux
// ─────────────────────────────────────────────────────────────────────────
// Tasty's MAIN window on Linux draws its own titlebar (Client-Side
//   Decoration): it is created with WindowAttributes::with_decorations(false),
//   and the host handles the window buttons, the titlebar drag and the edge
//   resize. The settings window turns the OS frame off on Linux too and draws
//   its own title row. This kit is the design for that titlebar.
//
// Linux has NO single convention — the button set, order, and side vary by
// desktop environment and user setting (GNOME: Close only, right; KDE/Breeze:
// min·max·close, movable to either side). So the layout is DATA-DRIVEN: pass
// `buttons` (subset/order of min·max·close) and `side` (left|right). On Wayland
// the window draws rounded top corners + a 1px border + a soft shadow whose
// margin holds the resize edges. All color/size from --tasty-* tokens.
// The buttons are the window button part of the Title bar and Title bar (inactive) contracts (RULES.md
// section 9, Layouts › Title bar): no fill at rest, the hover or press fill under the pointer, and the
// title ink on the glyph throughout. Close under the pointer is the Window close button.

const TB_LIN_CSS = `
.tb-lin { display:flex; align-items:center; height:var(--tasty-titlebar-height); flex:none;
  background:var(--tasty-titlebar-bg); border-bottom:var(--tasty-border-width) solid var(--tasty-titlebar-border);
  padding:0 var(--tasty-space-sm); gap:var(--tasty-space-sm); -webkit-user-select:none; user-select:none;
  border-top-left-radius:var(--tasty-titlebar-csd-radius); border-top-right-radius:var(--tasty-titlebar-csd-radius); }
.tb-lin[data-active="false"] { background:var(--tasty-titlebar-bg-inactive); }
.tb-lin__drag { -webkit-app-region:drag; }
.tb-lin__ctrls { display:flex; gap:var(--tasty-space-xs); flex:none; }
.tb-lin__btn { width:var(--tasty-titlebar-window-button-size); height:var(--tasty-titlebar-window-button-size);
  padding:0; border:0; border-radius:var(--tasty-radius-pill); display:grid; place-items:center;
  background:transparent; color:var(--tasty-titlebar-fg); cursor:pointer;
  transition:background var(--tasty-motion-ui-fast) var(--tasty-ease-ui), color var(--tasty-motion-ui-fast) var(--tasty-ease-ui); }
/* The app's Linux glyphs: minimize a line, maximize a square outline stroked inside its extent, close an X,
   each spanning titlebar-window-glyph-size (the path covers half the icon box) with a 1px stroke at any size.
   There is no restore glyph on Linux. */
.tb-lin__btn .tasty-icon { width:calc(var(--tasty-titlebar-window-glyph-size) * 2); height:calc(var(--tasty-titlebar-window-glyph-size) * 2);
  stroke-width:var(--tasty-border-width); }
.tb-lin__btn .tasty-icon path { vector-effect:non-scaling-stroke; }
/* window button (Title bar contracts): the glyph keeps the title ink in every state, only the fill changes */
.tb-lin[data-active="false"] .tb-lin__btn { color:var(--tasty-titlebar-fg-inactive); }
/* A button with data-state is frozen for a gallery frame: it shows that state and ignores the pointer. */
.tb-lin__btn:not([data-state]):hover, .tb-lin__btn[data-state="hover"] { background:var(--tasty-titlebar-button-hover-bg); }
.tb-lin__btn:not([data-state]):active, .tb-lin__btn[data-state="press"] { background:var(--tasty-titlebar-button-active-bg); }
/* close under the pointer is the Window close button; at least as specific as the inactive ink above, and after it */
.tb-lin .tb-lin__btn--close:not([data-state]):hover, .tb-lin .tb-lin__btn--close:not([data-state]):active,
.tb-lin .tb-lin__btn--close[data-state="hover"], .tb-lin .tb-lin__btn--close[data-state="press"] {
  background:var(--tasty-titlebar-close-hover-bg); color:var(--tasty-titlebar-close-hover-fg); }
`;

// cells marks parts of a gallery frame as contract cells for the gallery check:
// { title | min | max | close: { contract, state, host, parts } }. parts, a list of part names, becomes data-parts, so
// the cell measures only those rows of its contract. Each cell wraps one element: the title text or one button, so
// '— tasty' and the unmarked buttons stay in the general check. The mark is a display:contents wrapper, so the
// layout and the button's own data-state are untouched. The data-part attributes only locate parts for the check.
// The tabs variant has no title text, so it ignores cells.title; a button not in buttons ignores its cell.
function ContractCell({ cell, children }) {
  if (!cell) return children;
  return <span style={{ display: "contents" }} data-contract={cell.contract} data-state={cell.state} data-host={cell.host}
    data-parts={cell.parts ? JSON.stringify(cell.parts) : undefined}>{children}</span>;
}

function TitlebarLinux({ active = true, variant = "split", title = "agents-prod",
                         buttons = ["min", "max", "close"], side = "right",
                         tabs = ["build · cargo", "README.md", "scratch"], states = {}, cells = {} }) {
  // states freezes buttons for gallery frames: { min | max | close: "hover" | "press" }. A frozen button no
  // longer follows the pointer; the others still do.
  const G = { min: "windowMinimize", max: "windowMaximize", close: "close" };
  const ctrls = (
    <div className="tb-lin__ctrls">
      {buttons.map((b) => (
        <ContractCell key={b} cell={cells[b]}>
          <button className={"tb-lin__btn" + (b === "close" ? " tb-lin__btn--close" : "")} data-part="window button"
            data-state={states[b]} title={b[0].toUpperCase() + b.slice(1)}><Icon name={G[b]} data-part="glyph" /></button>
        </ContractCell>
      ))}
    </div>
  );
  const fg = active ? "var(--tasty-titlebar-fg)" : "var(--tasty-titlebar-fg-inactive)";
  const left = side === "left";

  const center = variant === "tabs" ? (
    <div style={{ display: "flex", gap: "var(--tasty-space-xs)", alignItems: "flex-end", flex: 1, minWidth: 0, height: "100%" }}>
      {tabs.map((t, i) => (
        <div key={t} style={{ display: "flex", alignItems: "center", padding: "0 var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-term-sm)", maxWidth: "var(--tasty-tab-width)",
          color: i === 0 ? "var(--tasty-titlebar-fg)" : "var(--tasty-text-muted)",
          background: i === 0 ? "var(--tasty-bg-panel)" : "transparent",
          borderRadius: "var(--tasty-radius) var(--tasty-radius) 0 0", height: "calc(100% - var(--tasty-space-xs))" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t}</span>
        </div>
      ))}
      <div className="tb-lin__drag" style={{ flex: 1 }} />
    </div>
  ) : (
    <div className="tb-lin__drag" style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", flex: 1, minWidth: 0,
      justifyContent: "center" }}>
      <img src={`${BASE}tasty-icon.png`} width="16" height="16" alt="" />
      <ContractCell cell={cells.title}>
        <span data-part="title" style={{ fontSize: "var(--tasty-font-size-term-sm)", color: fg }}>{title}</span>
      </ContractCell>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>— tasty</span>
    </div>
  );

  return (
    <div className="tb-lin" data-active={active}>
      {left && ctrls}
      {center}
      {!left && ctrls}
    </div>
  );
}

(function ensure() {
  if (typeof document !== "undefined" && !document.getElementById("tb-lin-css")) {
    const el = document.createElement("style"); el.id = "tb-lin-css"; el.textContent = TB_LIN_CSS; document.head.appendChild(el);
  }
})();

export { TitlebarLinux };
