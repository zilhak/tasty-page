/* Site controls for theme, navigation, copying and search. */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;


  /* Theme names are the app's own — mocha (dark, default) and latte (light).
     Only latte carries an attribute; mocha is the bare :root. Values stored by
     an older build ("light" / "dark") still resolve. */
  function applyTheme(name) {
    if (name === "latte") {
      root.setAttribute("data-theme", "latte");
    } else {
      root.removeAttribute("data-theme");
    }
    try { localStorage.setItem("tasty-theme", name); } catch (e) { /* private mode */ }
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "latte" ? "latte" : "mocha";
  }

  /* A language picked here outranks the browser language on the next visit to
     the landing page. See the redirect in pages/[...locale]/index.astro. */
  document.querySelectorAll(".lang-switch a[data-lang]").forEach(function (link) {
    link.addEventListener("click", function () {
      try { localStorage.setItem("tasty-lang", link.getAttribute("data-lang")); } catch (e) { /* private mode */ }
    });
  });

  /* <details> opens and closes by itself. These close the language list the way a popup closes. */
  var langSwitch = document.querySelector(".lang-switch");
  if (langSwitch) {
    document.addEventListener("click", function (e) {
      if (langSwitch.open && !langSwitch.contains(e.target)) langSwitch.open = false;
    });
    langSwitch.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !langSwitch.open) return;
      langSwitch.open = false;
      langSwitch.querySelector("summary").focus();
    });
    langSwitch.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !langSwitch.contains(e.relatedTarget)) langSwitch.open = false;
    });
    /* The back button restores the page as it was left, with the list open. */
    window.addEventListener("pageshow", function () { langSwitch.open = false; });
  }

  /* Let the React demo read and update the shared page theme. */
  window.tastyTheme = { get: currentTheme, set: applyTheme };

  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(currentTheme() === "latte" ? "mocha" : "latte");
    });
  }


  var menuBtn = document.querySelector(".menu-btn");
  var siteNav = document.querySelector(".site-nav");
  if (menuBtn && siteNav) {
    /* Below 901px the header links are hidden and the drawer carries a copy of
       them. A page with no sidebar gets a drawer that holds only the copy. */
    var drawer = document.querySelector(".sidebar");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.className = "sidebar sidebar--site";
      body.appendChild(drawer);
    }
    var siteMenu = siteNav.cloneNode(true);
    siteMenu.className = "site-menu";
    drawer.insertBefore(siteMenu, drawer.firstChild);
    drawer.id = "site-drawer";
    menuBtn.setAttribute("aria-controls", drawer.id);

    /* An element of its own, not a pseudo-element of body: iOS Safari sends no
       click for a tap on body unless the tapped element has its own listener. */
    var scrim = document.createElement("div");
    scrim.className = "nav-scrim";
    body.appendChild(scrim);

    var narrow = window.matchMedia("(max-width: 900px)");
    var isOpen = function () { return body.hasAttribute("data-nav-open"); };
    var openNav = function () {
      drawer.inert = false;
      body.setAttribute("data-nav-open", "");
      menuBtn.setAttribute("aria-expanded", "true");
      siteMenu.querySelector("a").focus({ preventScroll: true });
    };
    var closeNav = function (restoreFocus) {
      if (!isOpen()) return;
      body.removeAttribute("data-nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
      if (restoreFocus) menuBtn.focus({ preventScroll: true });
      /* The drawer stays visible while it slides out, and Tab would land in it. */
      if (narrow.matches) drawer.inert = true;
    };

    menuBtn.addEventListener("click", function () {
      if (isOpen()) closeNav(true);
      else openNav();
    });
    scrim.addEventListener("click", function () { closeNav(true); });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("#site-drawer") || e.target.closest(".menu-btn")) return;
      closeNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav(true);
    });
    /* The page under the scrim takes no focus. On a page whose drawer ends the
       document, Tab leaves the page first, so this watches where focus lands. */
    document.addEventListener("focusin", function (e) {
      if (!drawer.contains(e.target) && e.target !== menuBtn) closeNav(false);
    });
    /* The back button restores the page as it was left. */
    window.addEventListener("pageshow", function () { closeNav(false); });
    if (narrow.addEventListener) {
      narrow.addEventListener("change", function (e) {
        if (e.matches) return;
        closeNav(false);
        drawer.inert = false; /* above 900px this element is the page's sidebar */
      });
    }
  }


  document.querySelectorAll(".code-block").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = block.dataset.copyLabel || "copy";
    btn.addEventListener("click", function () {
      var text = pre.innerText;
      var done = function () {
        btn.textContent = block.dataset.copiedLabel || "copied";
        btn.setAttribute("data-copied", "");
        setTimeout(function () {
          btn.textContent = block.dataset.copyLabel || "copy";
          btn.removeAttribute("data-copied");
        }, 1400);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
      }
    });
    block.appendChild(btn);
  });


  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute("href") || "").replace(/^#/, "");
      if (id) byId[id] = a;
    });
    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      var first = null;
      Object.keys(byId).some(function (id) {
        if (visible.has(id)) { first = id; return true; }
        return false;
      });
      tocLinks.forEach(function (a) { a.removeAttribute("data-active"); });
      if (first && byId[first]) byId[first].setAttribute("data-active", "");
    }, { rootMargin: "-72px 0px -70% 0px", threshold: 0 });

    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }


  var searchInput = document.querySelector(".search input");
  var searchResults = document.querySelector(".search__results");
  if (searchInput && searchResults) {
    var index = null;
    var loading = false;
    var activeIdx = -1;

    function loadIndex() {
      if (index || loading) return;
      loading = true;
      fetch(searchInput.dataset.index)
        .then(function (r) { return r.json(); })
        .then(function (json) { index = json; loading = false; run(); })
        .catch(function () { loading = false; });
    }

    function score(entry, terms) {
      var title = entry.t.toLowerCase();
      var crumb = (entry.c || "").toLowerCase();
      var heads = (entry.h || "").toLowerCase();
      var total = 0;
      for (var i = 0; i < terms.length; i++) {
        var q = terms[i];
        var s = 0;
        if (title === q) s = 100;
        else if (title.indexOf(q) === 0) s = 60;
        else if (title.indexOf(q) !== -1) s = 40;
        else if (crumb.indexOf(q) !== -1) s = 18;
        else if (heads.indexOf(q) !== -1) s = 10;
        if (s === 0) return 0;
        total += s;
      }
      return total;
    }

    function run() {
      var raw = searchInput.value.trim().toLowerCase();
      if (!raw) { close(); return; }
      if (!index) { loadIndex(); return; }
      var terms = raw.split(/\s+/);
      var hits = [];
      for (var i = 0; i < index.length; i++) {
        var s = score(index[i], terms);
        if (s > 0) hits.push({ e: index[i], s: s });
      }
      hits.sort(function (a, b) { return b.s - a.s; });
      hits = hits.slice(0, 24);

      searchResults.innerHTML = "";
      if (!hits.length) {
        var empty = document.createElement("div");
        empty.className = "search__empty";
        empty.textContent = searchInput.dataset.emptyLabel || "No results";
        searchResults.appendChild(empty);
      } else {
        hits.forEach(function (hit) {
          var a = document.createElement("a");
          a.href = searchInput.dataset.base + hit.e.u;
          a.textContent = hit.e.t;
          var crumb = document.createElement("span");
          crumb.className = "r-crumb";
          crumb.textContent = hit.e.c || "";
          a.appendChild(crumb);
          searchResults.appendChild(a);
        });
      }
      activeIdx = -1;
      searchResults.setAttribute("data-open", "");
    }

    function close() {
      searchResults.removeAttribute("data-open");
      activeIdx = -1;
    }

    function items() {
      return Array.prototype.slice.call(searchResults.querySelectorAll("a"));
    }

    function move(delta) {
      var list = items();
      if (!list.length) return;
      list.forEach(function (a) { a.removeAttribute("data-active"); });
      activeIdx = (activeIdx + delta + list.length) % list.length;
      list[activeIdx].setAttribute("data-active", "");
      list[activeIdx].scrollIntoView({ block: "nearest" });
    }

    searchInput.addEventListener("focus", loadIndex);
    searchInput.addEventListener("input", run);
    searchInput.addEventListener("keydown", function (e) {
      /* An input method uses these keys to pick a candidate while it composes. Safari
         reports the Enter that ends a composition only by its key code. */
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        var list = items();
        if (activeIdx >= 0 && list[activeIdx]) { e.preventDefault(); list[activeIdx].click(); }
      } else if (e.key === "Escape") { close(); searchInput.blur(); }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== searchInput &&
          !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }


  var primary = document.getElementById("dl-primary");
  if (primary) {
    var ua = navigator.userAgent || "";
    var uad = navigator.userAgentData;
    var plat = (uad && uad.platform) || navigator.platform || "";
    var os = null;
    if (/Mac/i.test(plat) && !/iPhone|iPad/i.test(ua)) { os = "macos"; }
    else if (/Win/i.test(plat)) { os = "windows"; }
    else if (/Linux/i.test(plat) && !/Android/i.test(ua)) { os = "linux"; }
    var names = { macos: "macOS", windows: "Windows", linux: "Linux" };
    // The asset must match both the OS and the architecture the browser reports.
    // When the architecture is unknown the button keeps the releases page.
    var apply = function (arch) {
      var url = arch && primary.getAttribute("data-" + os + "-" + arch);
      if (url) {
        primary.href = url;
        primary.textContent = primary.getAttribute("data-label").replace("{os}", names[os]);
      }
    };
    var archOf = function (s) {
      if (/aarch64|arm64/i.test(s)) return "arm64";
      if (/x86_64|x86-64|amd64|\bx64\b/i.test(s)) return "x64";
      return null;
    };
    var fromStrings = function () { return archOf(navigator.platform || "") || archOf(ua); };
    if (os === "macos") {
      // Releases carry Apple silicon only, and Safari does not report the architecture.
      apply("arm64");
    } else if (os && uad && typeof uad.getHighEntropyValues === "function") {
      uad.getHighEntropyValues(["architecture", "bitness"]).then(function (v) {
        if (!v || !v.architecture) { apply(fromStrings()); return; }
        var a = null;
        if (v.bitness === "64" && v.architecture === "arm") a = "arm64";
        else if (v.bitness === "64" && v.architecture === "x86") a = "x64";
        apply(a);
      }, function () { apply(fromStrings()); });
    } else if (os) {
      apply(fromStrings());
    }
  }


  var current = document.querySelector('.nav-list a[aria-current="page"]');
  if (current) {
    var sidebar = document.querySelector(".sidebar");
    if (sidebar && window.matchMedia("(min-width: 901px)").matches) {
      var top = current.offsetTop - sidebar.clientHeight / 3;
      if (top > 0) sidebar.scrollTop = top;
    }
  }
})();
