// Tasty Gallery: reference for the rendered check. See gallery/README.md, "The check".
// Reads every frozen cell of the page and compares it with its rows in tokens/ground-ink-rules.json. The ratio follows
// RULES.md: each color rounds per channel to 8 bits and a translucent layer composites source-over, then rounds again.
// Limit: the ground is found by walking ancestors and their ::after overlay. A sibling laid over the ink is not seen,
// so a specimen paints its ground on an ancestor. The part selectors below cover the Button family only.
(function () {
  function parse(s) {
    var m = /rgba?\(([^)]+)\)/.exec(s);
    if (m) { var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; }
    m = /color\(srgb ([^)]+)\)/.exec(s);
    if (m) { var q = m[1].split(/[ \/]+/).filter(Boolean).map(Number); return [q[0] * 255, q[1] * 255, q[2] * 255, q[3] === undefined ? 1 : q[3]]; }
    return [0, 0, 0, 0];
  }
  function over(t, u) {
    return [0, 1, 2].map(function (i) { return Math.floor(t[i] * t[3] + u[i] * (1 - t[3]) + 0.5); }).concat(1);
  }
  function lum(c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function hex(c) { return "#" + c.slice(0, 3).map(function (v) { return Math.round(v).toString(16).padStart(2, "0"); }).join(""); }
  function near(a, b) {
    if (!a || a === "none" || a.length !== 7 || b.length !== 7) return a === b;
    return [1, 3, 5].every(function (i) { return Math.abs(parseInt(a.substr(i, 2), 16) - parseInt(b.substr(i, 2), 16)) <= 1; });
  }
  function groundOf(el, withPseudo) {
    var stack = [];
    for (var e = el; e; e = e.parentElement) {
      var after = getComputedStyle(e, "::after");
      if (withPseudo && after.content !== "none" && after.position === "absolute") {
        var a = parse(after.backgroundColor);
        if (a[3] > 0) stack.push(a);
      }
      var c = parse(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break; }
    }
    var base = [255, 255, 255, 1];
    for (var i = stack.length - 1; i >= 0; i -= 1) base = over(stack[i], base);
    return base;
  }
  function themeOf(el) { var t = el.closest("[data-theme]"); return t && t.getAttribute("data-theme") === "latte" ? "latte" : "mocha"; }

  async function run() {
    var data = await (await fetch("../tokens/ground-ink-rules.json")).json();
    var tok = Object.fromEntries(data.tokens.map(function (t) { return [t.name, t]; }));
    var out = [];
    var cells = Array.from(document.querySelectorAll("[data-contract]"));
    cells.forEach(function (cell) {
      var rows = data.components.filter(function (r) { return r.component === cell.dataset.contract && r.state === cell.dataset.state && r.host === cell.dataset.host; });
      var root = cell.querySelector(".sg-frozen").firstElementChild;
      var th = themeOf(cell);
      rows.forEach(function (r) {
        var want = tok[r.token], got = null, g = null, rt = null;
        if (r.part === "label" || r.part === "glyph" || r.part === "icon") {
          var e = r.part === "label" ? (root.querySelector("span") || root) : (root.querySelector("svg") || root);
          var ink = parse(getComputedStyle(e).color);
          g = groundOf(root, true);
          got = hex(over(ink, g));
          rt = ratio(over(ink, g), g);
        } else if (r.part === "edge") {
          var c = parse(getComputedStyle(root).borderTopColor);
          g = groundOf(root.parentElement, false);
          got = c[3] > 0 ? hex(over(c, g)) : "none";
        } else if (r.part === "ring") {
          var cs = getComputedStyle(root);
          got = cs.outlineStyle === "none" ? "none" : hex(parse(cs.outlineColor));
        } else { return; }
        var expect = want.values[th].toLowerCase();
        out.push({ contract: r.component, state: r.state, host: r.host, part: r.part, token: r.token, expect: expect, got: got, ground: g && hex(g), ratio: rt && +rt.toFixed(2), fileRatio: r.contrast && r.contrast[th], ok: near(got, expect) });
      });
    });
    var d = document.documentElement;
    return { cells: cells.length, rows: out.length, bad: out.filter(function (x) { return !x.ok; }), all: out, hscroll: d.scrollWidth > d.clientWidth };
  }
  window.GalleryAudit = { run: run };
})();
