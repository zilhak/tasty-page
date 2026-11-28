import React from "react";
import { Button } from "../../../components/core/Button.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { Kbd } from "../../../components/core/Kbd.jsx";
import { Tag } from "../../../components/core/Tag.jsx";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { Icon } from "../chrome.jsx";
import { popupBorderColor, popupFocusAttr } from "./shared.jsx";

// Tasty UI kit — Banner: the 4th overlay family (Modal / Popup / Toast / Banner).
// A floating, top-anchored notice pinned to the top of a scope's content area
// (View / Workspace / Pane / Tab / Surface) — NEVER over the tab bar. Focus-less,
// consumes its own mouse, and unlike a Toast it can carry actions. Lifetime rule (2026-11-02):
// a banner with NO user action has a TTL and auto-dismisses; a banner WITH an action
// (button or ⋯ menu row) has no TTL. × is not an action. TTL shows a top-right countdown that flips to an X on hover (and pauses while hovered
// or backgrounded). Mouse-capture always has its ⋯ (2026-11-03 — also with an unknown program name, where
// the menu shows its rows disabled), so it has no TTL under the normal rule; no exception. One banner shown per scope; the rest wait in a queue (max 5).
// Mirrors the proposed zilhak/tasty Banner manager. Standalone preview: banner.html



const bic = {
  mouse: <Icon name="mouse" size={16} />,
  check: <Icon name="check" size={16} />,
  warn: <Icon name="alertTriangle" size={16} />,
  x: <Icon name="close" size={14} />,
  more: <Icon name="more" size={14} />,
  bell: <Icon name="bell" />,
};

// ── the shared shell (frame only — every banner composes this) ──────────
function BannerShell({ recessed, zIndex, children }) {
  return (
    <div style={{ width: "100%", position: "relative", zIndex,
      background: "var(--tasty-banner-bg)", color: "var(--tasty-banner-fg)",
      border: "var(--tasty-border-width) solid var(--tasty-banner-border)",
      borderRadius: "var(--tasty-banner-radius)", boxShadow: "var(--tasty-banner-shadow)",
      opacity: recessed ? "var(--tasty-banner-recessed-opacity)" : 1,
      transition: "opacity var(--tasty-banner-fade) var(--tasty-ease-ui)" }}>
      {children}
    </div>
  );
}

