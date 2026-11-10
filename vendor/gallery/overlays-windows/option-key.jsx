import React from "react";
import { Section as WSection, Spec as WSpec, Stage as WStage, Meta as WMeta, Note as WNote } from "../parts/specimen.jsx";
import { wLbl, wRec, WKbd, WInput, WIcon } from "./settings-narrow.jsx";

// 2026-11-10 (R-56): the token is now `extra` (replaces `option`, which is no longer read).
const wOS = [["macOS · Alt key Cmd", "⌃⌥K", "Option"], ["macOS · Alt key Option", "⌃⌘K", "Cmd"], ["Windows", "Ctrl+Win+K", "Win"], ["Linux", "Super+Shift+1", "Super"]];
const wCode = { fontFamily: "var(--tasty-ui-code-font)", fontSize: "1em", background: "var(--tasty-ui-code-bg)", color: "var(--tasty-ui-code-fg)", padding: "0 var(--tasty-ui-code-padding-x)", borderRadius: "var(--tasty-ui-code-radius)" };
const C = ({ children }) => <code style={wCode}>{children}</code>;
const wErr = { fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-kb-plugin-error-fg)" };
// OS key name caption — one string on Windows / Linux, two on macOS (by the Alt key mapping)
const wNameCaps = [
  ["Windows / Linux", "cmd+k", <>Write Win and Super as <C>extra</C>.</>],
  ["macOS · Alt key Cmd", "option+k", <>Write Cmd as <C>alt</C> and Option as <C>extra</C>.</>],
  ["macOS · Alt key Option", "option+k", <>Write Option as <C>alt</C> and Cmd as <C>extra</C>.</>],
];
function OptionKeySection() {
  return (
    <WSection id="optionkey" title="Win · Super as extra — names and notices">
      <WSpec id="key-names-os-reserved-caption-text-entry-hint" title="Key names · OS-reserved caption · text-entry hint"
        when={<>The <C>extra</C> token (it replaces <C>option</C>, which is no longer read — old values are not converted) means <b>Win</b> on Windows, <b>Super</b> on Linux, and on macOS the key the Alt key mapping leaves over: <b>Option</b> by default, <b>Cmd</b> when Alt key is Option (see “Alt key (macOS)”). Win and Super are shown as <b>words</b>, like Ctrl and Alt — no logo glyph (the Windows logo is a trademark and Linux keyboards print different marks); macOS keys follow that physical key's display setting. Linux uses <b>Super</b> on every desktop, KDE included, so one config reads the same everywhere. The display-style dropdown stays macOS-only (there is nothing to choose between on the other two). A shortcut <b>typed as text</b> (config file, bundle import, plugin shortcut field) that matches a short known list of OS-owned combos gets a warning caption — the list is a hint, not a guarantee, and the copy says “may”. A text field that receives an OS key name (<C>cmd+k</C>, <C>super+k</C>, <C>win+k</C>, <C>meta+k</C>, and now the old <C>option+k</C>) gets a dedicated caption saying how to write it on <b>this</b> machine: one string on Windows / Linux, and on macOS one of two strings chosen by the Alt key mapping.</>}>
        <WStage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-panel)", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={wLbl}>extra — shortcut display per OS</span>
            {wOS.map(([os, combo, word]) => (
              <div key={os} style={{ display: "grid", gridTemplateColumns: "136px 140px 1fr", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--tasty-text-secondary)" }}>{os}</span>
                <span style={wRec}>{combo}</span>
                <WKbd keys={word} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 300 }}>
            <span style={wLbl}>plugin shortcut field — OS-reserved (Windows)</span>
            <WInput block mono defaultValue="extra+l" />
            <span style={{ display: "flex", alignItems: "flex-start", gap: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-kb-os-reserved-fg)" }}><span style={{ display: "inline-flex", flex: "none", marginTop: 1 }}><WIcon name="alertTriangle" size="var(--tasty-icon-size-xs)" /></span>Windows may use Win+L itself, so Tasty might not receive it.</span>
          </div>
          {wNameCaps.map(([os, typed, cap]) => (
            <div key={os} style={{ display: "flex", flexDirection: "column", gap: 4, width: 300 }}>
              <span style={wLbl}>plugin shortcut field — OS key name typed ({os})</span>
              <WInput block mono defaultValue={typed} invalid />
              <span style={wErr}>{cap}</span>
            </div>
          ))}
        </WStage>
        <WMeta
          specs={[["names", "extra = Windows Win · Linux Super (all desktops) — words, no icon asset · macOS Option (Alt key Cmd) or Cmd (Alt key Option) — that key's display setting"], ["display dropdown", "macOS only"], ["reserved list (hint)", "Windows: Win alone, Win+L · D · E · R · I · Tab · Linux: Super alone"], ["reserved caption", "warning tone · under the field / one line in the import warning block · never blocks saving"], ["recorded", "no caption (the OS key never reaches the recorder)"], ["OS key name", "cmd · super · win · meta · option → error caption replacing the generic “Unrecognized key” · Windows / Linux keys.os_key_name · macOS keys.os_key_name_macos_cmd_alt or _option_alt by the Alt key mapping · code runs for the tokens"], ["hold helper", "no extra binding on Win / Linux → holding Win / Super shows nothing (agreed)"]]}
          tokens={[{ tok: "--tasty-kb-os-reserved-fg", use: "→ accent-warning", color: "var(--tasty-kb-os-reserved-fg)" }, { tok: "--tasty-kb-plugin-error-fg", use: "OS key name", color: "var(--tasty-kb-plugin-error-fg)" }]} />
        <WNote>i18n — <code>keys.os_reserved.windows</code> “Windows may use {"{combo}"} itself, so Tasty might not receive it.” / “Windows가 {"{combo}"}를 먼저 쓸 수 있어 Tasty에 전달되지 않을 수 있습니다.” / “{"{combo}"} は Windows が使うことがあり、Tasty に届かない場合があります。” · <code>keys.os_reserved.linux</code> “Your desktop may use {"{combo}"} itself, so Tasty might not receive it.” / “데스크톱이 {"{combo}"}를 먼저 쓸 수 있어 Tasty에 전달되지 않을 수 있습니다.” / “{"{combo}"} はデスクトップが使うことがあり、Tasty に届かない場合があります。” · <code>keys.os_key_name</code> (Windows / Linux, rewritten) “Write Win and Super as `extra`.” / “Win·Super는 `extra`로 적으세요.” / “Win・Super は `extra` と書いてください。” / “请将 Win 和 Super 写为 `extra`。” · new <code>keys.os_key_name_macos_cmd_alt</code> “Write Cmd as `alt` and Option as `extra`.” / “Cmd는 `alt`로, Option은 `extra`로 적으세요.” / “Cmd は `alt`、Option は `extra` と書いてください。” / “请将 Cmd 写为 `alt`，将 Option 写为 `extra`。” · new <code>keys.os_key_name_macos_option_alt</code> “Write Option as `alt` and Cmd as `extra`.” / “Option은 `alt`로, Cmd는 `extra`로 적으세요.” / “Option は `alt`、Cmd は `extra` と書いてください。” / “请将 Option 写为 `alt`，将 Cmd 写为 `extra`。” (backticks = code runs). The option-migration card and its gallery sample are removed (feature deleted).</WNote>
      </WSpec>
    </WSection>
  );
}

export { OptionKeySection };
