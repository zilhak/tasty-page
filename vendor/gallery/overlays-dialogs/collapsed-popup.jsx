import React from "react";
import { Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { Tooltip } from "../../components/index.js";
import { ShellMock, CollapsedPopupButton } from "../parts/overlay-frames.jsx";
import { ConvertSurfacePopup, PopupTitleBar } from "../../ui_kits/terminal/overlays/info_modal.jsx";

// Tasty Gallery: Dialogs, a surface-scope popup that does not fit its surface. Only the show button stays in its
// place; pressing it shows the popup over the window. Copy values come from Codex (en, ko, ja, zh-Hans).

const COLLAPSED_COPY = {
  en: ["Show popup", "The popup does not fit in this surface. Press this button to show it over the application window."],
  ko: ["팝업 보기", "이 서피스는 팝업을 표시하기에 너무 작습니다. 이 버튼을 누르면 앱 윈도우 위에 팝업을 표시합니다."],
  ja: ["ポップアップを表示", "このサーフェスにはポップアップが収まりません。このボタンを押すと、アプリのウィンドウ上にポップアップを表示します。"],
  "zh-Hans": ["查看弹窗", "此 Surface 太小，无法容纳弹窗。按下此按钮可在应用窗口上方显示弹窗。"],
};

// popup.collapse_button.label · popup.collapse_button.tooltip — the shrink button on the expanded popup.
const COLLAPSE_COPY = {
  en: ["Collapse popup", "Collapse the popup to its show button to use the rest of the window. The popup stays open and keeps your input."],
  ko: ["팝업 접기", "팝업을 보기 버튼으로 접어 윈도우의 다른 영역을 사용합니다. 팝업은 열린 상태로 유지되며 입력 내용도 보존됩니다."],
  ja: ["ポップアップを折りたたむ", "ポップアップを表示ボタンに折りたたみ、ウィンドウの他の領域を操作できるようにします。ポップアップは開いたまま、入力内容も保持されます。"],
  "zh-Hans": ["折叠弹窗", "将弹窗折叠为查看按钮，以使用窗口的其他区域。弹窗保持打开，并保留输入内容。"],
};

// The round trip, left to right: collapsed in its surface, expanded over the window, collapsed again with its state.
const FLOW = [
  ["1 · collapsed — the show button in its surface; the rest of the window is usable", { scope: "surface", narrow: true, collapsed: "label", ring: true }],
  ["2 · pressed — expanded in window scope: the whole window is covered and nothing else takes a press, the sidebar included", { scope: "window", narrow: true, expanded: true }],
  ["3 · shrink pressed — collapsed again, the same popup with its input kept; the rest of the window is usable again", { scope: "surface", narrow: true, collapsed: "label", ring: true }],
];

const FRAMES = [
  ["wide surface — popup expanded in its surface", { scope: "surface" }],
  ["narrow surface — collapsed, opened by the user (key focus)", { scope: "surface", narrow: true, collapsed: "label", ring: true }],
  ["narrow surface — collapsed, the user typing in the other surface (no ring, no edge)", { scope: "surface", narrow: true, collapsed: "label", ring: true, focus: "other" }],
  ["narrow surface — collapsed, opened by an agent (no focus)", { scope: "surface", narrow: true, collapsed: "label", agent: true }],
  ["very narrow — label frame does not fit, icon only", { scope: "surface", narrow: true, collapsed: "icon", ring: true, leftWidth: 64 }],
  ["narrower than the icon frame — cut at the surface rect", { scope: "surface", narrow: true, collapsed: "clipped", ring: true, leftWidth: 24 }],
  ["pressed — the popup over the window, with the shrink button", { scope: "window", narrow: true, expanded: true }],
  ["pressed, window smaller than the popup — right and bottom cut", { scope: "window", size: [240, 76], pin: true, expanded: true }],
];

function CollapsedPopupSpec() {
  return (
    <Spec id="collapse-a-surface-popup-that-does-not-fit-leaves-a-show-button" title="Collapse — a surface popup that does not fit leaves a show button"
      when={<>A popup scoped <b>narrower than the window</b> (surface, tab or pane: the kind of scope does not matter, the frames draw a surface) that does not fit inside its scope's bounds is <b>not shrunk</b>. In its place the surface keeps <b>one button</b> in the popup's own frame, and nothing else. The popup is still open: the button takes key focus, and pressing it (click, <b>Enter</b> or <b>Space</b>) shows the popup <b>centered over the window</b> with the window scrim, where it stays until it closes. Its logical scope is still the surface, but it is shown in window scope: the scrim covers the whole window and nothing else in the window takes a press, the sidebar's workspace rows included, until it is collapsed again or closed. A <b>shrink</b> button in its title bar collapses it back to the show button: collapsing is not closing, the popup keeps its state and the rest of the window is usable again. Host and plugin popups take the same path: collapsed first, over the window only once pressed. While collapsed, the other surfaces stay usable. The check runs every frame, so when the surface grows back the popup returns to its expanded form in the surface. If the window is smaller than the popup too, the popup keeps its size, its left and top sit on the window's edge, and its right and bottom are cut. The button never names the popup: headless popups have no title, and a title would widen the button and make it collapse sooner.</>}>
      <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {FRAMES.map(([label, props]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "var(--tasty-text-muted)" }}>{label}</div>
            <ShellMock {...props} />
          </div>
        ))}
      </Stage>
      <Views>
        <View name="tooltip" label="tooltip — pointer hover or key focus">
          <div style={{ padding: "96px 16px 16px", background: "var(--tasty-surface-terminal-focused-bg)", borderRadius: "var(--tasty-radius)", display: "flex", justifyContent: "center", width: 440 }}>
            <Tooltip open placement="top" content={COLLAPSED_COPY.en[1]}>
              <CollapsedPopupButton kind="label" ring scrim={false} label={COLLAPSED_COPY.en[0]} />
            </Tooltip>
          </div>
        </View>
        {Object.entries(COLLAPSED_COPY).map(([lang, [label]]) => (
          <View key={lang} name={`label-${lang}`} label={`label — ${lang}`}>
            <div lang={lang} style={{ padding: 16, background: "var(--tasty-surface-terminal-focused-bg)", borderRadius: "var(--tasty-radius)", display: "flex", gap: 12, alignItems: "center" }}>
              <CollapsedPopupButton kind="label" scrim={false} label={label} />
              <CollapsedPopupButton kind="icon" scrim={false} label={label} />
            </div>
          </View>
        ))}
        <View name="expanded-title-bar" label="expanded — the shrink button: headless popup (host bar, no title) and a popup with its own title bar">
          <div style={{ padding: 16, background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 280, background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)", overflow: "hidden" }}>
              <PopupTitleBar title={null} closable={false} collapse={COLLAPSE_COPY.en[0]} collapseTip={COLLAPSE_COPY.en[1]} />
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--tasty-text-secondary)" }}>plugin content</div>
            </div>
            <ConvertSurfacePopup focused={false} collapse={COLLAPSE_COPY.en[0]} />
          </div>
        </View>
        <View name="collapse-tooltip" label="shrink tooltip — pointer hover or key focus">
          <div style={{ padding: "96px 16px 16px", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", display: "flex", justifyContent: "center", width: 440 }}>
            <Tooltip open placement="top" content={COLLAPSE_COPY.en[1]}>
              <span style={{ display: "inline-flex", width: 280 }}><span style={{ flex: 1, background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
                <PopupTitleBar title={null} closable={false} collapse={COLLAPSE_COPY.en[0]} />
              </span></span>
            </Tooltip>
          </div>
        </View>
        {Object.entries(COLLAPSE_COPY).map(([lang, [label, tip]]) => (
          <View key={"collapse-" + lang} name={`collapse-copy-${lang}`} label={`shrink button copy — ${lang}`}>
            <div lang={lang} style={{ padding: 16, background: "var(--tasty-bg-panel)", borderRadius: "var(--tasty-radius)", display: "flex", flexDirection: "column", gap: 4, maxWidth: 440, fontSize: 12 }}>
              <span style={{ color: "var(--tasty-text-primary)" }}>{label}</span>
              <span style={{ color: "var(--tasty-text-secondary)" }}>{tip}</span>
            </div>
          </View>
        ))}
      </Views>
      <Meta
        specs={[
          ["collapses when", "the popup's needed size is larger than the surface bounds (scope_bounds: the surface rect less the inset) on either axis — width alone or height alone is enough · expanded only when both fit · no shrink range · judged every frame · fits again → expanded again"],
          ["needed size", "host popup: that frame's sizer result (the size the user resized it to, if they did) · no sizer: default_size × ui_zoom · plugin popup: its size_hint, 360 × 200 without one"],
          ["inset", "max(0, min(spacing_sm, width / 2, height / 2)) of the surface rect, the same on all four sides · spacing_sm is 8 at scale 1 · host and plugin popups use the same rule · on a low, wide surface the height term is the one that reduces it"],
          ["frame", <>the popup's own frame: <span className="tok">--tasty-bg-panel</span> · 1px <span className="tok">--tasty-border-frame</span> · 4 radius · padding <span className="tok">--tasty-popup-content-margin</span> 4 · the button only</>],
          ["shadow", "shadow-modal on a scrim · shadow-popover when the popup has no scrim (the two floating shadows)"],
          ["button", <>Button.secondary md 28 · leading glyph <code>fit</code> 14 · label <code>popup.collapsed_button.label</code></>],
          ["frame size", "button + 2 × 4 + 2 × 1 → 38 tall · label frame as rendered here: en 134 · ko 109 · ja 175 · zh-Hans 110 wide · icon frame 38 × 38"],
          ["place", "centred on the popup's anchor pulled into the surface bounds (host: bounds centre · plugin ScreenCenter / ActiveSurfaceCenter: bounds centre · plugin Cursor: the pointer), re-centred on the frame's own size"],
          ["too narrow for the label", "label frame wider than the bounds → icon frame: IconButton solid 28, same glyph, accessible name = the label, tooltip unchanged"], ["too short for the label", "label frame taller than the bounds, whether or not its width fits → icon frame as well (the same 38 tall, narrower), cut on the vertical axis by the next row"],
          ["too small for the icon", "on each axis the icon frame does not fit, its start edge sits on the bounds' start edge (the inset row: reduced on a small surface) and the surface rect cuts its end; an axis that fits keeps its anchor alignment · never omitted — the popup is open and holds focus"],
          ["title", "not shown — headless popups have none; the tooltip explains what the button stands for"],
          ["scrim", "--tasty-scrim-bg, the one scrim value, on the surface while collapsed and on the whole window once pressed · follows the popup's own scrim entry, the same in both forms — no scrim blink when a divider drag crosses the fit line · the button sits on the frame, never straight on the scrim (only a modal or popup frame sits on scrim@*)"],
          ["focus", "border-focus · focus-ring-width 2 · 1px offset on the button (the :focus-visible pair) · opened by the user: shown from the first frame · passive (agent-opened): no ring · the frame lights the popup focus edge while it holds key focus (Focus, below)"],
          ["tooltip", <><code>popup.collapsed_button.tooltip</code> · Tooltip on pointer hover and key focus · 150ms delay</>],
          ["collapse back", <>expanded form only · IconButton sm, glyph <code>shrink</code>, first in the title bar's button cluster (before fullscreen and close), popup-title-btn-size 24, gap 4, edge inset 4 · accessible name <code>popup.collapse_button.label</code>, Tooltip <code>popup.collapse_button.tooltip</code> · a headless popup (no title bar of its own, plugin popups) gets the host title bar with no title and only this button: control-height 28, bg-sidebar, the title edge below — the expanded frame grows by it · keeps the popup's state: input, selection, scroll · back in the collapsed form the show button takes key focus</>],
          ["close", "no close mark on the collapsed form · the way out is the popup's own controls after pressing · Esc and outside clicks: the expanded popup's rule (below)"],
          ["pressed", "shown in window scope (logical scope stays the surface): centred, full-window scrim, shadow-modal · no other surface can be selected until it closes · host and plugin popups alike, always through the button: no popup goes over the window without it"],
          ["window too small", "the popup keeps its size · left and top on the window's inner edge, margin 0 · right and bottom cut by the window"],
          ["search bar", "not drawn: whether it collapses is a pending user decision (O1)"],
        ]}
        tokens={[
          { tok: "--tasty-bg-panel", use: "collapsed frame", color: "var(--tasty-bg-panel)" },
          { tok: "--tasty-border-frame", use: "frame edge", color: "var(--tasty-border-frame)" },
          { tok: "--tasty-popup-content-margin", use: "4 around the button" },
          { tok: "--tasty-border-focus", use: "button key focus", color: "var(--tasty-border-focus)" },
          { tok: "--tasty-focus-ring-width", use: "2" },
          { tok: "--tasty-shadow-modal", use: "on a scrim" },
          { tok: "--tasty-shadow-popover", use: "without a scrim" },
          { tok: "--tasty-scrim-bg", use: "unchanged by collapsing", color: "var(--tasty-scrim-bg)" },
        ]} />
      <Note>Esc and clicks on the collapsed form follow the expanded popup's rule. Esc drops the popup's focus and closes only a popup that closes on an outside click; a click outside its scope does the same; a click inside the scope goes to the popup. So of the popups that collapse, only convert surface closes on Esc; rename, the name conflict prompt, Properties, the file picker and the search bar (should it collapse, O1) drop their focus and keep the button. Enter or Space on the button shows the popup over the window. The design adds no close mark: a close mark on a choice popup would be a new answer (cancel? skip?) that the popup itself does not offer. Press the button and answer the popup.</Note>
      <Dont><b>Don't</b> shrink the popup to fit, drop the frame and leave a bare button on the scrim, or hide the button when even the icon frame does not fit. An open popup always shows where it is.</Dont>
    </Spec>
  );
}

function CollapseFlowSpec() {
  return (
    <Spec id="collapse-and-expand-a-round-trip-that-keeps-the-popup" title="Collapse and expand — a round trip that keeps the popup"
      when={<>The show button and the shrink button move one open popup between two forms. Collapsed, it sits in its own scope and the rest of the window works. Expanded, it covers the window in window scope and takes every press until it is collapsed again or closed. Its logical scope, the thing it acts on, is always its own surface, tab or pane. Collapsing never closes it: what the user typed is still there when it expands again.</>}>
      <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {FLOW.map(([label, props]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 560 }}>
            <div style={{ fontSize: 11, color: "var(--tasty-text-muted)" }}>{label}</div>
            <ShellMock {...props} />
          </div>
        ))}
      </Stage>
      <Meta
        specs={[
          ["collapsed → expanded", "the show button (click, Enter, Space) · key focus goes into the popup"],
          ["expanded", "window scope for the picture and for presses: scrim-bg over the whole window, shadow-modal, centred · no popup focus edge · logical scope unchanged"],
          ["expanded → collapsed", "the shrink button (click, Enter, Space) · the show button takes key focus · state kept"],
          ["closing", "only the popup's own controls · the shrink button never closes"],
          ["scope kinds", "surface, tab or pane — one rule"],
        ]}
        tokens={[
          { tok: "--tasty-scrim-bg", use: "whole window while expanded", color: "var(--tasty-scrim-bg)" },
          { tok: "--tasty-shadow-modal", use: "the expanded frame" },
          { tok: "--tasty-bg-sidebar", use: "host title bar of a headless expanded popup", color: "var(--tasty-bg-sidebar)" },
          { tok: "--tasty-popup-title-btn-size", use: "24 — the shrink button" },
        ]} />
    </Spec>
  );
}

export { CollapsedPopupSpec, CollapseFlowSpec, COLLAPSED_COPY, COLLAPSE_COPY };