// top-right affordance — TTL countdown number ↔ X. The X reveals on banner
// hover for BOTH kinds; a TTL banner shows the seconds when not hovered.
function BannerDismiss({ ttl, bannerHover, backgrounded, onClose }) {
  const [n, setN] = React.useState(ttl || 0);
  React.useEffect(() => { setN(ttl || 0); }, [ttl]);
  const frozen = bannerHover || backgrounded;        // TTL stop conditions
  React.useEffect(() => {
    if (!ttl || frozen) return undefined;
    if (n <= 0) { const id = setTimeout(() => onClose && onClose(), 0); return () => clearTimeout(id); }
    const id = setTimeout(() => setN((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [ttl, frozen, n]);
  return (
    <span style={{ width: "var(--tasty-size-24)", height: "var(--tasty-size-24)", flex: "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {bannerHover
        ? <IconButton size="sm" aria-label="Dismiss" onClick={onClose}>{bic.x}</IconButton>
        : ttl
          ? <span style={{ fontFamily: "var(--tasty-banner-countdown-font)", fontSize: "var(--tasty-banner-countdown-font-size)",
              color: "var(--tasty-banner-countdown-fg)", fontVariantNumeric: "tabular-nums" }}>{n}</span>
          : null}
    </span>
  );
}

// ── the "more" (⋯) overflow menu — per-app opt-outs behind one trigger ──
// Lives in the affordance column, LEFT of the ×, same hover reveal rule; stays
// lit while open. Rows are permanent Settings writes, so the copy says off /
// disable (never "pause"). The label's fixed text never truncates; the
// interpolated program name (mono) shrinks and ellipsises, so the menu stays
// between --tasty-banner-more-menu-min-width and -max-width in every locale.
// 2026-11-02 — prefix / {app} / suffix (en: prefix only; ko/ja: suffix only).
// The program name reads its own token pair, as the app does: banner-more-app-fg on a resting row, and
// banner-more-app-fg-hover on a hovered or keyboard-active row, the same ink as the fixed copy beside it (a row whose
// hover is held back by the menu's keys keeps the resting name too).
// The gallery's menu specimens use the same class, so the contrast check measures these tokens.
export const MORE_APP_CLASS = "tasty-banner-more-app";
const MORE_APP_CSS = `.${MORE_APP_CLASS} { color: var(--tasty-banner-more-app-fg); }
.tasty-menuitem:not(.tasty-menuitem--held):hover .${MORE_APP_CLASS}, .tasty-menuitem--active .${MORE_APP_CLASS} { color: var(--tasty-banner-more-app-fg-hover); }`;
export function MoreAppCss() { return <style>{MORE_APP_CSS}</style>; }
function MoreLabel({ text, app, after }) {
  return (
    <span style={{ display: "flex", minWidth: 0, whiteSpace: "nowrap" }}>
      <MoreAppCss />
      {text && <span style={{ flex: "none" }}>{text}</span>}
      <span title={app} className={MORE_APP_CLASS} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
        fontFamily: "var(--tasty-banner-more-app-font)" }}>{app}</span>
      {after && <span style={{ flex: "none" }}>{after}</span>}
    </span>
  );
}

// ── keys and focus for the open ⋯ menu, matched to the app (RULES.md "Popup focus") ──
// The menu opens holding the popup key focus and takes DOM focus, with no row active. Popup key ownership and widget
// focus are separate, as in the app: Tab and Shift+Tab move widget focus as usual, through the enabled rows and to
// the trigger or Dismiss, and the menu stays open and keeps the key focus (focused border, terminal unfocused).
// The keyboard-active row is the row with widget focus, whether ↑↓ or Tab moved it there; focus on the trigger,
// Dismiss or the menu box leaves no row active. ↑↓ move focus over the enabled rows and ↵ runs the focused row.
// Disabled rows take no focus. The trigger and Dismiss draw their own rings. Esc closes the menu wherever widget
// focus is in the banner card, and Esc or a row run gives focus back to the trigger while the banner is still there.
// A press outside the menu box closes it, the trigger included. As in the app, where the popup layer closes the menu on
// the press before the banner sees the click, the pointer click that press ends in on the trigger opens the menu again
// and gives it focus; a release off the trigger leaves it closed. Any other activation of the trigger (keyboard,
// click()) toggles at once. The focus a press gives stays. Focus that
// leaves the banner card closes it too, with or without a target. An inactive OS window changes nothing while it is
// inactive; when the window comes back without focus in the card, the menu closes.
// The card is the nearest [data-banner-card] around the trigger. Hosts spread rowProps(i) on each enabled row.
function useBannerMoreMenu({ open, setOpen, rowCount, onRun }) {
  const anchor = React.useRef(null);
  const menu = React.useRef(null);
  const back = React.useRef(false);
  const [kb, setKb] = React.useState(-1);
  const trigger = () => (anchor.current ? anchor.current.querySelector('[aria-label="More options"]') : null);
  const rows = () => (menu.current ? [...menu.current.querySelectorAll("[data-more-row]")] : []);
  const close = (toTrigger) => { if (toTrigger) back.current = true; setOpen(false); };
  React.useEffect(() => {
    if (open) { if (menu.current) menu.current.focus(); return; }
    setKb(-1);
    if (back.current) { back.current = false; const t = trigger(); if (t) t.focus(); }
  }, [open]);
  React.useEffect(() => {
    if (!open) return undefined;
    const card = anchor.current ? anchor.current.closest("[data-banner-card]") : null;
    const inCard = (el) => !!(card && el && card.contains(el));
    const onDown = (e) => { if (menu.current && !menu.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); } };
    const onIn = (e) => setKb(rows().indexOf(e.target));
    let timer = 0;
    const recheck = () => { clearTimeout(timer); timer = setTimeout(() => { if (document.hasFocus() && !inCard(document.activeElement)) setOpen(false); }, 0); };
    const onOut = (e) => {
      if (e.relatedTarget) { if (!inCard(e.relatedTarget)) setOpen(false); return; }
      recheck();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("focus", recheck);
    if (card) { card.addEventListener("keydown", onKey); card.addEventListener("focusin", onIn); card.addEventListener("focusout", onOut); }
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("focus", recheck);
      if (card) { card.removeEventListener("keydown", onKey); card.removeEventListener("focusin", onIn); card.removeEventListener("focusout", onOut); }
    };
  }, [open]);
  const run = (i) => { close(onRun(i) !== false); };
  const triggerProps = {
    // Every click toggles. A press on the trigger that finds the menu open has already closed it (the document
    // mousedown above, outside the menu box), so the pointer click that press ends in on the trigger opens it again,
    // and the open effect gives the menu focus. A release off the trigger makes no click on it, so the menu stays
    // closed. Keyboard and click() activations (detail 0) toggle the same way; the fresh-press rule in IconButton keeps
    // held or carried-over Enter and Space from making them. Each toggle reads the pending value (v => !v), so two
    // independent activations in one JS task toggle twice rather than both reading this render's open.
    onClick: () => { setOpen((v) => !v); },
  };
  const menuProps = {
    ref: menu, tabIndex: -1,
    onKeyDown: (e) => {
      const list = rows();
      if (!list.length) return;
      const at = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); list[(at + 1) % list.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); list[at <= 0 ? list.length - 1 : at - 1].focus(); }
      else if (e.key === "Enter" && at >= 0) { e.preventDefault(); run(at); }
    },
  };
  // an enabled row takes widget focus; its keyboard-active fill is the mark, so the row draws no outline of its own
  const rowProps = (i) => ({ tabIndex: 0, "data-more-row": i, style: { outline: "none" } });
  return { anchor, kb, run, close, triggerProps, menuProps, rowProps };
}

