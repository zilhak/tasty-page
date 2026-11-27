import React from "react";
import { SearchBar } from "../../ui_kits/terminal/overlays/search_bar.jsx";
import { PageStates } from "../parts/specimen.jsx";
import { STATES } from "./states.jsx";
import { Button, Kbd, MenuItem } from "../../components/index.js";
import { ToolsMenu } from "../../ui_kits/terminal/overlays/tools_menu.jsx";
import { GalleryNoticeColumn } from "./notice-column.jsx";
import { GalleryWebviewOpaque } from "./opaque-over-page.jsx";
import { GalleryToastOverPage } from "./toast-over-page.jsx";
import { GroundThemes as PGroundThemes, GroundCap as PGroundCap, ToolsMenuFrame, SearchBarFrame, HeldLabel, TabStripMock, SidebarMock, RailMock, CatSwitchSidebarMock, CatSwitchRailMock, ic, CatMenu, RailCategoryFrame, catIc, ModifierHintPanelG, MH_CAT_SECTIONS, MH_MIXED_SECTIONS, MH_EMPTY_SECTIONS } from "../parts/overlay-frames.jsx";
import { Section, Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { RemoteRowMenuItems } from "../../ui_kits/terminal/overlays/remote_row.jsx";
import { FallbackMenuSection } from "./fallback-menu.jsx";

// Tasty Gallery — Overlays · Popups & menus (anchored, no scrim)
// One of the five Overlays sub-pages (dialogs · windows · popups · banners · tutorial). Frame components are shared from
// parts/overlay-frames.jsx (parts/overlay-frames.jsx); this file holds only the
// page's specimens + nav. See the other overlays-*.jsx for the rest.





const NAV = [
  { id: "tools", label: "Tools menu" },
  { id: "fallback", label: "Fallback context menu" },
  { id: "search", label: "Search bar" },
  { id: "switch", label: "Switch-number overlay" },
  { id: "modhint", label: "Modifier hints" },
  { id: "categories", label: "Workspace categories" },
  { id: "notices", label: "Notice column · restore notice" },
  { id: "webview", label: "Over a web page (opaque)" },
];

// Interactive hold-to-reveal demo: press & hold the button; after a 500ms dwell
// the panel fades in (opacity 0.2→1 over 200ms). Release dismisses instantly.
// Reduced-motion shows it immediately with no fade.
function ModHintHoldDemo() {
  const reduce = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [phase, setPhase] = React.useState("idle"); // idle | pending | shown
  const [op, setOp] = React.useState(reduce ? 1 : 0.2);
  const timer = React.useRef(null);
  const start = () => {
    if (phase !== "idle") return;
    setPhase("pending");
    timer.current = setTimeout(() => setPhase("shown"), 500);
  };
  const stop = () => { clearTimeout(timer.current); setPhase("idle"); };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (phase !== "shown") { setOp(reduce ? 1 : 0.2); return undefined; }
    if (reduce) { setOp(1); return undefined; }
    setOp(0.2);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOp(1)));
    return () => cancelAnimationFrame(id);
  }, [phase, reduce]);
  const status = phase === "idle" ? "press & hold" : phase === "pending" ? "holding… (500ms)" : "showing";
  return (
    <div style={{ position: "relative", width: "var(--tasty-mod-hint-specimen-width)", flex: "none", height: 460, borderRadius: "var(--tasty-radius)",
      overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-border-default)", background: "var(--tasty-bg-app)" }}>
      {/* faux app: sidebar + terminal surface */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ width: 180, flex: "none", background: "var(--tasty-bg-sidebar)", borderRight: "var(--tasty-border-width) solid var(--tasty-separator)" }} />
        <div style={{ flex: 1, background: "var(--tasty-surface-terminal-focused-bg)" }} />
      </div>
      {/* the hold control, centred on the surface */}
      <div style={{ position: "absolute", top: 20, left: 200, display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button"
          onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={(e) => { e.preventDefault(); start(); }} onTouchEnd={stop}
          style={{ appearance: "none", cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 8,
            height: "var(--tasty-control-height)", padding: "0 var(--tasty-space-md)", borderRadius: "var(--tasty-radius)",
            border: "var(--tasty-border-width) solid var(--tasty-border-strong)",
            background: phase === "idle" ? "var(--tasty-surface-raised)" : "var(--tasty-surface-active)",
            color: "var(--tasty-text-secondary)", fontFamily: "var(--tasty-font-ui)", fontSize: 13 }}>
          <Kbd keys="Ctrl" /><span>Hold</span>
        </button>
        <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: 11, color: "var(--tasty-text-muted)" }}>{status}</span>
      </div>
      {/* the panel — default position: bottom-left, above the sidebar footer */}
      {phase === "shown" && (
        <div style={{ position: "absolute", left: 12, bottom: 12, opacity: op,
          transition: reduce ? "none" : "opacity var(--tasty-modhint-fade) var(--tasty-ease-ui)" }}>
          <ModifierHintPanelG />
        </div>
      )}
    </div>
  );
}

