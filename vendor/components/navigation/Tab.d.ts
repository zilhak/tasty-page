import * as React from "react";

export interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tab label (truncates with ellipsis). */
  label: React.ReactNode;
  /** Optional leading icon (surface kind). */
  icon?: React.ReactNode;
  /** Active tab — draws the active indicator and the active title ink. */
  active?: boolean;
  /**
   * Active tab indicator, as the app's Appearance setting: `underline` (default,
   * the strip's fill + top bar), `fill` (tab-bg-active, no mark) or `dot` (the
   * strip's fill + a small dot at the top). Read only when `active`.
   */
  indicator?: "underline" | "fill" | "dot";
  /**
   * The strip's fill, which the tab keeps: `mantle` (default, an unfocused
   * pane, tab-bg) or `raised` (the focused pane, tab-bg-raised, inactive label
   * tab-fg-raised). Pass the same value to every tab of one strip.
   */
  ground?: "mantle" | "raised";
  /**
   * Live-activity dot, MIRRORING the product surface model: the body exposes
   * one activity bool per surface, so the tab shows one dot — busy=green,
   * idle=no dot. The 5-color owner×activity vocabulary (running/waiting/agent/
   * error) has no per-surface data source and lives only on the WORKSPACE
   * StatusDot, never here. Tasty has no "unsaved/dirty" state — this replaces it.
   */
  status?: "idle" | "busy";
  /**
   * Attention kind — tints the title (tab-fg-needs-input / tab-fg-completion).
   * Outranks the active ink, so an active tab keeps the tint until attention
   * clears (attention.rs tab_title_color). Replaces the removed
   * `attached` / `notif` props (2026-10-07) — the product tab draws neither.
   */
  attention?: "needs-input" | "completion" | null;
  /** Fired when the close affordance is clicked. */
  onClose?: (e: React.MouseEvent) => void;
}

/**
 * One tab in the tab strip. 24px tall, 150px wide, with a hover-revealed
 * close button and the active indicator on the active tab.
 */
export function Tab(props: TabProps): JSX.Element;

export interface TabLookInput {
  active?: boolean;
  /** A frozen hover, as a specimen cell draws it. Ignored on the active tab. */
  hover?: boolean;
  indicator?: "underline" | "fill" | "dot";
  ground?: "mantle" | "raised";
  attention?: "needs-input" | "completion" | null;
}

/**
 * The Tab's fill, label ink and active mark as CSS values, for a specimen that
 * draws its own tab cell. Follows the same rules as the Tab's CSS.
 */
export function tabLook(input?: TabLookInput): { fill: string; ink: string; mark: "underline" | "dot" | null };

/** Draws the mark `tabLook` returns inside a position: relative cell. */
export function TabMark(props: { mark: "underline" | "dot" | null }): JSX.Element | null;
