import React from "react";
import { Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { Tooltip } from "../../components/index.js";
import { ShellMock, CollapsedPopupButton } from "../parts/overlay-frames.jsx";

// Tasty Gallery: Dialogs, a surface-scope popup that does not fit its surface. Only the show button stays in its
// place; pressing it shows the popup over the window. Copy values come from Codex (en, ko, ja, zh-Hans).

const COLLAPSED_COPY = {
  en: ["Show popup", "The popup does not fit in this surface. Press this button to show it over the application window."],
  ko: ["팝업 보기", "이 서피스는 팝업을 표시하기에 너무 작습니다. 버튼을 누르면 앱 창 위에 팝업을 표시합니다."],
  ja: ["ポップアップを表示", "このサーフェスにはポップアップが収まりません。このボタンを押すと、アプリのウィンドウ上にポップアップを表示します。"],
  "zh-Hans": ["查看弹窗", "此 Surface 太小，无法容纳弹窗。按下此按钮可在应用窗口上方显示弹窗。"],
};

const FRAMES = [
  ["wide surface — popup expanded in its surface", { scope: "surface" }],
  ["narrow surface — collapsed, opened by the user (key focus)", { scope: "surface", narrow: true, collapsed: "label", ring: true }],
  ["narrow surface — collapsed, opened by an agent (no focus)", { scope: "surface", narrow: true, collapsed: "label" }],
  ["very narrow — label frame does not fit, icon only", { scope: "surface", narrow: true, collapsed: "icon", ring: true, leftWidth: 64 }],
  ["narrower than the icon frame — cut at the surface rect", { scope: "surface", narrow: true, collapsed: "clipped", ring: true, leftWidth: 24 }],
  ["pressed — the popup over the window", { scope: "window", narrow: true }],
  ["pressed, window smaller than the popup — right and bottom cut", { scope: "window", size: [240, 76], pin: true }],
];

function CollapsedPopupSpec() {
  return (
    <Spec id="collapse-a-surface-popup-that-does-not-fit-leaves-a-show-button" title="Collapse — a surface popup that does not fit leaves a show button"
      when={<>A <b>surface-scope</b> popup that does not fit inside its surface bounds is <b>not shrunk</b>. In its place the surface keeps <b>one button</b> in the popup's own frame, and nothing else. The popup is still open: the button takes key focus, and pressing it (click, <b>Enter</b> or <b>Space</b>) shows the popup <b>centered over the window</b> with the window scrim, where it stays until it closes. The check runs every frame, so when the surface grows back the popup returns to its expanded form in the surface. If the window is smaller than the popup too, the popup keeps its size, its left and top sit on the window's edge, and its right and bottom are cut. The button never names the popup: headless popups have no title, and a title would widen the button and make it collapse sooner.</>}>
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
          <div style={{ padding: "48px 16px 16px", background: "var(--tasty-surface-terminal-focused-bg)", borderRadius: "var(--tasty-radius)", display: "flex", justifyContent: "center", width: 360 }}>
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
      </Views>
      <Meta
        specs={[
          ["collapses when", "the popup's size does not fit the surface bounds (surface rect − the 8 inset) · judged every frame · fits again → expanded again"],
          ["frame", <>the popup's own frame: <span className="tok">--tasty-bg-panel</span> · 1px <span className="tok">--tasty-border-frame</span> · 4 radius · padding <span className="tok">--tasty-popup-content-margin</span> 4 · the button only</>],
          ["shadow", "shadow-modal on a scrim · shadow-popover when the popup has no scrim (the two floating shadows)"],
          ["button", <>Button.secondary md 28 · leading glyph <code>fit</code> 14 · label <code>popup.collapsed_button.label</code></>],
          ["frame size", "button + 2 × 4 + 2 × 1 → 38 tall; en label frame ≈ 126 wide (estimate from the rendered en button)"],
          ["place", "centred on the popup's anchor pulled into the surface bounds (host: bounds centre · plugin ScreenCenter / ActiveSurfaceCenter: bounds centre · plugin Cursor: the pointer), re-centred on the frame's own size"],
          ["too narrow for the label", "label frame wider than the bounds → icon frame: IconButton solid 28, same glyph, accessible name = the label, tooltip unchanged"],
          ["too small for the icon", "on each axis the icon frame does not fit, its start edge sits on the bounds' start edge (the inset as reduced for a small surface) and the surface rect cuts its end; an axis that fits keeps its anchor alignment · never omitted — the popup is open and holds focus"],
          ["title", "not shown — headless popups have none; the tooltip explains what the button stands for"],
          ["scrim", "follows the popup's own scrim entry, the same in both forms — no scrim blink when a divider drag crosses the fit line · the button sits on the frame, never straight on the scrim (only a modal or popup frame sits on scrim@*)"],
          ["focus", "border-focus · focus-ring-width 2 · 1px offset on the button (the :focus-visible pair) · opened by the user: shown from the first frame · passive (agent-opened): no ring"],
          ["tooltip", <><code>popup.collapsed_button.tooltip</code> · Tooltip on pointer hover and key focus · 150ms delay</>],
          ["close", "no close mark on the collapsed form · the way out is the popup's own controls after pressing (open question on Esc, below)"],
          ["pressed", "window scope: centred, full-window scrim, shadow-modal · stays window scope until it closes"],
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
      <Note>Esc on the collapsed form follows the expanded popup's rule. If that rule closes only popups that close on an outside click, rename, the name conflict prompt, Properties and the file picker stay open on Esc while collapsed. The design adds no close mark either way: a close mark on a choice popup would be a new answer (cancel? skip?) that the popup itself does not offer. Press the button and answer the popup.</Note>
      <Dont><b>Don't</b> shrink the popup to fit, drop the frame and leave a bare button on the scrim, or hide the button when even the icon frame does not fit. An open popup always shows where it is.</Dont>
    </Spec>
  );
}

export { CollapsedPopupSpec, COLLAPSED_COPY };
