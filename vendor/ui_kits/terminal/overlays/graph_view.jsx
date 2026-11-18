import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { elbow, ZoomCluster, Minimap, NODE_W, NODE_H, sTok, sBg, sLabel } from "./dag_view.jsx";

// Tasty UI kit — the shared graph component (2026-11-10).
// The child graph and the Task DAG are ONE graph component with two contents:
//   GraphCanvas  pan · zoom · select · elbow edges · LOD · zoom cluster · minimap · LOD chip
//   GraphDrawer  the node detail, laid OVER the canvas from the right edge (never shrinks it)
//   GraphPush    one frame, several screens; a new screen pushes in from the right
//   GraphStrip   one-line notice pinned to the canvas top (refresh error, disconnected, mirror base detached or lost)
//   DrawerRow    label · value row used by every drawer body
// What differs per graph is passed in: the layout, the edges, the card renderer and the drawer body.
// Popup and surface frames wrap the same parts (decision 8: only the frame differs).

const Z_MIN = 0.2, Z_MAX = 1.5, Z_STEP = 0.1;
// The drawer's geometry is read from its tokens on the canvas element (tokPx), so the drawn width
// and the reveal / cover arithmetic cannot drift apart. These numbers are only the fallback for a
// page without the token sheet; they repeat the token values.
const DRAWER_W = 288;       // fallback for --tasty-graph-drawer-width
const COVER_BELOW = 480;    // fallback for --tasty-graph-drawer-cover-below
const REVEAL = 16;          // fallback for --tasty-graph-reveal-margin
const tokPx = (el, name, fallback) => {
  if (!el || typeof getComputedStyle === "undefined") return fallback;
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
};
// A duration token in ms ("120ms" or "0.12s"); 0 when the viewer asks for reduced motion.
const tokMs = (el, name, fallback) => {
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  if (!el || typeof getComputedStyle === "undefined") return fallback;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const v = parseFloat(raw);
  if (!Number.isFinite(v)) return fallback;
  return /ms$/.test(raw) ? v : /s$/.test(raw) ? v * 1000 : v;
};
const MINIMAP_MIN = 560;    // --tasty-dag-minimap-min-surface, measured on the canvas left uncovered
const lodOf = (z) => (z >= 0.7 ? "full" : z >= 0.4 ? "compact" : "block");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const CSS = `
.tasty-graph-drawer-slot { transition: transform var(--tasty-graph-drawer-motion) var(--tasty-ease-ui); }
.tasty-graph-push__track { transition: transform var(--tasty-graph-push-motion) var(--tasty-ease-ui); }
.tasty-graph-chrome { transition: right var(--tasty-graph-drawer-motion) var(--tasty-ease-ui); }
@media (prefers-reduced-motion: reduce) {
  .tasty-graph-drawer-slot, .tasty-graph-push__track, .tasty-graph-chrome { transition: none; }
}
.tasty-graph-still, .tasty-graph-still * { transition: none !important; }
`;
let injected = false;
function ensureCss() {
  if (injected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.id = "tasty-graph-view-css";
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

// ── Drawer ──────────────────────────────────────────────────────────
// Flush to the canvas's right edge, full canvas height, 288 wide; it floats over the canvas
// without a scrim, so it takes the popover shadow. Below 480 of canvas width it covers the
// whole canvas (no shadow: nothing shows beside it). Head 36 stays put; the body scrolls.
// The slide in and out belongs to the canvas (GraphCanvas's drawer slot), not to the drawer.
function GraphDrawer({ title, mono = false, onClose, closeLabel = "Close details", cover = false, children }) {
  ensureCss();
  return (
    <aside data-graph-drawer="" aria-label={typeof title === "string" ? title : undefined}
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 3, boxSizing: "border-box",
        width: cover ? "100%" : "var(--tasty-graph-drawer-width)", display: "flex", flexDirection: "column",
        background: "var(--tasty-dag-detail-bg)", fontFamily: "var(--tasty-font-ui)", cursor: "default",
        borderLeft: cover ? "none" : "var(--tasty-border-width) solid var(--tasty-dag-detail-border)",
        boxShadow: cover ? "none" : "var(--tasty-shadow-popover)" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", boxSizing: "border-box",
        height: "var(--tasty-graph-drawer-head-height)", padding: "0 var(--tasty-space-xs) 0 var(--tasty-dag-detail-padding)",
        borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: mono ? "var(--tasty-font-mono)" : "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-body)",
          fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{title}</span>
        <IconButton size="sm" aria-label={closeLabel} title={closeLabel} onClick={onClose}><Icon name="close" /></IconButton>
      </div>
      <div className="tasty-scroll" style={{ flex: 1, minHeight: 0, overflow: "auto", boxSizing: "border-box",
        padding: "var(--tasty-dag-detail-padding)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)" }}>
        {children}
      </div>
    </aside>
  );
}

// label · value. mono for ids, paths and codes; wrap for a path that must be read whole.
function DrawerRow({ k, v, mono, wrap }) {
  return (
    <>
      <dt style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{k}</dt>
      <dd style={{ margin: 0, minWidth: 0, overflow: "hidden", textOverflow: wrap ? "clip" : "ellipsis", whiteSpace: wrap ? "normal" : "nowrap",
        wordBreak: wrap ? "break-all" : "normal",
        fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)",
        fontFamily: mono ? "var(--tasty-font-mono)" : "var(--tasty-font-ui)" }}>{v}</dd>
    </>
  );
}
function DrawerRows({ children }) {
  return (
    <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "var(--tasty-space-md)",
      rowGap: "var(--tasty-space-xs)", alignItems: "baseline" }}>{children}</dl>
  );
}
function DrawerCaption({ children }) {
  return <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{children}</span>;
}

