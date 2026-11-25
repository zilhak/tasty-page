import React from "react";
import { Button, Icon as TIcon } from "../../components/index.js";
import { Section, Spec, Stage, Meta, Note, Do } from "../parts/specimen.jsx";

// Tasty Gallery — Overlays · Tutorial (the 6th overlay family)
// Marker overlay (floating geometric marker) + Callout bubble + Topic-list
// popup. Opened from the Tools → Tutorial menu. Frame/shared bits stay inline
// here (this family has no reuse elsewhere yet). See overlays-*.jsx for the rest.



const NAV = [
  { id: "marker", label: "Marker overlay" },
  { id: "callout", label: "Callout bubble" },
  { id: "topics", label: "Topic-list popup" },
  { id: "composite", label: "Composite step" },
];

// ── faux app shell the overlays float above ──
function App({ children, activeWs = 0 }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div style={{ width: 116, flex: "none", background: "var(--tasty-bg-sidebar)", borderRight: "var(--tasty-border-width) solid var(--tasty-separator)", padding: "10px 8px" }}>
        {["web", "api", "db"].map((w, i) => (
          <div key={w} style={{ height: 22, borderRadius: "var(--tasty-radius-sm)", display: "flex", alignItems: "center", gap: 6, padding: "0 6px", marginBottom: 3,
            background: i === activeWs ? "var(--tasty-surface-active)" : "transparent", color: i === activeWs ? "var(--tasty-text-on-active)" : "var(--tasty-text-muted)", fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--tasty-accent-success)", flex: "none" }} />{w}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 24, flex: "none", display: "flex", background: "var(--tasty-bg-panel)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
          {["zsh", "logs", "vim"].map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: 11, borderRight: "var(--tasty-border-width) solid var(--tasty-separator)",
              background: i === 0 ? "var(--tasty-surface-terminal-focused-bg)" : "transparent", color: i === 0 ? "var(--tasty-text-primary)" : "var(--tasty-text-muted)" }}>{t}</div>
          ))}
        </div>
        <div data-terminal-content="" style={{ flex: 1, background: "var(--tasty-surface-terminal-focused-bg)", color: "var(--tasty-text-muted)", fontFamily: "var(--tasty-font-mono)", fontSize: 11, padding: "10px 12px" }}>
          <div data-audit-exempt="terminal-attributes" style={{ opacity: 0.5 }}>$ kubectl get pods -n prod</div>
        </div>
        <div style={{ height: 20, flex: "none", background: "var(--tasty-bg-sidebar)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }} />
      </div>
      {children}
    </div>
  );
}

const ring = { position: "absolute", borderRadius: "var(--tasty-radius)", pointerEvents: "none", border: "var(--tasty-focus-ring-width) solid var(--tasty-accent-primary)" };
const glowShadow = "0 0 0 3px var(--tasty-tutorial-marker-glow-inner), 0 0 16px 2px var(--tasty-tutorial-marker-glow-outer)";

function Marker({ style, kind = "ring" }) {
  const s = { ...ring, ...style };
  if (kind === "glow") s.boxShadow = glowShadow;
  return <div style={s} />;
}

function Scrim() { return <div style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)", pointerEvents: "none" }} />; }

// ── Callout ──
// Every callout here is the ko copy, so its buttons read the app's ko values: tutorial.btn_skip, btn_back, btn_next.
const CALLOUT_KO = { skip: "목록", back: "이전", next: "다음" };

function Callout({ tail = "up", step, total = 5, title, body, first, style }) {
  const base = {
    position: "absolute", width: 244, background: "var(--tasty-surface-raised)",
    border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)",
    boxShadow: "var(--tasty-shadow-modal)", padding: "var(--tasty-space-md) var(--tasty-space-lg)", zIndex: 3, ...style,
  };
  const tailBase = { position: "absolute", width: 12, height: 12, background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", transform: "rotate(45deg)" };
  const tailPos = {
    up:    { top: -7, left: 28, borderRight: 0, borderBottom: 0 },
    down:  { bottom: -7, left: 28, borderLeft: 0, borderTop: 0 },
    left:  { left: -7, top: 24, borderTop: 0, borderRight: 0 },
    right: { right: -7, top: 24, borderBottom: 0, borderLeft: 0 },
  }[tail];
  return (
    <div style={base}>
      <div style={{ ...tailBase, ...tailPos }} />
      <div style={{ fontFamily: "var(--tasty-font-mono)", fontSize: 10, color: "var(--tasty-accent-primary-raised)", fontWeight: 600 }}>{step} / {total}</div>
      <h4 style={{ margin: "4px 0 6px", fontSize: 13, color: "var(--tasty-text-primary)", fontWeight: 600 }}>{title}</h4>
      <p style={{ margin: "0 0 var(--tasty-space-md)", fontSize: 11, color: "var(--tasty-text-secondary-raised)", lineHeight: "var(--tasty-line-height-ui)" }}>{body}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, marginRight: "auto" }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i === step - 1 ? "var(--tasty-accent-primary)" : "var(--tasty-surface-active)" }} />
          ))}
        </div>
        <button style={{ appearance: "none", background: "transparent", border: 0, color: "var(--tasty-text-muted-raised)", fontSize: 11, cursor: "pointer", padding: "0 6px", fontFamily: "var(--tasty-font-ui)" }}>{CALLOUT_KO.skip}</button>
        {!first && <Button size="sm">{CALLOUT_KO.back}</Button>}
        <Button size="sm" variant="primary">{CALLOUT_KO.next}</Button>
      </div>
    </div>
  );
}

