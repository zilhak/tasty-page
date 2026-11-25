import React from "react";
import { Kbd, Toast } from "../../components/index.js";
import { Section, Spec, Stage, Views, View, Meta, Note, Do, Dont } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";

// Capture region select: the Windows screen capture picks its area here. RULES section 4 holds the rules.
// Translation keys are proposals. The values are canon, in en, ko, ja and zh-Hans.
// cancelled is the result toast of a cancel (Esc, or a release with no selection), proposed as toast.screenshot_cancelled.
export const CAPTURE_COPY = {
  en: { idle: "Drag to select an area of the picture.", dragging: "Release to copy this area.", cancel: "Cancel", cancelled: "Screenshot cancelled. The clipboard was not changed." },
  ko: { idle: "이미지에서 드래그해 영역을 선택하세요.", dragging: "놓으면 이 영역이 복사됩니다.", cancel: "취소", cancelled: "스크린샷을 취소했습니다. 클립보드는 변경되지 않았습니다." },
  ja: { idle: "画像をドラッグして範囲を選択してください。", dragging: "離すとこの範囲がコピーされます。", cancel: "キャンセル", cancelled: "スクリーンショットをキャンセルしました。クリップボードは変更されませんでした。" },
  "zh-Hans": { idle: "拖动以选择图片区域。", dragging: "松开以复制此区域。", cancel: "取消", cancelled: "已取消截图。剪贴板未更改。" },
};
const LANGS = ["en", "ko", "ja", "zh-Hans"];

// The picture is a copy of a screen, so its colors are nobody's token. The two Tasty windows in it pin a theme of
// their own and stay the same whatever the page theme is. The flat and checker pictures are the two hard cases for
// the edge: the gray where black and white read about equally, and a pattern with no flat color at all.
const FLAT_MID = "#767676";
const CHECKER = "repeating-conic-gradient(#000000 0 25%, #ffffff 0 50%) 0 0 / 2px 2px";

function Bars({ widths, top, left, ink }) {
  return widths.map((w, i) => (
    <span key={i} style={{ position: "absolute", left, top: `calc(${top} + ${i} * 10%)`, width: w, height: "4%", background: ink }} />
  ));
}

function FakeWindow({ style, ink }) {
  return (
    <div style={{ position: "absolute", overflow: "hidden", background: "var(--tasty-surface-terminal-focused-bg)", ...style }}>
      <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: "10%", background: "var(--tasty-bg-app)" }} />
      <span style={{ position: "absolute", left: 0, top: "10%", bottom: 0, width: "22%", background: "var(--tasty-bg-sidebar)" }} />
      <Bars widths={["14%", "10%", "12%"]} top="18%" left="4%" ink="var(--tasty-text-muted)" />
      <Bars widths={["52%", "38%", "60%", "28%", "46%"]} top="20%" left="27%" ink={ink} />
    </div>
  );
}

function Desktop({ theme, wide, tall }) {
  const ink = theme === "latte" ? "var(--tasty-text-primary)" : "var(--tasty-accent-success)";
  return (
    <div data-theme={theme} style={{ position: "absolute", inset: 0, background: "var(--tasty-bg-panel)" }}>
      {tall ? (
        <>
          <FakeWindow ink={ink} style={{ left: "8%", top: "4%", width: "84%", height: "38%" }} />
          <FakeWindow ink={ink} style={{ left: "8%", top: "54%", width: "84%", height: "38%" }} />
        </>
      ) : wide ? (
        <>
          <FakeWindow ink={ink} style={{ left: "3%", top: "10%", width: "42%", height: "78%" }} />
          <FakeWindow ink={ink} style={{ left: "54%", top: "16%", width: "40%", height: "70%" }} />
        </>
      ) : (
        <>
          <FakeWindow ink={ink} style={{ left: "6%", top: "10%", width: "56%", height: "66%" }} />
          <FakeWindow ink={ink} style={{ left: "48%", top: "28%", width: "46%", height: "62%" }} />
        </>
      )}
    </div>
  );
}

function Picture({ tone, wide, tall }) {
  if (tone === "mid") return <div style={{ position: "absolute", inset: 0, background: FLAT_MID }} />;
  if (tone === "busy") return <div style={{ position: "absolute", inset: 0, background: CHECKER }} />;
  return <Desktop theme={tone === "light" ? "latte" : "mocha"} wide={wide} tall={tall} />;
}

