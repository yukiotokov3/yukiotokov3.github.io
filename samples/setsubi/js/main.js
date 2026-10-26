/* =========================================================
   有限会社青葉設備工業 ホームページ 共通の動き
   ※ 通常の更新では、このファイルを触る必要はありません。
      お知らせ・実績・求人は data フォルダのファイルを書き換えてください。
   ========================================================= */

(function () {
  "use strict";

  // 文字をHTMLとして安全に表示するための変換
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 写真の枠（見本のため写真は入れず、説明文だけを表示。写真を入れるときは img を戻す）
  function photo(src, label, plan) {
    return (
      '<div class="photo photo-plan">' +
      '<div class="photo-label"><span class="plan-tag">写真の提案</span>' +
      '<span class="plan-desc">' + esc(plan || label) + "</span></div>" +
      "</div>"
    );
  }

  /* ---------- ヘッダー：スクロールで影をつける ---------- */
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (toTop) toTop.classList.toggle("is-show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0 });
    });
  }

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

  /* ---------- お知らせ ---------- */
  var newsTargets = document.querySelectorAll("[data-news]");
  if (newsTargets.length) {
    var news = window.SITE_NEWS || [];
    newsTargets.forEach(function (target) {
      var limit = parseInt(target.getAttribute("data-news"), 10) || news.length;
      var showBody = target.hasAttribute("data-news-body");
      var items = news.slice(0, limit);
      if (!items.length) {
        target.innerHTML = '<li class="news-empty">現在お知らせはありません。</li>';
        return;
      }
      target.innerHTML = items.map(function (n) {
        return (
          "<li><div class=\"news-item\">" +
          '<span class="news-date">' + esc(n.date) + "</span>" +
          '<span class="news-cat">' + esc(n.category) + "</span>" +
          '<span class="news-title">' + esc(n.title) +
          (showBody && n.body ? '<p class="news-body">' + esc(n.body) + "</p>" : "") +
          "</span></div></li>"
        );
      }).join("");
    });
  }

  /* ---------- 施工実績 ---------- */
  var worksTarget = document.querySelector("[data-works]");
  if (worksTarget) {
    var works = window.SITE_WORKS || [];
    var worksLimit = parseInt(worksTarget.getAttribute("data-works"), 10) || works.length;

    var renderWorks = function (type) {
      var list = works.filter(function (w) { return !type || w.type === type; }).slice(0, worksLimit);
      if (!list.length) {
        worksTarget.innerHTML = '<p class="works-empty">実績は準備中です。</p>';
        return;
      }
      worksTarget.innerHTML = list.map(function (w) {
        return (
          '<article class="work-item">' +
          photo(w.image, w.title, w.plan) +
          "<h3>" + esc(w.title) + "</h3>" +
          '<p class="work-meta"><span class="work-tag">' + esc(w.type) + "</span>" +
          esc(w.place) + "　" + esc(w.year) + "</p>" +
          "</article>"
        );
      }).join("");
    };
    renderWorks("");

    var filter = document.querySelector(".works-filter");
    if (filter) {
      filter.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        filter.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        renderWorks(btn.getAttribute("data-type"));
      });
    }
  }

  /* ---------- 採用：職種タブ ---------- */
  var jobsTarget = document.querySelector("[data-jobs]");
  if (jobsTarget) {
    var jobs = window.SITE_JOBS || [];
    var tabs = jobs.map(function (j, i) {
      return (
        '<button type="button" role="tab" id="job-tab-' + i + '" aria-controls="job-panel-' + i + '" ' +
        'aria-selected="' + (i === 0 ? "true" : "false") + '">' + esc(j.name) + "</button>"
      );
    }).join("");
    var panels = jobs.map(function (j, i) {
      return (
        '<div class="tab-panel" role="tabpanel" id="job-panel-' + i + '" aria-labelledby="job-tab-' + i + '"' +
        (i === 0 ? "" : " hidden") + ">" +
        '<p class="job-desc">' + esc(j.description) + "</p>" +
        '<table class="table"><tbody>' +
        "<tr><th>職種</th><td>" + esc(j.name) + "</td></tr>" +
        "<tr><th>必要なもの</th><td>" + esc(j.requirement) + "</td></tr>" +
        "</tbody></table></div>"
      );
    }).join("");
    jobsTarget.innerHTML = '<div class="tabs" role="tablist">' + tabs + "</div>" + panels;

    jobsTarget.querySelector(".tabs").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      jobsTarget.querySelectorAll('[role="tab"]').forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-selected", on ? "true" : "false");
        document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
      });
    });
  }

  var recruitTable = document.querySelector("[data-recruit-table]");
  if (recruitTable) {
    recruitTable.innerHTML = (window.SITE_RECRUIT || []).map(function (row) {
      return "<tr><th>" + esc(row[0]) + "</th><td>" + esc(row[1]) + "</td></tr>";
    }).join("");
  }

  /* ---------- お問い合わせフォーム ---------- */
  var form = document.querySelector(".form");
  if (form) {
    // 「採用への応募」を選んだときだけ、希望職種と年齢の欄を出す
    var recruitOnly = form.querySelectorAll(".only-recruit");
    var updateKind = function () {
      var checked = form.querySelector('input[name="種別"]:checked');
      var isRecruit = checked && checked.value === "採用への応募";
      recruitOnly.forEach(function (el) { el.hidden = !isRecruit; });
    };
    form.addEventListener("change", updateKind);

    // URLの最後が ?type=recruit なら、最初から「採用への応募」を選んでおく
    if (/[?&]type=recruit/.test(location.search)) {
      var r = form.querySelector('input[value="採用への応募"]');
      if (r) r.checked = true;
    }
    updateKind();

    var message = form.querySelector(".form-message");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action") || "";
      if (!action || action.indexOf("YOUR_FORM_ID") !== -1) {
        message.textContent = "これは見本サイトのため、送信されません。";
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      message.textContent = "送信しています…";
      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("send failed");
        form.reset();
        updateKind();
        message.textContent = "送信が完了しました。担当者より折り返しご連絡いたします。";
      }).catch(function () {
        message.textContent = "送信できませんでした。お手数ですが、お電話（000-000-0000）でお問い合わせください。";
      }).then(function () {
        button.disabled = false;
      });
    });
  }

  /* ---------- スクロールでふわっと表示 ---------- */
  var fades = document.querySelectorAll(".fade");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    fades.forEach(function (el) { io.observe(el); });
  } else {
    fades.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- フッターの年 ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