// ── Topic row ──
function Topic({ n, title, desc, sel, done }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 10px", borderRadius: "var(--tasty-radius)", alignItems: "flex-start", cursor: "pointer",
      border: "var(--tasty-border-width) solid " + (sel ? "var(--tasty-tutorial-topic-selected-border)" : "transparent"),
      background: sel ? "var(--tasty-surface-active)" : "transparent" }}>
      <div style={{ width: 20, height: 20, flex: "none", borderRadius: "var(--tasty-radius-sm)", fontFamily: "var(--tasty-font-mono)", fontSize: 10, display: "grid", placeItems: "center", marginTop: 1,
        background: sel ? "var(--tasty-accent-primary)" : "var(--tasty-surface-raised)", color: sel ? "var(--tasty-text-on-accent)" : "var(--tasty-text-muted)" }}>{n}</div>
      <div style={{ minWidth: 0 }}>
        <b style={{ display: "block", fontSize: 13, color: "var(--tasty-text-primary)", fontWeight: 500, marginBottom: 2 }}>{title}</b>
        <span style={{ fontSize: 11, color: "var(--tasty-text-muted)" }}>{desc}</span>
      </div>
      {done && <span style={{ marginLeft: "auto", display: "inline-flex", color: "var(--tasty-accent-success-raised)" }}><TIcon name="check" size="var(--tasty-icon-size-sm)" /></span>}
    </div>
  );
}

