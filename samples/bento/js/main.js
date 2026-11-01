/* =========================================================
   見本サイト(架空の仕出し・お弁当屋) 共通の動き
   ※ 通常の更新では、このファイルを触る必要はありません。
   ========================================================= */
(function () {
  "use strict";

  /* ---------- ヘッダー：スクロールで影をつける ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- スマホのメニュー ---------- */
  var toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".global-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- 見本のフォームは送らない ---------- */
  document.querySelectorAll("form").forEach(function (form) {
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  });

  /* ---------- 年 ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- ふわっと出す ---------- */
  // 最初から画面に見えているものは隠さない。下にあるものだけ、見えたときにふわっと出す
  var fades = [].filter.call(document.querySelectorAll(".fade"), function (el) {
    return el.getBoundingClientRect().top > window.innerHeight;
  });
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fades.forEach(function (el) { el.classList.add("is-pre"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-pre");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    fades.forEach(function (el) { io.observe(el); });
  }
})();