// ── Strip ───────────────────────────────────────────────────────────
// warning = the cycle notice's recipe (refresh failed, remote disconnected); info = neutral band.
// action: one small button at the right end (Reconnect on the mirror banner); the text yields first.
function GraphStrip({ tone = "warning", action = null, children }) {
  const warn = tone === "warning";
  return (
    <div role="status" style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", boxSizing: "border-box",
      minHeight: "var(--tasty-dag-cycle-height)", padding: "0 var(--tasty-space-md)",
      background: warn ? "var(--tasty-dag-cycle-bg)" : "var(--tasty-dag-chrome-bg)",
      color: warn ? "var(--tasty-dag-cycle-fg)" : "var(--tasty-text-secondary)",
      borderBottom: `var(--tasty-border-width) solid ${warn ? "var(--tasty-dag-cycle-border)" : "var(--tasty-separator)"}`,
      fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-caption)" }}>
      <span style={{ display: "inline-flex", flex: "none", color: warn ? "inherit" : "var(--tasty-text-muted)" }}>
        <Icon name={warn ? "alertTriangle" : "info"} size="var(--tasty-icon-size-sm)" />
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={typeof children === "string" ? children : undefined}>{children}</span>
      {action && <span style={{ flex: "none", display: "inline-flex" }}>{action}</span>}
    </div>
  );
}

