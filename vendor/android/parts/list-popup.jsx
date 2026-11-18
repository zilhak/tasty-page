// Android part: the list popup. Every menu on Android uses this one form: a list in the middle of the window over a
// scrim, not a context menu at the finger as on the desktop. That covers a long press (the tab menu) and the logo
// (the Tasty menu). An open on-screen keyboard stays open and is never pushed away: the popup centres in the window
// area above it, and its rows scroll when that area is short.
//
// Whole rows only. Every item in the list is one row unit tall: an action row, a row in effect, a disabled row and a
// group heading alike. A group rule is drawn on the top edge of the group's first row, inside it, so it adds no height.
// The list area is a whole number of rows tall, and scrolling comes to rest on row edges, so a row is never shown in
// part.
//
// A list that scrolls says so. While any row is out of view, a scroll lane stands at the right of the list: a chevron
// at each end, lit when rows lie that way and dimmed when that end is reached, and a thumb between them for the share
// in view and the place. It shows the whole time the list can scroll, not only during a scroll, and never covers a row.
//
// Drawn here, not taken from vendor/components, because its shape differs from the desktop menu. Colors and type are
// canon tokens, and its sizes are the --tasty-android-popup-* tokens in tokens/components.css, listed below for the
// gallery tables. Icons come from vendor/icons through Icon.
import React, { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../../components/index.js";

// Token, the canon token it reads, and what it sets.
export const LIST_POPUP_TOKENS = [
  ["android-popup-max-width", "size-320", "Widest the popup gets. Narrower areas keep the side margin instead"],
  ["android-popup-margin", "space-lg", "Space between the popup and the edge of the area it sits in, on every side"],
  ["android-popup-title-height", "size-48", "Title row, its rule included: the name of what was pressed"],
  ["android-popup-row-height", "size-48", "The row unit. Every list item is one unit; an action row is also its target"],
  ["android-popup-padding-x", "space-lg", "Inset of the title, headings and row labels"],
  ["android-popup-font-size", "font-size-max", "Title and row labels"],
  ["android-popup-lane-width", "size-24", "Scroll lane at the right of a list that scrolls. The rows give up this width"],
  ["android-popup-lane-glyph", "icon-size-md", "Chevron at each end of the lane"],
  ["android-popup-thumb-width", "space-xs", "Thumb in the lane"],
];

const ruleAbove = { borderTop: "var(--tasty-border-width) solid var(--tasty-menu-separator)" };

// A row. rule: this row starts a group. disabled: shown in place and not tappable, never hidden, so rows do not move
// between openings. current: the one row already in effect, such as the workspace on screen.
export function ListPopupRow({ label, pressed, disabled, current, rule }) {
  return (
    <div role="menuitem" aria-disabled={disabled || undefined} aria-current={current || undefined} data-popup-item=""
      {...(disabled ? { "data-ink-grade": "none", "data-ink-why": "disabled" } : null)}
      style={{ position: "relative", flex: "none", boxSizing: "border-box", height: "var(--tasty-android-popup-row-height)", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
        padding: "0 var(--tasty-android-popup-padding-x)", fontSize: "var(--tasty-android-popup-font-size)", scrollSnapAlign: "start",
        color: disabled ? "var(--tasty-text-disabled)" : "var(--tasty-text-primary)",
        fontWeight: current ? "var(--tasty-font-weight-semibold)" : undefined,
        background: pressed && !disabled ? "var(--tasty-overlay-active)" : "transparent", ...(rule ? ruleAbove : null) }}>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {current && <span style={{ flex: "none", display: "inline-flex", color: "var(--tasty-accent-primary)" }}><Icon name="check" size="var(--tasty-icon-size-md)" /></span>}
    </div>
  );
}

// A group heading, such as Workspaces. One row unit, label at the bottom, not a target.
export function ListPopupHeading({ label, rule }) {
  return (
    <div role="presentation" data-popup-item="" style={{ flex: "none", boxSizing: "border-box", height: "var(--tasty-android-popup-row-height)", display: "flex", alignItems: "flex-end",
      padding: "0 var(--tasty-android-popup-padding-x) var(--tasty-space-sm)", scrollSnapAlign: "start", fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)",
      color: "var(--tasty-text-secondary)", ...(rule ? ruleAbove : null) }}>{label}</div>
  );
}

// How many whole rows fit. free: the height of the area the popup sits in. One rule for every size: the margin stays,
// and the list shows the whole rows that fit, at least one. A cramped screen gets no special handling. The keyboard,
// the window and the font scale are the user's choice, and the user changes them if the popup is too tight.
export function fitRows({ free, count, row, title, margin, border }) {
  const rows = Math.floor((free - 2 * margin - 2 * border - title) / row);
  return { margin, rows: Math.max(1, Math.min(rows, count)) };
}

