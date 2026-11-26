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
   * inactive fill + top bar), `fill` (tab-bg-active, no mark) or `dot` (inactive
   * fill + a small dot at the top). Read only when `active`.
   */
  indicator?: "underline" | "fill" | "dot";
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
