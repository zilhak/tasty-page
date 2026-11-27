import React from "react";
import { Spec, Stage, Meta, Views, View } from "../parts/specimen.jsx";
import { StatusBar } from "../../ui_kits/terminal/work.jsx";

// The kit StatusBar itself, as the kit shell and the landing page mount it: the chip label is the host's paletteKeys
// (Cmd+K by default, Ctrl+K where the host binds that), and the chip is a press-once button (fresh-press.js). The live
// bar counts chip and theme clicks so a held key can be watched: a new press of Enter or Space counts one, and holding
// it counts no more. The two fixed labels are Views, inert, so Tab goes straight to the live bar. Each bar shows the
// page's theme, as the bar shows the app's.

// The page theme, read after mount (the server markup draws Mocha) and kept in step with the site's theme switch.
function usePageTheme() {
  const [theme, setTheme] = React.useState("mocha");
  React.useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute("data-theme") === "latte" ? "latte" : "mocha");
    read();
    const o = new MutationObserver(read);
    o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => o.disconnect();
  }, []);
  return theme;
}

// The bar's frame leaves room around the bar, so the kit's focus ring on the chip (2px, offset 1px) draws whole.
function KitBar({ children }) {
  return (
    <div style={{ width: 520, maxWidth: "100%", boxSizing: "border-box", padding: "var(--tasty-space-xs)",
      border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>{children}</div>
  );
}

function LiveKitBar({ theme }) {
  const [chip, setChip] = React.useState(0);
  const [themeN, setThemeN] = React.useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", width: 520, maxWidth: "100%" }}>
      <KitBar>
        <StatusBar surfaceId="2" theme={theme} paletteKeys="Ctrl+K"
          onPalette={() => setChip((v) => v + 1)} onTheme={() => setThemeN((v) => v + 1)} />
      </KitBar>
      <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>
        {`palette chip clicks: ${chip} · theme clicks: ${themeN} · Tab to the chip · press Enter or Space → one more · hold Enter or Space → still one more, not one per repeat · release and press again → one more`}
      </span>
    </div>
  );
}

export function StatusBarKitSpec() {
  const theme = usePageTheme();
  return (
    <Spec id="status-bar-kit-palette-chip" title="Kit status bar — palette chip"
      when={<>The kit <code>StatusBar</code> as the kit shell and the landing page mount it. The palette chip shows the chord the host binds: <b>Cmd+K</b> by default, or what the host passes as <code>paletteKeys</code> (the landing page passes <b>Ctrl+K</b> off macOS). The chip opens the palette and gets the focus back when it closes, so it clicks only on a <b>new press</b> that began on it: the repeats of the key that ran a command do not reopen the palette.</>}>
      <Stage variant="column" style={{ gap: "var(--tasty-space-md)" }}>
        <LiveKitBar theme={theme} />
      </Stage>
      <Views>
        <View name="status-bar-kit-default" label="default · paletteKeys not passed → Cmd+K">
          <div inert="" style={{ pointerEvents: "none" }}><KitBar><StatusBar surfaceId="2" theme={theme} /></KitBar></div>
        </View>
        <View name="status-bar-kit-host-ctrl" label={'host · paletteKeys="Ctrl+K"'}>
          <div inert="" style={{ pointerEvents: "none" }}><KitBar><StatusBar surfaceId="2" theme={theme} paletteKeys="Ctrl+K" /></KitBar></div>
        </View>
      </Views>
      <Meta
        specs={[["paletteKeys", "the chord the chip shows · default Cmd+K · a host that binds one chord per platform passes that chord · a Kbd keys string or array"], ["chip keys", "Enter on press, Space on release, only for a new press that began on the chip · repeats do nothing · a Space released after a press that began elsewhere does nothing · pointer unchanged"], ["chip cap", "Kbd, as every other keycap"], ["theme cell", "the app's theme, here the page's"]]}
        tokens={[{ tok: "--tasty-text-muted", use: "chip label at rest", color: "var(--tasty-text-muted)" }, { tok: "--tasty-text-secondary", use: "chip label on hover", color: "var(--tasty-text-secondary)" }]} />
    </Spec>
  );
}
