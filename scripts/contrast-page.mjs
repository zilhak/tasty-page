/**
 * What the contrast check runs inside a page. pageLib is serialised into the page, so it reads nothing from this module.
 * Colors round per channel to 8 bits and a translucent layer composites source-over, as RULES.md says.
 */
export function pageLib() {
  const selectParts = (rows, parts) => parts === null ? rows : rows.filter((row) => parts.includes(row.part));
  const validateParts = (value, rows) => {
    if (value === null) return { parts: null };
    const invalidFormat = "expected a JSON array of part names";
    let parts;
    try {
      parts = JSON.parse(value);
    } catch {
      return { error: invalidFormat };
    }
    if (!Array.isArray(parts) || parts.some((part) => typeof part !== "string")) return { error: invalidFormat };
    if (parts.length === 0) return { error: "expected at least one part name" };
    const unknown = parts.filter((part) => !rows.some((row) => row.part === part));
    if (unknown.length > 0) return { error: `unknown parts ${JSON.stringify(unknown)}` };
    return { parts };
  };
  const expectedTheme = (el, theme) => {
    const scoped = el.closest("[data-theme]");
    if (scoped === null || scoped === el.ownerDocument.documentElement) return theme;
    return scoped.getAttribute("data-theme") === "latte" ? "latte" : "mocha";
  };

  const parse = (s) => {
    let m = /rgba?\(([^)]+)\)/.exec(s);
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; }
    m = /color\(srgb ([^)]+)\)/.exec(s);
    if (m) { const q = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [q[0] * 255, q[1] * 255, q[2] * 255, q[3] === undefined ? 1 : q[3]]; }
    m = /^#([0-9a-f]{6})(?:([0-9a-f]{2})|@([+-]?(?:[0-9]*\.)?[0-9]+(?:e[+-]?[0-9]+)?))?$/i.exec(s);
    if (m) {
      const alpha = m[3] !== undefined ? Number(m[3]) : m[2] ? parseInt(m[2], 16) / 255 : 1;
      if (alpha >= 0 && alpha <= 1) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), alpha];
    }
    return null;
  };
  const over = (t, u) => [0, 1, 2].map((i) => Math.floor(t[i] * t[3] + u[i] * (1 - t[3]) + 0.5)).concat(1);
  const lum = (c) => {
    const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const near = (a, b) => [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= 1);

  const overlays = (e) => ["::before", "::after"].map((pseudo) => {
    const p = getComputedStyle(e, pseudo);
    if (p.content === "none" || p.position !== "absolute") return null;
    // A bar or a ring is not the ground. Only a pseudo-element that covers its box is.
    const box = e.getBoundingClientRect();
    if (parseFloat(p.width) < box.width - 1 || parseFloat(p.height) < box.height - 1) return null;
    const c = parse(p.backgroundColor);
    return c && c[3] > 0 ? c : null;
  }).filter(Boolean);
  const opacityOf = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  // Content the browser does not render is not on screen, though its box and computed style are still there: a closed
  // details body sits in a slot whose content-visibility is hidden, and its color can lag behind a theme switch.
  // checkVisibility() with no options sees that; opacity and visibility are judged below, since opacity is composited.
  const rendered = (el) => typeof el.checkVisibility !== "function" || el.checkVisibility();
  // A closed details shows its first summary only. inClosedSlot: el is such a details, so the text right inside it is in
  // the hidden slot. inClosedBody: el sits in the body of a closed details, outside that summary.
  const isClosedDetails = (e) => e.tagName.toLowerCase() === "details" && e.getAttribute("open") === null;
  const inClosedSlot = (el) => isClosedDetails(el);
  const inClosedBody = (el) => {
    for (let c = el, p = el.parentElement; p; c = p, p = p.parentElement) {
      if (!isClosedDetails(p)) continue;
      const summary = [...p.children].find((k) => k.tagName.toLowerCase() === "summary");
      if (c !== summary) return true;
    }
    return false;
  };
  const visible = (el) => {
    if (!rendered(el)) return false;
    const s = getComputedStyle(el);
    if (s.visibility !== "visible" || s.display === "none") return false;
    // Fully transparent is not on screen. Any other opacity is measured, composited.
    if (opacityOf(el) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // The paints of one shape: its stroke, then its fill (a line has no fill), each through its own stroke-opacity or
  // fill-opacity. A shape that is hidden, not rendered, fully transparent, has no box, or sits in a defs-like container paints nothing.
  // paint names the one property to read ("stroke" or "fill"), so the other is neither read nor counted as a paint server.
  const SHAPES = "path, circle, rect, line, polyline, polygon, ellipse, use, text";
  const isShape = (el) => el.namespaceURI === "http://www.w3.org/2000/svg" && el.matches(SHAPES);
  const shapeShown = (shape) => {
    if (shape.closest("defs, clipPath, mask, symbol, pattern, marker") || !rendered(shape)) return false;
    const s = getComputedStyle(shape);
    if (s.display === "none" || s.visibility !== "visible" || opacityOf(shape) === 0) return false;
    const r = shape.getBoundingClientRect();
    return !(r.width === 0 && r.height === 0);
  };
  const shapeInks = (shape, onPaintServer, paint) => {
    if (!shapeShown(shape)) return [];
    const s = getComputedStyle(shape);
    const inks = [];
    const add = (value, alpha) => {
      if (value === "none") return;
      if (value.startsWith("url(")) { onPaintServer(); return; }
      const ink = parse(value);
      if (ink && ink[3] * alpha > 0) inks.push({ shape, ink: [ink[0], ink[1], ink[2], ink[3] * alpha] });
    };
    if (paint !== "fill" && s.strokeWidth !== "0px") add(s.stroke, Number(s.strokeOpacity));
    if (paint !== "stroke" && shape.tagName.toLowerCase() !== "line") add(s.fill, Number(s.fillOpacity));
    return inks;
  };
  // Each stroke and fill the svg itself paints, in document order. A nested svg reports its own. What a defs entry or a
  // use target holds is not walked: a use counts through its own inherited paint.
  const svgInks = (svg, onPaintServer, paint) => [...svg.querySelectorAll(SHAPES)]
    .filter((shape) => shape.closest("svg") === svg)
    .flatMap((shape) => shapeInks(shape, onPaintServer, paint));
  // The paints a row reads on the element it picked: an svg reads its own shapes, a shape reads itself, and any other
  // element reads every svg inside it, nested ones included, in document order.
  const rowInks = (el, onPaintServer, paint) => {
    if (el.tagName.toLowerCase() === "svg") return svgInks(el, onPaintServer, paint);
    if (isShape(el)) return shapeInks(el, onPaintServer, paint);
    return [...el.querySelectorAll("svg")].flatMap((svg) => svgInks(svg, onPaintServer, paint));
  };
  // Whether a row can read the element: a shape is on screen with a box in one direction, like a horizontal line.
  const rowShown = (el) => (isShape(el) ? shapeShown(el) : visible(el));
  const inkOn = (ink, el, ground) => over([ink[0], ink[1], ink[2], ink[3] * opacityOf(el)], ground);

  // The ground under an element as every value it can read: a gradient contributes each of its stops, so the lowest
  // ratio across the result is the lower end. A picture has no value, so it is reported.
  const STOP = /rgba?\([^)]+\)|color\(srgb [^)]+\)/g;
  const groundsOf = (el, includeSelf = true) => {
    const layers = [];
    let picture = false;
    for (let e = includeSelf ? el : el.parentElement; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      overlays(e).forEach((c) => layers.push([c]));
      if (s.backgroundImage !== "none") {
        if (s.backgroundImage.includes("url(")) picture = true;
        const stops = (s.backgroundImage.match(STOP) || []).map(parse).filter(Boolean);
        if (stops.length) layers.push(stops);
      }
      const c = parse(s.backgroundColor);
      if (c && c[3] > 0) { layers.push([c]); if (c[3] >= 1) break; }
    }
    let grounds = [[255, 255, 255, 1]];
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      const next = new Map();
      for (const g of grounds) for (const layer of layers[i]) { const v = over(layer, g); next.set(hex(v), v); }
      grounds = [...next.values()];
    }
    return { grounds, picture };
  };
  const lowest = (ink, el, grounds) => grounds.reduce((best, ground) => {
    const got = inkOn(ink, el, ground);
    const rt = ratio(got, ground);
    return !best || rt < best.ratio ? { ratio: rt, got, ground } : best;
  }, null);

  // The dashed annotation marks a specimen draws only to explain it (RULES.md "Annotation marks"): an outline or a border
  // side that is dashed, wider than 0 and painted in the color --tasty-specimen-annotation-border resolves to on that
  // element. The token resolves through a child probe's computed color, because the custom property itself can stay a
  // color-mix() string. A mark is one element however many sides it dashes. An outline with a negative offset stands on
  // the element's own fill, an outline outside on the ground under the element. A border stands on the element's own
  // fill when the background reaches under it (background-clip border-box), else on the ground under the element.
  // Each paint is judged at 3:1 on its ground, a border on the side with the lowest ratio. A ground that is a picture, or
  // a gradient of more than one color, is counted, not judged: a line across it meets colors no stop holds.
  // The ground is read layer by layer (markGrounds): under a border only the background layers whose own clip is
  // border-box count, and a layer that surely covers the line in opaque color hides every layer and ancestor below it.
  const MARK_TOKEN = "var(--tasty-specimen-annotation-border)";
  const SIDES = ["Top", "Right", "Bottom", "Left"];
  const sameColor = (a, b) => near(a, b) && Math.abs(a[3] - b[3]) < 0.01;
  const markToken = (el) => {
    const probe = el.ownerDocument.createElement("span");
    probe.style.color = MARK_TOKEN;
    el.appendChild(probe);
    try {
      return parse(getComputedStyle(probe).color);
    } finally {
      el.removeChild(probe);
    }
  };
  // A computed list split at its top-level commas, one entry per layer. A parenthesis inside a quoted string, as a data
  // URL can hold, does not nest.
  const splitLayers = (v) => {
    const out = [];
    let depth = 0, quote = "", escaped = false, cur = "";
    for (const ch of v) {
      if (escaped) escaped = false;
      else if (quote) { if (ch === "\\") escaped = true; else if (ch === quote) quote = ""; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      if (ch === "," && depth === 0 && !quote) { out.push(cur.trim()); cur = ""; } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const listAt = (v, i, fallback) => { const l = v ? splitLayers(v) : [fallback]; return l[i % l.length]; };
  const GRADIENT = /^(repeating-)?(linear|radial|conic)-gradient$/;
  // What one element paints, top layer first: a covering pseudo-element, each background image, then the background
  // color. A picture is null; any other layer is its colors and whether it hides what lies below it. underBorder keeps
  // only the layers clipped to the border box (the color takes the clip of the last layer, as CSS does) and leaves out
  // the element's own pseudo-elements, which a box inset from the border does not put under it. An image layer hides
  // only when it surely covers the line in opaque color: clipped to the border box, auto-sized and repeated, and with
  // every color in it read and opaque. A color this reads no stop from (oklch(), say) leaves the layer not hiding.
  const markLayers = (e, underBorder) => {
    const s = getComputedStyle(e);
    const images = s.backgroundImage && s.backgroundImage !== "none" ? splitLayers(s.backgroundImage) : [];
    const clipAt = (i) => listAt(s.backgroundClip, i, "border-box");
    const reaches = (i) => !underBorder || clipAt(i) === "border-box";
    const out = underBorder ? [] : overlays(e).map((c) => ({ colors: [c], hides: c[3] >= 1 }));
    images.forEach((img, i) => {
      if (img === "none" || !reaches(i)) return;
      if (img.includes("url(")) { out.push(null); return; }
      const colors = (img.match(STOP) || []).map(parse).filter(Boolean);
      if (!colors.length) return;
      const read = [...img.replace(STOP, "").matchAll(/([a-z-]+)\(/g)].every((m) => GRADIENT.test(m[1]));
      const covers = clipAt(i) === "border-box" && /^auto( auto)?$/.test(listAt(s.backgroundSize, i, "auto")) && /^repeat( repeat)?$/.test(listAt(s.backgroundRepeat, i, "repeat"));
      out.push({ colors, hides: read && covers && colors.every((c) => c[3] >= 1) });
    });
    const c = parse(s.backgroundColor);
    if (c && c[3] > 0 && reaches(Math.max(images.length - 1, 0))) out.push({ colors: [c], hides: c[3] >= 1 });
    return out;
  };
  // The ground under a mark: the element's own layers when own (only those reaching under a border for a border), then
  // its ancestors', down to the first layer that hides the rest. Under an element that is not fully opaque, or one
  // inside such an element, what lies below shows through, so no layer there hides it. A picture above that layer
  // makes the ground a picture.
  const markGrounds = (el, own, border) => {
    const layers = [];
    let picture = false;
    walk: for (let e = own ? el : el.parentElement; e; e = e.parentElement) {
      const opaque = opacityOf(e) === 1;
      for (const layer of markLayers(e, border && e === el)) {
        if (layer === null) { picture = true; continue; }
        layers.push(layer.colors);
        if (layer.hides && opaque) break walk;
      }
    }
    let grounds = [[255, 255, 255, 1]];
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      const next = new Map();
      for (const g of grounds) for (const layer of layers[i]) { const v = over(layer, g); next.set(hex(v), v); }
      grounds = [...next.values()];
    }
    return { grounds, picture };
  };
  const measureMarks = (scope, left, label) => {
    const res = { marks: 0, judged: 0, picture: 0, below: [] };
    for (const el of scope.querySelectorAll("*")) {
      const s = getComputedStyle(el);
      const paints = [];
      if (s.outlineStyle === "dashed" && parseFloat(s.outlineWidth) > 0) paints.push({ name: "outline", colors: [s.outlineColor], own: parseFloat(s.outlineOffset) < 0 });
      const sides = SIDES.filter((d) => s[`border${d}Style`] === "dashed" && parseFloat(s[`border${d}Width`]) > 0);
      if (paints.length === 0 && sides.length === 0) continue;
      if (left(el) || !visible(el)) continue;
      const token = markToken(el);
      if (!token) continue;
      const matched = paints.filter((p) => { const c = parse(p.colors[0]); return c && sameColor(c, token); });
      const borderSides = sides.filter((d) => { const c = parse(s[`border${d}Color`]); return c && sameColor(c, token); });
      if (borderSides.length) matched.push({ name: borderSides.map((d) => d.toLowerCase()).join(","), colors: borderSides.map((d) => s[`border${d}Color`]), own: true, border: true });
      if (matched.length === 0) continue;
      res.marks += 1;
      for (const m of matched) {
        const { grounds, picture } = markGrounds(el, m.own, m.border === true);
        if (picture || grounds.length > 1) { res.picture += 1; continue; }
        res.judged += 1;
        const low = m.colors.map((c) => lowest(parse(c), el, grounds)).reduce((x, y) => (y.ratio < x.ratio ? y : x));
        if (low.ratio < 3) res.below.push({ kind: "edge", ratio: +low.ratio.toFixed(2), grade: 3, got: hex(low.got), ground: hex(low.ground), spec: label(el), text: `annotation ${m.name}` });
      }
    }
    return res;
  };

  // A row that reads several paints: every paint is judged on its own lowest ground, against the token on that ground
  // and against the grade. inks are already composited through the opacity above each shape. want is the token value
  // (null when the row has none to compare) and grade is null when the row has none. The record of a token failure
  // is the first paint off the token; the record of a grade failure, or of a pass, is the paint with the lowest ratio.
  const judgeInks = (inks, grounds, want, grade) => {
    let off = 0, first = null, worst = null;
    for (const ink of inks) {
      const low = grounds.reduce((best, ground) => {
        const got = over(ink, ground);
        const rt = ratio(got, ground);
        return !best || rt < best.ratio ? { ratio: rt, got, ground } : best;
      }, null);
      if (want && !near(low.got, over(want, low.ground))) { off += 1; if (!first) first = low; }
      if (!worst || low.ratio < worst.ratio) worst = low;
    }
    const show = (v) => v && { ratio: +v.ratio.toFixed(2), got: hex(v.got), ground: hex(v.ground) };
    return {
      inks: inks.length, off, tokenOk: want ? off === 0 : null,
      gradeOk: grade === null || grade === undefined || !worst || worst.ratio >= grade,
      mismatch: show(first), worst: show(worst),
    };
  };

  // A gallery contract row whose part is an svg: the row's status and the paint it reports. No paint reports none.
  const judgeSvgPart = (el, paint, ground, want, grade, onPaintServer) => {
    const inks = rowInks(el, onPaintServer, paint);
    if (inks.length === 0) return { status: "mismatch", got: "none", ground: hex(ground), inks: 0, off: 0 };
    const j = judgeInks(inks.map(({ ink, shape }) => [ink[0], ink[1], ink[2], ink[3] * opacityOf(shape)]), [ground], want, grade);
    const status = j.off ? "mismatch" : j.gradeOk ? "ok" : "below";
    return { ...(j.off ? j.mismatch : j.worst), status, ...(status === "ok" ? {} : { inks: j.inks, off: j.off }) };
  };

  const outsideGallery = (el) => el.closest("[data-gallery-page]") === null;
  const where = (el) => {
    const name = (e) => e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/)[0] : "");
    return el.parentElement ? `${name(el.parentElement)} > ${name(el)}` : name(el);
  };

  // A selector row from the rule file, without its state.
  const alternatives = (selector) => {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of selector) {
      if (ch === "(" || ch === "[") depth += 1;
      if (ch === ")" || ch === "]") depth -= 1;
      if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const pseudoOf = (alt) => (/::(before|after|placeholder)$/.exec(alt) || [])[0] || null;
  const bare = (alt) => alt.replace(/::(before|after|placeholder)$/, "").replace(/:(hover|active|focus-visible|focus)/g, "");
  const pick = (alt) => [...document.querySelectorAll(bare(alt))].filter(outsideGallery);

  // The paint a row names on an element, and what it stands on.
  const paintOf = (row, el, pseudo) => {
    const cs = getComputedStyle(el, pseudo || undefined);
    const edgeInk = () => {
      if (row.id === "focus") return parse(el.tagName === "INPUT" ? cs.borderTopColor : cs.outlineColor);
      for (const side of ["Top", "Bottom", "Left", "Right"]) if (parseFloat(cs[`border${side}Width`]) > 0) return parse(cs[`border${side}Color`]);
      return null;
    };
    if (row.kind === "edge") return { ink: edgeInk(), ground: groundsOf(el, false) };
    let ink;
    if (row.kind === "glyph") {
      if (pseudo) ink = parse(cs.borderLeftColor);
      else {
        const inks = rowInks(el, () => {});
        if (inks.length) return { inks, ground: groundsOf(el) };
        ink = parse(cs.color);
      }
    } else if (row.kind === "mark" && !el.textContent.trim()) ink = parse(cs.backgroundColor);
    else ink = parse(cs.color);
    const ground = groundsOf(el);
    const own = pseudo ? parse(cs.backgroundColor) : null;
    if (own && own[3] > 0) ground.grounds = ground.grounds.map((g) => over(own, g));
    return { ink, ground };
  };

  const judgeRow = (row, el, pseudo, tokens, theme) => {
    const { ink, inks, ground } = paintOf(row, el, pseudo);
    const want = tokens[row.token] && tokens[row.token][theme] ? parse(tokens[row.token][theme]) : null;
    if (inks) {
      // Every paint of the svg counts. A below record reads the lowest paint, a wrong ink record the first one off.
      const j = judgeInks(inks.map(({ ink: i, shape }) => [i[0], i[1], i[2], i[3] * opacityOf(shape)]), ground.grounds, want, row.grade);
      const shown = j.off ? j.mismatch : j.worst;
      return {
        ...shown, low: j.worst, inks: j.inks, off: j.off, picture: ground.picture,
        inkOk: want ? j.tokenOk : false,
        below: row.grade !== null && !j.gradeOk,
        at: where(el),
      };
    }
    if (!ink || ink[3] === 0) return null;
    const low = lowest(ink, el, ground.grounds);
    return {
      ratio: +low.ratio.toFixed(2), got: hex(low.got), ground: hex(low.ground), picture: ground.picture,
      inkOk: want ? near(low.got, over(want, low.ground)) : false,
      below: row.grade !== null && low.ratio < row.grade,
      at: where(el),
    };
  };

  // The rows of the given states against whatever the page shows now.
  const directText = (el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  // A text row reads an element that shows text. A family row spans a whole drawing, so it reads the element holding the text.
  const showsText = (row, el, pseudo, family) => pseudo || el.tagName === "INPUT" || (family ? directText(el) : el.textContent.trim() !== "");
  const sameState = (row, o) => o.state === row.state || (row.state === "rest" && o.state === "selected");
  const measureRows = (rows, allRows, family, tokens, theme) => rows.map((row) => {
    const res = { id: row.id, found: [], measured: 0, inkHits: 0, results: [] };
    for (const alt of alternatives(row.selector)) {
      const pseudo = pseudoOf(alt);
      const els = pick(alt);
      if (els.length) res.found.push(alt);
      for (const el of els) {
        if (!rowShown(el)) continue;
        if (row.kind === "text" && !showsText(row, el, pseudo, family.includes(row.id))) continue;
        // A graded row does not read the mark or an ornament inside it. Those have their own rows.
        if (row.grade !== null && el.closest("[data-audit-exempt], [data-ink-grade]")) continue;
        const r = judgeRow(row, el, pseudo, tokens, theme);
        if (!r) continue;
        res.measured += 1;
        if (r.inkOk) res.inkHits += 1;
        if (r.below || !r.inkOk) {
          // Another row may name this element: .site-nav a also matches the current link. Only a row that reads the same paint
          // in the same state counts: the same kind and pseudo element, and the same state, or a selected row for an element a
          // rest row reads. A selected item's own ink is not excused by the rest ink. The focus row does not count: its ring is
          // drawn only on focus, and its outline color would excuse a frame's text at rest.
          r.otherRow = allRows.some((o) => o !== row && o.kind === row.kind && o.state !== "focus" && sameState(row, o)
            && alternatives(o.selector).some((a) => pseudoOf(a) === pseudo && el.matches(bare(a)) && (judgeRow(o, el, pseudo, tokens, theme) || {}).inkOk));
          res.results.push(r);
        }
      }
    }
    return res;
  });

  // Everything on screen outside a gallery specimen, whether a row names it or not.
  const scan = (scope, { exemptIds, noGradeInks, grades }) => {
    const out = { text: 0, glyph: 0, inputs: 0, svgs: 0, pseudo: 0, below: [], exemptUses: {}, badExempt: [], gradeNone: {}, picture: [], paintServer: 0 };
    const exemptOf = (el) => { const e = el.closest("[data-audit-exempt]"); return e ? e.getAttribute("data-audit-exempt") : null; };
    scope.querySelectorAll("[data-audit-exempt]").forEach((e) => {
      if (!outsideGallery(e)) return;
      const id = e.getAttribute("data-audit-exempt");
      if (!exemptIds.includes(id)) out.badExempt.push({ id, at: where(e) });
      out.exemptUses[id] = (out.exemptUses[id] || 0) + 1;
    });
    const textGrade = (el) => {
      const s = getComputedStyle(el);
      const px = parseFloat(s.fontSize);
      const bold = Number(s.fontWeight) >= 700;
      return px >= grades.displayMinPx || (bold && px >= grades.displayBoldMinPx) ? grades.display : grades.text;
    };
    const judge = (kind, el, ink, grade, text, pseudo) => {
      if (kind === "text") out.text += 1; else if (kind === "glyph") out.glyph += 1; else out.inputs += 1;
      if (pseudo) out.pseudo += 1;
      const { grounds, picture } = groundsOf(el);
      const own = pseudo ? parse(getComputedStyle(el, pseudo).backgroundColor) : null;
      const used = own && own[3] > 0 ? grounds.map((g) => over(own, g)) : grounds;
      const low = lowest(ink, el, used);
      const marked = el.closest("[data-ink-grade]");
      const native = el.closest(":disabled, [aria-disabled='true']");
      if (marked || native) {
        const why = marked ? marked.getAttribute("data-ink-why") : "disabled";
        // Disabled frees the disabled tokens from a grade, not every ink under a disabled ancestor.
        const free = why !== "disabled" || noGradeInks.some((v) => { const c = parse(v); return c && near(over(c, low.ground), over(ink, low.ground)); });
        if (free) { out.gradeNone[why] = (out.gradeNone[why] || 0) + 1; return; }
      }
      if (picture) { out.picture.push({ at: where(el), text }); return; }
      if (low.ratio < grade) out.below.push({ kind, ratio: +low.ratio.toFixed(2), grade, got: hex(low.got), ground: hex(low.ground), at: where(el), text });
    };
    const skip = (el) => !outsideGallery(el) || el.closest("script, style, noscript, template") !== null;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim();
      if (!t) continue;
      const el = n.parentElement;
      // Text right inside a closed details is in its hidden slot, though the details itself is rendered.
      if (inClosedSlot(el)) continue;
      if (el.closest("svg") || skip(el) || exemptOf(el) || !visible(el)) continue;
      const ink = parse(getComputedStyle(el).color);
      if (!ink || ink[3] === 0) continue;
      judge("text", el, ink, textGrade(el), t.slice(0, 40));
    }
    // Generated text such as a figure label has no text node.
    scope.querySelectorAll("*").forEach((el) => {
      if (el.closest("svg") || skip(el) || exemptOf(el) || !visible(el)) return;
      for (const pseudo of ["::before", "::after"]) {
        const cs = getComputedStyle(el, pseudo);
        if (cs.content === "none" || cs.content === "normal" || cs.content === '""' || cs.display === "none") continue;
        const ink = parse(cs.color);
        if (ink && ink[3] > 0) judge("text", el, ink, grades.text, cs.content.slice(0, 40), pseudo);
      }
    });
    scope.querySelectorAll("input:not([type=checkbox]):not([type=radio]), textarea").forEach((el) => {
      if (skip(el) || exemptOf(el) || !visible(el)) return;
      const empty = !el.value;
      if (empty && !el.placeholder) return;
      const ink = parse(getComputedStyle(el, empty ? "::placeholder" : undefined).color);
      if (ink && ink[3] > 0) judge("input", el, ink, grades.text, (el.value || el.placeholder).slice(0, 40));
    });
    scope.querySelectorAll("svg").forEach((el) => {
      if (skip(el) || exemptOf(el) || !visible(el)) return;
      out.svgs += 1;
      svgInks(el, () => { out.paintServer += 1; }).forEach(({ shape, ink }) => {
        const isText = shape.tagName.toLowerCase() === "text";
        judge(isText ? "text" : "glyph", shape, ink, isText ? grades.text : grades.nonText, isText ? shape.textContent.trim().slice(0, 40) : where(el));
      });
    });
    return out;
  };

  // For a pointer or press row: which element takes the pointer, and which is measured.
  const aim = (alt) => {
    const m = /^(.*?):(hover|active)(.*)$/.exec(bare.length ? alt : alt);
    const head = m ? m[1] : bare(alt);
    const tail = m ? m[3] : "";
    const candidates = [...document.querySelectorAll(head)].filter((e) => outsideGallery(e) && (m ? rowShown(e) : true));
    const el = candidates.find((e) => !e.matches("[aria-current]")) || candidates[0];
    if (!el) return null;
    const pseudo = pseudoOf(alt);
    const part = tail.replace(/::(before|after|placeholder)$/, "").trim();
    const target = part ? el.querySelector(part) : el;
    if (!target) return null;
    const pointer = m ? el : el.parentElement;
    pointer.scrollIntoView({ block: "center", behavior: "instant" });
    const r = pointer.getBoundingClientRect();
    window.__aimed = { pointer, target, pseudo };
    // With no pointer state in the selector the row is shown by the box around it, so aim at that box's corner.
    return m ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: r.left + 2, y: r.top + 2 };
  };
  const measureAimed = (row, tokens, theme) => {
    const { pointer, target, pseudo } = window.__aimed;
    const reached = pointer.matches(":hover");
    if (!reached || !rowShown(target)) return { reached, measured: false };
    const r = judgeRow(row, target, pseudo, tokens, theme);
    return r ? { reached, measured: true, ...r } : { reached, measured: false };
  };
  // frames: the selectors of the scroll frames this page samples. A frame must show its ring: a focus-visible outline that
  // is not none and has a width. A frame with the ring off or no paint is a wrong ink record, not a skip, so the next frame
  // of its kind cannot hide it. Other stops keep the row's reading, as an input shows focus by its border.
  // framesOnly: past the ordinary stops, any other stop is left unjudged.
  const measureFocus = (row, tokens, theme, frames = [], framesOnly = false) => {
    const el = document.activeElement;
    if (!el || el === document.body || !outsideGallery(el) || !el.matches(row.selector)) return null;
    const frame = frames.find((f) => el.matches(f)) ?? null;
    if (!frame) return framesOnly ? null : judgeRow(row, el, null, tokens, theme);
    const cs = getComputedStyle(el);
    const ringOn = el.matches(":focus-visible") && cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const r = ringOn ? judgeRow(row, el, null, tokens, theme) : null;
    return r ? { ...r, frame } : { frame, at: where(el), got: "none", ground: "none", ratio: 0, inkOk: false, below: false };
  };

  // Whether a pointer row's target counts as found: shown, or with a shown parent, since the target can have no box until
  // the pointer reaches its host (display: none until :hover). A target in a closed details body is not found through its
  // parent: the body is not drawn whatever the pointer does.
  const pointerCandidate = (e) => visible(e) || (!inClosedBody(e) && e.parentElement !== null && visible(e.parentElement));

  return { selectParts, validateParts, expectedTheme, parse, over, ratio, hex, near, overlays, opacityOf, visible, svgInks, shapeInks, rowInks, rowShown, judgeInks, judgeSvgPart, inkOn, measureRows, scan, alternatives, pseudoOf, bare, pick, aim, measureAimed, measureFocus, measureMarks, inClosedSlot, pointerCandidate };
}