const dim = { position: "absolute", background: "var(--tasty-capture-dim-bg)" };
// The dim is four panels around the selection and the edge sits outside the selection, so the pixels inside are the
// picture untouched: what the selection shows is what the crop holds.
function Selection({ r }) {
  const right = `calc(${r.x} + ${r.w})`;
  const bottom = `calc(${r.y} + ${r.h})`;
  const edge = "var(--tasty-capture-edge-width)";
  return (
    <>
      <span style={{ ...dim, left: 0, right: 0, top: 0, height: r.y }} />
      <span style={{ ...dim, left: 0, right: 0, top: bottom, bottom: 0 }} />
      <span style={{ ...dim, left: 0, width: r.x, top: r.y, height: r.h }} />
      <span style={{ ...dim, left: right, right: 0, top: r.y, height: r.h }} />
      <span style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, zIndex: 1,
        boxShadow: `0 0 0 ${edge} var(--tasty-capture-edge-dark), 0 0 0 calc(${edge} * 2) var(--tasty-capture-edge-light)` }} />
    </>
  );
}

function CapturePicture({ tone, wide, tall, rect, style }) {
  return (
    <div data-audit-exempt="capture-picture" style={{ position: "relative", flex: "none", boxShadow: "0 0 0 var(--tasty-border-width) var(--tasty-border-frame)", ...style }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Picture tone={tone} wide={wide} tall={tall} />
      </div>
      {rect ? <Selection r={rect} /> : <span style={{ ...dim, inset: 0 }} />}
    </div>
  );
}

function CaptureBand({ lang = "en", size }) {
  const c = CAPTURE_COPY[lang];
  return (
    <div lang={lang} style={{ height: "var(--tasty-capture-band-height)", flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-md)", padding: "0 var(--tasty-space-sm)", background: "var(--tasty-bg-sidebar)",
      borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)", fontSize: "var(--tasty-font-size-body)", whiteSpace: "nowrap" }}>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: "var(--tasty-text-primary)" }}>{size ? c.dragging : c.idle}</span>
      {size && <span style={{ flex: "none", fontFamily: "var(--tasty-font-mono)", color: "var(--tasty-text-primary)" }}>{size}</span>}
      <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)", color: "var(--tasty-text-secondary)" }}>
        <Kbd keys="Esc" />{c.cancel}
      </span>
    </div>
  );
}

// One window's content area. height fixes the area, for a picture that does not fill it. Without it the bed hugs the picture.
function CaptureFrame({ lang, size, height, width, children, stageRef, stageProps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: width || "100%", maxWidth: "100%", minWidth: 0, overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-border-frame)" }}>
      <CaptureBand lang={lang} size={size} />
      <div ref={stageRef} {...stageProps} style={{ display: "flex", alignItems: "center", justifyContent: "center", height, padding: "var(--tasty-capture-stage-inset)", background: "var(--tasty-bg-app)", cursor: "crosshair", boxSizing: "border-box", ...(stageProps && stageProps.style) }}>
        {children}
      </div>
    </div>
  );
}

const fill = { width: "100%", aspectRatio: "16 / 9" };
const dragRect = { x: "24%", y: "22%", w: "44%", h: "48%" };

const Pair = ({ frame }) => <ThemePair render={frame} />;

const CANCEL_DEMO = "The view closes. The clipboard does not change, and the cancel toast appears.";

// The window that asked, after a cancel: the view is gone and the cancel toast sits in the window's toast stack.
function CancelledWindow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end", gap: "var(--tasty-space-sm)", minHeight: "var(--tasty-size-180)", boxSizing: "border-box",
      padding: "var(--tasty-space-md)", background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)" }}>
      {LANGS.map((lang) => <Toast key={lang} lang={lang} variant="info">{CAPTURE_COPY[lang].cancelled}</Toast>)}
    </div>
  );
}