// ── Canvas ──────────────────────────────────────────────────────────
// g        { pos: {id: {x, y}}, width, height }   — layout, computed from shape only
// nodes    [{ id, ... }]                          — painted by renderNode(node, lod, selected)
// edges    [{ key, from, to, color, dash, dim, s, t, td }] — s/t are the attach points
// drawer   (cover) => node | null                  — the open drawer, or null
// dirFixed the flow direction cannot change: the direction button shows disabled, with dirTitle
function GraphCanvas({ g, nodes, edges, renderNode, colorOf, dir = "td", onDirChange, dirFixed = false, dirTitle,
  selected, onSelect, minimap = true, chrome = true, drawer = null, banner = null, still = false, initialZoom, style }) {
  ensureCss();
  const ref = React.useRef(null);
  const [vp, setVp] = React.useState({ w: 800, h: 480 });
  const [z, setZ] = React.useState(1);
  const [o, setO] = React.useState({ x: 16, y: 16 });
  const drag = React.useRef(null);
  const fitted = React.useRef("");
  const [geo, setGeo] = React.useState({ drawerW: DRAWER_W, coverBelow: COVER_BELOW, reveal: REVEAL });

  const fit = React.useCallback((box) => {
    const b = box || vp;
    const pad = 16;
    const k = clamp(Math.min((b.w - pad * 2) / g.width, (b.h - pad * 2) / g.height), Z_MIN, 1);
    const kk = initialZoom ? initialZoom : k;
    let x = Math.max(pad, (b.w - g.width * kk) / 2);
    // fit with the drawer already open (a selection carried in) also keeps the selected card in sight
    if (drawer && b.w >= geo.coverBelow && selected && g.pos[selected]) {
      const right = x + (g.pos[selected].x + NODE_W) * kk, limit = b.w - geo.drawerW - geo.reveal;
      if (right > limit) x -= right - limit;
    }
    setZ(kk);
    setO({ x, y: Math.max(pad, (b.h - g.height * kk) / 2) });
  }, [g.width, g.height, g.pos, vp, initialZoom, drawer, selected, geo]);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (Math.abs(r.width - vp.w) > 1 || Math.abs(r.height - vp.h) > 1) setVp({ w: r.width, h: r.height });
    const next = { drawerW: tokPx(el, "--tasty-graph-drawer-width", DRAWER_W), coverBelow: tokPx(el, "--tasty-graph-drawer-cover-below", COVER_BELOW),
      reveal: tokPx(el, "--tasty-graph-reveal-margin", REVEAL) };
    if (next.drawerW !== geo.drawerW || next.coverBelow !== geo.coverBelow || next.reveal !== geo.reveal) setGeo(next);
  });

  const shapeKey = `${nodes.length}:${g.width}x${g.height}:${dir}`;
  React.useEffect(() => {
    const key = `${shapeKey}:${Math.round(vp.w / 32)}:${Math.round(vp.h / 32)}`;
    if (fitted.current === key || vp.w < 2) return;
    fitted.current = key;
    fit(vp);
  }, [shapeKey, vp, fit]);

  const open = !!drawer;
  const cover = open && vp.w < geo.coverBelow;

  // Drawer slide (graph-drawer-motion 120, ease-ui): on open the slot mounts off the right edge
  // ("in") and moves into place on the next frame ("open"); on close it slides back out ("out")
  // with the content it last showed, then unmounts. A canvas that starts with a selection starts
  // "open", and a still frame never slides. Switching the selection swaps the body in place.
  const lastDrawer = React.useRef(drawer);
  if (drawer) lastDrawer.current = drawer;
  const [slide, setSlide] = React.useState(drawer ? "open" : "gone");
  React.useLayoutEffect(() => {
    if (open && (slide === "gone" || slide === "out")) setSlide(still ? "open" : "in");
    else if (!open && (slide === "open" || slide === "in")) setSlide(still ? "gone" : "out");
  }, [open, slide, still]);
  React.useEffect(() => {
    if (slide === "in") {
      let id2 = 0;
      const id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setSlide((v) => (v === "in" ? "open" : v))); });
      return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
    }
    if (slide === "out") {
      const t = setTimeout(() => setSlide((v) => (v === "out" ? "gone" : v)), tokMs(ref.current, "--tasty-graph-drawer-motion", 120));
      return () => clearTimeout(t);
    }
    return undefined;
  }, [slide]);
  const slotCover = vp.w < geo.coverBelow;
  const covered = open && !cover ? geo.drawerW : 0;

  // Keep the selected card in sight: when the drawer opens over it, pan just enough to put the
  // card the reveal margin (graph-reveal-margin) left of the drawer edge. Pan only — never zoom, never re-layout.
  React.useEffect(() => {
    if (!open || cover || !selected || !g.pos[selected]) return;
    const p = g.pos[selected];
    const right = o.x + (p.x + NODE_W) * z;
    const limit = vp.w - geo.drawerW - geo.reveal;
    if (right > limit) setO((prev) => ({ ...prev, x: prev.x - (right - limit) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, open, cover]);

  const zoomBy = (steps, cx, cy) => {
    setZ((prev) => {
      const next = clamp(+(prev + steps * Z_STEP).toFixed(2), Z_MIN, Z_MAX);
      if (next === prev) return prev;
      const px = cx == null ? vp.w / 2 : cx, py = cy == null ? vp.h / 2 : cy;
      setO((prevO) => ({ x: px - ((px - prevO.x) / prev) * next, y: py - ((py - prevO.y) / prev) * next }));
      return next;
    });
  };
  // The drawer and the chrome are not canvas: a wheel over them scrolls them (or nothing), never pans or zooms.
  const offCanvas = (e) => !!(e.target.closest && (e.target.closest("[data-graph-drawer]") || e.target.closest("[data-graph-chrome]")));
  const onWheel = (e) => {
    if (offCanvas(e)) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const r = ref.current.getBoundingClientRect();
      zoomBy(e.deltaY > 0 ? -1 : 1, e.clientX - r.left, e.clientY - r.top);
    } else {
      setO((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };
  const onMouseDown = (e) => {
    if (offCanvas(e)) return;
    const onNode = e.target.closest && e.target.closest("[data-dag-node]");
    if (onNode && e.button !== 1) return;
    drag.current = { x: e.clientX, y: e.clientY, o, moved: false, empty: !onNode };
    e.preventDefault();
  };
  React.useEffect(() => {
    const move = (e) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
      setO({ x: drag.current.o.x + dx, y: drag.current.o.y + dy });
    };
    // A click on the empty canvas (no drag) clears the selection and closes the drawer.
    const up = () => { if (drag.current && drag.current.empty && !drag.current.moved && onSelect) onSelect(null); drag.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [onSelect]);

  const lod = lodOf(z);
  const showMap = minimap && vp.w - covered >= MINIMAP_MIN;
  const compactChrome = vp.w - covered < 400;
  const td = dir !== "lr";

  return (
    <div ref={ref} onWheel={onWheel} onMouseDown={onMouseDown} className={still ? "tasty-graph-still" : undefined}
      style={{ position: "relative", flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden",
        cursor: "grab", background: "var(--tasty-dag-canvas-bg)",
        backgroundImage: "radial-gradient(var(--tasty-dag-canvas-dot) var(--tasty-dag-canvas-dot-size), transparent 0)",
        backgroundSize: "var(--tasty-dag-canvas-dot-gap) var(--tasty-dag-canvas-dot-gap)", ...style }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: g.width, height: g.height,
        transform: `translate(${o.x}px, ${o.y}px) scale(${z})`, transformOrigin: "0 0" }}>
        <svg width={g.width} height={g.height} style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }} aria-hidden="true">
          {edges.map((e) => {
            const hot = selected && (selected === e.from || selected === e.to);
            const color = hot ? "var(--tasty-dag-edge-highlight)" : e.dim ? "var(--tasty-dag-edge-dim)" : e.color;
            const t = e.t;
            const head = e.td
              ? `${t.x - 4},${t.y - 7} ${t.x + 4},${t.y - 7} ${t.x},${t.y}`
              : `${t.x - 7},${t.y - 4} ${t.x - 7},${t.y + 4} ${t.x},${t.y}`;
            return (
              <g key={e.key}>
                <path d={elbow(e.s, e.t, e.td, 4)} fill="none" stroke={color} strokeWidth={e.width || 1} style={e.dash ? { strokeDasharray: e.dash } : undefined} />
                <polygon points={head} fill={color} />
              </g>
            );
          })}
        </svg>
        {nodes.map((n) => g.pos[n.id] && (
          <span key={n.id} data-dag-node={n.id} style={{ position: "absolute", left: g.pos[n.id].x, top: g.pos[n.id].y }}>
            {renderNode(n, lod, selected === n.id)}
          </span>
        ))}
      </div>

      {banner && <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }}>{banner}</div>}

      {chrome && (
        <div data-graph-chrome="" className="tasty-graph-chrome" style={{ position: "absolute", zIndex: 2,
          right: covered ? `calc(var(--tasty-graph-drawer-width) + var(--tasty-dag-chrome-inset))` : "var(--tasty-dag-chrome-inset)",
          bottom: "var(--tasty-dag-chrome-inset)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--tasty-space-sm)" }}>
          {showMap && <Minimap g={g} dag={{ nodes }} colorOf={colorOf} z={z} ox={o.x} oy={o.y} vw={vp.w} vh={vp.h} dir={dir} />}
          <ZoomCluster z={z} compact={compactChrome} onZoom={(s) => zoomBy(s)} onFit={() => fit()}
            dir={dir} dirDisabled={dirFixed} dirTitle={dirTitle} onDir={() => onDirChange && onDirChange(td ? "lr" : "td")} />
        </div>
      )}
      {lod !== "full" && (
        <div data-graph-chrome="" style={{ position: "absolute", zIndex: 2, left: "var(--tasty-dag-chrome-inset)", bottom: "var(--tasty-dag-chrome-inset)",
          padding: "0 var(--tasty-space-sm)", height: "var(--tasty-dag-runner-height)", display: "inline-flex", alignItems: "center",
          borderRadius: "var(--tasty-radius-sm)", border: "var(--tasty-border-width) solid var(--tasty-dag-chrome-border)",
          background: "var(--tasty-dag-chrome-bg)", fontFamily: "var(--tasty-font-label)",
          fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>
          {lod === "compact" ? "names only — zoom in for status" : "status blocks — zoom in for names"}
        </div>
      )}
      {slide !== "gone" && lastDrawer.current && (
        <div className="tasty-graph-drawer-slot" style={{ position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 3,
          width: slotCover ? "100%" : "var(--tasty-graph-drawer-width)",
          transform: slide === "open" ? "none" : "translateX(100%)", pointerEvents: slide === "open" ? "auto" : "none" }}>
          {lastDrawer.current(slotCover)}
        </div>
      )}
    </div>
  );
}

// ── Push ────────────────────────────────────────────────────────────
// Screens sit side by side; index picks the one shown. Going forward the track moves left
// (the new screen comes in from the right); back moves it right. Earlier screens stay mounted,
// so a screen keeps its zoom, pan, selection and open drawer when you come back to it.
// index may be fractional to draw a frozen middle frame (still = no transition).
function GraphPush({ index = 0, still = false, children }) {
  ensureCss();
  const screens = React.Children.toArray(children).filter(Boolean);
  return (
    <div style={{ position: "relative", flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden", display: "flex" }}>
      <div className={still ? "tasty-graph-push__track tasty-graph-still" : "tasty-graph-push__track"}
        style={{ display: "flex", width: "100%", minWidth: 0, transform: `translateX(${-index * 100}%)` }}>
        {screens.map((s, i) => (
          <div key={i} aria-hidden={Math.round(index) !== i || undefined} inert={Math.round(index) !== i ? "" : undefined}
            style={{ flex: "0 0 100%", minWidth: 0, display: "flex", flexDirection: "column" }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

// ── Child graph data ────────────────────────────────────────────────
// Six liveness states. Each borrows a DAG state look, so the card, the minimap and the
// contrast contract are the DAG node's; only the glyph and label are the child's own.
//   active      ◑  running look           (working)
//   idle        ❯  ready look             (at the prompt — the prompt glyph)
//   needs_input !  awaiting-input look    (stopped on a person, as in the DAG)
//   stale       ◦  waiting look           (quiet too long — a guess, so neutral, not a warning)
//   exited      −  cancelled look, dimmed (process ended; the surface is still open)
//   unknown     ?  unknown look           (remote connection lost)
const CHILD_STATE = {
  active:      { glyph: "◑", tone: "running",   key: "child_graph.state.active" },
  idle:        { glyph: "❯", tone: "ready",     key: "child_graph.state.idle" },
  needs_input: { glyph: "!",      tone: "awaiting",  key: "child_graph.state.needs_input" },
  stale:       { glyph: "◦", tone: "waiting",   key: "child_graph.state.stale" },
  exited:      { glyph: "−", tone: "cancelled", key: "child_graph.state.exited", dim: true },
  unknown:     { glyph: "?",      tone: "unknown",   key: "child_graph.state.unknown" },
};
const CHILD_STATE_ORDER = ["active", "idle", "needs_input", "stale", "exited", "unknown"];
function childTone(state) {
  const s = CHILD_STATE[state] || CHILD_STATE.unknown;
  if (s.tone === "awaiting") return { ...s, tok: "var(--tasty-dag-phase-awaiting)", bg: "var(--tasty-dag-phase-awaiting-bg)", lbl: "var(--tasty-dag-phase-awaiting-label)", plain: false };
  return { ...s, tok: sTok(s.tone), bg: sBg(s.tone), lbl: sLabel(s.tone), plain: s.tone === "waiting" || s.tone === "cancelled" };
}
const childColor = (n) => (n.kind && n.kind !== "surface" ? "var(--tasty-dag-minimap-node-dim)" : CHILD_STATE[n.state]?.dim ? "var(--tasty-dag-minimap-node-dim)" : childTone(n.state).tok);

// Tidy left → right tree: depth = column, leaves take rows in order, a parent centres on its
// children. Shape only (ids + parent), never state, so a poll repaints without moving a card.
// CHIP_ROOM above row 0 keeps the base chip inside the fitted frame.
const LAYER_GAP = 32, SIB_GAP = 24, CHIP_ROOM = 20;
function childLayout(nodes) {
  const ids = new Set(nodes.map((n) => n.id));
  const kids = {};
  const roots = [];
  for (const n of nodes) {
    if (n.parent && ids.has(n.parent)) (kids[n.parent] = kids[n.parent] || []).push(n.id);
    else roots.push(n.id);
  }
  const pos = {};
  let row = 0, maxDepth = 0;
  const place = (id, d) => {
    maxDepth = Math.max(maxDepth, d);
    const ks = kids[id] || [];
    let y;
    if (!ks.length) { y = CHIP_ROOM + row * (NODE_H + SIB_GAP); row++; }
    else { ks.forEach((k) => place(k, d + 1)); y = (pos[ks[0]].y + pos[ks[ks.length - 1]].y) / 2; }
    pos[id] = { x: d * (NODE_W + LAYER_GAP), y };
  };
  roots.forEach((r) => place(r, 0));
  return { pos, width: (maxDepth + 1) * NODE_W + maxDepth * LAYER_GAP, height: CHIP_ROOM + row * NODE_H + Math.max(0, row - 1) * SIB_GAP };
}
// One relation, parent → child: the DAG's depends_on edge (solid neutral, arrow at the child),
// accent when it touches the selected card. A parent and child on different machines take the same line.
function childEdges(nodes, g) {
  const ids = new Set(nodes.map((n) => n.id));
  return nodes.filter((n) => n.parent && ids.has(n.parent) && g.pos[n.parent] && g.pos[n.id]).map((n) => {
    const a = g.pos[n.parent], b = g.pos[n.id];
    return { key: `${n.parent}->${n.id}`, from: n.parent, to: n.id, td: false,
      s: { x: a.x + NODE_W, y: a.y + NODE_H / 2 }, t: { x: b.x, y: b.y + NODE_H / 2 },
      color: "var(--tasty-dag-edge-depends)", dash: null };
  });
}
// Base line only (checkbox off): ancestors to the root + every descendant of the base.
// Full tree (checkbox on): everything reachable from the base's root.
function childVisible(nodes, baseId, full) {
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  let root = baseId;
  while (by[root] && by[root].parent && by[by[root].parent]) root = by[root].parent;
  const under = (id, acc) => { acc.add(id); nodes.filter((n) => n.parent === id).forEach((n) => under(n.id, acc)); return acc; };
  if (full) { const all = under(root, new Set()); return nodes.filter((n) => all.has(n.id)); }
  const keep = under(baseId, new Set());
  for (let p = by[baseId] && by[baseId].parent; p && by[p]; p = by[p].parent) keep.add(p);
  return nodes.filter((n) => keep.has(n.id));
}

export { GraphCanvas, GraphDrawer, DrawerRow, DrawerRows, DrawerCaption, GraphStrip, GraphPush, lodOf, CHILD_STATE, CHILD_STATE_ORDER, childTone, childColor, childLayout, childEdges, childVisible };
