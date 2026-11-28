import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { Input } from "../../../components/forms/Input.jsx";

// Tasty UI kit — terminal search bar (Ctrl+F / ⌘F, top-right of the focused surface).
// Mirrors zilhak/tasty → src/adapters/ui/search_bar.rs
//   PopupDef: id "search_bar", 360×28, headless, sticky_focus false, outside_click Unfocus: stays open on a press
//   outside it, and a press in the surface outside the bar hands key focus to the terminal.


// ── Search bar — mirrors src/adapters/ui/search_bar.rs (popup id "search_bar") ──
// Headless popup floating at the top-right of the FOCUSED terminal surface.
// One horizontal row, 4px gaps: input (flex — FILLS the bar, min 60px; DESIGN
// CANONICAL, see search_bar.rs note below) · status text
// (error > no-matches > {current}/{total}) · ▲▼ (only when matches exist) ·
// Aa / .* / ab option toggles · │ divider · ✕ close (Esc). Enter next, Shift+Enter prev, ↑↓ navigate,
// Esc closes while key focus is anywhere in the bar. Does NOT close on outside click; the press takes key focus out of the bar, which stays open.
// Its border shows popup focus (RULES.md "Popup focus"): popup-border-focused while focus is inside the bar,
// popup-border-unfocused once it is elsewhere. A press on the bar's own frame (padding, counter, divider, a disabled
// arrow) takes the focus back for the field when the focus was outside the bar, and leaves it on the control that has
// it when the bar already holds it, as a press inside a popup's frame gives it key focus.
// INPUT WIDTH (canonical): flex:1 — the input grows to fill the bar after the
// fixed-width counter (40px) and always-visible buttons are laid out. The Rust
// search_bar.rs:24-32 desired_width(200.0) is a fixed-width approximation to
// reconcile toward the flexible design, not a design constraint.
// An option toggle (Aa, .*, ab). It is a component of its own, defined once: a component made inside SearchBar would be
// a new type on every render, so React would replace its button whenever the options or the focus changed, and the
// button that took the press (and with it the key focus) would leave the page without a blur the bar could see.
function SearchToggle({ label, active, title, onClick }) {
  return (
    <IconButton size="sm" active={active} aria-label={title} title={title} onClick={onClick}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", fontWeight: 600, lineHeight: 1,
        color: active ? "var(--tasty-text-on-active)" : "var(--tasty-text-muted-raised)" }}>{label}</span>
    </IconButton>
  );
}

function SearchBar({ lines = [], onClose }) {
  const [q, setQ] = React.useState("");
  const [matchCase, setMatchCase] = React.useState(false);   // "Aa" — default off (case-insensitive)
  const [regex, setRegex] = React.useState(false);           // ".*"
  const [wholeWord, setWholeWord] = React.useState(false);   // "ab"
  const [cur, setCur] = React.useState(0);

  const { count, error } = React.useMemo(() => {
    if (!q) return { count: 0, error: false };
    let pattern;
    try {
      let src = regex ? q : q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (wholeWord) src = "\\b(?:" + src + ")\\b";
      pattern = new RegExp(src, matchCase ? "g" : "gi");
    } catch (e) { return { count: 0, error: true }; }
    let n = 0;
    for (const ln of lines) { const m = ln.match(pattern); if (m) n += m.length; }
    return { count: n, error: false };
  }, [q, matchCase, regex, wholeWord, lines]);

  React.useEffect(() => { setCur(0); }, [q, matchCase, regex, wholeWord]);

  // Key focus: inside the bar (the field or one of its buttons) or elsewhere. The field takes it on open (autoFocus).
  const [focusIn, setFocusIn] = React.useState(false);
  const onBarFocus = () => setFocusIn(true);
  const onBarBlur = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusIn(false); };
  const onBarPress = (e) => {
    if (e.button !== 0 || e.target.closest("button:not(:disabled), input")) return;
    e.preventDefault();
    const field = e.currentTarget.querySelector("input");
    if (!e.currentTarget.contains(document.activeElement) && field) field.focus({ preventScroll: true });
  };

  // Previous and Next keep the focus and step once per click, so they take keyRepeat: holding Enter on one keeps
  // stepping, as holding Enter in the field does (fresh-press.js).
  const next = () => { if (count) setCur((c) => (c + 1) % count); };
  const prev = () => { if (count) setCur((c) => (c - 1 + count) % count); };
  const onKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (e.shiftKey) prev(); else next(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); prev(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); next(); }
  };
  // Esc closes the bar wherever its key focus is (the field, an arrow, an option or close), as the app's focused popup
  // takes Esc in its own step. The bar reads it only while it holds the focus, so an Esc pressed elsewhere (the
  // terminal) never reaches it. The caller puts the focus back where the bar was opened from.
  const onBarKey = (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  // status counter — always visible (fixed layout): "0/0" when empty/no
  // matches/invalid; red whenever a query has zero usable results.
  const hasQuery = q.length > 0;
  const counterText = count > 0 ? `${cur + 1}/${count}` : "0/0";
  const counterColor = hasQuery && (error || count === 0)
    ? "var(--tasty-accent-danger-raised)" : "var(--tasty-text-muted-raised)";

  return (
    <div role="search" data-popup-focus={focusIn ? "focused" : "unfocused"} onFocus={onBarFocus} onBlur={onBarBlur} onMouseDown={onBarPress} onKeyDown={onBarKey}
      style={{ position: "absolute", top: "var(--tasty-space-sm)", right: "var(--tasty-space-sm)", zIndex: 20,
      width: 360, maxWidth: "calc(100% - var(--tasty-space-md))",
      display: "flex", alignItems: "center", gap: 4, padding: 4,
      background: "var(--tasty-surface-raised)",
      border: `var(--tasty-border-width) solid ${focusIn ? "var(--tasty-popup-border-focused)" : "var(--tasty-popup-border-unfocused)"}`,
      borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-popover)",
      fontFamily: "var(--tasty-font-ui)" }}>
      <span style={{ flex: 1, minWidth: 60, display: "flex" }}>
        <Input block ground="raised" invalid={hasQuery && error} autoFocus placeholder="Search..." value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
      </span>
      <span style={{ flex: "none", width: 40, textAlign: "center", fontSize: 12,
        color: counterColor, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{counterText}</span>
      <IconButton size="sm" keyRepeat aria-label="Previous match" title="Previous match (Shift+Enter)"
        disabled={count === 0} onClick={prev}>
        <Icon name="chevronUp" size={14} />
      </IconButton>
      <IconButton size="sm" keyRepeat aria-label="Next match" title="Next match (Enter)"
        disabled={count === 0} onClick={next}>
        <Icon name="chevronDown" size={14} />
      </IconButton>
      <SearchToggle label="Aa" active={matchCase} title="Match case" onClick={() => setMatchCase((v) => !v)} />
      <SearchToggle label=".*" active={regex} title="Regular expression" onClick={() => setRegex((v) => !v)} />
      <SearchToggle label="ab" active={wholeWord} title="Match whole word" onClick={() => setWholeWord((v) => !v)} />
      {/* A divider on the raised bar reads the raised cell of the separator role (RULES.md section 6). */}
      <span style={{ flex: "none", width: 1, alignSelf: "stretch", margin: "0 var(--tasty-size-2)",
        background: "var(--tasty-border-strong)" }}></span>
      <IconButton size="sm" aria-label="Close search" title="Close (Esc)" onClick={onClose}>
        <Icon name="close" size={14} />
      </IconButton>
    </div>
  );
}

export { SearchBar };
