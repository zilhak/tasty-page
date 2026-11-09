import React from "react";
import { Icon, Checkbox, Input, SearchableSelect, Toast, Tooltip } from "../../components/index.js";
import { Spec, Stage, Meta, Note, Dont } from "../parts/specimen.jsx";

// Tasty Gallery — Settings › Appearance font rows and the rejected font states.

// One key per message in each language. settings.appearance.font.custom_font_rejected
const REJECT_COPY = {
  en: "Could not load a font from this path. Using another font.",
  ko: "이 경로에서 폰트를 불러오지 못했습니다. 다른 폰트로 표시합니다.",
  ja: "このパスからフォントを読み込めませんでした。別のフォントで表示します。",
};
const ROW_COPY = {
  en: { base: "Custom font file:", row: "Custom font file", ud: "Use default" },
  ko: { base: "커스텀 폰트 파일:", row: "커스텀 폰트 파일", ud: "기본값 사용" },
  ja: { base: "カスタムフォントファイル:", row: "カスタムフォントファイル", ud: "デフォルトを使用" },
};
const INDENT = "calc(var(--tasty-settings-label-width) + var(--tasty-settings-label-gap))";

// The line under a rejected control. hold keeps its box and hides its ink, so taking focus never moves the rows below.
function RejectLine({ text, hold = false, indent = true, order }) {
  return (
    <span aria-hidden={hold || undefined} role={hold ? undefined : "status"} style={{ flex: "0 0 100%", order, boxSizing: "border-box", paddingLeft: indent ? INDENT : 0, visibility: hold ? "hidden" : undefined }}>
      <span style={{ display: "block", maxWidth: "var(--tasty-measure-md)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-accent-danger-raised)", overflowWrap: "anywhere" }}>{text}</span>
    </span>
  );
}

// layout: "wide" keeps label, control and checkbox on one line. "dropped" moves the checkbox under the line. "wrapped" puts the control at the row start. "stacked" does both.
function FontRow({ label, control, ud, udChecked, line, hold, layout = "wide" }) {
  const atStart = layout === "wrapped" || layout === "stacked";
  const drop = layout === "dropped" || layout === "stacked";
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: "var(--tasty-settings-label-gap)", rowGap: "var(--tasty-settings-row-caption-gap)", minHeight: "var(--tasty-settings-row-min-height)", padding: "var(--tasty-space-xs) 0" }}>
      <span style={{ flex: atStart ? "0 0 100%" : "none", width: atStart ? "auto" : "var(--tasty-settings-label-width)", fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)" }}>{label}</span>
      <span style={{ flex: "none", display: "flex" }}>{control}</span>
      {ud && <span style={{ display: "inline-flex", order: drop ? 2 : undefined }}><Checkbox label={ud} checked={udChecked} /></span>}
      {line && <RejectLine text={line} hold={hold} indent={!atStart} order={drop ? 1 : undefined} />}
    </div>
  );
}

// state: rest | focus | rejected | focus-rejected | default
function FileControl({ value = "", state = "rest", label }) {
  return (
    <span style={{ display: "flex", width: "var(--tasty-field-width-lg)" }}>
      <Input block mono value={value} aria-label={label} readOnly={state === "default" || undefined} onChange={() => {}}
        invalid={state === "rejected"} aria-invalid={state === "rejected" ? true : undefined} focused={state === "focus" || state === "focus-rejected"} />
    </span>
  );
}

// One font file row. base = the default grid (colon label, no checkbox). The line belongs to rejected, and focus-rejected only keeps its box.
function FileRow({ base = false, lang = "en", value, state = "rest", layout }) {
  const C = ROW_COPY[lang];
  const label = base ? C.base : C.row;
  const line = state === "rejected" || state === "focus-rejected" ? REJECT_COPY[lang] : null;
  return <FontRow label={label} layout={layout} control={<FileControl value={value} state={state} label={label} />} ud={base ? null : C.ud} udChecked={state === "default"} line={line} hold={state === "focus-rejected"} />;
}

