import React from "react";
import * as WDS from "../../components/index.js";
import { Section as WSection, Spec as WSpec, Stage as WStage, Views as WViews, View as WView, Meta as WMeta, Note as WNote } from "../parts/specimen.jsx";
import { wLbl, WRow } from "./settings-narrow.jsx";
import { SettingsWindow as Kit_SettingsWindow } from "../../ui_kits/terminal/overlays/settings_window.jsx";

// R-56 (2026-11-10) — macOS Alt key mapping and the link click choices per OS (macOS · Windows · Linux).
// The first Spec renders the settings kit itself with os="macos" (L2 order + separator);
// the rows and open lists below are drawn here so the hidden states show without clicking.
const noop = () => {};

const { Select: WSelect, MenuItem: WMenuItem } = WDS;

const wCode = { fontFamily: "var(--tasty-ui-code-font)", fontSize: "1em", background: "var(--tasty-ui-code-bg)", color: "var(--tasty-ui-code-fg)", padding: "0 var(--tasty-ui-code-padding-x)", borderRadius: "var(--tasty-ui-code-radius)" };
const C = ({ children }) => <code style={wCode}>{children}</code>;
const wPanel = { display: "flex", flexDirection: "column", gap: "var(--tasty-settings-row-gap)", padding: "var(--tasty-space-md)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" };
const wMenu = { width: "var(--tasty-field-width-md)", padding: "var(--tasty-space-xs)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-menu-radius)", background: "var(--tasty-menu-bg)", boxShadow: "var(--tasty-shadow-popover)", display: "flex", flexDirection: "column" };
const wCaption = { margin: 0, fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", lineHeight: "var(--tasty-line-height-ui)", maxWidth: "var(--tasty-measure-md)" };

// the shared settings Row (settings-narrow.jsx) + a row caption under it (row-caption-gap), as the kit does
function Row({ label, caption, children }) {
  const row = <WRow label={label}>{children}</WRow>;
  if (!caption) return row;
  return <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-settings-row-caption-gap)" }}>{row}{caption}</div>;
}

// A settings Row that stacks the way the canon's narrow rule says (Settings rows at narrow widths): side by side
// while the control fits beside the label, stacked when it does not, and back only with settings-row-stack-hysteresis
// to spare. The link click card uses it so its rows fit a 390 page instead of scrolling.
function FitRow({ label, children }) {
  const ref = React.useRef(null);
  const need = React.useRef(0);
  const [stacked, setStacked] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const check = () => {
      const row = el.firstElementChild;
      if (!row) return;
      const spare = parseFloat(getComputedStyle(el).getPropertyValue("--tasty-settings-row-stack-hysteresis")) || 0;
      setStacked((was) => {
        if (!was) {
          if (row.scrollWidth > el.clientWidth) { need.current = row.scrollWidth; return true; }
          return false;
        }
        return el.clientWidth < need.current + spare;
      });
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} style={{ minWidth: 0 }}><WRow label={label} stacked={stacked}>{children}</WRow></div>;
}

const ALT_MAP = [
  ["alt", "Cmd", "Option"],
  ["extra", "Option", "Cmd"],
];

// Link click modifier card: the live demo has one Select per OS; Views draw the closed and open states as inert frames.
// The demo value cmd is a gallery name only: the saved value name of the macOS Cmd choice is the implementing side's.
const LINK_OFF = "Disable left-click opening";
const LINK_LIVE = [
  { os: "macOS", options: [{ value: "ctrl", label: "Ctrl" }, { value: "alt", label: "Option" }, { value: "cmd", label: "Cmd" }, { value: "none", label: LINK_OFF }] },
  { os: "Windows · Linux", options: [{ value: "ctrl", label: "Ctrl" }, { value: "alt", label: "Alt" }, { value: "none", label: LINK_OFF }] },
];
const LINK_CLOSED = [
  { name: "link-click-modifier-macos-default", label: "macOS — closed (default Ctrl)", value: "ctrl", shown: "Ctrl" },
  { name: "link-click-modifier-macos-saved-alt", label: "macOS — closed, saved value alt (Option)", value: "alt", shown: "Option" },
  { name: "link-click-modifier-winlinux-default", label: "Windows · Linux — closed (default Ctrl)", value: "ctrl", shown: "Ctrl" },
];
const LINK_LISTS = [
  { name: "link-click-modifier-macos-open", label: "macOS — open list", items: ["Ctrl", "Option", "Cmd", LINK_OFF] },
  { name: "link-click-modifier-winlinux-open", label: "Windows · Linux — open list", items: ["Ctrl", "Alt", LINK_OFF] },
];