function TopicPopup({ scaled }) {
  return (
    <div style={{ position: "relative", zIndex: 2, width: 360, background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)", overflow: "hidden" }}>
      <div style={{ padding: "var(--tasty-space-md) var(--tasty-space-lg)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)", display: "flex", alignItems: "center" }}>
        <b style={{ fontSize: 13, color: "var(--tasty-text-primary)", fontWeight: 600 }}>튜토리얼</b>
        <div style={{ marginLeft: "auto", color: "var(--tasty-text-muted)", cursor: "pointer" }}>✕</div>
      </div>
      <div style={{ maxHeight: "var(--tasty-size-200)", overflowY: "auto", padding: "var(--tasty-space-sm)" }}>{/* screen-only cap (no DTCG token) — scales with ui_scale like the rows it bounds */}
        <Topic n={1} sel title="워크스페이스 · 패인 · 탭 · 서피스" desc="화면 구조 4개 기본 개념." done={scaled} />
        {scaled && <>
          <Topic n={2} title="커맨드 팔레트 & 단축키" desc="모든 명령을 키보드로." />
          <Topic n={3} title="포트 스캐너 · 리모트" desc="로컬 포트와 원격 세션 연결." />
          <Topic n={4} title="프리셋 & 워크스페이스 레이아웃" desc="패인 배치를 저장·복원." />
        </>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "var(--tasty-space-md) var(--tasty-space-lg)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <span style={{ marginRight: "auto", fontSize: 10, color: "var(--tasty-text-muted)", fontFamily: "var(--tasty-font-mono)" }}>Esc 닫기</span>
        <Button size="sm" variant="primary">진행</Button>
      </div>
    </div>
  );
}

function Page() {
  return (
    <>
      <Section id="marker" title="Marker overlay — floating geometric marker">
        <Spec id="marker-an-independent-shape-drawn-over-a-target" title="Marker — an independent shape drawn over a target"
          when={<>After Modal / Popup / Toast / Banner / Modifier-hint, <b>Marker</b> is the 6th overlay concept — and the only one carrying <b>no message</b>. It is a pure geometric ring/leader drawn at a rect on the <b>top z-layer</b>, <b>never</b> touching the target widget's own border, <b>pointer-events:none</b> so clicks pass through. Fired only by the <b>Tools → Tutorial</b> flow.</>}>
          <Stage variant="solo" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, padding: 16, background: "var(--tasty-bg-app)" }}>
            <div style={{ position: "relative", height: 150, background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <App /><Marker kind="ring" style={{ left: 34, top: 38, right: 16, bottom: 22 }} />
              <span style={{ position: "absolute", left: 8, bottom: 6, fontSize: 10, fontFamily: "var(--tasty-font-mono)", color: "var(--tasty-text-muted)" }}>ring — solid 2px</span>
            </div>
            <div style={{ position: "relative", height: 150, background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <App /><Scrim /><Marker kind="glow" style={{ left: 34, top: 38, right: 16, bottom: 22 }} />
              <span style={{ position: "absolute", left: 8, bottom: 6, fontSize: 10, fontFamily: "var(--tasty-font-mono)", color: "var(--tasty-text-primary)" }}>glow + spotlight — default</span>
            </div>
          </Stage>
          <Meta
            specs={[["family", "Modal · Popup · Toast · Banner · Modifier-hint · Marker"], ["z-layer", "top — above all content"], ["pointer", "none (clicks pass through)"], ["ring width", "2px (--tasty-focus-ring-width)"], ["radius", "4px (--tasty-radius)"], ["highlight", "static glow default · pulse opt (reduced-motion → static)"], ["fires on", "Tools → Tutorial only"]]}
            tokens={[{ tok: "--tasty-accent-primary", use: "ring", color: "var(--tasty-accent-primary-raised)" }, { tok: "--tasty-tutorial-marker-glow-inner", use: "halo, 3px spread" }, { tok: "--tasty-tutorial-marker-glow-outer", use: "halo, 16px blur" }, { tok: "--tasty-focus-ring-width", use: "2px stroke" }, { tok: "--tasty-scrim-bg", use: "spotlight dim", color: "var(--tasty-scrim-bg)" }, { tok: "--tasty-radius", use: "corner" }]} />
          <Note><b>Decision 3 (강조):</b> default = 2px solid ring + static glow; <b>pulse</b> is opt-in only and falls back to a static ring under <code>prefers-reduced-motion</code>. <b>Decision 1 (딤):</b> spotlight scrim ON by default, user-disableable.</Note>
        </Spec>
      </Section>

      <Section id="callout" title="Callout bubble">
        <Spec id="callout-title-body-progress-back-next-skip-4-way-tail" title="Callout — title · body · progress · Back/Next/Skip · 4-way tail"
          when={<>The guidance bubble pinned to a marker. Fixed <b>244px</b> wide (i18n growth absorbed vertically), a <b>tail</b> points at the marker in one of 4 directions, and edge-avoidance flips the tail + clamps the body into the 8px safe area while the tail keeps aiming at the marker corner.</>}>
          <Stage variant="solo" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, padding: 24, background: "var(--tasty-bg-app)", placeItems: "center" }}>
            {/* The basics topic in the app's order (workspace, pane, tab, surface, summary), with its ko copy as written. */}
            <div style={{ position: "relative" }}><Callout tail="up" step={2} title="페인" body="각 페인은 자기 탭 바를 갖습니다. 페인을 나누면 서로 다른 탭을 나란히 볼 수 있어요." style={{ position: "relative" }} /></div>
            <div style={{ position: "relative" }}><Callout tail="down" step={3} title="탭" body="페인 안에서 작업을 전환하는 단위입니다. 탭마다 서피스 배치를 따로 가질 수 있어요." style={{ position: "relative" }} /></div>
            <div style={{ position: "relative" }}><Callout tail="left" step={4} title="서피스" body="터미널이나 문서가 표시되는 작업 영역입니다. 한 탭 안에 여러 서피스를 나눠 놓을 수 있어요." style={{ position: "relative" }} /></div>
            <div style={{ position: "relative" }}><Callout tail="right" step={1} first title="워크스페이스" body="작업에 필요한 페인과 탭을 묶는 공간입니다. 사이드바에서 다른 워크스페이스로 전환할 수 있어요." style={{ position: "relative" }} /></div>
          </Stage>
          <Meta
            specs={[["width", "244px fixed"], ["tail", "up · down · left · right (12px diamond)"], ["progress", "2/5 label + dot rail"], ["buttons", "tutorial.btn_skip (link) · btn_back (secondary) · btn_next (primary) · ko 목록 · 이전 · 다음 · en Topics · Back · Next"], ["first step", "Back hidden"], ["last step", "btn_next → btn_done (ko 완료 · en Done), reopens topic popup"], ["placement", "below → above → right → left; flip on overflow; clamp to 8px safe area"]]}
            tokens={[{ tok: "--tasty-surface-raised", use: "bubble fill", color: "var(--tasty-surface-raised)" }, { tok: "--tasty-border-frame", use: "1px edge + tail — the popup frame", color: "var(--tasty-border-frame)" }, { tok: "--tasty-shadow-modal", use: "floating lift" }, { tok: "--tasty-accent-primary", use: "step · active dot · Next", color: "var(--tasty-accent-primary-raised)" }]} />
          <Do><b>Do</b> reuse the DS <b>Button</b> (primary 다음 / secondary 이전) and keep 목록 as a low-emphasis link back to the topic list popup — the callout is guidance, not a decision surface.</Do>
        </Spec>
      </Section>

      <Section id="topics" title="Topic-list popup">
        <Spec id="topic-list-centered-popup-scrollable-to-start" title="Topic list — centered popup, scrollable, '진행' to start"
          when={<>The entry surface (CenteredFocused popup, standard scrim). Title + a scrollable list of topics (name + description, hover / selected / done states) + a primary <b>진행</b> button. v1 ships <b>one</b> topic; the list scrolls as topics grow.</>}>
          <Stage variant="solo" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, padding: 16, background: "var(--tasty-bg-app)" }}>
            <div style={{ position: "relative", minHeight: 300, display: "grid", placeItems: "center", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <Scrim /><TopicPopup />
            </div>
            <div style={{ position: "relative", minHeight: 300, display: "grid", placeItems: "center", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <Scrim /><TopicPopup scaled />
            </div>
          </Stage>
          <Meta
            specs={[["type", "CenteredFocused popup + scrim"], ["width", "360px"], ["list", "max-height 200px → internal scroll"], ["row states", "hover = overlay-hover · selected = surface-active + accent index cap · done = accent-success ✓"], ["footer", "Esc hint + 진행 (primary)"]]}
            tokens={[{ tok: "--tasty-bg-panel", use: "popup fill", color: "var(--tasty-bg-panel)" }, { tok: "--tasty-scrim-bg", use: "dim behind", color: "var(--tasty-scrim-bg)" }, { tok: "--tasty-surface-active", use: "selected row", color: "var(--tasty-surface-active)" }, { tok: "--tasty-accent-success", use: "done ✓", color: "var(--tasty-accent-success-raised)" }]} />
        </Spec>
      </Section>

      <Section id="composite" title="Composite — a tutorial step in place">
        <Spec id="step-1-4" title="Step 1 / 5 — 워크스페이스"
          when={<>Popup closed: marker (glow ring) + spotlight dim + callout only. Per <b>Decision 2</b>, step 1 wraps the whole workspace content area (tabs + surface + status, sidebar excluded), and the marker then shrinks to the pane, tab and surface. The summary shows only the callout.</>}>
          <Stage variant="solo" style={{ padding: 0, background: "var(--tasty-bg-app)" }} minHeight={340}>
            {/* Every part inside is absolutely placed, so the frame takes the stage's width itself (it shrank to its 2px
                border before) and keeps a floor that holds the callout and its tail; a narrower column scrolls the stage. */}
            <div style={{ position: "relative", flex: "1 1 100%", minWidth: "var(--tasty-tutorial-step-specimen-min-width)", height: 340, borderRadius: "var(--tasty-radius)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <App />
              <Scrim />
              <Marker kind="glow" style={{ left: 124, top: 8, right: 10, bottom: 8 }} />
              {/* step 1 of the basics topic's 5 (the app's topic.steps.len()), its ko copy as written */}
              <Callout tail="right" step={1} total={5} first title="워크스페이스"
                body="작업에 필요한 페인과 탭을 묶는 공간입니다. 사이드바에서 다른 워크스페이스로 전환할 수 있어요."
                style={{ left: 150, top: 120 }} />
            </div>
          </Stage>
          <Note><b>동작:</b> 다음 → step 2 (페인으로 마커 축소) · 이전 → 이전 · 목록/Esc → 주제 목록 팝업 복귀 · 마지막 step 다음 → 목록 팝업 재open. 마커·딤은 <code>pointer-events:none</code>.</Note>
        </Spec>
      </Section>
    </>
  );
}

export const page = {
  active: "overlays-tutorial",
  nav: NAV,
  head: {
  title: "Overlays · Tutorial",
  intro: "Explore tutorial markers, callouts, and the topic list. See how these elements work together to guide someone through the parts of the app.",
  
},
  content: <Page />,
};

export default function GalleryRoute() {
  return page.content;
}