function Frame({ theme, label, view, w = "var(--tasty-size-560)", children }) {
  return (
    <div data-theme={theme} data-view={view} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0, maxWidth: "100%", background: "var(--tasty-bg-app)" }}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{label}</span>
      <div style={{ width: w, maxWidth: "100%", boxSizing: "border-box", padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)" }}>{children}</div>
    </div>
  );
}
// A named state inside a frame.
function St({ name, view, children }) {
  return (
    <div data-view={view} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", paddingBottom: "var(--tasty-space-md)" }}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{name}</span>
      {children}
    </div>
  );
}
const stage = (children) => <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>{children}</Stage>;
const THEMES = [["Mocha", "mocha"], ["Latte", "latte"]];
const LONG_PATH = "/usr/local/share/fonts/NerdFonts/JetBrainsMono/JetBrainsMonoNerdFont-Regular.ttf";

// Live row. The demo judges by extension only so it needs no file. The app reads the file.
function LiveFileRow() {
  const [text, setText] = React.useState("~/notes/todo.txt");
  const [focused, setFocused] = React.useState(false);
  const bad = (v) => v !== "" && !/\.(ttf|otf|ttc)$/i.test(v);
  const [held, setHeld] = React.useState(false);
  const shown = !focused && bad(text);
  return (
    <FontRow label="Custom font file" ud="Use default" udChecked={false} line={shown || (focused && held) ? REJECT_COPY.en : null} hold={focused}
      control={<span style={{ display: "flex", width: "var(--tasty-field-width-lg)" }}><Input block mono value={text} invalid={shown} aria-invalid={shown || undefined} aria-label="Custom font file"
        onChange={(e) => setText(e.target.value)} onFocus={() => { setHeld(bad(text)); setFocused(true); }} onBlur={() => setFocused(false)} /></span>} />
  );
}

// 2026-10-06 — Settings › Appearance › <surface> › Font override. Same idiom as the colour-override rows:
// label (settings-label-width) · control (its field-width) · trailing Checkbox "Use default". Preview is a
// separate block BELOW the grid at every window width — no side column to collide with.
function FontOverrideG({ long = false, file = null }) {
  const ud = long ? "既定値を使用" : "Use default";
  const rows = [
    ["Font family", <span style={{ display: "flex", width: "var(--tasty-field-width-lg)" }}><Input block defaultValue="D2Coding" icon={<Icon name="search" />} /></span>, false],
    ["Custom font file", file ? <FileControl value={file.value} state={file.state} label="Custom font file" /> : <span style={{ display: "flex", width: "var(--tasty-field-width-lg)" }}><Input block mono readOnly /></span>, !file],
    ["Font size", <span style={{ display: "flex", width: "var(--tasty-field-width-xs)" }}><Input block mono defaultValue="14" addon="px" /></span>, false],
    ["Line height", <span style={{ display: "flex", width: "var(--tasty-field-width-xs)" }}><Input block mono readOnly defaultValue="1.2" /></span>, true],
    ["Font DPI scaling", <span style={{ display: "flex", width: "var(--tasty-field-width-md)" }}><Input block readOnly defaultValue="Follow display" /></span>, true],
  ];
  // 2026-10-06 (b2) — preview content: the surface's EFFECTIVE background + effective font, four sample lines
  // (latin · hangul · digits · kana), inside the kit box edge. bg-app / bg-panel are stand-ins for the runtime
  // surface colours (Terminal default: Focused #000000, Unfocused = base).
  const pv = (focused) => (
    <div style={{ flex: "1 1 var(--tasty-font-preview-min-width)", minWidth: "var(--tasty-font-preview-min-width)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
      <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{focused ? "Focused" : "Unfocused"}</span>
      <div style={{ display: "flex", flexDirection: "column", padding: "var(--tasty-font-preview-padding-y) var(--tasty-font-preview-padding-x)", background: focused ? "var(--tasty-bg-app)" : "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid " + (focused ? "var(--tasty-border-strong)" : "var(--tasty-separator)"), borderRadius: "var(--tasty-radius)",
        fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-term)", lineHeight: "var(--tasty-font-preview-line-height)", color: "var(--tasty-text-primary)", whiteSpace: "nowrap", overflow: "hidden" }}>
        <span>AaBbCcDdEeFfGg</span><span>가나다라마바사</span><span>1234567890</span><span>アカサタナハマラヤワ</span>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-lg)", maxWidth: "var(--tasty-settings-content-max-width)" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map(([label, ctl, def]) => (
          <FontRow key={label} label={label} control={ctl} ud={ud} udChecked={def} line={file && label === "Custom font file" && file.state === "rejected" ? REJECT_COPY.en : null} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Preview</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)" }}>{pv(true)}{pv(false)}</div>
        <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Font: D2Coding / 14.0px</span>
      </div>
    </div>
  );
}

// toast.font_rejected. {} is the path or the family name.
const TOAST_COPY = {
  en: (v) => "Could not load the font: " + v + ". Using another font.",
  ko: (v) => "폰트를 불러오지 못했습니다: " + v + ". 다른 폰트로 표시합니다.",
  ja: (v) => "フォントを読み込めませんでした: " + v + "。別のフォントで表示します。",
};
const TOAST_PATH = "~/fonts/notes.txt";
const TOAST_LONG = "/usr/local/…/JetBrainsMono/JetBrainsMonoNerdFont-Regular.ttf";

// The bottom-right corner of the main window: the toast stack over a surface, above the status bar.
function MainCorner({ theme, label, view, children }) {
  return (
    <div data-theme={theme} data-view={view} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", maxWidth: "100%", background: "var(--tasty-bg-app)" }}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{label}</span>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end", gap: "var(--tasty-space-sm)", width: "var(--tasty-size-400)", maxWidth: "100%", minHeight: "var(--tasty-size-180)", boxSizing: "border-box", padding: "var(--tasty-space-md)", paddingBottom: "var(--tasty-toast-stack-offset-bottom)", background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)" }}>
        {children}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "var(--tasty-status-bar-height)", background: "var(--tasty-bg-panel)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }} />
      </div>
    </div>
  );
}