// The kit's own Tools menu in a room with fixed host chrome across its top, as the landing's site header: the button
// sits just under the band, so the menu, opened above it at its own height, would start above the room. It is moved
// down to the room's top edge (and over the button), as the app's clamp_to_screen moves it inside the window. The
// band and the room are in this box's coordinates, which the menu takes as its anchor and bounds. A frame is a
// picture, so it is inert: the menu takes no focus and no keys.
// With hostRuns, the same room with no band and the button low in it: the menu opens above the button, and the rows
// the host cannot run draw disabled (here the landing's list, which has no Tutorial, Task DAGs, child graph or file
// picker window).
const TM_ROOM = { w: 360, h: 420, band: 56, btnTop: 60, btnH: 24 };
// With roomRight, the room the host passes ends left of the box's right edge, narrower than the menu: the menu is
// drawn at the room's width, as the app draws a popup at the size clamp_to_screen leaves it.
function ToolsMenuInRoomFrame({ band = TM_ROOM.band, btnTop = TM_ROOM.btnTop, hostRuns = null, roomRight = TM_ROOM.w }) {
  const anchor = { top: btnTop, bottom: btnTop + TM_ROOM.btnH, left: 8, right: 168, width: 160, height: TM_ROOM.btnH };
  const bounds = { top: band, left: 0, right: roomRight, bottom: TM_ROOM.h };
  return (
    <div inert="" style={{ position: "relative", width: TM_ROOM.w, maxWidth: "100%", height: TM_ROOM.h, overflow: "hidden", pointerEvents: "none",
      background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
      {band > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: band, display: "flex", alignItems: "center", padding: "0 var(--tasty-space-md)",
        background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-default)" }}>
        <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>host chrome · fixed · outside bounds</span>
      </div>}
      {/* the part of the box past the room's right edge, drawn as the band above is, so the room's width shows */}
      {roomRight < TM_ROOM.w && <div style={{ position: "absolute", left: roomRight, right: 0, top: band, bottom: 0,
        background: "var(--tasty-bg-sidebar)", borderLeft: "var(--tasty-border-width) solid var(--tasty-border-default)" }} />}
      <div style={{ position: "absolute", left: 8, top: btnTop, width: 160 }}>
        <Button variant="ghost" size="sm" block leadingIcon={ic.tools} style={{ justifyContent: "flex-start" }}>Tools</Button>
      </div>
      <ToolsMenu anchor={anchor} bounds={bounds} hostRuns={hostRuns} onClose={() => {}} onAction={() => {}} />
    </div>
  );
}

// The kit's Tools menu, live, in a room shorter than the menu: the Tools button opens it as a host does, with the
// button's rect as the anchor and the box as the room (both in the box's coordinates, as the menu is placed inside
// the box), so the menu is cut to the box and scrolls. It takes the keys once it is placed; a key that marks a row out
// of view scrolls the menu to it, and the page stays where it is. The wheel scrolls the rows and leaves the mark, and
// Enter or Space on a marked row scrolled wholly out of view scrolls the menu to show it and runs nothing, and holding
// the key does not run it; Space never scrolls the list the browser's way. Running a row or Esc closes it and hands
// the focus back to the button, and the key that ran the row, still held, does not reopen it: the button clicks only
// on a new press that began on it (Button, fresh-press.js). The box is 240 high, and less in a window shorter than 420 (never less than 120): shortening the
// window with a row marked shortens the room, and the menu, refitted, still shows the marked row. The frozen views
// below are for the contrast check; this one is for the pointer and the keys.
function ToolsMenuLiveDemo() {
  const boxRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const [anchor, setAnchor] = React.useState(null);
  const room = React.useCallback(() => {
    const box = boxRef.current;
    return { top: 0, left: 0, right: box ? box.clientWidth : 0, bottom: box ? box.clientHeight : 0 };
  }, []);
  const close = React.useCallback(() => {
    setAnchor(null);
    const b = btnRef.current && btnRef.current.querySelector("button");
    if (b) b.focus({ preventScroll: true });
  }, []);
  const open = (e) => {
    const box = boxRef.current.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor((a) => (a ? null : { top: r.top - box.top, bottom: r.bottom - box.top, left: r.left - box.left, right: r.right - box.left, width: r.width, height: r.height }));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", width: TM_ROOM.w, maxWidth: "100%" }}>
      <div ref={boxRef} data-tools-live="" style={{ position: "relative", height: "clamp(120px, calc(100vh - 180px), 240px)", overflow: "hidden",
        background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
        <div ref={btnRef} style={{ position: "absolute", left: 8, bottom: 8, width: 160 }}>
          <Button variant="ghost" size="sm" block leadingIcon={ic.tools} style={{ justifyContent: "flex-start" }} onClick={open}>Tools</Button>
        </div>
        {anchor && <ToolsMenu anchor={anchor} bounds={room} onClose={close} onAction={close} />}
      </div>
      <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>case 1 · scroll the page until the demo is near the top of the screen · click Tools · ↓ ↑ Tab Shift+Tab mark rows · press Shift+Tab to mark the last row · make the browser window about 300px tall → menu scrolls as needed to keep the marked row in view · Enter or Space runs the marked row · case 2 · click Tools · press Shift+Tab to mark Git · wheel-scroll the menu until Git is fully out of view · press and hold Enter or Space → menu scrolls to show Git and nothing runs · keep holding the key → menu stays open and nothing runs · release the key and press Enter or Space again → menu closes and focus returns to the Tools button · keep holding the key, then release it → menu stays closed · case 3 · click Tools · press Space before marking a row → list stays put · Esc closes</span>
    </div>
  );
}

// The kit search bar, live, over a terminal with five matches of "tasty". It mounts on Open search, so its field's
// autofocus does not take the page's focus while the reader scrolls past. Previous and Next keep the focus and step
// once per click, and they take keyRepeat (fresh-press.js): holding Enter on one keeps stepping, one match per
// repeat, as holding Enter in the field does; Space steps once on release. Esc or close puts the button back.
const SEARCH_LIVE_LINES = ["~/work/tasty", "$ tasty list surfaces", "tasty: 3 surfaces", "$ tasty read since-mark", "tasty-agent ok"];
function SearchBarLiveDemo() {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => { const b = btnRef.current && btnRef.current.querySelector("button"); if (b) b.focus({ preventScroll: true }); });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", width: 420, maxWidth: "100%" }}>
      <div data-search-live="" style={{ position: "relative", height: 120, boxSizing: "border-box", padding: "var(--tasty-space-sm)",
        background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)",
        fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>
        {SEARCH_LIVE_LINES.map((l) => <div key={l}>{l}</div>)}
        {open && <SearchBar lines={SEARCH_LIVE_LINES} onClose={close} />}
      </div>
      <div ref={btnRef} style={{ display: "flex" }}>
        {!open && <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Open search</Button>}
      </div>
      <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>click Open search · type tasty → 1/5 · Tab to ▲ or ▼ · press Enter → one step · hold Enter → one more step per repeat, wrapping 5/5 → 1/5 · release and press Space → one step on release · Esc closes</span>
    </div>
  );
}

function Page() {
  return (
    <>
<Section id="tools" title="Tools menu">
        <Spec id="tools-menu-anchored-no-scrim" title="Tools menu — anchored, no scrim"
          when={<>A popup anchored <b>above</b> the sidebar Tools button (left-aligned to it). Unlike the modal layer this is a lightweight menu — <b>no scrim</b>, dismisses on outside click or <Kbd keys="Esc" />. Built-in entries first, in this fixed order — <b>Command palette… · Listening ports… · Remote connections… · Presets · Tutorial… · Task DAGs · Open child graph · Open File…</b> — then a separator, then <b>plugin-contributed</b> tools in manifest <code>order</code> (Clipboard Viewer 100 · Git 130). Every label that opens a further window ends in the single ellipsis character <code>…</code>, never three periods. <b>Width (2026-10-07)</b>: the menu is as wide as its longest row (label + <span className="tok">--tasty-menu-item-padding-x</span> both sides + the 4 ring + border), never narrower than <b>160</b> and never wider than <b>240</b>; a label past 240 ellipsizes at its <b>end</b>. This covers translated labels without a per-locale width.</>}>
          <Stage variant="solo center"><ToolsMenuFrame /></Stage>
          <Stage variant="solo center"><ToolsMenuLiveDemo /></Stage>
          <Meta
            specs={[["width", <>fit content · min 160 <span className="tok">--tasty-tools-menu-min-width</span> · max 240 <span className="tok">--tasty-tools-menu-max-width</span></>], ["overflow", "end ellipsis past max"], ["anchor", "above button, left-aligned"], ["kept in room", "as the app's clamp_to_screen · top in [room top, room bottom − height] · left in [room left, room right − width] · room narrower than the menu → room width, labels end in … · menu taller than the room → room height, rows scroll · room = window, or what host passes as bounds (the part its fixed chrome leaves)"], ["anchor and size", "anchor stays where the button was when the menu opened · window resize or host bounds change → refit the menu from its full size to the current room · menu grows back as the room grows · refit to a shorter room → menu scrolls just enough to show the row marked by a key, keeping its mark and focus and the page in place · no marked row → menu keeps its scroll position on refit"], ["key scrolling", "key marks a row → menu scrolls just enough to show the whole row · page stays put"], ["wheel scrolling", "wheel scrolls rows and leaves the mark in place · marked row fully out of view → first Enter or Space shows the whole row and runs nothing"], ["rows", "28px MenuItem, no icons"], ["built-in", "8 — fixed order"], ["inner ring", <>4 · <span className="tok">--tasty-popup-content-margin</span></>], ["scrim", "none"], ["dismiss", <>outside click · <span className="ic">Esc</span></>], ["open", "Menu takes keyboard input · no row marked"], ["Down · Tab", "Unmarked → first runnable row · then next runnable row · stop at last"], ["Up · Shift+Tab", "Unmarked → last runnable row · then previous runnable row · stop at first"], ["runnable rows", "Disabled plugin tools are never marked · a host (kit demo, landing) passes the rows it can run; the others draw disabled, as in the host-rows view"], ["keys", "Enter or Space → do nothing if no row is marked, show the whole row if fully out of view, or run it if any part is in view · only a new press acts, repeats while holding Enter or Space do nothing · Esc → close menu"], ["marked row", "MenuItem keyboard-active fill and inks · no focus ring · pointer tints others"]]}
            tokens={[{ tok: "--tasty-menu-bg", use: "menu fill", color: "var(--tasty-menu-bg)" }, { tok: "--tasty-menu-border", use: "edge → border-strong", color: "var(--tasty-menu-border)" }, { tok: "--tasty-popup-content-margin", use: "→ space-xs 4" }, { tok: "--tasty-tools-menu-min-width", use: "→ size-160" }, { tok: "--tasty-tools-menu-max-width", use: "→ size-240" }, { tok: "--tasty-shadow-popover", use: "lift" }]} />
          <Views>
            <View name="tools-menu-keyboard-row" label="Down twice from open → Listening ports… · keyboard-active">
              <ToolsMenuFrame active="Listening ports…" />
            </View>
            <View name="tools-menu-kept-in-room" label="Button just under fixed host chrome → menu moved down to the room's top edge">
              <ToolsMenuInRoomFrame />
            </View>
            <View name="tools-menu-host-rows" label="A host without some tools' windows → those rows disabled, skipped by keys">
              <ToolsMenuInRoomFrame band={0} btnTop={380} hostRuns={["palette", "ports", "remote", "presets", "clipboard", "git"]} />
            </View>
            <View name="tools-menu-narrow-room" label="Room 120 wide → menu fills the width, labels end in …">
              <ToolsMenuInRoomFrame band={0} btnTop={380} roomRight={120} />
            </View>
          </Views>
          <Note>Plugins extend the list <b>below</b> the separator only — built-in order is fixed. This is a popover, not a dialog: it never dims the app.</Note>
        </Spec>
      </Section>

<FallbackMenuSection />

<Section id="search" title="Search bar">
        <Spec id="search-bar-ctrl-f-headless" title="Search bar — Ctrl/⌘F, headless"
          when={<>A <b>360px</b> headless popup floating at the <b>top-right of the focused surface</b> — not on a scrim, and it <b>stays open</b> on outside click. One row: a flex Input, a <code>cur/total</code> counter (red on zero matches), ▲▼ steppers, <code>Aa</code> / <code>.*</code> / <code>ab</code> option toggles, a divider, and close. <Kbd keys="↵" /> next, <Kbd keys="Esc" /> closes.</>}>
          <Stage variant="solo center"><SearchBarFrame /></Stage>
          <Stage variant="solo center"><SearchBarLiveDemo /></Stage>
          <Meta
            specs={[["frame", "360 × 28 row"], ["anchor", "top-right of focused surface"], ["counter", "cur/total · red on 0"], ["toggles", "Aa · .* · ab"], ["▲ ▼ keys", "keep the focus · one step per click · Enter steps on press and again on each repeat of that press (keyRepeat) · Space one step on release · an Enter that began elsewhere does nothing until a new press"], ["dismiss", <span className="ic">Esc</span>]]}
            tokens={[{ tok: "--tasty-surface-raised", use: "bar fill", color: "var(--tasty-surface-raised)" }, { tok: "--tasty-popup-border-focused", use: "bar edge while the bar holds key focus", color: "var(--tasty-popup-border-focused)" }, { tok: "--tasty-popup-border-unfocused", use: "bar edge while key focus is elsewhere", color: "var(--tasty-popup-border-unfocused)" }, { tok: "--tasty-border-strong", use: "divider between option toggles and close button", color: "var(--tasty-border-strong)" }, { tok: "--tasty-accent-danger", use: "no-match counter", color: "var(--tasty-accent-danger-raised)" }, { tok: "--tasty-shadow-popover", use: "lift" }]} />
          <Note>Sticky-focus popover: the input keeps focus and the bar persists through clicks in the terminal — it closes only on <span className="ic">Esc</span> or its × button.</Note>
        </Spec>
        <Spec id="query-field-ground-normal-focused-invalid" title="Query field ground — normal · focused · invalid"
          when={<>The bar is <span className="tok">--tasty-surface-raised</span>, so the query field is an <b>Input ground="raised"</b> (the 10-14 rule, no exception): <code>bg-panel</code> fill, <code>border-control-raised</code> edge. <b>normal</b> is the box after a shortcut hands focus back to the terminal; the bar stays open. <b>invalid</b> is a regex error with <code>.*</code> on: the edge is <code>accent-danger</code> in both focus states, and focused adds the danger ring. Behaviour (Enter, Shift+Enter, Esc, filtering) and copy are unchanged.</>}>
          <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
            <PGroundThemes render={() => (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: 400, maxWidth: "100%" }}>
                <PGroundCap>normal — focus back in the terminal</PGroundCap><SearchBarFrame height={48} />
                <PGroundCap>focused</PGroundCap><SearchBarFrame height={48} focused />
                <PGroundCap>invalid · focused</PGroundCap><SearchBarFrame height={48} focused invalid value="(tas" />
                <PGroundCap>invalid · focus in the terminal</PGroundCap><SearchBarFrame height={48} invalid value="(tas" />
              </div>
            )} />
          </Stage>
          <Meta
            specs={[["field ground", <>ground="raised" · no exception</>], ["normal", <>input-raised-bg → bg-panel · input-raised-border → border-control-raised</>], ["focused", <>border-focus edge + 1px border-focus ring</>], ["invalid", <>accent-danger edge · focused adds 1px accent-danger ring · counter 0/0 accent-danger</>], ["Mocha / Latte", "bg-panel = base · border-control-raised = overlay1 in Mocha, subtext0 in Latte · bar surface-raised = surface0"]]}
            tokens={[{ tok: "--tasty-input-raised-bg", use: "field fill", color: "var(--tasty-input-raised-bg)" }, { tok: "--tasty-input-raised-border", use: "field edge", color: "var(--tasty-input-raised-border)" }, { tok: "--tasty-border-focus", use: "focused", color: "var(--tasty-border-focus)" }, { tok: "--tasty-accent-danger", use: "invalid", color: "var(--tasty-accent-danger-raised)" }]} />
        </Spec>
      </Section>

<Section id="switch" title="Switch-number overlay">
        <Spec id="tab-switch-overlay-modifier-held" title="Tab switch overlay — modifier held"
          when={<>Holding the <b>tab switch modifier</b> (<Kbd keys="Ctrl" /> by default — rebindable) paints a number keycap over <b>every tab</b>, previewing the <Kbd keys="Ctrl+1" />…<Kbd keys="Ctrl+9" /> / <Kbd keys="Ctrl+0" /> switch shortcuts. The keycap <b>replaces the tab's leading icon in place</b> — no width change, no scrim; the icon returns on release. The <b>active</b> tab's keycap is <b>accent-filled</b> so "where am I" stays legible. Workspaces show nothing — only the modifier bound to tabs triggers this.</>}>
          <Stage variant="solo center" style={{ flexDirection: "column", gap: 16, padding: 20, background: "var(--tasty-bg-app)" }}>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>released — each tab shows its surface icon</div>
              <TabStripMock held={false} />
            </div>
            <div>
              <HeldLabel keys="Ctrl">icon slot becomes the number keycap</HeldLabel>
              <TabStripMock held={true} />
            </div>
          </Stage>
          <Meta
            specs={[["widget", <><span className="ic">Kbd</span> keycap · 16px</>], ["content", "digit only · 0 = 10th tab"], ["placement", "replaces leading icon, in place"], ["range", "1–9 + 0; 11th tab onward: none"], ["active tab", "accent-filled keycap"], ["scrim", "none"], ["appear", "90ms fade · release 0ms"]]}
            tokens={[{ tok: "--tasty-switch-overlay-bg", use: "keycap fill", color: "var(--tasty-switch-overlay-bg)" }, { tok: "--tasty-switch-overlay-active-bg", use: "active-tab keycap", color: "var(--tasty-switch-overlay-active-bg)" }, { tok: "--tasty-switch-overlay-border", use: "keycap edge", color: "var(--tasty-switch-overlay-border)" }, { tok: "--tasty-switch-overlay-fade", use: "90ms appear" }]} />
          <Note>The digit equals the <b>key you press</b>, so the 10th tab reads <span className="ic">0</span> (not "10") to match <Kbd keys="Ctrl+0" />. Tabs past the 10th carry no shortcut, so they get <b>no keycap</b> — never paint a number a key won't trigger.</Note>
        </Spec>
        <Spec id="workspace-switch-overlay-modifier-held" title="Workspace switch overlay — modifier held"
          when={<>Holding the <b>workspace switch modifier</b> (<Kbd keys="Alt" /> by default — rebindable) paints a keycap over <b>each sidebar workspace</b>, previewing <Kbd keys="Alt+1" />…<Kbd keys="Alt+9" />. In the <b>full</b> sidebar the keycap replaces the leading <b>status dot</b>; in the <b>collapsed</b> rail it replaces the <b>letter avatar</b>. Same in-place, no-scrim rule as tabs; tabs show nothing here. Releasing dismisses instantly.</>}>
          <Stage variant="solo center" style={{ alignItems: "flex-start", gap: 24, padding: 20, background: "var(--tasty-bg-app)", flexWrap: "wrap" }}>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>released — full sidebar</div>
              <SidebarMock held={false} />
            </div>
            <div>
              <HeldLabel keys="Alt">status dot becomes the keycap</HeldLabel>
              <SidebarMock held={true} />
            </div>
            <div>
              <HeldLabel keys="Alt">collapsed rail · letter becomes the keycap</HeldLabel>
              <RailMock />
            </div>
          </Stage>
          <Meta
            specs={[["widget", <><span className="ic">Kbd</span> keycap · 16px</>], ["content", "digit only (1–9)"], ["full placement", "replaces status dot"], ["collapsed", "replaces letter avatar"], ["range", "1–9 only; 10th onward: none"], ["active ws", "accent-filled keycap"], ["scrim", "none"]]}
            tokens={[{ tok: "--tasty-switch-overlay-bg", use: "keycap fill", color: "var(--tasty-switch-overlay-bg)" }, { tok: "--tasty-switch-overlay-active-bg", use: "active-ws keycap", color: "var(--tasty-switch-overlay-active-bg)" }, { tok: "--tasty-switch-overlay-active-fg", use: "digit on accent", color: "var(--tasty-switch-overlay-active-fg)" }, { tok: "--tasty-switch-overlay-size", use: "16px footprint" }]} />
          <Note>Workspace shortcuts only go <b>1–9</b> (no <span className="ic">0</span>), so the 10th workspace and beyond get <b>no keycap</b> — in the collapsed rail they keep their letter avatar (last item above). The bound modifier is read from the same keybindings the shortcut uses: rebind it and the overlay follows.</Note>
          <Do><b>Do</b> replace the leading indicator rather than overlapping the label — the keycap's own surface-raised fill + border clears 4.5:1 on both tab and sidebar backgrounds without a scrim.</Do>
        </Spec>
        <Spec id="category-switch-overlay-ctrl-shift-held" title="Category switch overlay — Ctrl+Shift held"
          when={<>A third switch axis, present only when <b>Workspace categories (folders)</b> is on. Holding the <b>category switch modifier</b> (<Kbd keys="Ctrl+Shift" /> by default — rebindable) paints a keycap over <b>each category</b>, previewing <Kbd keys="Ctrl+Shift+1" />…<Kbd keys="Ctrl+Shift+9" /> / <Kbd keys="Ctrl+Shift+0" />. In the <b>full</b> sidebar the keycap is <b>right-aligned on the category header</b> — it does <b>not</b> replace the chevron, which stays to carry collapse state (and its auto-expand rotation). In the <b>rail</b> it sits <b>centered on the <code>---</code> boundary</b>. The reserved <b>normal</b> category (“Workspaces”) is <b>1</b>. This overlay and the workspace overlay are <b>modifier-exclusive</b> — <Kbd keys="Alt" /> paints workspaces, <Kbd keys="Ctrl+Shift" /> paints categories, never both at once, so workspace rows keep their status dots here. The chord is the product default <code>category_switch_modifier = ctrl+shift</code> (every preset) — the gallery and the app read it from there.</>}>
          <Stage variant="solo center" style={{ alignItems: "flex-start", gap: 24, padding: 20, background: "var(--tasty-bg-app)", flexWrap: "wrap" }}>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>released — full sidebar with categories</div>
              <CatSwitchSidebarMock held={false} />
            </div>
            <div>
              <HeldLabel keys="Ctrl+Shift">category header gets a trailing keycap</HeldLabel>
              <CatSwitchSidebarMock held={true} />
            </div>
            <div>
              <HeldLabel keys="Ctrl+Shift">collapsed rail · <code>---</code> becomes the keycap</HeldLabel>
              <CatSwitchRailMock held={true} />
            </div>
          </Stage>
          <Meta
            specs={[["widget", <><span className="ic">Kbd</span> keycap · 16px</>], ["content", "digit only · 0 = 10th category"], ["full placement", "trailing on header — chevron kept"], ["rail", <>centered on the <code>---</code> boundary</>], ["range", "1–9 + 0; 11th category onward: none"], ["reserved", "normal (“Workspaces”) = 1"], ["active cat", "accent-filled keycap"], ["exclusivity", "Ctrl = tabs · Alt = ws · Ctrl+Shift = category"], ["default", "category_switch_modifier = ctrl+shift"]]}
            tokens={[{ tok: "--tasty-switch-overlay-bg", use: "keycap fill", color: "var(--tasty-switch-overlay-bg)" }, { tok: "--tasty-switch-overlay-active-bg", use: "active-category keycap", color: "var(--tasty-switch-overlay-active-bg)" }, { tok: "--tasty-switch-overlay-active-fg", use: "digit on accent", color: "var(--tasty-switch-overlay-active-fg)" }, { tok: "--tasty-surface-active", use: "landed workspace row", color: "var(--tasty-surface-active)" }]} />
          <Note><b>Auto-expand:</b> switching to a <b>collapsed</b> category rotates its chevron open and reveals its rows (the chevron is why it isn't replaced by the keycap) — the new collapse state persists in <code>layout.json</code>. <b>Last-active:</b> the switch lands on that category's most-recently-focused workspace (its first if never visited), shown with the ordinary <b>surface-active + 2px accent bar</b> — no separate affordance. Reuses the <span className="ic">NumCap</span> keycap and every <span className="tok">--tasty-switch-overlay-*</span> token; no new tokens.</Note>
        </Spec>
      </Section>

<Section id="modhint" title="Modifier hints">
        <Spec id="modifier-hint-panel-hold-to-reveal" title="Modifier hint panel — hold to reveal"
          when={<>A floating, <b>focus-less</b> discoverability panel painted while a modifier is <b>held</b> — like macOS's hold-⌘ shortcut sheet. Press &amp; hold the <Kbd keys="Ctrl" /> control: after a <b>500ms</b> dwell the panel <b>fades in</b> (opacity 0.2→1 over 200ms); release dismisses it <b>instantly</b>. It defaults to the <b>bottom-left</b>, just above the sidebar footer, and is <b>draggable</b> + edge-<b>resizable</b>. It never dims the app and never takes keyboard focus.</>}>
          <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
            <ModHintHoldDemo />
          </Stage>
          <Meta
            specs={[["trigger", <>modifier held <b>500ms</b></>], ["default size", <>180 × 400 · <span className="tok">--tasty-modhint-width</span> × <span className="tok">--tasty-modhint-height</span></>], ["default pos", "bottom-left, above sidebar footer"], ["appear", "fade opacity 0.2→1 · 200ms"], ["release", "0ms — instant dismiss"], ["focus", "never — not a focus window"], ["scrim", "none"]]}
            tokens={[{ tok: "--tasty-modhint-bg", use: "panel fill", color: "var(--tasty-modhint-bg)" }, { tok: "--tasty-modhint-shadow", use: "floating lift" }, { tok: "--tasty-modhint-fade", use: "200ms fade-in" }, { tok: "--tasty-modhint-hold-delay", use: "500ms hold" }]} />
          <Note>Reduced motion skips the fade — the panel appears at full opacity the instant the 500ms hold completes. The <b>bound</b> modifier set is read from the same keybindings source the shortcuts use (Win/Linux: Ctrl / Alt / Shift; macOS adds Cmd / Option).</Note>
        </Spec>

        <Spec id="anatomy-chord-ordering" title="Anatomy & chord ordering"
          when={<>Sections are the shortcut <b>chords that contain the held modifier</b>, ordered by <b>chord size</b> (1→2→3→4) then by modifier priority <b>Ctrl → Cmd/Alt → Option → Shift</b>. Each section header is the chord as <span className="ic">Kbd</span> keycaps; under it sit the bound <b>keycap rows</b> (action + <span className="ic">Kbd</span>), an optional <b>special-role row</b> (what the chord itself does — e.g. Ctrl = tab-switch numbers, Shift = TUI mouse-capture bypass), and <b>plugin</b> rows carrying the agent dot. A chord with <b>no</b> bindings and no role is <b>omitted</b> entirely.</>}>
          <Stage variant="solo center" style={{ padding: 24, background: "var(--tasty-bg-app)", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>default — Ctrl held</div>
              <ModifierHintPanelG />
            </div>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>resized taller (drag any edge) — 480</div>
              <ModifierHintPanelG style={{ height: 480 }} />
            </div>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>Ctrl+Shift held — categories on</div>
              <ModifierHintPanelG held="Ctrl+Shift" sections={MH_CAT_SECTIONS} style={{ height: 300 }} />
            </div>
          </Stage>
          <Meta
            specs={[["drag strip", "muted sidebar fill — NOT a titlebar"], ["X button", "dismiss for this hold only"], ["section order", "size ↑, then Ctrl→Cmd/Alt→Option→Shift"], ["keycap row", "action + Kbd"], ["role row", "washed, leading glyph, no keycap"], ["plugin row", "agent dot, context-dependent"], ["row text", <>11 · <span className="tok">--tasty-modhint-row-font-size</span> (chord · role · empty rows)</>], ["chord row", <>min 24 · <span className="tok">--tasty-modhint-row-min-height</span></>], ["role row pad", <>6 / 8 · <span className="tok">--tasty-modhint-row-gap</span> / <span className="tok">--tasty-space-sm</span></>], ["grip", <>12 · inset 2 from right/bottom · <span className="tok">--tasty-modhint-grip-size</span> · <span className="tok">--tasty-modhint-grip-inset</span> (on-scale)</>], ["min size", "180 × 240"]]}
            tokens={[{ tok: "--tasty-modhint-header-bg", use: "drag strip", color: "var(--tasty-modhint-header-bg)" }, { tok: "--tasty-modhint-role-bg", use: "role-row wash", color: "var(--tasty-modhint-role-bg)" }, { tok: "--tasty-modhint-role-fg", use: "role glyph", color: "var(--tasty-modhint-role-fg)" }, { tok: "--tasty-accent-agent", use: "plugin dot", color: "var(--tasty-accent-agent-raised)" }, { tok: "--tasty-modhint-grip-fg", use: "resize grip", color: "var(--tasty-modhint-grip-fg)" }]} />
          <Do><b>Do</b> keep it opaque and low-chrome — it floats over live terminal output, and the muted drag strip (not a titlebar) is the promise that it will never steal focus.</Do>
          <Dont><b>Don't</b> hide a chord that a key combo <i>could</i> reach — a bound-empty chord shows its ChordHead with a muted <b>“No shortcuts bound”</b> placeholder (see below), never nothing, so holding an all-empty combo still surfaces the panel.</Dont>
          <Note>When <b>Workspace categories (folders)</b> is on, the <Kbd keys="Ctrl+Shift" /> chord carries a <b>“Switch category”</b> role row (folder glyph) — the discoverability entry for the category quick-switch (see Switch-number overlay). A chord's role row is how a numeric switch announces itself, exactly like <Kbd keys="Ctrl" /> = tab-switch numbers.</Note>
        </Spec>

        <Spec id="empty-chord-no-shortcuts-bound-placeholder" title="Empty chord — “No shortcuts bound” placeholder"
          when={<>A chord that <b>exists but carries no binding and no role</b> is <b>not</b> omitted — its <span className="ic">ChordHead</span> shows with a single muted <b>placeholder row</b> beneath it. This <b>reverses</b> the original decision (“empty chord → omitted entirely, never ‘none’”): holding an all-empty combo like <Kbd keys="Ctrl+Alt+Shift" /> now surfaces the panel with a <b>“No shortcuts bound”</b> line instead of showing nothing. The placeholder is the <b>quietest</b> row in the panel — <span className="ic">text-muted</span>, <b>no keycap</b>, <b>no wash</b>, <b>no leading glyph</b> — an <i>absence</i> signal, deliberately not a role-row. It is fully static and non-interactive.</>}>
          <Stage variant="solo center" style={{ padding: 24, background: "var(--tasty-bg-app)", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>all-empty — Ctrl+Alt+Shift held</div>
              <ModifierHintPanelG held="Ctrl+Alt+Shift" sections={MH_EMPTY_SECTIONS} />
            </div>
            <div>
              <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)", marginBottom: 8 }}>mixed — Ctrl held, filled + empty sections</div>
              <ModifierHintPanelG held="Ctrl" sections={MH_MIXED_SECTIONS} />
            </div>
          </Stage>
          <Meta
            specs={[["row", "placeholder text only — no keycap"], ["tone", "muted (below a keycap row)"], ["wash", "none — not a role-row"], ["glyph", "none"], ["min height", "20px (tighter than a 24px keycap row)"], ["section gap", "3px inside (empty sits tight)"], ["copy", "“No shortcuts bound”"], ["interaction", "none — static, no hover/focus"]]}
            tokens={[{ tok: "--tasty-modhint-empty-fg", use: "placeholder text", color: "var(--tasty-modhint-empty-fg)" }, { tok: "--tasty-text-muted", use: "→ semantic", color: "var(--tasty-text-muted)" }, { tok: "--tasty-modhint-section-gap", use: "between sections (unchanged)" }]} />
          <Do><b>Do</b> keep the placeholder muted and bare — it announces an <i>absence</i>, so it must read quieter than a bound keycap row and never borrow the role-row's wash or glyph.</Do>
          <Dont><b>Don't</b> give it a keycap, a hover highlight, or a washed background — a keycap implies a binding that isn't there, and a wash makes it look like a role-row that <i>does</i> something.</Dont>
          <Note>i18n key <code>modifier_hint.empty</code> — en <code>“No shortcuts bound”</code> · ko <code>“지정된 단축키 없음”</code> · ja <code>“割り当てなし”</code>. Fits one line in the 180px panel across all three. New token <code>--tasty-modhint-empty-fg</code> → <code>text-muted</code> (a pointer, no new primitive), so the implementing side flips <code>build_hint_sections()</code>' empty-<code>retain</code> and paints one <code>draw_row</code> variant.</Note>
        </Spec>
      </Section>

      <Section id="categories" title="Workspace categories">
        <Spec id="sidebar-context-menu-target-resolves-under-the-cursor" title="Sidebar context menu — target resolves under the cursor"
          when={<>Right-clicking anywhere in the sidebar workspace area opens this menu (no dedicated buttons) — only when <b>Settings › General › Workspace categories (folders)</b> is on. Items resolve to the <b>target under the cursor</b>: empty <b>background</b>, a <b>category header</b>, or a <b>workspace row</b>. The reserved <b>normal</b> category (“Workspaces”) is additive-only — Rename category and Delete category are <b>left out</b>, not disabled: that category can never be renamed or deleted, so a disabled row would only promise a state that never comes. Same <span className="ic">MenuItem</span> + anchored-popup language as the Tools menu.</>}>
          <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
            <CatMenu caption="target: background (cwd)">
              <MenuItem label="New category" icon={catIc.plus} />
            </CatMenu>
            <CatMenu caption="target: category header">
              <MenuItem label="Add workspace" icon={catIc.plus} />
              <MenuItem separator />
              <MenuItem label="Rename category" icon={catIc.edit} />
              <MenuItem label="Delete category" icon={catIc.trash} danger />
              <MenuItem separator />
              <MenuItem label="New category" icon={catIc.plus} />
            </CatMenu>
            <CatMenu caption="target: reserved (normal)">
              <MenuItem label="Add workspace" icon={catIc.plus} />
              <MenuItem separator />
              <MenuItem label="New category" icon={catIc.plus} />
            </CatMenu>
            <CatMenu caption="target: local workspace row">
              <MenuItem label="Move to category" icon={catIc.move} disabled />
              <MenuItem label="Workspaces" />
              <MenuItem label="Services" />
              <MenuItem separator />
              <MenuItem label="New category" icon={catIc.plus} />
              <MenuItem separator />
              <MenuItem label="Force detach" disabled />
            </CatMenu>
            <CatMenu caption="target: local workspace row · served to another client">
              <MenuItem label="Move to category" icon={catIc.move} disabled />
              <MenuItem label="Workspaces" />
              <MenuItem label="Services" />
              <MenuItem separator />
              <MenuItem label="New category" icon={catIc.plus} />
              <MenuItem separator />
              <MenuItem label="Force detach" />
            </CatMenu>
          </Stage>
          <Meta
            specs={[["trigger", "right-click, no dedicated button"], ["width", "176px min"], ["background", "New category"], ["category", "Add ws · Rename · Delete · New"], ["reserved", "Add ws · New (additive-only) · Rename / Delete left out, not disabled"], ["workspace", "Move to category (inert header) · targets · New | Force detach (enabled only while this Tasty serves the workspace to another client, otherwise disabled, no reason)"], ["Force detach", "local workspace menus only · not on a mirror (a saved remote row or an agent mirror): no other client can hold one, so the item and its separator are left out, not disabled"], ["targets", "every category except the current one · normal = “Workspaces”"]]}
            tokens={[{ tok: "--tasty-surface-raised", use: "menu fill", color: "var(--tasty-surface-raised)" }, { tok: "--tasty-border-strong", use: "edge", color: "var(--tasty-border-strong)" }, { tok: "--tasty-accent-danger", use: "delete row", color: "var(--tasty-accent-danger-raised)" }, { tok: "--tasty-shadow-popover", use: "lift" }]} />
          <Note>“Move to category” is an <b>inert header</b> with the target categories listed <b>flat</b> beneath it (current category omitted) — no submenu, because the product draws this menu with the OS-native context menu (2026-10-07). Drag-and-drop reorder stays the primary path; this is the menu fallback. New strings: <code>workspace_category.add_workspace</code> · <code>collapse</code> · <code>expand</code>. Existing: <code>new_category</code> · <code>rename_category</code> · <code>delete_category</code> · <code>move_to_category</code>.</Note>
        </Spec>
        <Spec id="collapsed-rail-category-button-anchored-popup" title="Collapsed rail — `---` category button + anchored popup"
          when={<>In the 52px rail, categories aren't labelled — each boundary is a clickable <b>horizontal <code>---</code> button</b> (the old thin separator, now a button). Clicking it opens a popup to its <b>right</b> (like the rail Tools button). The popup's <b>top line is the category name</b>, a <b>non-clickable header</b>; below are the actions. A category's avatars sit <b>below</b> its <code>---</code>; a <b>collapsed or empty</b> category shows only the <code>---</code> button.</>}>
          <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
            <RailCategoryFrame />
          </Stage>
          <Meta
            specs={[["boundary", <><code>---</code> full-width button</>], ["anchor", "popup to the right of the button"], ["header", "category name — non-clickable"], ["items", "Add workspace · Collapse · Rename · Delete"], ["collapsed/empty", <><code>---</code> only, no avatars</>], ["reserved", "no Rename/Delete"]]}
            tokens={[{ tok: "--tasty-separator", use: <><code>---</code> line (idle)</>, color: "var(--tasty-separator)" }, { tok: "--tasty-text-muted", use: <><code>---</code> line (hover)</>, color: "var(--tasty-text-muted)" }, { tok: "--tasty-surface-raised", use: "popup fill", color: "var(--tasty-surface-raised)" }, { tok: "--tasty-menu-border", use: "edge", color: "var(--tasty-menu-border)" }, { tok: "--tasty-popup-content-margin", use: "inner ring 4 (all sides)" }, { tok: "--tasty-accent-danger", use: "delete row", color: "var(--tasty-accent-danger-raised)" }]} />
          <Note>Collapse state is per-category and <b>shared</b> with the full sidebar (both seed from the persisted <code>collapsed</code> flag in <code>layout.json</code>). Toggling here or in the full header updates the same state.</Note>
        </Spec>
        <Spec id="remote-row-context-menu-by-connection-state" title="Saved remote workspace — the row menu by connection state"
          when={<>A saved remote row's right-click menu is the workspace menu (the OS menu in the app: order, wording, separators and disabled items only) with one <b>connection group</b> and one <b>close group</b> at the end. The connection group is <b>Connect</b> (or <b>Reconnect</b> for a row that had a screen in this run, the popup's word) and <b>Disconnect</b>; each is <b>disabled, not hidden</b>, where it cannot act. When the remote workspace is <b>gone</b> (closed elsewhere in this run, or a connect found it missing: the popup's Remote workspace closed), Connect or Reconnect stays in its place, <b>disabled</b>, as on the popup: the workspace is gone, so it could only fail, and the row's tooltip and popup already give the reason, so the menu adds nothing. That is not kept across a restart: the row comes back not connected with Connect enabled, and a connect that finds the workspace still missing disables it again. The close group names <b>where</b> the closing happens: <b>Close locally</b> takes the row out of this Tasty and leaves the workspace running on the remote; <b>Close remote workspace…</b> ends it there and opens a confirmation, so it is last and carries the ellipsis. Nothing can reach the remote while the row is not connected, so that item is enabled only when connected. The menu opens with or without categories; the category block appears only with categories on. An agent mirror made from the CLI or IPC keeps today's menu.</>}>
          <Stage variant="solo center" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-xl)", flexWrap: "wrap", alignItems: "flex-start" }}>
            <CatMenu caption="connected · categories on"><RemoteRowMenuItems state="connected" categories={["Workspaces", "Services"]} /></CatMenu>
            <CatMenu caption="connecting"><RemoteRowMenuItems state="connecting" /></CatMenu>
            <CatMenu caption="reconnecting"><RemoteRowMenuItems state="reconnecting" /></CatMenu>
            <CatMenu caption="disconnected (last screen kept)"><RemoteRowMenuItems state="disconnected" /></CatMenu>
            <CatMenu caption="not connected (after a restart)"><RemoteRowMenuItems state="not_connected" /></CatMenu>
            <CatMenu caption="remote workspace closed (this run) · Reconnect disabled"><RemoteRowMenuItems state="disconnected" closed /></CatMenu>
            <CatMenu caption="remote workspace missing, no screen in this run (not connected) · Connect disabled"><RemoteRowMenuItems state="not_connected" closed /></CatMenu>
          </Stage>
          <Views>
            <View name="remote-row-menu-languages" label="ko, ja, zh-Hans — connected, disconnected and closed elsewhere">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-xl)", alignItems: "flex-start" }}>
                {["ko", "ja", "zh-Hans"].flatMap((lang) => [
                  <CatMenu key={lang + "c"} caption={lang + " · connected"}><RemoteRowMenuItems state="connected" lang={lang} /></CatMenu>,
                  <CatMenu key={lang + "d"} caption={lang + " · disconnected"}><RemoteRowMenuItems state="disconnected" lang={lang} /></CatMenu>,
                  <CatMenu key={lang + "x"} caption={lang + " · closed elsewhere"}><RemoteRowMenuItems state="disconnected" closed lang={lang} /></CatMenu>,
                ])}
              </div>
            </View>
          </Views>
          <Meta
            specs={[["order", "Rename · Change Subtitle | Move Up · Move Down | Save as workspace preset | (categories) | Connect or Reconnect · Disconnect | Close locally · Close remote workspace…"], ["Connect / Reconnect", "enabled: disconnected, not connected · disabled: connected, connecting, reconnecting, and when the remote workspace is gone in this run (closed elsewhere, or a connect or Reconnect found it missing: the popup's Remote workspace closed) · Reconnect when the row had a screen in this run (row word disconnected), Connect when it had none (row word not connected, after a restart too) · disabled keeps its place and its label, no reason line · not kept across a restart: the row is not connected and Connect is enabled, and a connect that finds the workspace still missing is Remote workspace closed again with Connect disabled · every other refused connect is Connection failed with Connect still enabled"], ["remote workspace closed", "two forms · the row had a screen in this run: disconnected, Reconnect disabled — the same as disconnected but for Reconnect · no screen in this run (after a restart too): not connected, Connect disabled — the same as not connected but for Connect · both: Disconnect disabled (not connected to anything) · Close locally enabled, removes the row · Close remote workspace… disabled"], ["Disconnect", "enabled: connected, connecting, reconnecting · disabled: disconnected, not connected · while connecting or reconnecting it cancels the attempt in progress and leaves the row disconnected by the user, the popup's user-disconnected form (decided, R-58 Q2; looked at again if L1 = b) · no automatic reconnect after it"], ["Close locally", "always · the remote workspace keeps running · no confirmation"], ["Close remote workspace…", "connected only · opens the confirmation (Dialogs › Close remote workspace)"], ["replaces", "Disconnect Workspace and Close Workspace on a saved remote row"], ["Force detach", "not on this menu · a saved remote row is a mirror and no other client can hold one, so the item and its separator are left out, not disabled (local workspace menus only)"], ["agent mirror", "today's menu, unchanged · no Force detach either"]]}
            tokens={[]} />
          <Note>Copy: <code>remote.row.popup.connect</code> · <code>child_graph.reconnect</code> · <code>remote.row.menu.disconnect</code> · <code>remote.row.menu.close_local</code> · <code>remote.row.menu.close_remote</code>. The other items keep their current keys and English, shown here as the app has them.</Note>
          <Dont><b>Don't</b> label the local one plain “Close”. On a remote row the word alone reads as closing the remote workspace, which is the other item.</Dont>
        </Spec>
      </Section>
      <Section id="notices" title="Notice column — restore failure · save halt · response wait">
        {GalleryNoticeColumn ? <GalleryNoticeColumn /> : null}
      </Section>
      <Section id="webview" title="Over a web page — opaque mode">
        {GalleryWebviewOpaque ? <GalleryWebviewOpaque /> : null}
        <GalleryToastOverPage />
      </Section>
    </>
  );
}

export const page = {
  active: "overlays-popups",
  nav: NAV,
  head: {
    title: "Popups & menus",
    intro: "Explore menus, search bars, switch overlays, and modifier hints. Check their placement and dismissal, and compare opaque overlays above a web page.",
    
  },
  content: <Page />,
};

export default function GalleryRoute() {
  return <PageStates value={STATES}>{page.content}</PageStates>;
}