export const installPageLib = (tab) => tab.addScriptTag({ content: `window.__contrast = (${pageLib})();` });

// The Node runner indexes contract definitions and browser results by the same row identity.
const contractRowKey = ({ component, contract, state, host, part }) => `${component ?? contract}|${state}|${host}|${part}`;

export function missingCellRows(contractRows, measuredRows) {
  // Every measurement result covers the row, including an unlocated part.
  const seen = new Set(measuredRows.map(contractRowKey));
  return [...new Set(contractRows.map(contractRowKey))].filter((key) => !seen.has(key));
}

const SETTLE_LIMIT_MS = 30000;

// A style change reaches the computed value only through the frames of its transition. The reduced motion rule leaves a
// 0.01ms transition on every property, so this holds for all of them, and a loaded machine can take far longer than that
// to draw the next frame. Until then a read returns the old ink, or an oklab() value when the ink comes from color-mix,
// which parse cannot read. So wait for the condition, not for a time. An endless animation, such as a blinking cursor,
// has no end to wait for, so it is left out. A page that never settles fails the check.
export const stylesSettled = (tab) => tab.evaluate(async (limit) => {
  const deadline = performance.now() + limit;
  for (;;) {
    const running = document.getAnimations().filter((a) => a.playState === "running" && a.effect.getComputedTiming().endTime !== Infinity);
    if (running.length === 0) return;
    if (performance.now() > deadline) throw new Error(`styles still moving after ${limit}ms: ${running.slice(0, 5).map((a) => a.transitionProperty || a.animationName).join(", ")}`);
    await new Promise(requestAnimationFrame);
  }
}, SETTLE_LIMIT_MS);
