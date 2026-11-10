import React from "react";
import * as WDS from "../../components/index.js";
import { Section as WSection, Spec as WSpec, Stage as WStage, Meta as WMeta, Note as WNote } from "../parts/specimen.jsx";
import { wLbl, WRow } from "./settings-narrow.jsx";
import { SettingsWindow as Kit_SettingsWindow } from "../../ui_kits/terminal/overlays/settings_window.jsx";

// R-56 (2026-11-10) — macOS Alt key mapping and the macOS link click choices.
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

const ALT_MAP = [
  ["alt", "Cmd", "Option"],
  ["extra", "Option", "Cmd"],
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

      <WSpec id="terminal-link-click-modifier-choices-macos" title="Terminal › General · link click modifier choices (macOS)"
        when={<>The link click modifier is a <b>physical key</b> and ignores the Alt key mapping. On macOS the choices name the keys you press — <b>Ctrl · Option · Cmd</b> — which ends the old “Alt” label for what is really Option. They are always <b>words</b>: this is a settings choice, not a rendered shortcut, so the Cmd / Option display settings do not apply (U3 covers shortcut display only). No extra caption on the row: the key name now says what to hold. The last choice, “Disable left-click opening”, is drawn as today; whether it stays is <b>awaiting the user's answer</b>. Windows and Linux choices are not drawn — placeholder only.</>}>
        <WStage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <span style={wLbl}>macOS — closed (current value Ctrl; the default awaits the user's answer)</span>
            <div style={{ ...wPanel, width: 520 }}>
              <Row label="Link click modifier:">
                <WSelect options={[{ value: "ctrl", label: "Ctrl" }]} value="ctrl" style={{ width: "var(--tasty-field-width-md)" }} />
              </Row>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <span style={wLbl}>macOS — open list</span>
            <div style={wMenu}>
              <WMenuItem label="Ctrl" selected />
              <WMenuItem label="Option" />
              <WMenuItem label="Cmd" />
              <WMenuItem label="Disable left-click opening" wrap />
            </div>
            <span style={{ ...wLbl, maxWidth: "var(--tasty-field-width-md)" }}>last row: kept as today — keep or drop awaits the user</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
            <span style={wLbl}>Windows · Linux</span>
            <div style={{ width: 240, minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--tasty-space-md)", boxSizing: "border-box", border: "var(--tasty-border-width) dashed var(--tasty-border-strong)", borderRadius: "var(--tasty-radius)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", textAlign: "center" }}>
              Choices and default awaiting the user's answer — not drawn
            </div>
          </div>
        </WStage>
        <WMeta
          specs={[["place", "unchanged — Terminal › General, Option as Meta stays right below"], ["macOS choices", "Ctrl · Option · Cmd (+ Disable left-click opening, pending) — words, every language"], ["width", "field-width-md 160 — unchanged; the macOS words are shorter than the existing off choice"], ["off choice", "open list wraps it (MenuItem wrap) when wider than the list; closed trigger unchanged"], ["caption", "none on macOS"], ["Windows / Linux", "pending user answer"]]}
          tokens={[{ tok: "--tasty-field-width-md", use: "Select + list width" }, { tok: "--tasty-menu-item-selected-fg", use: "current value", color: "var(--tasty-menu-item-selected-fg)" }]} />
        <WNote>i18n — new <code>settings.terminal.link_modifier_option</code> “Option” and <code>settings.terminal.link_modifier_cmd</code> “Cmd” (all languages). <code>settings.terminal.link_modifier_ctrl</code>, <code>_none</code> and <code>_label</code> unchanged. On macOS the stored <code>alt</code> value shows <code>link_modifier_option</code>; <code>link_modifier_alt</code> stays for Windows / Linux.</WNote>
      </WSpec>
    </WSection>
  );
}

export { AltKeySection };
