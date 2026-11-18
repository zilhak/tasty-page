import React from "react";
import { Select as FrSelect, MenuItem as FrMenuItem, HelpHint as FrHelp, Tooltip as FrTooltip } from "../../components/index.js";
import { Section, Spec, Stage, Meta, Note, Do, Dont } from "../parts/specimen.jsx";

// Tasty Gallery — Overlays · Windows › Settings › Terminal › Frame rate: the two redraw caps.
// Two Select rows that share one choice list, built from the fastest connected monitor.
// Open lists are drawn as frames so the hidden states show without clicking.

// Copy per language. zh-Hans values were written by Codex against the zh-Hans glossary.
const FR = {
  en: { section: "Frame rate", output: "Output frame rate", input: "Input frame rate",
    outputHint: "The most frames per second Tasty draws when terminal output changes the screen.",
    inputHint: "The most frames per second Tasty draws in response to your input, such as typing. When the screen has not drawn for a frame interval, the next input draws at once, and output the same terminal returns right after your input counts as input.",
    caption: "Both are maximums. Tasty never draws faster than the monitor each window is on. The list holds values up to your fastest monitor's refresh rate, plus any saved value above it.",
    fps: "{} fps", match: "Match monitor", above: "{} fps (above monitor)" },
  ko: { section: "프레임 레이트", output: "출력 프레임 레이트", input: "입력 프레임 레이트",
    outputHint: "터미널 출력으로 화면이 바뀔 때 1초에 그리는 최대 프레임 수입니다.",
    inputHint: "입력에 반응해 1초에 그리는 최대 프레임 수입니다. 마지막으로 그린 뒤 프레임 간격 이상 지난 화면에서는 다음 입력을 바로 그리고, 입력 직후 같은 터미널에서 돌아온 출력도 입력으로 봅니다.",
    caption: "두 값은 최대치입니다. 윈도우가 있는 모니터의 주사율보다 빠르게 그리지 않습니다. 목록에는 연결된 모니터 중 가장 높은 주사율까지의 값과, 그보다 높게 저장된 값이 보입니다.",
    fps: "{} fps", match: "모니터에 맞춤", above: "{} fps (모니터 초과)" },
  ja: { section: "フレームレート", output: "出力フレームレート", input: "入力フレームレート",
    outputHint: "ターミナルの出力で画面が変わるときに、1秒間に描画する最大フレーム数です。",
    inputHint: "入力に応じて1秒間に描画する最大フレーム数です。最後の描画からフレーム間隔以上たった画面では次の入力をすぐに描画し、入力直後に同じターミナルから返る出力も入力として扱います。",
    caption: "どちらも上限です。ウィンドウがあるモニターのリフレッシュレートより速くは描画しません。一覧には、接続中のモニターの最高リフレッシュレートまでの値と、それより高く保存された値が表示されます。",
    fps: "{} fps", match: "モニターに合わせる", above: "{} fps (モニター超過)" },
  "zh-Hans": { section: "帧率", output: "输出帧率", input: "输入帧率",
    outputHint: "终端输出使屏幕变化时，Tasty 每秒绘制的最大帧数。",
    inputHint: "Tasty 响应键入等输入时，每秒绘制的最大帧数。若屏幕自上次绘制以来已至少经过一个帧间隔，下一次输入会立即触发绘制；输入后紧接着由同一终端返回的输出也按输入处理。",
    caption: "两项均为上限。Tasty 的绘制帧率不会超过各窗口所在显示器的刷新率。列表包含不超过已连接显示器最高刷新率的值，以及已保存的高于该刷新率的值。",
    fps: "{} fps", match: "匹配显示器", above: "{} fps（超出刷新率）" },
};

const CHOICES = [15, 30, 60, 120, 144, 240];
const UNLIMITED = -1;

// The list the row shows: every choice up to the fastest connected monitor, then Match monitor.
// A saved value above that range keeps its place in numeric order, before Match monitor, in its own template
// (each language places the bracket and its spacing).
function frOptions(L, hz, saved) {
  const list = CHOICES.filter((v) => v <= hz).map((v) => ({ value: String(v), label: L.fps.replace("{}", v) }));
  if (saved !== UNLIMITED && saved > hz) list.push({ value: String(saved), label: L.above.replace("{}", saved), over: true });
  list.push({ value: String(UNLIMITED), label: L.match });
  return list;
}

function FrRow({ label, hint, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--tasty-settings-row-stack-gap) var(--tasty-settings-label-gap)", minHeight: "var(--tasty-settings-row-min-height)" }}>
      <span style={{ width: "var(--tasty-settings-label-width)", flex: "none", fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)", lineHeight: "var(--tasty-line-height-ui)", display: "inline-flex", alignItems: "center", gap: "var(--tasty-help-hint-gap)" }}>
        <span>{label}:</span><FrHelp label={hint} placement="bottom" />
      </span>
      <span style={{ display: "inline-flex", width: "var(--tasty-field-width-lg)", maxWidth: "100%" }}>{children}</span>
    </div>
  );
}