function AltKeySection() {
  return (
    <WSection id="altkey" title="Alt key (macOS) — mapping and link click keys">
      <WSpec id="keybindings-l2-order-macos" title="Keybindings L2 on macOS · Plugins → separator → Alt key → Import / Export"
        when={<>The settings kit rendered with <code>os="macos"</code>, opened on Keybindings › Alt key. On macOS the L2 list ends <b>Plugins</b>, then the <b>separator</b>, then <b>Alt key</b> and <b>Import / Export</b> — the two sections that do not edit a binding. Windows and Linux keep the old order (no Alt key, separator above Import / Export). Typing in the filter hides the separator, as before.</>}>
        <WStage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-app)", overflowX: "auto" }}>
          <div style={{ position: "relative", flex: "none", width: 1140, height: 740 }}>
            <Kit_SettingsWindow os="macos" initialL1="Keybindings" initialL2="Alt key" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
          </div>
        </WStage>
        <WMeta
          specs={[["macOS L2", "General · Workspace · Pane · Tab · Surface · Clipboard · Zoom · Explorer · Scripts · Preset · Plugins | Alt key · Import / Export"], ["separator", "one, above Alt key (macOS) · above Import / Export (Windows / Linux) · hidden while filtering"], ["kit", "SettingsWindow os = windows (default) · macos · linux, initialL1 / initialL2"]]}
          tokens={[{ tok: "--tasty-separator", use: "L2 separator", color: "var(--tasty-separator)" }]} />
      </WSpec>
      <WSpec id="keybindings-alt-key-mapping-macos" title="Keybindings › Alt key · one row, macOS only"
        when={<>On macOS the <C>alt</C> token can mean <b>Cmd</b> (default, today's behaviour) or <b>Option</b>; <C>extra</C> is always the other key. The row lives in its <b>own Keybindings section “Alt key”</b>, after Plugins, with the Keybindings separator moved above it — it changes what the tokens mean rather than editing a binding, like Import / Export, which follows it. Its own section is what makes the label-only filter find “alt”. The section and the row do not exist on Windows or Linux. Switching keeps every saved binding; the binding list, palette, modifier hint and keycaps re-render with the physical key each token now means, drawn with that key's <b>existing display setting</b> (Cmd key display / Option key display — unchanged, the Alt text choice included).</>}>
        <WStage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <span style={wLbl}>Keybindings › Alt key — default (Cmd)</span>
            <div style={{ ...wPanel, width: 520 }}>
              <Row label="Alt key mapping:" caption={<p style={wCaption}>Saved shortcuts stay the same; only the keys you press change. <C>alt</C> uses the selected key and <C>extra</C> the other.</p>}>
                <WSelect options={[{ value: "cmd", label: "Cmd" }, { value: "option", label: "Option" }]} value="cmd" style={{ width: "var(--tasty-field-width-md)" }} />
              </Row>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <span style={wLbl}>open list</span>
            <div style={wMenu}>
              <WMenuItem label="Cmd" selected />
              <WMenuItem label="Option" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <span style={wLbl}>token → physical key (not drawn in the app)</span>
            <div style={{ display: "grid", gridTemplateColumns: "64px 96px 96px", gap: "var(--tasty-space-xs) var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>
              <span />
              <span style={{ color: "var(--tasty-text-muted)" }}>Alt key: Cmd</span>
              <span style={{ color: "var(--tasty-text-muted)" }}>Alt key: Option</span>
              {ALT_MAP.map(([tok, a, b]) => (
                <React.Fragment key={tok}><span><C>{tok}</C></span><span>{a}</span><span>{b}</span></React.Fragment>
              ))}
            </div>
          </div>
        </WStage>
        <WMeta
          specs={[["place", "Keybindings L2 · after Plugins · separator above (moved from Import / Export) · Import / Export follows · macOS only"], ["row", "Row + Select field-width-md · default Cmd · caption = RowCaption (measure-md, row-caption-gap 4)"], ["code runs", "backtick runs in the catalog → ui-code tokens"], ["display", "no new glyph or display setting — Cmd key display / Option key display follow the physical key"], ["applies", "immediately, no restart (implementation plan)"]]}
          tokens={[{ tok: "--tasty-field-width-md", use: "Select" }, { tok: "--tasty-settings-row-caption-gap", use: "row → caption" }, { tok: "--tasty-ui-code-bg", use: "code run", color: "var(--tasty-ui-code-bg)" }]} />
        <WNote>i18n — <code>settings.keybindings.subtab.alt_key</code> “Alt key” / “Alt 키” / “Alt キー” / “Alt 键” · <code>settings.keybindings.alt_key_label</code> “Alt key mapping:” / “Alt 키 지정:” / “Alt キーの割り当て:” / “Alt 键映射：” · <code>settings.keybindings.alt_key_cmd</code> “Cmd” · <code>settings.keybindings.alt_key_option</code> “Option” (all languages) · <code>settings.keybindings.alt_key_desc</code> “Saved shortcuts stay the same; only the keys you press change. `alt` uses the selected key and `extra` the other.” / “저장된 단축키는 그대로 유지되고 실제로 누르는 키만 바뀝니다. `alt`는 선택한 키, `extra`는 나머지 키를 사용합니다.” / “保存済みのショートカットはそのままで、実際に押すキーだけが変わります。`alt` は選択したキー、`extra` はもう一方のキーを使います。” / “已保存的快捷键保持不变，只有实际按下的按键会改变。`alt` 使用所选按键，`extra` 使用另一个按键。” (backticks = code runs).</WNote>
      </WSpec>

      <WSpec id="terminal-link-click-modifier-choices-macos" title="Terminal › General · link click modifier choices per OS"
        when={<>The link click modifier is a <b>physical key</b> and ignores the Alt key mapping. On macOS the choices name the keys you press — <b>Ctrl · Option · Cmd</b> — which ends the old “Alt” label for what is really Option. On Windows and Linux the choices are <b>Ctrl · Alt</b>; the Win / Super key is not offered. Every OS keeps <b>“Disable left-click opening”</b> as the last choice, and the default is <b>Ctrl</b> on every OS. The choices are always <b>words</b>: this is a settings choice, not a rendered shortcut, so the Cmd / Option display settings do not apply (U3 covers shortcut display only). No caption on the row on any OS: the list itself shows which keys can be used, so the missing Win / Super key needs no note.</>}>
        <WStage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-xl)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {LINK_LIVE.map(({ os, options }) => (
            <div key={os} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", flex: "1 1 auto", minWidth: 0, maxWidth: "var(--tasty-settings-content-max-width)" }}>
              <span style={wLbl}>{os} — live</span>
              <div style={wPanel}>
                <FitRow label="Link click modifier:">
                  <WSelect options={options} defaultValue="ctrl" style={{ width: "var(--tasty-field-width-md)" }} />
                </FitRow>
              </div>
            </div>
          ))}
        </WStage>
        <WViews>
          {LINK_CLOSED.map(({ name, label, value, shown }) => (
            <WView key={name} name={name} label={label} wide>
              <div inert="" style={{ width: "100%", maxWidth: "var(--tasty-settings-content-max-width)", pointerEvents: "none" }}>
                <FitRow label="Link click modifier:">
                  <WSelect options={[{ value, label: shown }]} value={value} style={{ width: "var(--tasty-field-width-md)" }} />
                </FitRow>
              </div>
            </WView>
          ))}
          {LINK_LISTS.map(({ name, label, items }) => (
            <WView key={name} name={name} label={label}>
              <div inert="" style={{ ...wMenu, pointerEvents: "none" }}>
                {items.map((it, i) => <WMenuItem key={it} label={it} selected={i === 0} wrap={i === items.length - 1} />)}
              </div>
            </WView>
          ))}
        </WViews>
        <WMeta
          specs={[["place", "unchanged — Terminal › General, Option as Meta stays right below"], ["macOS choices", "Ctrl · Option · Cmd · Disable left-click opening — words, every language"], ["Windows / Linux choices", "Ctrl · Alt · Disable left-click opening — words, every language; no Win / Super"], ["default", "Ctrl on every OS"], ["saved alt on macOS", "the stored value alt stays the physical Option key and shows Option (link_modifier_option) in the closed trigger and the list · no migration of saved alt"], ["frame width", "settings-content-max-width 620 cap — the settings content column the row sits in; narrower pages fit the row to the space and stack it when the control does not fit"], ["width", "field-width-md 160 — unchanged; every key word is shorter than the existing off choice"], ["off choice", "open list wraps it (MenuItem wrap) when wider than the list; closed trigger unchanged"], ["caption", "none on any OS — no note for the missing Win / Super key"]]}
          tokens={[{ tok: "--tasty-field-width-md", use: "Select + list width" }, { tok: "--tasty-menu-item-selected-fg", use: "current value", color: "var(--tasty-menu-item-selected-fg)" }]} />
        <WNote>i18n — the app catalog has neither <code>settings.terminal.link_modifier_option</code> nor <code>settings.terminal.link_modifier_cmd</code> yet, in any of the four languages; add both with the R-56 values: “Option” and “Cmd” in every language. <code>settings.terminal.link_modifier_ctrl</code>, <code>_alt</code>, <code>_none</code> and <code>_label</code> keep their values. On macOS the stored <code>alt</code> value shows <code>link_modifier_option</code>; <code>link_modifier_alt</code> stays for Windows / Linux. Behaviour — the app's settings row and its saved-value normalisation handle only <code>ctrl</code>, <code>alt</code> and <code>none</code> today. A saved <code>alt</code> is not migrated: it is already the physical Option key. The macOS Cmd choice is new behaviour, and the name of its saved value is the implementing side's to choose.</WNote>
      </WSpec>
    </WSection>
  );
}

export { AltKeySection };
