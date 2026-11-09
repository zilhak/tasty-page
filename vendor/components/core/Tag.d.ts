import * as React from "react";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Host ground. "raised" and "active" read the matrix cell for that ground. Leave out on a neutral ground. */
  ground?: "raised" | "active";
  /** Color treatment. default = outlined neutral. */
  variant?: "default" | "accent" | "agent" | "success" | "warning" | "attention" | "danger" | "info" | "attached";
  /** Prefix with a small status dot in the current color. */
  dot?: boolean;
  /** Disabled ink rule — neutral box + text-disabled for every variant (accent fill / tint edge drop out). Automatic inside a disabled ListCtrl row. */
  disabled?: boolean;
  /** Uppercase label (e.g. REMOTE). Always draws letter-spacing-caps with it — an uppercase Tag never goes untracked (2026-10-06). */
  caps?: boolean;
  /** Holds an ID, a permission, a surface kind, a version or a size. Stays mono in every UI language. Leave out for words. */
  mono?: boolean;
  children?: React.ReactNode;
}

/**
 * Small label, in the label family, for surface kinds, permissions, plugin origins
 * ("built-in"), and detector rule types.
 */
export function Tag(props: TagProps): JSX.Element;