function FrPage({ lang = "en", hz = 60, output = 30, input = 60, w }) {
  const L = FR[lang];
  const sel = (v) => <FrSelect block options={frOptions(L, hz, v)} value={String(v)} onChange={() => {}} />;
  return (
    <div lang={lang} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-settings-row-gap)", padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", width: w || "var(--tasty-size-560)", maxWidth: "100%", boxSizing: "border-box" }}>
      <FrRow label={L.output} hint={L.outputHint}>{sel(output)}</FrRow>
      <FrRow label={L.input} hint={L.inputHint}>{sel(input)}</FrRow>
      <p style={{ margin: 0, fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-muted)", maxWidth: "var(--tasty-measure-md)", textWrap: "pretty" }}>{L.caption}</p>
    </div>
  );
}

// The open list under a trigger, drawn as a frame (the shared Select list: menu ground, popover shadow).
// At least as wide as the trigger; a longer row widens it rather than ellipsising (the selected row also holds the check).
function FrList({ lang = "en", hz = 60, saved = 30 }) {
  const L = FR[lang];
  return (
    <div lang={lang} style={{ width: "max-content", minWidth: "var(--tasty-field-width-lg)", padding: "var(--tasty-space-xs)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-menu-radius)", background: "var(--tasty-menu-bg)", boxShadow: "var(--tasty-shadow-popover)", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      {frOptions(L, hz, saved).map((o) => <FrMenuItem key={o.value} label={o.label} selected={o.value === String(saved)} />)}
    </div>
  );
}

// A row label with its HelpHint held open (the hover state, drawn as a frame so the check measures the bubble).
// The bare HelpHint glyph inside a forced-open Tooltip is what HelpHint renders on hover. The label starts half a
// bubble in, so the centred bubble stays inside the frame; the frame is wider than a narrow page and scrolls in its stage.
function FrHintOpen({ lang = "en", row = "output" }) {
  const L = FR[lang];
  return (
    <div lang={lang} data-view={"help-" + row + "-" + lang} style={{ padding: "var(--tasty-space-md) var(--tasty-space-md) var(--tasty-size-160) calc(var(--tasty-tooltip-max-width) / 2)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", width: "var(--tasty-size-480)", flex: "none", boxSizing: "border-box" }}>
      <span style={{ fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)", lineHeight: "var(--tasty-line-height-ui)", display: "inline-flex", alignItems: "center", gap: "var(--tasty-help-hint-gap)" }}>
        <span>{row === "output" ? L.output : L.input}:</span>
        <FrTooltip open placement="bottom" content={row === "output" ? L.outputHint : L.inputHint} className="tasty-help-hint"><FrHelp /></FrTooltip>
      </span>
    </div>
  );
}

const FrPair = ({ children }) => (
  <>{[["Mocha", "mocha"], ["Latte", "latte"]].map(([label, t]) => (
    <div key={label} data-theme={t} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md)", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", minWidth: 0, flex: "1 1 var(--tasty-size-560)", maxWidth: "100%" }}>
      <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start" }}>{children}</div>
    </div>
  ))}</>
);
const FrCase = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0, maxWidth: "100%" }}>
    <span style={{ fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{label}</span>{children}
  </div>
);

function FrameRateSection() {
  const st = { padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" };
  return (
    <Section id="framerate" title="Terminal › Frame rate — redraw caps">
      <Spec id="terminal-frame-rate-two-redraw-caps" title="Two redraw caps, one choice list"
        when={<>Two caps on how often Tasty redraws: one for redraws that terminal output causes, one for redraws your input causes. They are a pair with the same choices, so they sit together in their <b>own Terminal section, Frame rate</b>, after Performance. Its own section keeps two things apart. The label-only section filter finds “frame”, which it would not if the rows lived inside Performance. And these caps take effect as soon as they are saved, while the Performance note says its rows reach only terminals opened afterward, so the new section carries <b>no apply note</b> and the Performance note stays as it is. Each row is a <b>Select at field-width-lg</b> with the usual HelpHint. One muted caption under the pair says both are maximums and which values the list holds. Neither HelpHint claims a CPU or GPU saving: a cap only limits the interval between frames. Defaults: output 30 fps, input 60 fps.</>}>
        <Stage variant="solo" style={st}>
          <FrPair>
            <FrCase label="default · output 30 · input 60"><FrPage /></FrCase>
            <FrCase label="input · Match monitor"><FrPage input={UNLIMITED} /></FrCase>
          </FrPair>
        </Stage>
        <Stage variant="solo" style={st}>
          {["en", "ko", "ja", "zh-Hans"].flatMap((lg) => ["output", "input"].map((row) => (
            <FrCase key={lg + row} label={lg + " · " + row + " HelpHint open"}><FrHintOpen lang={lg} row={row} /></FrCase>
          )))}
        </Stage>
        <Meta
          specs={[["place", "Terminal L2, new last section “Frame rate” after Performance · section heading = the L2 label · no apply note"], ["rows", "settings Row: label settings-label-width + HelpHint (?) · gap settings-label-gap · min-height settings-row-min-height · rows gap settings-row-gap · output row first, input row second"], ["control", "the shared Select (choice_select) · width field-width-lg 200 · height select-height"], ["caption", "one, under the input row · caption text-muted · line-height-ui · max-width measure-md · wraps, never ellipsises"], ["defaults", "output 30 fps · input 60 fps"], ["applies", "on save, to every open window (no restart) · nothing on the page says so, as with any setting that applies at once"], ["HelpHint", "the shared HelpHint → Tooltip bubble (tooltip-bg · tooltip-border · max-width tooltip-max-width) · placement bottom · open frames above, one per row and language"], ["not added", "no apply note · no per-window applied value · no restart hint · no slider or free number field"]]}
          tokens={[{ tok: "--tasty-field-width-lg", use: "Select width (200)" }, { tok: "--tasty-select-height", use: "trigger height" }, { tok: "--tasty-settings-label-width", use: "label column" }, { tok: "--tasty-text-muted", use: "caption ink", color: "var(--tasty-text-muted)" }]} />
        <Do>Keep the two caps side by side in a section the filter can find by name.</Do>
        <Dont>Add these rows under the Performance note: the note's “terminals opened afterward” would be wrong for them.</Dont>
      </Spec>

      <Spec id="terminal-frame-rate-choice-list-by-monitor" title="The choice list follows the fastest monitor"
        when={<>The list holds every choice up to the refresh rate of the <b>fastest connected monitor</b>, then <b>Match monitor</b>, always last. Options read “30 fps”. The stored “unlimited” value draws up to the monitor's refresh rate, so its label says that, <b>Match monitor</b>, instead of “no limit”, which would promise frames the monitor never shows. A monitor that reports no rate counts as 60 Hz, and 59.94 Hz rounds to 60. The list is rebuilt from the monitors connected <b>when it opens</b>, so plugging in a faster monitor while the window is open adds its choices on the next open.</>}>
        <Stage variant="solo" style={st}>
          <FrPair>
            <FrCase label="60 Hz (or no report) · 4 items · input 60 selected"><FrList hz={60} saved={60} /></FrCase>
            <FrCase label="144 Hz · 6 items · output 30 selected"><FrList hz={144} saved={30} /></FrCase>
            <FrCase label="240 Hz or faster · 7 items"><FrList hz={240} saved={UNLIMITED} /></FrCase>
            <FrCase label="50 Hz · 3 items"><FrList hz={50} saved={30} /></FrCase>
          </FrPair>
        </Stage>
        <Meta
          specs={[["choices", "15 · 30 · 60 · 120 · 144 · 240 · Match monitor (stored -1) · the same list for both rows"], ["shown", "values ≤ the fastest connected monitor's rate (rounded) · Match monitor always, last"], ["no report", "treated as 60 Hz → 15 · 30 · 60 · Match monitor"], ["label", "“{} fps” · Match monitor for -1"], ["selected", "MenuItem selected (text-primary + accent check)"], ["refresh", "the list is built each time it opens, from the monitors connected then"], ["list frame", "menu-bg · menu-border · menu-radius · shadow-popover · at least the trigger width (field-width-lg), wider when a row needs it, so no option ellipsises"]]}
          tokens={[{ tok: "--tasty-menu-bg", use: "open list ground", color: "var(--tasty-menu-bg)" }, { tok: "--tasty-menu-border", use: "open list edge", color: "var(--tasty-menu-border)" }, { tok: "--tasty-shadow-popover", use: "floating list" }]} />
      </Spec>

      <Spec id="terminal-frame-rate-saved-above-monitor" title="A saved value above every monitor"
        when={<>Pick 144 fps, then keep only a 60 Hz monitor: the saved 144 stays, and Tasty draws at most what the monitor shows. The row does not pretend the value is gone, and it does not use the shared “(unknown)” suffix, since the value is known. The trigger shows <b>“144 fps (above monitor)”</b>, and the open list keeps that row selected <b>in numeric order</b>, before Match monitor, in the same words. The row shows no applied number, because it depends on which monitor each window is on; the caption under the pair already says Tasty never draws faster than the monitor. Picking another value saves it, and the extra row is gone on the next open. Nothing rewrites the saved value on its own.</>}>
        <Stage variant="solo" style={st}>
          <FrPair>
            <FrCase label="60 Hz monitor · output saved 144"><FrPage output={144} /></FrCase>
            <FrCase label="open list"><FrList hz={60} saved={144} /></FrCase>
          </FrPair>
        </Stage>
        <Stage variant="solo" style={st}>
          <FrCase label="en · 60 Hz · input saved 240 — the longest trigger"><FrPage input={240} /></FrCase>
          <FrCase label="ko · 60 Hz · input saved 240"><FrPage lang="ko" input={240} /></FrCase>
          <FrCase label="ko · open list"><FrList lang="ko" hz={60} saved={240} /></FrCase>
          <FrCase label="ja · 60 Hz · output saved 144"><FrPage lang="ja" output={144} /></FrCase>
          <FrCase label="ja · open list"><FrList lang="ja" hz={60} saved={144} /></FrCase>
          <FrCase label="zh-Hans · 60 Hz · output saved 144"><FrPage lang="zh-Hans" output={144} /></FrCase>
          <FrCase label="zh-Hans · open list"><FrList lang="zh-Hans" hz={60} saved={144} /></FrCase>
        </Stage>
        <Meta
          specs={[["when", "the saved value is a listed choice above the fastest connected monitor (a value outside the choices never reaches the row: it reads as the default)"], ["trigger", "its own template “{} fps (above monitor)” (not value + suffix, so each language places the bracket) · Select ink unchanged (text-primary), no warning colour"], ["list", "the saved value in numeric order, before Match monitor, selected, same template"], ["applied value", "not shown"], ["write", "unchanged until the user picks another value"]]} />
        <Note>This is a new template key, not <code>settings.choice_missing_suffix</code>: “(unknown)” would say Tasty cannot read the value. The longest trigger, “240 fps (above monitor)”, fits field-width-lg in every language shown (zh-Hans has no space before its full-width bracket); at narrow widths the trigger keeps its width and the row stacks.</Note>
        <Dont>Clamp or rewrite the saved value, or colour the trigger as an error: the value is valid and only limited by the monitor.</Dont>
      </Spec>

      <Spec id="terminal-frame-rate-languages-and-narrow" title="Languages and narrow windows"
        when={<>Labels wrap inside the label column. When the content is narrower than label + gap + field-width-lg, each row stacks: label, then the Select at its own width. The caption wraps under the pair.</>}>
        <Stage variant="solo" style={st}>
          <FrCase label="ko · 560"><FrPage lang="ko" /></FrCase>
          <FrCase label="ja · 560 · input Match monitor"><FrPage lang="ja" input={UNLIMITED} /></FrCase>
          <FrCase label="zh-Hans · 560"><FrPage lang="zh-Hans" /></FrCase>
          <FrCase label="ko · narrow 360 — rows stack"><FrPage lang="ko" w="var(--tasty-size-360)" /></FrCase>
          <FrCase label="ja · narrow 360 · above monitor"><FrPage lang="ja" output={144} w="var(--tasty-size-360)" /></FrCase>
          <FrCase label="en · narrow 360 · Match monitor"><FrPage input={UNLIMITED} w="var(--tasty-size-360)" /></FrCase>
        </Stage>
        <Meta specs={[["stack", "settings_stack_row: label over control · gap settings-row-stack-gap · control keeps field-width-lg (max 100%)"], ["label", "wraps in settings-label-width, never ellipsises"], ["caption", "wraps at the column width"]]} />
        <Note>i18n (new keys; names are a proposal, the implementing side may place them): L2 label and heading <code>settings.misc.subtab.frame_rate</code> “Frame rate” · “프레임 레이트” · “フレームレート” · “帧率”. Rows <code>settings.frame_rate.output</code> “Output frame rate” · “출력 프레임 레이트” · “出力フレームレート” · “输出帧率” and <code>settings.frame_rate.input</code> “Input frame rate” · “입력 프레임 레이트” · “入力フレームレート” · “输入帧率”, each with a <code>…_desc</code> HelpHint as drawn. <code>settings.frame_rate.caption</code> as drawn. Options <code>settings.frame_rate.fps</code> “{"{}"} fps” in every language, <code>settings.frame_rate.match_monitor</code> “Match monitor” · “모니터에 맞춤” · “モニターに合わせる” · “匹配显示器”, <code>settings.frame_rate.fps_above_monitor</code> “{"{}"} fps (above monitor)” · “{"{}"} fps (모니터 초과)” · “{"{}"} fps (モニター超過)” · “{"{}"} fps（超出刷新率）”. Row labels add the colon the way the Performance rows do. <code>settings.performance.apply_notice</code> does not change.</Note>
      </Spec>
    </Section>
  );
}

export { FrameRateSection };
