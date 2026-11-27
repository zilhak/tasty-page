import * as React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** md = 28px (default), sm = 24px to match the tab strip. */
  size?: "sm" | "md";
  /** ghost (default, bare) or solid (raised surface + border). */
  variant?: "ghost" | "solid";
  /** Show the persistent active/selected state (accent color). */
  active?: boolean;
  /** Host ground. "active" reads text-on-active on a selected row. */
  ground?: "panel" | "active";
  /** The icon element — normally `<Icon name="…" />` from components/core/Icon. */
  /** Enter and Space click only on a new press that began on the button; repeats of a held key do nothing.
   *  keyRepeat: a stepper (Previous and Next, Zoom in and out) lets the repeats of an Enter press that began on it click
   *  again, one per repeat. Space still clicks once on release. */
  keyRepeat?: boolean;
  children?: React.ReactNode;
}

/**
 * Square, icon-only button for toolbars, tab-close, and sidebar actions.
 * Same height as Button; ghost by default with 8%/12% overlays.
 */
export function IconButton(props: IconButtonProps): JSX.Element;