function BannerMore({ app, open, setOpen, onAction }) {
  const rowCount = app ? 2 : 0;
  // a row run returns focus to the trigger unless it closes the banner ("notice")
  const { anchor: wrap, kb, run, triggerProps, menuProps, rowProps } = useBannerMoreMenu({ open, setOpen, rowCount,
    onRun: (i) => { const which = i === 0 ? "notice" : "capture"; onAction && onAction(which); return which !== "notice"; } });
  const act = (which) => run(which === "notice" ? 0 : 1);
  // 2026-11-03 — name unknown (remote mirror, before first poll, lookup failed): the actions exist but can't run.
  // Same two rows, disabled (no hover, no click, menu stays open, nothing saved, keyboard skips them),
  // worded without a name, under a non-interactive reason line. Not updated live if the name arrives while open.
  const known = !!app;
  return (
    <span ref={wrap} style={{ position: "relative", width: "var(--tasty-size-24)", height: "var(--tasty-size-24)", flex: "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <IconButton size="sm" aria-label="More options" aria-expanded={open} active={open} {...triggerProps}>{bic.more}</IconButton>
      {open && (
        // The open menu holds key focus (surface scope), so its border shows focus (RULES.md "Popup focus").
        <div {...menuProps} role="menu" aria-label="Banner options" {...popupFocusAttr(true)} style={{ position: "absolute", outline: "none",
          top: "calc(100% + var(--tasty-banner-more-menu-offset))", right: 0, zIndex: 3,
          minWidth: "var(--tasty-banner-more-menu-min-width)", maxWidth: "var(--tasty-banner-more-menu-max-width)",
          width: known ? "max-content" : "var(--tasty-banner-more-menu-max-width)", boxSizing: "border-box",
          background: "var(--tasty-banner-more-menu-bg)",
          border: `var(--tasty-border-width) solid ${popupBorderColor(true)}`,
          borderRadius: "var(--tasty-banner-more-menu-radius)", padding: "var(--tasty-banner-more-menu-padding)",
          boxShadow: "var(--tasty-banner-more-menu-shadow)" }}>
          {known ? (<>
            <MenuItem icon={bic.bell} active={kb === 0} {...rowProps(0)} onClick={() => act("notice")}
              label={<MoreLabel text="Don't show again for " app={app} />} />
            <MenuItem icon={<Icon name="mouse" />} active={kb === 1} {...rowProps(1)} onClick={() => act("capture")}
              label={<MoreLabel text="Let Tasty handle clicks in " app={app} />} />
          </>) : (<>
            <div role="note" style={{ display: "flex", alignItems: "flex-start", gap: "var(--tasty-space-sm)",
              padding: "var(--tasty-space-xs) var(--tasty-space-md)", color: "var(--tasty-banner-more-reason-fg)",
              fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)" }}>
              <span style={{ display: "inline-flex", flex: "none", marginTop: "var(--tasty-banner-more-reason-glyph-offset)" }}><Icon name="info" size={14} /></span>
              <span style={{ minWidth: 0 }}>Can't tell which program is running, so nothing can be saved.</span>
            </div>
            <MenuItem separator />
            <MenuItem disabled wrap aria-disabled="true" icon={bic.bell} label="Don't show again for this program" />
            <MenuItem disabled wrap aria-disabled="true" icon={<Icon name="mouse" />} label="Let Tasty handle clicks in this program" />
          </>)}
        </div>
      )}
    </span>
  );
}

function Banner({ data, recessed, zIndex, backgrounded, onClose, onMenuOpen }) {
  const { glyph, glyphColor, title, body, actions, ttl, app } = data;
  const more = !!data.more; // 2026-11-03 — drawn whether or not the program name is known (unknown → disabled menu form)
  const [hover, setHover] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  // the host paints the surface under the open menu unfocused, as key focus is in the menu
  React.useEffect(() => { onMenuOpen && onMenuOpen(menuOpen); }, [menuOpen]);
  React.useEffect(() => () => { onMenuOpen && onMenuOpen(false); }, []);
  const onAction = (which) => { if (which === "notice") onClose && onClose(); };
  return (
    <BannerShell recessed={recessed} zIndex={zIndex}>
      <div data-banner-card="" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ display: "flex", alignItems: "flex-start", gap: "var(--tasty-banner-gap)",
          padding: "var(--tasty-banner-padding-y) var(--tasty-banner-padding-x)" }}>
        <span style={{ display: "inline-flex", flex: "none", marginTop: "var(--tasty-size-1)",
          color: glyphColor || "var(--tasty-banner-icon-fg)" }}>{glyph}</span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--tasty-size-2)",
          paddingRight: "var(--tasty-banner-more-reserve)" }}>
          <div style={{ fontSize: "var(--tasty-banner-title-font-size)", fontWeight: "var(--tasty-font-weight-semibold)",
            color: "var(--tasty-text-primary)", lineHeight: "var(--tasty-line-height-ui)" }}>{title}</div>
          {body && <div style={{ fontSize: "var(--tasty-banner-body-font-size)", color: "var(--tasty-banner-body-fg)",
            lineHeight: "var(--tasty-line-height-ui)" }}>{body}</div>}
          {actions && <div style={{ display: "flex", gap: "var(--tasty-space-sm)", marginTop: "var(--tasty-space-xs)" }}>{actions}</div>}
        </div>
        {/* affordance column — the ⋯ trigger (when the banner has one) then the dismiss slot */}
        <span style={{ position: "absolute", top: "var(--tasty-banner-padding-y)", right: "var(--tasty-space-sm)",
          display: "flex", alignItems: "center", gap: "var(--tasty-banner-more-column-gap)",
          opacity: more && !(hover || menuOpen) ? 0 : 1,
          transition: "opacity var(--tasty-banner-fade) var(--tasty-ease-ui)" }}>
          {more && <BannerMore app={app} open={menuOpen} setOpen={setMenuOpen} onAction={onAction} />}
          <BannerDismiss ttl={ttl} bannerHover={hover || menuOpen} backgrounded={backgrounded} onClose={onClose} />
        </span>
      </div>
    </BannerShell>
  );
}

