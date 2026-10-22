/* アニメーション追加版 — GSAP + ScrollTrigger
   動きを減らす設定の人、GSAPが読み込めなかった人には何もしない(静止したまま全部読める) */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion");

  var seen = new WeakSet();
  function first(el) { if (seen.has(el)) return false; seen.add(el); return true; }

  /* 数字を0から数え上げる(「約8」の「約」は残す) */
  function countUp(el, delay, trigger) {
    var tn = el.firstChild;
    if (!tn || tn.nodeType !== 3) return;
    var m = tn.nodeValue.match(/^(\D*)(\d+)(.*)$/);
    if (!m) return;
    var obj = { v: 0 }, to = +m[2];
    tn.nodeValue = m[1] + "0" + m[3];
    gsap.to(obj, {
      v: to, duration: 1.2, delay: delay || 0, ease: "power2.out",
      scrollTrigger: trigger ? { trigger: trigger, start: "top 85%" } : undefined,
      onUpdate: function () { tn.nodeValue = m[1] + Math.round(obj.v) + m[3]; }
    });
  }

  /* 最初の画面: 見出しが下から1行ずつせり上がり、数字が数え上がる */
  function hero() {
    var lines = document.querySelectorAll(".split .ln > span");
    if (!lines.length) return;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(lines, { yPercent: 110, duration: 1, stagger: 0.14 })
      .from(".hero .eyebrow", { opacity: 0, x: -12, duration: 0.5 }, 0.1)
      .from(".hero .lead, .hero-actions", { y: 18, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.5)
      .from(".stats > div", { y: 24, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.7);
    document.querySelectorAll(".stats dd").forEach(function (dd, i) { countUp(dd, 0.8 + i * 0.08); });
  }

  function scan(root) {
    root = root && root.querySelectorAll ? root : document;

    /* 作品: 写真が上から開き、中でゆっくり動く。説明は少し遅れて順に出る */
    root.querySelectorAll(".work").forEach(function (w) {
      if (!first(w)) return;
      var shot = w.querySelector(".shot"), img = shot && shot.querySelector("img"), body = w.querySelector(".work-body");
      if (shot) gsap.fromTo(shot, { clipPath: "inset(0% 0% 100% 0% round 8px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 8px)", duration: 1.1, ease: "power3.inOut",
        scrollTrigger: { trigger: w, start: "top 85%" }
      });
      if (img) gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } });
      if (body) gsap.from(body.children, { y: 24, opacity: 0, duration: 0.7, stagger: 0.07, ease: "power3.out", delay: 0.25, scrollTrigger: { trigger: w, start: "top 85%" } });
    });

    /* 詳細: 公開までの時刻を、線が左から伸びるのに合わせて順に置く */
    root.querySelectorAll(".timeline").forEach(function (t) {
      if (!first(t)) return;
      var track = document.createElement("div");
      track.className = "timeline-track"; track.setAttribute("aria-hidden", "true");
      track.innerHTML = "<i></i>";
      t.parentNode.insertBefore(track, t);
      var n = t.children.length;
      var tl = gsap.timeline({ scrollTrigger: { trigger: t, start: "top 80%" } });
      tl.from(track.firstChild, { scaleX: 0, duration: 0.35 * n, ease: "none" }, 0)
        .from(t.querySelectorAll(".mk"), { scale: 0, rotate: -60, duration: 0.45, stagger: 0.35, ease: "back.out(2.4)" }, 0)
        .from(t.querySelectorAll("li > .tm, li > .ev"), { y: 10, opacity: 0, duration: 0.4, stagger: 0.175 }, 0.1);
      var last = t.querySelector("li.last .mk");
      if (last) tl.to(last, { scale: 1.7, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
    });
    root.querySelectorAll(".nums .v").forEach(function (v) { if (first(v)) countUp(v, 0, v); });

    /* そのほかの段: 下からふわっと */
    root.querySelectorAll("[data-reveal]:not(.work)").forEach(function (el) {
      if (!first(el)) return;
      gsap.from(el, { y: 28, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    root.querySelectorAll(".section-head, .page-head h1").forEach(function (el) {
      if (!first(el)) return;
      gsap.from(el, { y: 20, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    ScrollTrigger.refresh();
  }

  /* ヘッダー: 下へ読み進めると隠れ、上に戻すと出る */
  function header() {
    var h = document.querySelector(".site-header");
    if (!h) return;
    var shown = true;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function (self) {
        var show = self.direction < 0 || self.scroll() < 160 || document.body.classList.contains("menu-open") || h.contains(document.activeElement);
        if (show === shown) return;
        shown = show;
        gsap.to(h, { yPercent: show ? 0 : -100, duration: 0.3, ease: "power2.out" });
      }
    });
  }

  /* ボタン: ポインターに少しだけ吸い寄せられる */
  function magnet() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (!b) return;
      var r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.15, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.3, ease: "power2.out" });
    });
    document.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (b && !b.contains(e.relatedTarget)) gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  }

  document.addEventListener("teashi:rendered", function (e) { scan(e.detail); });
  document.addEventListener("DOMContentLoaded", function () { hero(); header(); magnet(); scan(document); });
})();
