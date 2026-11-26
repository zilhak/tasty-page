import React from "react";

/**
 * Tasty Tab — a single tab in the tab strip. 24px tall, 150px wide,
 * holds a label and a close affordance. The active tab adopts the
 * focused panel color; inactive tabs sit on the sidebar tone.
 *
 * The dot encodes the surface's LIVE ACTIVITY — NOT "unsaved". Tasty has no
 * dirty/unsaved concept (terminals are PTY output; markdown surfaces are
 * read-only viewers), so the old dirty-only dot had nothing to mark.
 *
 * status MIRRORS THE PRODUCT (demo=main). The product surface model exposes
 * exactly one activity bool per surface — `busy` (foreground PTY process is not
 * a known shell, output within ~2s, not input echo) — so the tab draws ONE dot:
 *   busy → green · idle → no dot.
 * The richer 5-color owner×activity vocabulary (running/waiting/agent/error)
 * has NO data source at the tab/surface level — it is produced only at the
 * WORKSPACE level (sidebar StatusDot, port_scanner, plugins). It deliberately
 * does NOT live on the tab; don't reintroduce it here without a product source.
 *
 * `attention` tints the TITLE — the product's one attention channel on a tab
 * (tab_bar.rs): needs-input (tab-fg-needs-input) › completion (tab-fg-completion)
 * › active › rest, on the active tab too (attention.rs tab_title_color). The
 * focus-driven clear in redraw touches only the surface that holds key focus in a
 * frame (redraw.rs focus_observed_effect), and only while the OS window is focused
 * and the surface's content is not hidden by occupancy (a hard lock, or a member of
 * an occupied workspace; frame_effect.rs FocusObserved). No surface holds key focus
 * while a popup has the keys or a fullscreen stage shows. That clear passes over
 * every other surface, so an active tab keeps the tint too: the active tab of an
 * unfocused pane or another workspace, or the focused one while the window is
 * inactive (the Tab specimen's needs-input strip) or its surface is hard occupied
 * (the completion strip). Separately, reading a surface's last unread notification
 * clears its attention locally (attention.rs mark_notification_read →
 * clear_attention_local), and the read is passed on to the other windows' engines
 * too (dispatch_domain.rs cascade_notification_read). (2026-10-07: the old `attached`
 * ring and `notif` label were removed — the product tab draws neither; attach
 * lives on the workspace row.) The dot is static (no pulse).
 *
 * Right cluster: busy dot · close, tab-status-gap (4) apart; label → cluster
 * is tab-gap (8).
 *
 * Keyboard focus: the canon is that the pane tab strip is no keyboard stop and
 * draws no ring. Tabs move by shortcut (next/prev tab, quick switch, switch
 * numbers). The app does not hold to this yet: egui focus can still reach a
 * pane tab and its close button, and taking them out of the focus order is
 * the app's pending work. Neither the tab nor its close button is a Tab stop
 * here. A web
 * host that adds one for page keyboard access (the landing demo) gets the 2px
 * ring INSIDE the tab: tabs abut and the strip clips, so a ring off the box
 * would be cut or would cover a neighbour. The app draws its tab context-menu
 * stroke inside the tab the same way. The close button keeps the control ring,
 * focus-ring-offset (1px) off its 16px box, which stays inside the 24px tab.
 */

const CSS = `
.tasty-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--tasty-tab-gap);
  height: var(--tasty-control-height-tab);
  width: var(--tasty-tab-width);
  padding: 0 var(--tasty-space-sm) 0 var(--tasty-space-md);
  border-right: var(--tasty-border-width) solid var(--tasty-separator);
  background: var(--tasty-bg-sidebar);
  color: var(--tasty-text-muted);
  font-family: var(--tasty-font-ui);
  font-size: var(--tasty-font-size-body);
  cursor: pointer;
  user-select: none;
  transition: background var(--tasty-motion-ui-fast) var(--tasty-ease-ui), color var(--tasty-motion-ui-fast) var(--tasty-ease-ui);
}
.tasty-tab:hover { background: var(--tasty-tab-bg-hover); color: var(--tasty-tab-fg-hover); }
.tasty-tab--active { background: var(--tasty-bg-panel); color: var(--tasty-text-primary); }
/* only when a host makes the tab a Tab stop: the ring sits inside the box (see the note above) */
.tasty-tab:focus-visible { outline-offset: calc(-1 * var(--tasty-focus-ring-width)); }
.tasty-tab--active::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: var(--tasty-tab-indicator-width); background: var(--tasty-accent-primary);
}
.tasty-tab__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tasty-tab__icon { flex: none; display: inline-flex; color: var(--tasty-text-secondary); }
.tasty-tab__icon svg { width: var(--tasty-tab-icon-size); height: var(--tasty-tab-icon-size); display: block; }
.tasty-tab__close {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: var(--tasty-tab-close-size); height: var(--tasty-tab-close-size); border: 0; padding: 0; border-radius: var(--tasty-radius-sm);
  background: transparent; color: var(--tasty-text-secondary); cursor: pointer; opacity: 0;
  transition: opacity var(--tasty-motion-ui-fast), background var(--tasty-motion-ui-fast);
}
.tasty-tab:hover .tasty-tab__close, .tasty-tab--active .tasty-tab__close { opacity: 1; }
.tasty-tab__close:hover { background: var(--tasty-overlay-active); color: var(--tasty-text-primary); }
.tasty-tab__close svg { width: var(--tasty-icon-size-xs); height: var(--tasty-icon-size-xs); }
/* live-activity dot — mirrors the product busy bool (busy = green, idle = none) */
.tasty-tab__cluster { flex: none; display: inline-flex; align-items: center; gap: var(--tasty-tab-status-gap); }
.tasty-tab__dot { position: relative; width: var(--tasty-tab-dot-size); height: var(--tasty-tab-dot-size); border-radius: var(--tasty-radius-pill); background: var(--tasty-status-dot-idle); flex: none; }
.tasty-tab__dot--busy { background: var(--tasty-status-dot-success); }
/* attention — title tint (needs-input outranks completion); clears on focus */
.tasty-tab--needs-input .tasty-tab__label { color: var(--tasty-tab-fg-needs-input); }
.tasty-tab--completion .tasty-tab__label { color: var(--tasty-tab-fg-completion); }
`;



let injected = false;
function ensureCss() {
  if (injected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.id = "tasty-tab-css";
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

export function Tab({ label, icon = null, active = false, status = "idle", attention = null, onClose, className = "", ...rest }) {
  ensureCss();
  const busy = status === "busy";
  // As the app's tab_title_color: attention outranks active, so an active tab keeps its attention tint.
  const cls = ["tasty-tab", active ? "tasty-tab--active" : "", attention ? "tasty-tab--" + attention : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {icon && <span className="tasty-tab__icon">{icon}</span>}
      <span className="tasty-tab__label">{label}</span>
      <span className="tasty-tab__cluster">
      {busy && <span className="tasty-tab__dot tasty-tab__dot--busy" />}
      <button
        className="tasty-tab__close"
        aria-label="Close tab"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); onClose && onClose(e); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      </span>
    </div>
  );
}