// ── sample banners ──────────────────────────────────────────────────────
// Built lazily (at render) — NOT at module load. These compose DS components
// (Kbd / Button), and inside the compiled bundle this file evaluates before
// the DS namespace finishes populating, so a module-level `const SAMPLES`
// would create elements from still-undefined components. makeSamples() runs
// from BannerHost's render, by which point the namespace is ready.
function makeSamples() {
  return {
  mouse: {
    id: "mouse-capture", glyph: bic.mouse, glyphColor: "var(--tasty-text-secondary)", more: true, app: "vim",
    title: "Mouse reporting captured your drag",
    body: (<><b style={{ color: "var(--tasty-text-secondary-raised)" }}>vim</b> has mouse tracking on, so drag-to-select is disabled. Hold <Kbd keys="Shift" /> to select anyway.</>),
  },
  mouseUnknown: {
    id: "mouse-capture", glyph: bic.mouse, glyphColor: "var(--tasty-text-secondary)", more: true, app: null,
    title: "Mouse reporting captured your drag",
    body: (<>The running program has mouse tracking on, so drag-to-select is disabled. Hold <Kbd keys="Shift" /> to select anyway.</>),
  },
  preset: {
    id: "preset-applied", glyph: bic.check, glyphColor: "var(--tasty-accent-success)", ttl: 6,
    title: (<>Preset <b style={{ color: "var(--tasty-text-primary)" }}>Dev split</b> applied to this tab.</>),
  },
  shell: {
    id: "shell-integration-missing", glyph: bic.warn, glyphColor: "var(--tasty-accent-warning)", ttl: 10,
    title: "Shell integration not detected",
    body: "Command-completion hooks (docker build, just run, etc.) need OSC 133 shell integration. See docs/features/hooks for setup.",
  },
  err: {
    id: "write-failed", glyph: bic.warn, glyphColor: "var(--tasty-accent-danger)",
    title: "Couldn’t write config.toml",
    body: "Permission denied. Check the file owner, or open it to resolve the conflict.",
    actions: (<><Button variant="secondary" size="sm">Retry</Button><Button variant="ghost" ground="raised" size="sm">Open file</Button></>),
  },
  };
}

