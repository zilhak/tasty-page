// The gallery page measurement. It runs in the page through tab.evaluate, so it reads only its arguments, the page and
// window.__contrast (contrast-page.mjs), and the tests can run it against a stand-in DOM.

// Runs in the page. Colors round per channel to 8 bits and a translucent layer composites source-over, as RULES.md says.
export function measureGallery({ rows, tokens, grades, partMap, exemptIds, noGradeTokens, theme }) {
  const { selectParts, validateParts, expectedTheme, parse, over, ratio, hex, near, overlays, visible, inkOn } = window.__contrast;
  // The ground under an element: its own fill and overlays, then each ancestor's, down to the first opaque fill.
  const groundOf = (el, includeSelf = true) => {
    const stack = [];
    let picture = false;
    for (let e = includeSelf ? el : el.parentElement; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== "none") picture = true;
      overlays(e).forEach((c) => stack.push(c));
      const c = parse(s.backgroundColor);
      if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; }
    }
    let base = [255, 255, 255, 1];
    for (let i = stack.length - 1; i >= 0; i -= 1) base = over(stack[i], base);
    return { color: base, picture };
  };
  const out = { cells: 0, rows: [], diagnostics: [], text: 0, svgs: 0, emptySvgs: 0, glyph: 0, inputs: 0, below: [], exemptUses: {}, badExempt: [], gradeNone: [], picture: 0, paintServer: 0 };
  const svgInks = (svg) => window.__contrast.svgInks(svg, () => { out.paintServer += 1; });

  const label = (el) => {
    const spec = el.closest("[data-spec]");
    return spec ? spec.getAttribute("data-spec") : "";
  };

  // Frozen cells
  const cells = Array.from(document.querySelectorAll("[data-gallery-page] [data-contract]"));
  out.cells = cells.length;
  cells.forEach((cell) => {
    const { contract, state, host } = cell.dataset;
    const spec = label(cell);
    const view = cell.closest("[data-view]")?.getAttribute("data-view") ?? "";
    const location = { contract, state, host, spec, view };
    const matching = rows.filter((r) => r.component === contract && r.state === state && r.host === host);
    const value = cell.getAttribute("data-parts");
    const { parts, error } = validateParts(value, matching);
    if (error) {
      out.diagnostics.push({ ...location, value, error });
      return;
    }
    const name = expectedTheme(cell, theme);
    selectParts(matching, parts).forEach((r) => {
      const map = (partMap[contract] && partMap[contract][r.part]) || {};
      const sel = map.sel || `[data-part="${r.part}"]`;
      const el = sel === ":cell" ? cell : cell.querySelector(sel);
      const want = tokens[r.token] && tokens[r.token][name];
      const role = grades[r.role] || {};
      const base = { ...location, part: r.part, token: r.token, role: r.role, grade: role.grade };
      if (!el) { out.rows.push({ ...base, status: "unlocated" }); return; }
      const cs = getComputedStyle(el, map.pseudo);
      let prop = map.prop;
      if (!prop) {
        if (r.part === "ring") prop = "outlineColor";
        else if (role.kind === "edge") {
          const bw = parseFloat(cs.borderTopWidth) > 0 ? "borderTopColor" : parseFloat(cs.borderBottomWidth) > 0 ? "borderBottomColor" : parseFloat(cs.borderLeftWidth) > 0 ? "borderLeftColor" : parseFloat(cs.borderRightWidth) > 0 ? "borderRightColor" : "backgroundColor";
          prop = bw;
        } else if (el.tagName.toLowerCase() === "svg" || el.querySelector("svg")) prop = "svg";
        else prop = "color";
      }
      if (r.part === "ring" && prop === "outlineColor" && cs.outlineStyle === "none") { out.rows.push({ ...base, status: "mismatch", got: "none", expect: want }); return; }
      const shadow = () => { const m = /(rgba?\([^)]+\)|color\([^)]+\))/.exec(cs.boxShadow); return m ? parse(m[1]) : null; };
      // An edge, a ring or a filled part stands on what is under it, not on itself.
      const ownFill = /^(border|outline|shadow|backgroundColor)/.test(prop);
      const ground = groundOf(ownFill ? el.parentElement : el).color;
      let row;
      if (prop === "svg") {
        // Every paint the part draws is judged: the svg's own shapes, the shape the row picks, or every svg inside
        // the element (judgeSvgPart in contrast-page.mjs). map.paint keeps only the stroke or only the fill.
        const res = window.__contrast.judgeSvgPart(el, map.paint, ground, want ? parse(want) : null, role.grade || null, () => { out.paintServer += 1; });
        row = { ...base, ...res, expect: want };
      } else {
        const raw = prop === "shadow" ? shadow() : parse(cs[prop]);
        if (!raw || raw[3] === 0) { out.rows.push({ ...base, status: "mismatch", got: "none", expect: want, ground: hex(ground) }); return; }
        const got = inkOn(raw, el, ground);
        const exp = want && parse(want) ? over(parse(want), ground) : null;
        const rt = ratio(got, ground);
        row = { ...base, got: hex(got), expect: want, ground: hex(ground), ratio: +rt.toFixed(2) };
        if (exp && !near(got, exp)) row.status = "mismatch";
        else if (role.grade && rt < role.grade) row.status = "below";
        else row.status = "ok";
      }
      out.rows.push(row);
    });
  });

  // Everything else on the page
  const scope = document.querySelector("[data-gallery-page]");
  const skip = (el) => el.closest("[data-contract]") !== null;
  const exemptOf = (el) => {
    const e = el.closest("[data-audit-exempt]");
    return e ? e.getAttribute("data-audit-exempt") : null;
  };
  scope.querySelectorAll("[data-audit-exempt]").forEach((e) => {
    const id = e.getAttribute("data-audit-exempt");
    if (!exemptIds.includes(id)) out.badExempt.push({ id, spec: label(e) });
    out.exemptUses[id] = (out.exemptUses[id] || 0) + 1;
  });
  // A specimen can pin the other theme on its own box, so the no-grade values follow the nearest data-theme.
  const noGradeValues = (el) => {
    const name = expectedTheme(el, theme);
    return noGradeTokens.map((t) => tokens[t] && tokens[t][name]).filter(Boolean).map((v) => parse(v)).filter(Boolean);
  };
  const judge = (kind, el, ink, grade, text) => {
    if (kind === "text") out.text += 1; else if (kind === "glyph") out.glyph += 1; else out.inputs += 1;
    const marked = el.closest("[data-ink-grade]");
    const native = el.closest(":disabled, [aria-disabled='true']");
    const { color: ground, picture } = groundOf(el);
    const got = inkOn(ink, el, ground);
    const rt = ratio(got, ground);
    if (marked || native) {
      const why = marked ? marked.getAttribute("data-ink-why") : "disabled";
      // Disabled frees the disabled tokens from a grade, not every ink under a disabled ancestor.
      const noGrade = why !== "disabled" || noGradeValues(el).some((v) => near(over(v, ground), over(ink, ground)));
      if (noGrade) { out.gradeNone.push({ why, spec: label(el) }); return; }
    }
    if (picture) { out.picture += 1; return; }
    if (rt < grade) out.below.push({ kind, ratio: +rt.toFixed(2), grade, got: hex(got), ground: hex(ground), spec: label(el), text });
  };
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (el.closest("svg") || skip(el) || exemptOf(el) || !visible(el)) continue;
    const ink = parse(getComputedStyle(el).color);
    if (!ink || ink[3] === 0) continue;
    judge("text", el, ink, 4.5, t.slice(0, 40));
  }
  scope.querySelectorAll("input:not([type=checkbox]):not([type=radio]), textarea").forEach((el) => {
    if (skip(el) || exemptOf(el) || !visible(el)) return;
    const empty = !el.value;
    const ink = parse(getComputedStyle(el, empty && el.placeholder ? "::placeholder" : undefined).color);
    if (empty && !el.placeholder) return;
    if (ink) judge("input", el, ink, 4.5, (el.value || el.placeholder).slice(0, 40));
  });
  scope.querySelectorAll("svg").forEach((el) => {
    if (skip(el) || exemptOf(el) || !visible(el)) return;
    out.svgs += 1;
    const inks = svgInks(el);
    if (inks.length === 0) out.emptySvgs += 1;
    inks.forEach(({ shape, ink }) => {
      const isText = shape.tagName.toLowerCase() === "text";
      judge(isText ? "text" : "glyph", shape, ink, isText ? 4.5 : 3, isText ? shape.textContent.trim().slice(0, 40) : el.getAttribute("aria-label") || shape.getAttribute("class") || "svg");
    });
  });
  out.hscroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
  return out;
}