// Pointer and keyboard work: drag on the picture, press Esc while the frame has focus.
function CaptureDemo() {
  const SOURCE = { w: 3840, h: 2160 };
  const pictureRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null);
  const [last, setLast] = React.useState("Drag on the picture.");
  const at = (e) => {
    const b = pictureRef.current.getBoundingClientRect();
    return { px: Math.min(Math.max(e.clientX - b.left, 0), b.width), py: Math.min(Math.max(e.clientY - b.top, 0), b.height), bw: b.width, bh: b.height };
  };
  const minDrag = () => parseFloat(getComputedStyle(pictureRef.current).getPropertyValue("--tasty-capture-min-drag")) || 0;
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.parentElement.focus();
    const p = at(e);
    setDrag({ x0: p.px, y0: p.py, x1: p.px, y1: p.py, bw: p.bw, bh: p.bh });
  };
  const onMove = (e) => { if (drag) { const p = at(e); setDrag({ ...drag, x1: p.px, y1: p.py }); } };
  const shown = () => {
    if (!drag) return null;
    const w = Math.abs(drag.x1 - drag.x0);
    const h = Math.abs(drag.y1 - drag.y0);
    const min = minDrag();
    if (w < min || h < min) return null;
    return {
      rect: { x: `${(Math.min(drag.x0, drag.x1) / drag.bw) * 100}%`, y: `${(Math.min(drag.y0, drag.y1) / drag.bh) * 100}%`, w: `${(w / drag.bw) * 100}%`, h: `${(h / drag.bh) * 100}%` },
      size: `${Math.round((w / drag.bw) * SOURCE.w)} × ${Math.round((h / drag.bh) * SOURCE.h)}`,
    };
  };
  const onUp = () => {
    const s = shown();
    setDrag(null);
    setLast(s ? `The view closes and the crop is ${s.size}. The existing result toast reports the copy.` : `No selection, so this cancels. ${CANCEL_DEMO}`);
  };
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    setDrag(null);
    setLast(`Esc cancels. ${CANCEL_DEMO}`);
  };
  const s = shown();
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
      <CaptureFrame size={s && s.size} stageProps={{ tabIndex: 0, onKeyDown: onKey }}>
        <div ref={pictureRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} style={{ ...fill, flex: "none", touchAction: "none", display: "flex" }}>
          <CapturePicture tone="dark" rect={s && s.rect} style={{ width: "100%", height: "100%" }} />
        </div>
      </CaptureFrame>
      <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{last}</span>
    </div>
  );
}