function FontToastSpec() {
  return (
    <Spec id="font-rejected-toast" title="Font rejected toast"
      when={<>A <b>saved</b> font value that can't be used raises one toast in the main window: after the first check at startup, or right after saving. It never comes from the preview, so typing a path raises nothing. It is the <b>warning</b> card, like the language pack font notice, because Tasty keeps running on another font and the setting is kept. The body names the value, since at startup nothing else says which one failed. A value rejected on several surfaces raises one card, so the card names no surface. Two different values raise two cards. There is no action button.</>}>
      {stage(<>
        {THEMES.map(([l, t]) => <MainCorner key={l} theme={t} label={l + " · once, path"} view={"font-toast-path-" + t}><Toast variant="warning">{TOAST_COPY.en(TOAST_PATH)}</Toast></MainCorner>)}
        {THEMES.map(([l, t]) => <MainCorner key={l} theme={t} label={l + " · long path, already shortened · no such file reads the same"} view={"font-toast-long-" + t}><Toast variant="warning">{TOAST_COPY.en(TOAST_LONG)}</Toast></MainCorner>)}
        <MainCorner theme="mocha" label="Mocha · ko" view="font-toast-ko"><Toast variant="warning">{TOAST_COPY.ko(TOAST_PATH)}</Toast></MainCorner>
        <MainCorner theme="latte" label="Latte · ja" view="font-toast-ja"><Toast variant="warning">{TOAST_COPY.ja(TOAST_PATH)}</Toast></MainCorner>
        <MainCorner theme="mocha" label="Mocha · two different values, newest at the bottom" view="font-toast-two"><Toast variant="warning">{TOAST_COPY.en(TOAST_PATH)}</Toast><Toast variant="warning">{TOAST_COPY.en("~/fonts/Removed.ttf")}</Toast></MainCorner>
        <MainCorner theme="latte" label="Latte · beside the language pack font notice" view="font-toast-sibling"><Toast variant="warning">Could not load the language pack font: Noto Sans KR. Some characters may appear as □.</Toast><Toast variant="warning">{TOAST_COPY.en(TOAST_PATH)}</Toast></MainCorner>
      </>)}
      <Meta
        specs={[["card", "Toast variant warning, which is ToastKind::Warning in the app"], ["boxes", "rail and body, no icon, no hint, no button"], ["value", "in the body, same font as the body. Long paths shorten as the language pack notice does"], ["long text", "wraps inside toast-max-width, breaking anywhere in a path"], ["once", "per value. Several surfaces, one card"], ["lifetime", "overlay.toast_duration_ms, unchanged"], ["position", "main window stack, toast-stack-offset-bottom"]]}
        tokens={[{ tok: "--tasty-accent-warning", use: "rail", color: "var(--tasty-toast-accent-warning)" }, { tok: "--tasty-toast-max-width", use: "card cap" }, { tok: "--tasty-toast-stack-offset-bottom", use: "main window offset" }]} />
      <Note><b>Copy.</b> <code>toast.font_rejected</code>: en “{TOAST_COPY.en("{}")}” · ko “{TOAST_COPY.ko("{}")}” · ja “{TOAST_COPY.ja("{}")}” The same key takes a path or a family name. It doesn't ask for a new value: a file replaced with a good font works after a restart with the same value. Its danger sibling, ToastKind::Error, is for an action that failed, which this isn't. No token was added.</Note>
      <Dont><b>Don't</b> raise this toast from the preview's check, or add a button: the row in Settings is where the value is changed.</Dont>
    </Spec>
  );
}

// settings.appearance.font.family_rejected
const FAMILY_COPY = {
  en: { line: "Could not load this font's file. Using another font.", base: "Font family:", row: "Font family", ud: "Use default" },
  ko: { line: "이 폰트의 파일을 불러오지 못했습니다. 다른 폰트로 표시합니다.", base: "폰트:", row: "폰트", ud: "기본값 사용" },
  ja: { line: "このフォントのファイルを読み込めませんでした。別のフォントで表示します。", base: "フォント:", row: "フォント", ud: "デフォルトを使用" },
};
const FAMILIES = ["D2Coding", "Fira Code", "JetBrains Mono", "Noto Sans Mono", "Sarasa Term K"];
const PINNED = [{ value: "", label: "Default (monospace)" }];

// state: rest | rejected | open
function FamilyRow({ lang = "en", base = false, value = "Noto Sans Mono", state = "rest" }) {
  const C = FAMILY_COPY[lang];
  const W = { width: "var(--tasty-field-width-lg)" };
  const control = state === "open"
    ? <SearchableSelect open focusSearch query="" activeIndex={4} options={FAMILIES} pinned={PINNED} value={value} searchPlaceholder="Search fonts" style={W} />
    : <SearchableSelect options={FAMILIES} pinned={PINNED} value={value} style={W} />;
  return <FontRow label={base ? C.base : C.row} control={control} ud={base ? null : C.ud} udChecked={false} line={state === "rest" ? null : C.line} hold={state === "open"} />;
}

function FontFamilyRejectedSpec() {
  return (
    <Spec id="appearance-font-family-rejected" title="Appearance › Font family rejected"
      when={<>A family from the list can be rejected when its file is damaged. The row gets the <b>same line</b> as the file field, with its own words, and <b>no invalid edge</b>: the name is a real entry and nothing was mistyped, so the fault is in a file the field doesn't show. While the list is open the line's ink goes and its box stays. Picking another family judges again when the list closes. A saved family raises the same toast as a file, with the name in it. The Terminal override row shows the line only when the terminal can't use the font.</>}>
      {stage(THEMES.map(([l, t]) => (
        <Frame key={l} theme={t} label={l + " · family rows"} view={"font-family-" + t}>
          <St name="default grid · rest"><FamilyRow base value="JetBrains Mono" /></St>
          <St name="default grid · rejected"><FamilyRow base state="rejected" /></St>
          <St name="override row · rejected"><FamilyRow state="rejected" /></St>
          <St name="Terminal override row · the terminal can use the font, the preview can't — no line"><FamilyRow /></St>
          <div style={{ minHeight: "var(--tasty-size-300)" }}><St name="override row · rejected, list open — line box kept"><FamilyRow state="open" /></St></div>
        </Frame>
      )))}
      {stage(<>
        <Frame theme="mocha" label="Mocha · ko" view="font-family-ko"><FamilyRow lang="ko" state="rejected" /></Frame>
        <Frame theme="latte" label="Latte · ja" view="font-family-ja"><FamilyRow lang="ja" state="rejected" /></Frame>
      </>)}
      <Meta
        specs={[["trigger", "unchanged in every state. SearchableSelect has no invalid state"], ["line", "same form and position as the file field's line"], ["list open", "line box kept, no ink"], ["Save", "enabled in every state"], ["toast", "font-rejected-toast, with the family name"]]}
        tokens={[{ tok: "--tasty-accent-danger-raised", use: "line", color: "var(--tasty-accent-danger-raised)" }, { tok: "--tasty-settings-row-caption-gap", use: "control → line" }]} />
      <Note><b>Copy.</b> <code>settings.appearance.font.family_rejected</code>: en “{FAMILY_COPY.en.line}” · ko “{FAMILY_COPY.ko.line}” · ja “{FAMILY_COPY.ja.line}” It names the file as the fault, which is what the user can act on. No token and no contract row was added.</Note>
    </Spec>
  );
}

function FontFileRejectedSpec() {
  return (
    <Spec id="appearance-font-file-rejected" title="Appearance › Custom font file rejected"
      when={<>A font file that can't be used shows on its row: the <b>invalid edge</b> on the Input and <b>one line</b> under it. The default grid and the override grid draw the same thing, for every cause: no such file, a folder, no permission, or a file that isn't a usable font. <b>While the Input has focus nothing is red</b>, whatever the value is. Leaving it judges the value then in the field. The value stays and <b>Save stays enabled</b>, because a rejected value is saved and skipped when used. The preview draws the font in effect. The Terminal override row judges by what the <b>terminal</b> can use, not by the preview.</>}>
      {stage(THEMES.map(([l, t]) => (
        <Frame key={l} theme={t} label={l + " · default grid"} view={"font-file-base-" + t}>
          <St name="rest"><FileRow base value="~/fonts/D2Coding.ttf" /></St>
          <St name="focus — no error"><FileRow base value="~/fonts/D2Coding.ttf" state="focus" /></St>
          <St name="rejected"><FileRow base value="~/fonts/notes.txt" state="rejected" /></St>
          <St name="rejected · focus — no error, line box kept"><FileRow base value="~/fonts/notes.txt" state="focus-rejected" /></St>
        </Frame>
      )))}
      {stage(THEMES.map(([l, t]) => (
        <Frame key={l} theme={t} label={l + " · override row"} view={"font-file-override-" + t}>
          <St name="rest"><FileRow value="~/fonts/D2Coding.ttf" /></St>
          <St name="focus — no error"><FileRow value="~/fonts/D2Coding.ttf" state="focus" /></St>
          <St name="rejected — not a usable font"><FileRow value="~/fonts/notes.txt" state="rejected" /></St>
          <St name="rejected — no file at this path, same form"><FileRow value="~/fonts/Removed.ttf" state="rejected" /></St>
          <St name="rejected · focus — no error, line box kept"><FileRow value="~/fonts/notes.txt" state="focus-rejected" /></St>
          <St name="Use default on — read-only, the value in effect, never an error"><FileRow value="" state="default" /></St>
        </Frame>
      )))}
      {stage(THEMES.map(([l, t]) => (
        <Frame key={l} theme={t} label={l + " · Terminal override row"} view={"font-file-terminal-" + t}>
          <St name="the terminal can't use the file — same form"><FileRow value="~/notes/todo.txt" state="rejected" /></St>
          <St name="the terminal can use the file, the preview can't — no error"><FileRow value="~/fonts/NegativeLineHeight.ttf" /></St>
        </Frame>
      )))}
      {stage(THEMES.map(([l, t]) => (
        <Frame key={l} theme={t} label={l + " · grid and preview · the row grows, nothing else changes"} view={"font-file-grid-" + t} w="var(--tasty-size-620)">
          <FontOverrideG file={{ value: "~/fonts/notes.txt", state: "rejected" }} />
        </Frame>
      )))}
      {stage(<>
        {THEMES.map(([l, t]) => (
          <Frame key={l} theme={t} label={l + " · long path · clipped at the end · hover shows all of it"} view={"font-file-long-" + t}>
            <St name="rest"><FileRow value={LONG_PATH} /></St>
            <St name="rejected"><FileRow value={LONG_PATH} state="rejected" /></St>
            <div style={{ paddingTop: "var(--tasty-size-64)" }}>
              <St name="hover"><FontRow label="Custom font file" ud="Use default" udChecked={false} line={REJECT_COPY.en}
                control={<Tooltip open placement="top" content={<span style={{ fontFamily: "var(--tasty-font-mono)", overflowWrap: "anywhere" }}>{LONG_PATH}</span>}><FileControl value={LONG_PATH} state="rejected" /></Tooltip>} /></St>
            </div>
          </Frame>
        ))}
      </>)}
      {stage(<>
        <Frame theme="mocha" label="Mocha · ko" view="font-file-ko"><FileRow lang="ko" value="~/fonts/notes.txt" state="rejected" /></Frame>
        <Frame theme="latte" label="Latte · ja" view="font-file-ja"><FileRow lang="ja" value="~/fonts/notes.txt" state="rejected" /></Frame>
        <Frame theme="mocha" label="Mocha · en · width 460 · checkbox under the line" view="font-file-dropped" w="var(--tasty-size-460)"><FileRow value="~/fonts/notes.txt" state="rejected" layout="dropped" /></Frame>
        <Frame theme="latte" label="Latte · ja · width 360 · control at the row start" view="font-file-wrapped" w="var(--tasty-size-360)"><FileRow lang="ja" value="~/fonts/notes.txt" state="rejected" layout="stacked" /></Frame>
        <Frame theme="mocha" label="Mocha · ko · default grid · width 320" view="font-file-base-narrow" w="var(--tasty-size-320)"><FileRow base lang="ko" value="~/fonts/notes.txt" state="rejected" layout="wrapped" /></Frame>
        <Frame theme="latte" label="Latte · live — the demo judges by extension, the app reads the file" view="font-file-live"><LiveFileRow /></Frame>
      </>)}
      <Meta
        specs={[["control", "Input · mono · field-width-lg · both grids"], ["rejected", "Input invalid: red edge, no ring"], ["focus", "Input focused only. Never invalid while focused, so the red ring never shows here"], ["line", "caption · accent-danger-raised · measure-md · in the control column"], ["input → line", "settings-row-caption-gap"], ["line position", "directly under the line holding the Input. The checkbox never sits between them"], ["row height", "grows by the line. Only the rows below it move"], ["taking focus", "the line's box stays and its ink goes, so the rows don't jump. The height follows the new result on leaving"], ["value on focus, then fixed", "the box closes on leaving, once"], ["long path", "clipped at the Input's end, no ellipsis in an editable value. Hover shows the whole value in a Tooltip"], ["empty value", "no file set, no error"], ["Use default on", "read-only box, no invalid, no line"], ["Terminal row", "invalid and line only when the terminal can't use the file. The preview's result doesn't count"], ["Save", "enabled in every state"]]}
        tokens={[{ tok: "--tasty-input-border-invalid", use: "edge", color: "var(--tasty-input-border-invalid)" }, { tok: "--tasty-accent-danger-raised", use: "line", color: "var(--tasty-accent-danger-raised)" }, { tok: "--tasty-font-size-caption", use: "line" }, { tok: "--tasty-line-height-ui", use: "line" }, { tok: "--tasty-settings-row-caption-gap", use: "Input → line" }, { tok: "--tasty-measure-md", use: "line width" }, { tok: "--tasty-field-width-lg", use: "Input" }, { tok: "--tasty-settings-label-width", use: "line indent" }, { tok: "--tasty-settings-label-gap", use: "line indent" }]} />
      <Note><b>Copy.</b> <code>settings.appearance.font.custom_font_rejected</code>: en “{REJECT_COPY.en}” · ko “{REJECT_COPY.ko}” · ja “{REJECT_COPY.ja}” One line for every cause and every row. It doesn't ask for a new path: a file replaced with a good font works after a restart with the same value. No token was added.</Note>
      <Dont><b>Don't</b> disable Save, clear the value, or show the line while the field has focus: most values on the way to a full path are not a font.</Dont>
    </Spec>
  );
}

export { FontOverrideG, FontFileRejectedSpec, FontToastSpec, FontFamilyRejectedSpec };
