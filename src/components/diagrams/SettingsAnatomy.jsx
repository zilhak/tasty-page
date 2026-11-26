import React from "react";
import { SettingsWindow } from "../../../vendor/ui_kits/terminal/overlays/settings_window.jsx";

/** The kit Scrim fills this positioned frame; CSS scales the fixed-size window. The kit is a picture, not
 * controls: it is inert and hidden from assistive technology. The frame scrolls sideways when the column is
 * narrower than the scaled window, so it is the one Tab stop, a region named for what it shows (a region, not a
 * group, for the reason in WindowAnatomy.jsx). */
export function SettingsAnatomy({ labels }) {
  return (
    <div className="anat-settings" role="region" aria-label={labels.name} tabIndex={0}>
      <div className="anat-settings__stage" aria-hidden="true" inert="">
        <SettingsWindow theme="mocha" onTheme={() => {}} uiScale="md" onUiScale={() => {}} onClose={() => {}} />
      </div>
    </div>
  );
}