// The scroll lane. above, below: rows lie that way. share: the part of the list in view. at: how far it is scrolled, 0 to 1.
// A chevron is lit in text-secondary when rows lie its way and dimmed to text-disabled at that end. Not a target: the
// list scrolls by swipe.
function LaneEnd({ dir, lit }) {
  return (
    <span aria-hidden="true" {...(lit ? null : { "data-ink-grade": "none", "data-ink-why": "disabled" })}
      style={{ flex: "none", height: "var(--tasty-android-popup-lane-width)", display: "flex", alignItems: "center", justifyContent: "center",
        color: lit ? "var(--tasty-text-secondary)" : "var(--tasty-text-disabled)" }}>
      <Icon name={dir === "up" ? "chevronUp" : "chevronDown"} size="var(--tasty-android-popup-lane-glyph)" />
    </span>
  );
}
export function ScrollLane({ above, below, share, at }) {
  return (
    <div data-scroll-lane={above && below ? "both" : above ? "above" : below ? "below" : "none"}
      style={{ flex: "none", width: "var(--tasty-android-popup-lane-width)", display: "flex", flexDirection: "column", background: "var(--tasty-surface-raised)" }}>
      <LaneEnd dir="up" lit={above} />
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "var(--tasty-android-popup-thumb-width)", borderRadius: "var(--tasty-radius-sm)",
          background: "var(--tasty-text-muted)", height: `${share * 100}%`, top: `${at * (1 - share) * 100}%` }} />
      </div>
      <LaneEnd dir="down" lit={below} />
    </div>
  );
}

const px = (el, name) => parseFloat(getComputedStyle(el).getPropertyValue(name));

// The popup over a window. under is the app window's content, inert while the popup is open. keyboard is the height of
// an open on-screen keyboard in px, or 0: the keyboard stays where it is, outside the scrim, and the popup centres in
// what is left above it. scrollTo puts the list at a scroll position, for specimens that show a scrolled list.
// expanded: for the gallery, show every row and let the frame grow instead of scrolling. onFit reports what the app
// would show in the frame's real free height: { count, rows }.
export function ListPopup({ title, children, under, keyboard = 0, scrollTo = 0, expanded = false, onFit }) {
  const area = useRef(null);
  const body = useRef(null);
  const [fit, setFit] = useState(null);
  const [grow, setGrow] = useState(0);
  const [pos, setPos] = useState({ top: 0, max: 0 });

  useLayoutEffect(() => {
    const el = area.current;
    const count = body.current.querySelectorAll(":scope > [data-popup-item]").length;
    const v = { row: px(el, "--tasty-android-popup-row-height"), title: px(el, "--tasty-android-popup-title-height"), margin: px(el, "--tasty-android-popup-margin"),
      border: px(el, "--tasty-border-width") };
    const real = fitRows({ free: el.clientHeight, count, ...v });
    if (onFit) onFit({ count, rows: real.rows });
    if (expanded) {
      const need = v.title + count * v.row + 2 * v.border + 2 * v.margin;
      setGrow(Math.max(el.clientHeight, need));
      setFit({ count, margin: v.margin, rows: count });
    } else setFit({ count, ...real });
  }, [keyboard, expanded]);

  useLayoutEffect(() => {
    const el = body.current;
    if (!fit || !el) return;
    el.scrollTop = scrollTo;
    setPos({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight });
  }, [fit, scrollTo]);

  const hidden = fit ? fit.count - fit.rows : 0;
  const onScroll = () => setPos({ top: body.current.scrollTop, max: body.current.scrollHeight - body.current.clientHeight });
  return (
    <div style={{ position: "relative", flex: 1, height: grow ? undefined : "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div ref={area} style={{ position: "relative", flex: grow ? "none" : 1, minHeight: 0, height: grow ? `${grow}px` : undefined }}>
        {/* Out of flow, so what lies under the scrim never sets the free height the popup is fitted to. */}
        <div data-audit-exempt="under-scrim" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>{under}</div>
        <div style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: fit ? `${fit.margin}px` : "var(--tasty-android-popup-margin)", boxSizing: "border-box" }}>
          <div role="menu" aria-label={title} style={{ width: "100%", maxWidth: "var(--tasty-android-popup-max-width)", display: "flex", flexDirection: "column", boxSizing: "content-box",
            background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)",
            fontFamily: "var(--tasty-font-ui)", overflow: "hidden", visibility: fit ? "visible" : "hidden" }}>
            <div style={{ flex: "none", boxSizing: "border-box", height: "var(--tasty-android-popup-title-height)", display: "flex", alignItems: "center", padding: "0 var(--tasty-android-popup-padding-x)",
              fontSize: "var(--tasty-android-popup-font-size)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)", borderBottom: "var(--tasty-border-width) solid var(--tasty-menu-separator)" }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            </div>
            <div style={{ display: "flex", flex: "none" }}>
              <div ref={body} onScroll={onScroll} data-popup-list="" style={{ flex: 1, minWidth: 0, height: fit ? `calc(${fit.rows} * var(--tasty-android-popup-row-height))` : undefined, overflowY: "auto",
                scrollbarWidth: "none", scrollSnapType: "y mandatory", display: "flex", flexDirection: "column" }}>{children}</div>
              {hidden > 0 && <ScrollLane above={pos.top > 1} below={pos.top < pos.max - 1} share={fit.rows / fit.count} at={pos.max ? pos.top / pos.max : 0} />}
            </div>
          </div>
        </div>
      </div>
      {keyboard > 0 && (
        // A stand-in for the system keyboard, which Tasty does not draw. It marks the space the popup leaves alone.
        <div style={{ flex: "none", height: `${keyboard}px`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
          background: "var(--tasty-bg-sidebar)", border: "var(--tasty-border-width) dashed var(--tasty-border-control)",
          fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>On-screen keyboard, stays open</div>
      )}
    </div>
  );
}