// ── interactive host — one shown per scope, the rest queue (max 5) ──────
function BannerHost() {
  const SAMPLES = React.useMemo(makeSamples, []);
  const [stack, setStack] = React.useState(() => [SAMPLES.mouse]); // [0] = shown
  const [bg, setBg] = React.useState(false);                 // scope backgrounded → TTL pauses
  const [menuOpen, setMenuOpen] = React.useState(false);     // an open ⋯ menu holds key focus → the terminal paints unfocused
  const bed = menuOpen ? "unfocused" : "focused";

  const spawn = (key) => setStack((s) => {
    const sample = { ...SAMPLES[key] };
    if (s[0] && s[0].id === sample.id) return [{ ...sample, _k: Math.random() }, ...s.slice(1)]; // same id shown → reset
    if (s.some((b) => b.id === sample.id)) return s;          // dup already queued → ignore
    if (s.length >= 6) return s;                              // 1 shown + 5 queued = full → ignore
    return [...s, sample];
  });
  const close = () => setStack((s) => s.slice(1));

  const shown = stack[0];
  const queued = Math.max(0, stack.length - 1);
  const Ctrl = ({ children, onClick, on }) => (
    <Button variant={on ? "secondary" : "ghost"} size="sm" onClick={onClick}>{children}</Button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "100%", maxWidth: 760 }}>
      {/* demo control bar — not part of the component */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", flexWrap: "wrap",
        padding: "var(--tasty-space-sm)", border: "var(--tasty-border-width) solid var(--tasty-separator)",
        borderRadius: "var(--tasty-radius)", background: "var(--tasty-bg-sidebar)" }}>
        <span style={{ fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)", textTransform: "uppercase",
          letterSpacing: "var(--tasty-letter-spacing-caps)", color: "var(--tasty-text-muted)" }}>spawn</span>
        <Ctrl onClick={() => spawn("mouse")}>Mouse capture</Ctrl>
        <Ctrl onClick={() => spawn("mouseUnknown")}>Mouse capture (name unknown)</Ctrl>
        <Ctrl onClick={() => spawn("preset")}>Preset (TTL 6s)</Ctrl>
        <Ctrl onClick={() => spawn("shell")}>Shell integration (TTL 10s)</Ctrl>
        <Ctrl onClick={() => spawn("err")}>Write error</Ctrl>
        <span style={{ width: "var(--tasty-border-width)", alignSelf: "stretch", background: "var(--tasty-separator)", margin: "0 var(--tasty-space-xs)" }} />
        <Ctrl on={bg} onClick={() => setBg((b) => !b)}>{bg ? "Backgrounded ✓" : "Background scope"}</Ctrl>
        <span style={{ flex: 1 }} />
        {queued > 0 && <Tag variant="accent">+{queued} queued</Tag>}
      </div>

      {/* faux scope: tab bar (must stay clear) + terminal content + the banner zone */}
      <div style={{ position: "relative", width: "100%", height: 320, borderRadius: "var(--tasty-radius)", overflow: "hidden",
        border: "var(--tasty-border-width) solid var(--tasty-border-default)", background: `var(--tasty-surface-terminal-${bed}-bg)`,
        opacity: bg ? 0.55 : 1, transition: "opacity var(--tasty-banner-fade) var(--tasty-ease-ui)" }}>
        <div style={{ display: "flex", alignItems: "stretch", height: 28, flex: "none",
          background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
          {["server", "dev", "vim"].map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", padding: "0 var(--tasty-space-md)", fontSize: "var(--tasty-font-size-body)",
              borderRight: "var(--tasty-border-width) solid var(--tasty-separator)",
              background: i === 2 ? "var(--tasty-bg-panel)" : "transparent",
              color: i === 2 ? "var(--tasty-text-primary)" : "var(--tasty-text-muted)",
              boxShadow: i === 2 ? "inset 0 -2px 0 var(--tasty-accent-primary)" : "none" }}>{t}</div>
          ))}
        </div>
        <div data-terminal-content="" style={{ padding: "var(--tasty-space-md) var(--tasty-size-14)", fontFamily: "var(--tasty-font-mono)",
          fontSize: "var(--tasty-font-size-term-sm)", lineHeight: 1.6, color: `var(--tasty-surface-terminal-${bed}-fg)`, opacity: 0.4 }}>
          <div><span data-audit-exempt="ansi-content" style={{ color: "var(--tasty-ansi-green)" }}>~/tasty</span> $ vim src/main.rs</div>
          <div>-- VISUAL --   1,1   Top</div>
        </div>
        {/* banner zone — 8px below the tab bar, 8px side margins, no bottom margin */}
        <div style={{ position: "absolute", top: "calc(28px + var(--tasty-banner-margin))",
          left: "var(--tasty-banner-margin)", right: "var(--tasty-banner-margin)" }}>
          {shown && <Banner key={shown.id + (shown._k || "")} data={shown} backgrounded={bg} onClose={close} onMenuOpen={setMenuOpen} />}
          {!shown && (
            <div style={{ textAlign: "center", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", paddingTop: "var(--tasty-space-md)" }}>
              No banner — spawn one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Banner, BannerShell, BannerHost, useBannerMoreMenu };