export function CaptureRegionSection() {
  return (
    <Section id="captureregion" title="Capture region select">
      <Spec id="capture-region-select" title="Capture region select"
        when={"On Windows, use the screenshot shortcut to capture every monitor as one picture, then select the area to keep in this view below the title bar. The default shortcut is Ctrl+Alt+S; you can rebind it. Tasty draws this view because the operating system tool cannot return a result to an app packaged as .msi or .zip. On macOS and Linux, an operating system tool handles selection."}>
        <Stage variant="solo center" eager style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)" }}>
          <CaptureDemo />
        </Stage>
        <Note>Release a drag to copy the selected area to the clipboard and close the view. The existing result toast reports the result. Press Esc at any time, or click without dragging, to cancel. The view closes, the clipboard does not change, and the cancel toast always appears. A drag under 4 px on either axis counts as a click.</Note>
        <Do>Keep the hint, crop size and Esc in the opaque 32 px mantle band above the picture. In a narrow window, ellipsize only the hint so the size and Esc stay visible.</Do>
        <Dont>Do not float a hint or size over the picture. It would hide pixels you might select and make text contrast depend on the picture.</Dont>
        <Dont>Do not reuse the modal scrim for the picture dim. A scrim marks underlying content as inert; this picture is what you read and act on.</Dont>
        <Views>
          <View wide name="capture-before" label="Before a drag: the whole picture is dimmed">
            <Pair frame={() => <CaptureFrame><CapturePicture tone="dark" style={fill} /></CaptureFrame>} />
          </View>
          <View wide name="capture-dragging" label="Dragging: the selection is clear, the size is live">
            <Pair frame={() => <CaptureFrame size="1690 × 1037"><CapturePicture tone="dark" rect={dragRect} style={fill} /></CaptureFrame>} />
          </View>
          <View wide name="capture-cancelled" label="After a cancel, by Esc or by a click with no drag: the view is closed, the cancel toast in every language">
            <Pair frame={() => <CancelledWindow />} />
          </View>
          <View wide name="capture-smallest-area" label="The smallest area: capture-min-drag on both axes">
            <Pair frame={() => <CaptureFrame size="12 × 12"><CapturePicture tone="dark" rect={{ x: "50%", y: "40%", w: "var(--tasty-capture-min-drag)", h: "var(--tasty-capture-min-drag)" }} style={fill} /></CaptureFrame>} />
          </View>
        </Views>
        <Meta
          specs={[
            ["area", "every pixel below the title bar. No popup frame, no popup title, no scrim, no shadow"],
            ["band height", <span className="tok">--tasty-capture-band-height</span>],
            ["band", "mantle · hint left · size, then Esc and Cancel right · Esc stays put when the size appears"],
            ["band inset", <span className="tok">--tasty-space-sm</span>],
            ["band gap", <span className="tok">--tasty-space-md</span>],
            ["hint", "body · text-primary · end ellipsis · the only part that gives way"],
            ["size", "body mono · text-primary · {width} × {height} in picture pixels · same text in every language, so no key"],
            ["Esc and Cancel", "Kbd on mantle · gap space-xs · body · text-secondary · a label, not a button"],
            ["stage inset", <span className="tok">--tasty-capture-stage-inset</span>],
            ["bed", "crust · 1px border-frame around the picture, outside it"],
            ["edge", <><span className="tok">--tasty-capture-edge-width</span> × 2 · outside the selection · dark inner, light outer · no radius</>],
            ["no selection under", <span className="tok">--tasty-capture-min-drag</span>],
            ["pointer", "crosshair on the picture and the inset · default on the band · a press in the inset starts at the nearest picture edge · past the picture, the selection clamps to it"],
            ["release with a selection", "copies, closes the view · the existing result toasts, unchanged: toast.screenshot_copied, toast.screenshot_path_only, toast.screenshot_copy_failed"],
            ["cancel", "Esc at any time, or release with no selection (a click, or under capture-min-drag on either axis) · closes the view · clipboard unchanged · toast.screenshot_cancelled, info"],
            ["result toast", "every way the view ends raises one · in the window that asked"],
            ["motion", "0ms · the view, the dim and the edge never fade"],
          ]}
          tokens={[
            { tok: "--tasty-capture-dim-bg", use: "picture outside the selection, one value in both themes", color: "var(--tasty-capture-dim-bg)" },
            { tok: "--tasty-capture-edge-light", use: "outer stroke, against the dim", color: "var(--tasty-capture-edge-light)" },
            { tok: "--tasty-capture-edge-dark", use: "inner stroke, against the selection", color: "var(--tasty-capture-edge-dark)" },
            { tok: "--tasty-bg-sidebar", use: "band · mantle", color: "var(--tasty-bg-sidebar)" },
            { tok: "--tasty-bg-app", use: "bed · crust", color: "var(--tasty-bg-app)" },
            { tok: "--tasty-separator", use: "band bottom edge", color: "var(--tasty-separator)" },
            { tok: "--tasty-border-frame", use: "picture frame", color: "var(--tasty-border-frame)" },
            { tok: "--tasty-text-primary", use: "hint and size", color: "var(--tasty-text-primary)" },
            { tok: "--tasty-text-secondary", use: "Cancel", color: "var(--tasty-text-secondary)" },
            { tok: "--tasty-toast-accent-info", use: "cancel toast rail, the info Toast as it is", color: "var(--tasty-toast-accent-info)" },
          ]} />
      </Spec>

      <Spec id="capture-region-fit" title="Fitting the picture"
        when={"Center the picture in the crust bed with an 8 px inset and a 1 px frame, preserving its aspect ratio. Scale large pictures down to fit; keep smaller pictures at one to one without enlarging them."}>
        <Views>
          <View wide name="capture-picture-larger" label="Picture larger than the area, wide: scaled down, bed above and below">
            <Pair frame={() => <CaptureFrame size="2304 × 1123" height="var(--tasty-size-240)"><CapturePicture tone="dark" wide rect={{ x: "30%", y: "24%", w: "30%", h: "52%" }} style={{ width: "100%", aspectRatio: "32 / 9" }} /></CaptureFrame>} />
          </View>
          <View wide name="capture-picture-taller" label="Picture larger than the area, tall: scaled down, bed left and right">
            <Pair frame={() => <CaptureFrame size="1944 × 1152" height="var(--tasty-size-240)"><CapturePicture tone="dark" tall rect={{ x: "10%", y: "20%", w: "90%", h: "30%" }} style={{ height: "100%", aspectRatio: "9 / 16" }} /></CaptureFrame>} />
          </View>
          <View wide name="capture-picture-smaller" label="Picture smaller than the area: one to one, centered, never scaled up">
            <Pair frame={() => <CaptureFrame size="96 × 53" height="var(--tasty-size-240)"><CapturePicture tone="dark" rect={{ x: "20%", y: "20%", w: "60%", h: "60%" }} style={{ width: "var(--tasty-size-160)", height: "var(--tasty-size-88)" }} /></CaptureFrame>} />
          </View>
          <View wide name="capture-at-picture-edge" label="Selection at the picture's edge: the strokes sit in the inset">
            <Pair frame={() => <CaptureFrame size="1920 × 2160"><CapturePicture tone="dark" rect={{ x: "50%", y: "0%", w: "50%", h: "100%" }} style={fill} /></CaptureFrame>} />
          </View>
          <View wide name="capture-narrow-window" label="Narrow window: the hint ellipsizes, the size and Esc stay">
            <Pair frame={() => <CaptureFrame size="1690 × 1037" width="var(--tasty-size-240)"><CapturePicture tone="dark" rect={dragRect} style={fill} /></CaptureFrame>} />
          </View>
          <View wide name="capture-copy-languages" label="The band in every language">
            <Pair frame={() => (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
                {["en", "ko", "ja", "zh-Hans"].map((lang) => (
                  <React.Fragment key={lang}>
                    <CaptureBand lang={lang} />
                    <CaptureBand lang={lang} size="1690 × 1037" />
                  </React.Fragment>
                ))}
              </div>
            )} />
          </View>
        </Views>
        <Meta specs={[
          ["fit", "scale to fit inside the stage · keep the ratio · never above one to one"],
          ["crop", "from the source picture at its own resolution, however it is displayed"],
          ["monitors", "no monitor lines · the app does not know the boundaries"],
        ]} />
        <Note>Display scale never changes the crop: you always copy source pixels at full resolution. The size in the band is the crop's size in source picture pixels.</Note>
      </Spec>

      <Spec id="capture-region-any-picture" title="On any picture"
        when={"Compare the selection edge on dark, light, flat gray and 1 px checker pictures. The 50% black dim caps pixels outside the selection at #808080, giving the white outer stroke contrast on any picture. Both 1 px strokes sit outside the selection, black inside and white outside, leaving selected pixels untouched."}>
        <Views>
          {[
            ["capture-on-dark", "Dark picture", "dark"],
            ["capture-on-light", "Light picture", "light"],
            ["capture-on-mid", "Flat gray, the hard case for one stroke", "mid"],
            ["capture-on-busy", "Fine pattern, no flat color", "busy"],
          ].map(([name, label, tone]) => (
            <View wide key={name} name={name} label={label}>
              <Pair frame={() => <CaptureFrame size="1690 × 1037"><CapturePicture tone={tone} rect={dragRect} style={fill} /></CaptureFrame>} />
            </View>
          ))}
        </Views>
        <Meta specs={[
          ["light stroke on dim", "at least 3.95:1 on any picture · dim caps the picture at #808080 · 3:1 grade holds"],
          ["strokes to each other", "21:1 on any picture"],
          ["dark stroke on selection", "no promise · it depends on the picture · the light stroke holds the edge"],
          ["dim", "none on black, where the edge alone shows the selection"],
        ]} />
        <Note>Computation establishes at least 3.95:1 for white against the dim and 21:1 between the strokes on any picture because the dim caps pixels outside the selection at #808080 and the strokes are pure white and pure black. Pixel probes confirmed the painted values only on the four sample pictures. The black stroke has no guaranteed contrast against selected pixels, and how the edge looks to a person on a fine pattern was not measured.</Note>
      </Spec>
    </Section>
  );
}
