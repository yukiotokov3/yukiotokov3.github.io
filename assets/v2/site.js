/* テアシ商会 試作サイト — 依存ライブラリなし */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function withTransition(fn) {
    if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(fn); else fn();
  }

  /* ---------- ページを開いたら一番上から(表示テーマは端末の設定に合わせる) ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function toTop() {
    var id = location.hash.slice(1), target = id && document.getElementById(id);
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }
  window.addEventListener("pageshow", toTop);

  /* ---------- ヘッダー ---------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    var menuBtn = document.querySelector(".menu-btn");
    var nav = document.getElementById("gnav");
    function closeMenu() {
      if (!nav.classList.contains("is-open")) return;
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.querySelector("span").textContent = "メニュー";
    }
    menuBtn.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) { closeMenu(); menuBtn.focus(); return; }
      nav.style.top = Math.round(header.getBoundingClientRect().bottom) + "px";
      nav.classList.add("is-open");
      document.body.classList.add("menu-open");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.querySelector("span").textContent = "閉じる";
      nav.querySelector("a").focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); menuBtn.focus(); }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", closeMenu);
    var path = location.pathname.replace(/index\.html$/, "");
    if (path.indexOf("/samples/") === 0) path = "/samples/";
    document.querySelectorAll(".gnav a").forEach(function (a) {
      if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
    });
    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 4); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- スクロールで出す(最初の画面にある物は隠さない) ---------- */
  var io = null;
  function reveal(scope) {
    if (window.gsap && window.ScrollTrigger) { document.dispatchEvent(new CustomEvent("teashi:rendered", { detail: scope || document })); return; }
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("reveal-in");
          en.target.classList.remove("reveal-pending");
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }
    var vh = window.innerHeight;
    (scope || document).querySelectorAll("[data-reveal]:not(.reveal-in)").forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add("reveal-pending");
      io.observe(el);
    });
  }

  /* ---------- 作品データ ---------- */
  var dataPromise = null;
  function loadWorks() {
    if (!dataPromise) dataPromise = fetch("/assets/v2/works.json").then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
    return dataPromise;
  }
  function status(data, id) {
    return data.statuses.filter(function (s) { return s.id === id; })[0] || { name: id, mark: "" };
  }
  function statusTag(data, id) {
    var s = status(data, id);
    return '<span class="tag">' + s.mark + " " + esc(s.name) + "</span>";
  }
  function fmtDate(d) { return d.replace(/-/g, "."); }
  function title(w) { return w.name + (w.fictional ? "(架空)" : ""); }
  function shot(w, eager) {
    return '<figure class="shot" style="view-transition-name: shot-' + w.id + '"><img src="' + w.image.src + '" srcset="' + w.image.srcSmall + " 640w, " + w.image.src + ' 1280w" sizes="(min-width: 761px) 640px, 100vw" width="1280" height="800" alt="' + esc(w.image.alt) + '"' + (eager ? "" : ' loading="lazy"') + ' decoding="async"></figure>';
  }
  function workRow(data, w, i) {
    return '<li class="work" data-reveal>' +
      '<a class="work-link" href="/samples/detail/#' + w.id + '" tabindex="-1" aria-hidden="true">' + shot(w, i === 0) + "</a>" +
      '<div class="work-body"><div class="work-top"><span class="work-no">#' + w.no + "</span>" + statusTag(data, w.status) + '<span class="tag tag-made">' + esc(w.made) + '</span><span class="note">' + fmtDate(w.date) + " 公開</span></div>" +
      '<h3><a href="/samples/detail/#' + w.id + '">' + esc(title(w)) + "</a></h3>" +
      "<p>" + esc(w.kind) + "。「" + esc(w.tagline) + "」</p>" +
      '<p class="work-facts">' + w.highlights.map(function (h) { return "<span>" + esc(h.label) + " <b>" + esc(h.value) + "</b></span>"; }).join("") + "</p>" +
      '<p><a class="more" href="/samples/detail/#' + w.id + '">作った記録を見る <span class="arr" aria-hidden="true">→</span></a></p>' +
      "</div></li>";
  }
  function showLoadError(el) {
    el.innerHTML = '<p class="empty">作品のデータを読み込めませんでした。ページを読み込み直してください。</p>';
  }

  /* ---------- ページごと ---------- */
  var pages = {
    home: function () {
      var el = document.getElementById("latest");
      loadWorks().then(function (data) {
        el.innerHTML = data.works.map(function (w, i) { return workRow(data, w, i); }).join("");
        reveal(el);
      }).catch(function () { showLoadError(el); });
    },

    works: function () {
      var listEl = document.getElementById("works-list");
      var filterEl = document.getElementById("filters");
      var noteEl = document.getElementById("result-note");
      loadWorks().then(function (data) {
        var opts = [{ id: "all", name: "すべて", mark: "" }].concat(data.statuses);
        function count(id) { return data.works.filter(function (w) { return id === "all" || w.status === id; }).length; }
        filterEl.innerHTML = opts.map(function (s) {
          return '<button type="button" class="chip" data-status="' + s.id + '" aria-pressed="false">' + (s.mark ? s.mark + " " : "") + esc(s.name) + ' <span class="count">' + count(s.id) + "件</span></button>";
        }).join("");
        function apply(id, animate) {
          if (!opts.some(function (s) { return s.id === id; })) id = "all";
          filterEl.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.status === id)); });
          var items = data.works.filter(function (w) { return id === "all" || w.status === id; });
          var render = function () {
            listEl.innerHTML = items.length
              ? items.map(function (w, i) { return workRow(data, w, i); }).join("")
              : '<li class="empty">「' + esc(status(data, id).name) + "」の作品は、今はありません。</li>";
            noteEl.textContent = (id === "all" ? "すべての作品" : "「" + status(data, id).name + "」の作品") + "を" + items.length + "件表示しています。";
            reveal(listEl);
          };
          if (animate) withTransition(render); else render();
        }
        filterEl.addEventListener("click", function (e) {
          var b = e.target.closest(".chip");
          if (!b) return;
          history.replaceState(null, "", b.dataset.status === "all" ? location.pathname : "#" + b.dataset.status);
          apply(b.dataset.status, true);
        });
        apply((location.hash || "#all").slice(1), false);
      }).catch(function () { showLoadError(listEl); });
    },

    work: function () {
      var el = document.getElementById("work-detail");
      function render(data) {
        var id = location.hash.slice(1), idx = -1;
        data.works.forEach(function (w, i) { if (w.id === id) idx = i; });
        if (idx < 0) {
          document.title = "作品が見つかりません | テアシ商会";
          el.innerHTML = '<section class="page-head"><div class="wrap"><h1>作品が見つかりません</h1><p class="lead">アドレスが変わった可能性があります。<a href="/samples/">作ったものの一覧</a>から探してください。</p></div></section>';
          return;
        }
        var w = data.works[idx];
        var other = data.works[(idx + 1) % data.works.length];
        var lastDone = -1;
        w.timeline.forEach(function (t, i) { if (t.time) lastDone = i; });
        document.title = title(w) + "| 作ったもの | テアシ商会";
        el.innerHTML =
          '<section class="page-head"><div class="wrap">' +
          '<nav class="crumbs" aria-label="現在地"><ol><li><a href="/">はじめに</a></li><li><a href="/samples/">作ったもの</a></li><li aria-current="page">#' + w.no + "</li></ol></nav>" +
          "<h1>" + esc(title(w)) + "</h1>" +
          '<p class="lead">' + esc(w.kind) + "。「" + esc(w.tagline) + "」</p>" +
          '<div class="detail-top">' + shot(w, true) +
          '<div style="display:grid;gap:var(--sp-5);align-content:start"><dl class="facts">' +
          "<div><dt>状態</dt><dd>" + statusTag(data, w.status) + "</dd></div>" +
          "<div><dt>公開日</dt><dd>" + fmtDate(w.date) + "</dd></div>" +
          "<div><dt>番号</dt><dd>" + esc(w.label) + " #" + w.no + "</dd></div>" +
          "<div><dt>作った体制</dt><dd>" + esc(w.made) + "</dd></div>" +
          "</dl>" +
          '<p><a class="btn btn-primary ext" href="' + w.url + '" target="_blank" rel="noopener">サイトを開く</a></p>' +
          '<p class="note">新しいタブで開きます。</p></div></div>' +
          "</div></section>" +
          '<div class="wrap detail-body">' +
          '<section data-reveal><h2>公開までの流れ</h2><ol class="timeline" role="list">' +
          w.timeline.map(function (t, i) {
            return '<li class="' + (t.time ? (i === lastDone ? "last" : "") : "none") + '"><span class="mk" aria-hidden="true"></span><span class="tm">' + (t.time ? t.time : "記録なし") + '</span><span class="ev">' + esc(t.event) + "</span></li>";
          }).join("") +
          '</ol><p class="note">' + esc(w.timelineNote.replace("{date}", fmtDate(w.date))) + "</p></section>" +
          '<section data-reveal><h2>数字で見る</h2><div class="nums">' +
          w.numbers.map(function (n) { return '<div><span class="v">' + esc(n.value) + "<small>" + esc(n.unit) + '</small></span><span class="l">' + esc(n.label) + "</span></div>"; }).join("") +
          "</div></section>" +
          '<section data-reveal><h2>誰が何をしたか</h2><ul class="who" role="list">' +
          w.who.map(function (x) { return '<li><span class="k">' + esc(x.k) + "</span><span>" + esc(x.v) + "</span></li>"; }).join("") +
          '</ul><p class="note">' + esc(w.credit) + "</p></section>" +
          '<nav class="pager" aria-label="ほかの作品"><a href="/samples/"><span class="note">← 一覧へ</span><span class="t">作ったもの</span></a>' +
          '<a class="next" href="/samples/detail/#' + other.id + '"><span class="note">ほかの作品 →</span><span class="t">#' + other.no + " " + esc(title(other)) + "</span></a></nav></div>";
        reveal(el);
      }
      loadWorks().then(function (data) {
        render(data);
        window.addEventListener("hashchange", function () {
          withTransition(function () { render(data); window.scrollTo(0, 0); });
          var h = el.querySelector("h1");
          if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
        });
      }).catch(function () { showLoadError(el); });
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    toTop();
    var page = document.body.dataset.page;
    if (pages[page]) pages[page]();
    reveal(document);
  });
})();
