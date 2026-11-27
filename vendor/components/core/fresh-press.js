import React from "react";

/**
 * A key press acts on the control that took it. Enter and Space click a focused button only on a new press that began
 * on it: the repeats of a held key are taken and do nothing, and a Space released on the button after a press that
 * began elsewhere clicks nothing. So the key that ran a menu row or closed a window does not reopen it from the button
 * the focus went back to while the key was still down. A fresh press clicks as before (Enter on press, Space on
 * release), and pointer clicks are untouched.
 *
 * Button and IconButton use it. A plain <button> that opens a popup or a window spreads its result:
 * `const press = useFreshPress({ onClick }); <button {...press}>`. Pass the handlers the button had; the result calls them.
 */
export function useFreshPress({ onKeyDown, onKeyUp, onClick, onBlur } = {}) {
  // A Space press began on this control and is not released yet.
  const space = React.useRef(false);
  // The Space release just seen began elsewhere: drop the click the browser makes from it.
  const drop = React.useRef(false);
  return {
    onKeyDown(e) {
      if (e.key === "Enter" || e.key === " ") {
        if (e.repeat) e.preventDefault();
        else if (e.key === " ") space.current = true;
      }
      if (onKeyDown) onKeyDown(e);
    },
    onKeyUp(e) {
      if (e.key === " ") {
        if (!space.current) {
          e.preventDefault();
          drop.current = true;
          setTimeout(() => { drop.current = false; }, 0);
        }
        space.current = false;
      }
      if (onKeyUp) onKeyUp(e);
    },
    onClick(e) {
      if (drop.current && e.detail === 0) {
        drop.current = false;
        e.preventDefault();
        return;
      }
      if (onClick) onClick(e);
    },
    onBlur(e) {
      space.current = false;
      if (onBlur) onBlur(e);
    },
  };
}
