import React from "react";
import { Spec, Stage, Meta } from "../parts/specimen.jsx";
import { StatusBar } from "../../ui_kits/terminal/work.jsx";

// The kit StatusBar itself, as the kit shell and the landing page mount it: the chip label is the host's paletteKeys
// (Cmd+K by default, Ctrl+K where the host binds that), and the chip is a press-once button (fresh-press.js). The live
// bar counts chip clicks so a held key can be watched: a new press of Enter or Space counts one, and holding it counts
// no more.
function KitBar({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", width: 520, maxWidth: "100%" }}>
      <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{label}</span>
      <div style={{ border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function LiveKitBar() {
  const [n, setN] = React.useState(0);
  return (
    <KitBar label={`live · palette chip clicks: ${n} · Tab to the chip · press Enter or Space → one more · hold Enter or Space → still one more, not one per repeat · release and press again → one more`}>
      <StatusBar surfaceId="2" theme="mocha" paletteKeys="Ctrl+K" onPalette={() => setN((v) => v + 1)} onTheme={() => {}} />
    </KitBar>
  );
}

export function StatusBarKitSpec() {
  return (
    <Spec id="status-bar-kit-palette-chip" title="Kit status bar — palette chip"
      when={<>The kit <code>StatusBar</code> as the kit shell and the landing page mount it. The palette chip shows the chord the host binds: <b>Cmd+K</b> by default, or what the host passes as <code>paletteKeys</code> (the landing page passes <b>Ctrl+K</b> off macOS). The chip opens the palette and gets the focus back when it closes, so it clicks only on a <b>new press</b> that began on it: the repeats of the key that ran a command do not reopen the palette.</>}>
      <Stage variant="column" style={{ gap: "var(--tasty-space-md)" }}>
        <KitBar label="default · paletteKeys not passed → Cmd+K">
          <StatusBar surfaceId="2" theme="mocha" />
        </KitBar>
        <KitBar label={'host · paletteKeys="Ctrl+K"'}>
          <StatusBar surfaceId="2" theme="mocha" paletteKeys="Ctrl+K" />
        </KitBar>
        <LiveKitBar />
      </Stage>
      <Meta
        specs={[["paletteKeys", "the chord the chip shows · default Cmd+K · a host that binds one chord per platform passes that chord · a Kbd keys string or array"], ["chip keys", "Enter on press, Space on release, only for a new press that began on the chip · repeats do nothing · a Space released after a press that began elsewhere does nothing · pointer unchanged"], ["chip cap", "Kbd, as every other keycap"]]}
        tokens={[{ tok: "--tasty-text-muted", use: "chip label at rest", color: "var(--tasty-text-muted)" }, { tok: "--tasty-text-secondary", use: "chip label on hover", color: "var(--tasty-text-secondary)" }]} />
    </Spec>
  );
}
