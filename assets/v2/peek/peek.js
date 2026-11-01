/* テアシ商会の社内をのぞく窓(2026-11-01)
   ・日本時間で中の様子が変わる(決まった予定をもとにした絵で、実況ではない)
   ・ボードには最近の公開、吹き出しには活動記録の一部が出る(data.json はサイトを組むたびに書き出す)
   ・人を押すと、その人の役割と最近の仕事が出る
   試しに時刻を変えて見るとき: ?peek=23:10 や ?peek=mon-09:50 */
(function () {
  "use strict";
  var SCRIPT = document.currentScript;
  var DATA_URL = SCRIPT ? new URL("data.json", SCRIPT.src).href : null;
  var LAYOUTS = {
    band: { W: 400, H: 80, wallH: 40, rail: 27, windows: [8, 348], clock: [56, 7], poster: [76, 8], board: [196, 4, 84, 30], shelf: [292, 6], plant: [318, 28], server: [332, 14],
      lamps: [62, 112, 162, 362], staff: [62, 112, 162], DY: 56, chairY: 36, boxY: 40, boss: { cx: 362, DY: 56, chairY: 34, figY: 36 }, lime: [274, 41], limeWrites: true,
      meet: [[200, 40], [224, 40], [248, 40]], meetBoss: [276, 33] },
    hero: { W: 176, H: 144, wallH: 54, rail: 40, windows: [8], clock: [52, 8], poster: [52, 24], board: [84, 5, 86, 32], shelf: null, plant: [158, 86], server: null,
      lamps: [28, 82, 136], staff: [28, 82, 136], DY: 78, chairY: 58, boxY: 62, boss: { cx: 116, DY: 120, chairY: 100, figY: 102 }, lime: [22, 112], limeWrites: false,
      meet: [[6, 108], [30, 108], [54, 108]], meetBoss: [74, 98] }
  };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PEOPLE = {
    kikaku:  { name: "企画", kind: "AI社員", color: "#4A6400", shade: "#36490a", role: "何を作るかの案出しと、仕様・原稿の下書き", verb: "の案と原稿を出した" },
    gijutsu: { name: "技術", kind: "AI社員", color: "#3a3a42", shade: "#24242a", role: "コードを書いて、公開の準備をする", verb: "を組んで、公開の準備をした" },
    henshu:  { name: "編集", kind: "AI社員", color: "#e0894a", shade: "#b8662f", role: "文章と見た目を確かめて、直す", verb: "の文と見た目を確かめた" },
    lime:    { name: "秘書ライム", kind: "AI秘書", color: "#9BCB00", shade: "#6f9200", role: "SNSの数字の記録と、調べもの", verb: null },
    boss:    { name: "社長", kind: "人", role: "何を作るかと、公開するかを決める", verb: "の公開を決めた" }
  };
  var STAFF = [{ id: "kikaku", ex: "open" }, { id: "gijutsu", ex: "focus" }, { id: "henshu", ex: "happy" }];

  // ---------- 時刻 ----------
  function nowJST() {
    var q = new URLSearchParams(location.search).get("peek");
    var d = new Date(Date.now() + 9 * 3600e3);
    var dow = d.getUTCDay(), h = d.getUTCHours(), m = d.getUTCMinutes();
    if (q) {
      var mm = q.match(/^(?:(sun|mon|tue|wed|thu|fri|sat)-)?(\d{1,2}):(\d{2})$/);
      if (mm) { if (mm[1]) dow = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(mm[1]); h = +mm[2]; m = +mm[3]; }
    }
    return { dow: dow, h: h, m: m, t: h * 60 + m };
  }

  // ---------- その時刻の様子 ----------
  function scene(n, data) {
    var t = n.t, weekday = n.dow >= 1 && n.dow <= 5;
    var s = {
      sky: t < 300 || t >= 1140 ? "night" : t < 600 ? "morning" : t < 960 ? "day" : "evening",
      kikaku: "desk", gijutsu: "desk", henshu: "desk", boss: "away", lime: "away", meeting: false, lunch: false, bubbles: {}
    };
    s.label = { night: "夜", morning: "朝", day: "昼", evening: "夕方" }[s.sky];
    if (t >= 600 && t < 1140) s.boss = "desk";
    if (t >= 1380 || t < 360) s.kikaku = "sleep";
    if (t >= 1260 || t < 420) s.henshu = "away";
    if ((t >= 510 && t < 560) || (t >= 780 && t < 820) || (n.dow === 0 && t >= 1260 && t < 1320)) s.lime = "board";
    if (n.dow === 1 && t >= 585 && t < 630) { s.meeting = true; s.kikaku = s.gijutsu = s.henshu = "board"; s.boss = "board"; s.lime = "away"; }
    if (t >= 720 && t < 780) s.lunch = true;

    var B = s.bubbles, latest = data && data.works && data.works[0], log = data && data.log && data.log[0];
    var short = function (str, n2) { return str.length > n2 ? str.slice(0, n2 - 1) + "…" : str; };
    if (s.meeting) {
      B.kikaku = "週次会議。今週の作りかけを読み上げ中"; B.boss = "次に作る1案を決める";
    } else if (s.lunch) {
      B.henshu = "お昼休み(画面だけ休憩中)"; B.boss = "お昼ごはん";
      B.gijutsu = "休まずにコードを書いている";
    } else {
      if (weekday && t >= 1044 && t < 1080) B.kikaku = "きょうの日報を書いている";
      else if (s.kikaku === "sleep") B.kikaku = "机でうとうと…";
      else B.kikaku = "次に作るものの案を考えている";
      B.gijutsu = s.sky === "night" ? "夜も作業中。コードを組んでいる" : "コードを書いている";
      if (t >= 532 && t < 560) B.gijutsu = "SNSの数字をダッシュボードへ反映中";
      if (s.henshu === "desk") B.henshu = log ? "最新の活動記録を確認:「" + short(log.text, 14) + "」" : "文の言い回しを確かめている";
      if (s.lime === "board") B.lime = n.dow === 0 && t >= 1260 ? "外部監査のレポートを出した" : t < 560 ? "けさのSNSの数字を記録した" : "調べものの結果を報告中";
      if (s.boss === "desk") B.boss = latest ? "「" + short(latest.name, 14) + "」を見返している" : "作ったものを確かめている";
    }
    return s;
  }

  // ---------- 絵 ----------
  function Painter(ctx, L) {
    var c = ctx, W = L.W, H = L.H, DY = L.DY;
    var R = function (x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); };
    var PAL = { k: "#16161a", s: "#f3d0a8", S: "#d9a77e", g: "#9BCB00", H: "#3a2416", J: "#5a3a24", r: "#d9776a", x: "#f7f7f2", n: "#2a2a30", N: "#1c1c21", m: "#5c5f66", M: "#43464c" };
    function spr(rows, x, y, pal) {
      var p = {}, k; for (k in PAL) p[k] = PAL[k]; if (pal) for (k in pal) p[k] = pal[k];
      for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) { var ch = rows[j][i]; if (ch !== ".") { c.fillStyle = p[ch]; c.fillRect(x + i, y + j, 1, 1); } }
    }
    var HEAD_BOSS = ["..kkkkkkkk..", ".kHHHHHHHHk.", "kHHHJJHHHHHk", "kHHssssssHHk", "kHsksssskSSk", "kssksssskSSk", "kssssssssSSk", "kssssrrssSSk", ".kssssssSSk.", "..kkkkkkkk.."];
    var HEAD_BOSS_BLINK = HEAD_BOSS.map(function (r, i) { return i === 4 ? "kHssssssssSk" : i === 5 ? "kskksssskkSk" : r; });
    var SUIT = ["..kkkkkkkkkk..", ".kccxxggxxccCk", "kcccxxggxxcCCk", "kccccxggxccCCk", "kcccccggcccCCk", "kccccccccccCCk", "kccccccccccCCk", "kccccccccccCCk", "kccccccccccCCk", "kccccccccccCCk"];
    var BOX = [".kkkkkkkkkkkkkkkk.", "kchhhhcccccccccCCk", "kckkkkkkkkkkkkkcCk"];
    for (var i = 0; i < 7; i++) BOX.push("kckbbbbbbbbbbbkcCk");
    BOX.push("kckkkkkkkkkkkkkcCk", "kccccccccccgcccCCk", "kCCCCCCCCCCCCCCCCk", ".kkkkkkkkkkkkkkkk.");
    var MON = ["kkkkkkkkkkkkkkkk", "kmmmmmmmmmmmmmMk", "kmmmmmmmmmmmmmMk", "kmmmmmmggmmmmmMk", "kmmmmmmggmmmmmMk", "kmmmmmmmmmmmmmMk", "kmmmmmmmmmmmmmMk", "kMMMMMMMMMMMMMMk", "kkkkkkkkkkkkkkkk", "......kmMk......", "....kkkkkkkk...."];

    var SKY = {
      morning: ["#9fd0ee", "#e8f5fb", "#7aa6c4", "#fffbe6"], day: ["#5fa8e0", "#bfe2f7", "#5a87ad", "#ffffff"],
      evening: ["#f4a259", "#f9dc8f", "#c06a3a", "#fff2b8"], night: ["#0b1430", "#22305e", "#121a33", null]
    };
    function room(s) {
      var night = s.sky === "night", sk = SKY[s.sky], x, y, i;
      var wh = L.wallH, rl = L.rail;
      R(0, 0, W, wh, "#4a4842"); for (x = 0; x < W; x += 6) R(x, 0, 1, rl + 1, "#504e47");
      R(0, rl, W, 1, "#9BCB00"); R(0, rl + 1, W, wh - rl - 3, "#3a342c"); for (x = 2; x < W; x += 22) { R(x, rl + 3, 18, wh - rl - 7, "#453e35"); R(x, rl + 3, 18, 1, "#2e2922"); }
      R(0, wh - 2, W, 2, "#26221d");
      for (y = wh; y < H; y += 4) { R(0, y, W, 4, (y / 4) % 2 ? "#6b4a32" : "#654530"); R(0, y, W, 1, "#5a3d29"); for (x = (y * 7) % 40; x < W; x += 40) R(x, y, 1, 4, "#56392a"); }
      L.windows.forEach(function (wx) {
        var g = c.createLinearGradient(0, 6, 0, 26); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]);
        R(wx - 2, 4, 40, 24, "#2b2620"); c.fillStyle = g; c.fillRect(wx, 6, 36, 20);
        [[0, 8, 6], [6, 12, 5], [11, 5, 7], [18, 10, 6], [24, 7, 5], [29, 13, 7]].forEach(function (b) {
          R(wx + b[0], 26 - b[1], b[2], b[1], sk[2]);
          if (night) for (var yy = 26 - b[1] + 2; yy < 25; yy += 3) for (var xx = 1; xx < b[2] - 1; xx += 2) if ((xx * 7 + yy * 3 + b[0]) % 5 < 2) R(wx + b[0] + xx, yy, 1, 1, "#f2d36b");
        });
        if (night) { R(wx + 5, 9, 1, 1, "#fff"); R(wx + 20, 8, 1, 1, "#fff"); R(wx + 29, 11, 1, 1, "#cde"); }
        else { R(wx + 22, 10, 5, 5, sk[3]); R(wx + 23, 9, 3, 1, sk[3]); R(wx + 3, 9, 8, 2, "rgba(255,255,255,.7)"); R(wx + 5, 8, 4, 1, "rgba(255,255,255,.7)"); }
        R(wx + 17, 6, 2, 20, "#2b2620"); R(wx, 15, 36, 1, "#2b2620"); R(wx - 3, 26, 42, 2, "#5c5247"); R(wx - 3, 26, 42, 1, "#7a6e5f");
        if (!night) { c.fillStyle = s.sky === "evening" ? "rgba(255,190,110,.13)" : "rgba(255,255,255,.07)"; c.beginPath(); c.moveTo(wx - 4, wh); c.lineTo(wx + 40, wh); c.lineTo(wx + 62, wh + 30); c.lineTo(wx + 12, wh + 30); c.fill(); }
      });
      L.lamps.forEach(function (x) { R(x, 0, 1, 4, "#16161a"); R(x - 4, 4, 9, 3, "#16161a"); R(x - 3, 4, 7, 2, "#2f2f34"); R(x - 2, 7, 5, 1, night ? "#fff2b8" : "#e9dfb8"); });
      var ck = L.clock; R(ck[0], ck[1], 11, 11, "#16161a"); R(ck[0] + 1, ck[1] + 1, 9, 9, "#efeee6"); R(ck[0] + 1, ck[1] + 1, 9, 1, "#fff");
      var po = L.poster; R(po[0], po[1], 22, 14, "#16161a"); R(po[0] + 1, po[1] + 1, 20, 12, "#111"); R(po[0] + 4, po[1] + 7, 3, 3, "#efeee6"); R(po[0] + 8, po[1] + 5, 4, 4, "#efeee6"); R(po[0] + 13, po[1] + 3, 5, 5, "#efeee6"); R(po[0] + 17, po[1] + 9, 2, 2, "#9BCB00");
      var bd = L.board; R(bd[0], bd[1], bd[2], bd[3], "#16161a"); R(bd[0] + 1, bd[1] + 1, bd[2] - 2, bd[3] - 3, "#f4f3ee"); R(bd[0] + 1, bd[1] + 1, bd[2] - 2, 1, "#ffffff"); R(bd[0] + 1, bd[1] + bd[3] - 3, bd[2] - 2, 1, "#c9c7bd");
      R(bd[0] + 4, bd[1] + bd[3] - 1, 40, 2, "#8b8f96"); R(bd[0] + 9, bd[1] + bd[3] - 2, 4, 1, "#d9534f"); R(bd[0] + 15, bd[1] + bd[3] - 2, 4, 1, "#3d6fb0"); R(bd[0] + bd[2] - 6, bd[1] + 3, 3, 3, "#9BCB00"); R(bd[0] + 3, bd[1] + 3, 3, 3, "#d9534f");
      if (L.shelf) {
        var sx = L.shelf[0], sy = L.shelf[1]; R(sx, sy, 22, 32, "#16161a"); R(sx + 1, sy + 1, 20, 30, "#5a3e2a");
        var cols = ["#9BCB00", "#efeee6", "#e0894a", "#3d6fb0", "#d9534f", "#4A6400"];
        for (i = 0; i < 3; i++) { R(sx + 1, sy + 10 + i * 10, 20, 2, "#3d2a1c"); for (var b = 0; b < 6; b++) { var hh = 6 + ((b + i) % 3); R(sx + 2 + b * 3, sy + 10 + i * 10 - hh, 2, hh, cols[(b + i * 2) % 6]); R(sx + 2 + b * 3, sy + 10 + i * 10 - hh, 2, 1, "rgba(255,255,255,.35)"); } }
      }
      var pl = L.plant; R(pl[0], pl[1], 10, 10, "#16161a"); R(pl[0] + 1, pl[1] + 1, 8, 9, "#b8662f"); R(pl[0] + 1, pl[1] + 1, 8, 1, "#e0894a");
      [[4, -14], [0, -10], [8, -11], [2, -6], [7, -6], [5, -9]].forEach(function (p, i) { R(pl[0] + p[0] - 1, pl[1] + p[1] - 1, 5, 4, "#16161a"); R(pl[0] + p[0], pl[1] + p[1], 3, 2, i % 2 ? "#6f9200" : "#9BCB00"); });
      if (L.server) { var sv = L.server; R(sv[0], sv[1], 10, 24, "#16161a"); R(sv[0] + 1, sv[1] + 1, 8, 8, "#9fd3f0"); R(sv[0] + 1, sv[1] + 1, 8, 2, "#c9ecff"); R(sv[0] + 1, sv[1] + 9, 8, 14, "#efeee6"); R(sv[0] + 3, sv[1] + 13, 2, 1, "#3d6fb0"); R(sv[0] + 6, sv[1] + 13, 2, 1, "#d9534f"); }
    }
    function clockHands(n) {
      var cx = L.clock[0] + 5.5, cy = L.clock[1] + 5.5, a1 = ((n.h % 12) + n.m / 60) / 12 * Math.PI * 2, a2 = n.m / 60 * Math.PI * 2;
      [[a1, 2.6], [a2, 3.8]].forEach(function (p) { for (var r = 0; r <= p[1]; r += 0.5) R(Math.floor(cx + Math.sin(p[0]) * r), Math.floor(cy - Math.cos(p[0]) * r), 1, 1, "#16161a"); });
      R(L.clock[0] + 5, L.clock[1] + 1, 1, 1, "#9BCB00");
    }
    function chair(cx, y) { R(cx - 10, y, 20, 20, "#16161a"); R(cx - 9, y + 1, 18, 19, "#3b3530"); R(cx - 9, y + 1, 18, 2, "#554c44"); R(cx - 8, y + 3, 1, 14, "#4a423b"); }
    function desk(x, y, w, tag) {
      R(x, y, w, 1, "#16161a"); R(x, y + 1, w, 3, "#b88a5c"); R(x + 1, y + 1, w - 2, 1, "#dcae7e"); R(x, y + 4, w, 1, "#16161a"); R(x + 1, y + 5, w - 2, 9, "#8a6040"); R(x + 1, y + 5, w - 2, 1, "#6b4a30");
      for (var gx = x + 4; gx < x + w - 4; gx += 7) R(gx, y + 7 + (gx % 3), 4, 1, "#7d5739");
      R(x, y + 1, 1, 14, "#16161a"); R(x + w - 1, y + 1, 1, 14, "#16161a"); R(x, y + 14, w, 1, "#16161a");
      R(x + 2, y + 15, 3, 4, "#16161a"); R(x + 3, y + 15, 1, 3, "#5a3d26"); R(x + w - 5, y + 15, 3, 4, "#16161a"); R(x + w - 4, y + 15, 1, 3, "#5a3d26");
      R(x + w - 15, y + 7, 11, 5, "#16161a"); R(x + w - 14, y + 8, 9, 3, "#7a5536"); R(x + w - 11, y + 9, 3, 1, "#dcae7e");
      if (tag) { R(x + 4, y + 7, 8, 4, "#16161a"); R(x + 5, y + 8, 6, 2, tag); }
      c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(x + 2, y + 19, w, 2);
    }
    function keyboard(cx, y) { R(cx - 7, y, 14, 2, "#16161a"); R(cx - 6, y, 12, 1, "#d8d8d0"); }
    function mug(x, y, f, steam) { R(x, y, 5, 6, "#16161a"); R(x + 1, y + 1, 3, 4, "#efeee6"); R(x + 1, y + 1, 3, 1, "#6b3a1f"); R(x + 5, y + 2, 1, 3, "#16161a"); if (steam) { var s = f % 3; R(x + 1 + (s % 2), y - 2 - s, 1, 1, "rgba(255,255,255,.7)"); R(x + 2 - (s % 2), y - 4 - s, 1, 1, "rgba(255,255,255,.5)"); } }
    function papers(x, y) { R(x, y, 9, 3, "#16161a"); R(x + 1, y, 7, 2, "#efeee6"); R(x + 2, y - 1, 6, 1, "#16161a"); R(x + 2, y, 6, 1, "#fff"); }
    function face(x, y, ex, lit) {
      var sx = x + 3, sy = y + 3; for (var j = 0; j < 7; j++) R(sx, sy + j, 11, 1, j % 2 ? "#1b2509" : "#223010"); R(sx, sy, 3, 1, "#3a4a1a"); R(sx, sy + 1, 1, 1, "#3a4a1a");
      var g = lit ? "#d2f25a" : "#9BCB00"; var P = function (dx, dy, w) { R(sx + dx, sy + dy, w || 1, 1, g); };
      if (ex === "blink" || ex === "sleep") { P(2, 3, 2); P(7, 3, 2); P(5, 5); }
      else if (ex === "happy") { P(2, 3); P(3, 2); P(4, 3); P(6, 3); P(7, 2); P(8, 3); P(4, 5, 3); P(3, 4); P(7, 4); }
      else if (ex === "focus") { P(2, 2, 3); P(6, 2, 3); P(3, 3); P(7, 3); P(4, 5, 3); }
      else { P(3, 2); P(3, 3); P(7, 2); P(7, 3); P(4, 5, 3); P(3, 4); P(7, 4); }
    }
    function box(x, y, col, sh, ex, lit) { spr(BOX, x, y, { c: col, C: sh, h: "rgba(255,255,255,.45)", b: "#1b2509" }); face(x, y, ex, lit); }
    function arm(x0, y0, x1, y1, col) {
      var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), t, x, y;
      for (t = 0; t <= n; t++) { x = Math.round(x0 + (x1 - x0) * t / n); y = Math.round(y0 + (y1 - y0) * t / n); R(x - 1, y, 3, 1, "#16161a"); }
      for (t = 0; t <= n; t++) { x = Math.round(x0 + (x1 - x0) * t / n); y = Math.round(y0 + (y1 - y0) * t / n); R(x, y, 1, 1, col); }
      R(x1 - 1, y1 - 1, 4, 4, "#16161a"); R(x1, y1, 2, 2, col);
    }
    function standingBox(x, y, p, ex, lit, f, write) {
      c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x, y + 19, 18, 2);
      box(x, y, p.color, p.shade, ex, lit);
      if (write && L.limeWrites) { var w = f % 4 < 2; arm(x + 17, y + 5, x + 20, y - 3 + (w ? 0 : 2), p.color); R(x + 21, y - 4 + (w ? 0 : 2), 1, 2, "#3d6fb0"); }
      else arm(x + 17, y + 7, x + 20, y + 11, p.color);
      arm(x, y + 7, x - 3, y + 11, p.color);
      [[4, 0], [12, 1]].forEach(function (d) { var up = (f + d[1]) % 4 === 0 ? 1 : 0; R(x + d[0], y + 14 - up, 2, 4, "#16161a"); R(x + d[0] - 1, y + 17 - up, 4, 2, "#16161a"); });
    }
    function bossFigure(x, y, f, standing) {
      spr((f % 17) === 0 ? HEAD_BOSS_BLINK : HEAD_BOSS, x + 1, y);
      spr(SUIT, x, y + 10, { c: "#2a2a30", C: "#1c1c21" });
      if (standing) { R(x + 1, y + 20, 12, 8, "#16161a"); R(x + 2, y + 20, 4, 7, "#2a2a30"); R(x + 8, y + 20, 4, 7, "#2a2a30"); R(x, y + 27, 6, 2, "#3a2416"); R(x + 8, y + 27, 6, 2, "#3a2416"); }
    }

    // 人の当たり判定(押せる範囲)
    var hits = {};
    function draw(s, n, f) {
      var night = s.sky === "night";
      c.clearRect(0, 0, W, H); room(s); clockHands(n); hits = {};
      STAFF.forEach(function (st, i) {
        var p = PEOPLE[st.id], state = s[st.id], cx = L.staff[i];
        chair(cx, L.chairY);
        var seated = state === "desk" || state === "sleep";
        if (seated) {
          var sleep = state === "sleep", bob = sleep ? 1 : ((f + i * 2) % 8 < 4 ? 0 : 1);
          var ex = sleep ? "sleep" : (((f + i * 7) % 23) === 0 ? "blink" : st.ex);
          box(cx - 9, L.boxY + bob, p.color, p.shade, ex, night);
          hits[st.id] = [cx - 12, L.chairY, 24, DY - L.chairY + 20];
        }
        desk(cx - 22, DY, 44, ["#9BCB00", "#efeee6", "#e0894a"][i]);
        spr(MON, cx - 26 + (i === 1 ? 30 : 2), DY - 11);
        if (seated) {
          [[-6, 0], [4, 1]].forEach(function (d) { var up = state === "desk" && (f + i + d[1]) % 4 === 0 ? 1 : 0; R(cx + d[0], DY + 15 - up, 2, 3, "#16161a"); R(cx + d[0] - 1, DY + 17 - up, 4, 2, "#16161a"); });
          if (night) { c.fillStyle = "rgba(210,242,90,.18)"; c.fillRect(cx - 8, L.boxY + 1, 16, 10); }
        }
        keyboard(cx, DY - 1);
        if (seated) {
          var tt = state === "sleep" ? 0 : ((f + i) % 4 < 2 ? 0 : 1);
          [[cx - 6, tt], [cx + 3, 1 - tt]].forEach(function (h) { R(h[0] - 1, DY - 3 - h[1], 5, 4, "#16161a"); R(h[0], DY - 2 - h[1], 3, 2, p.color); });
        }
        if (i === 0) mug(cx + 12, DY - 6, f, !night && !reduce); if (i === 1) papers(cx - 20, DY - 3); if (i === 2) { mug(cx + 10, DY - 6, f + 1, !night && !reduce); papers(cx - 19, DY - 3); }
        if (state === "sleep") { var z = reduce ? 0 : f % 6; c.fillStyle = "#efeee6"; c.font = "5px monospace"; c.fillText("z", cx + 8, L.boxY - 2 - z); c.fillText("Z", cx + 11, L.boxY - 7 - z); }
      });
      var B = L.boss, bx = B.cx;
      var bossDesk = function () {
        chair(bx, B.chairY); R(bx - 11, B.chairY - 2, 22, 4, "#16161a"); R(bx - 10, B.chairY - 1, 20, 2, "#1f2a0a");
        if (s.boss === "desk") { bossFigure(bx - 7, B.figY, f, false); hits.boss = [bx - 14, B.chairY - 4, 28, 30]; }
        desk(bx - 28, B.DY, 56); R(bx - 8, B.DY - 4, 16, 4, "#16161a"); R(bx - 7, B.DY - 3, 14, 2, "#9BCB00");
        if (s.boss === "desk") { papers(bx + 12, B.DY - 3); mug(bx - 22, B.DY - 6, f + 2, !night && !reduce); }
      };
      var front = B.DY > DY; // 社長の机が手前の列なら、立っている人より後に描く
      if (!front) bossDesk();
      if (s.meeting) {
        STAFF.forEach(function (st, i) { var m = L.meet[i]; standingBox(m[0], m[1], PEOPLE[st.id], ((f + i * 5) % 23) === 0 ? "blink" : st.ex, night, f + i, false); hits[st.id] = [m[0] - 3, m[1] - 4, 24, 26]; });
      }
      if (s.lime === "board") { var lm = L.lime; standingBox(lm[0], lm[1] + (f % 8 < 4 ? 0 : 1), PEOPLE.lime, ((f % 19) === 0) ? "blink" : "happy", night, f, true); hits.lime = [lm[0] - 4, lm[1] - 10, 28, 34]; }
      if (s.boss === "board") { bossFigure(L.meetBoss[0], L.meetBoss[1], f, true); hits.boss = [L.meetBoss[0] - 4, L.meetBoss[1] - 3, 22, 34]; }
      if (front) bossDesk();
      if (night) {
        c.fillStyle = "rgba(8,10,30,.38)"; c.fillRect(0, 0, W, H);
        var gx = L.staff[1], g = c.createRadialGradient(gx, L.boxY + 6, 2, gx, L.boxY + 6, 30); g.addColorStop(0, "rgba(210,242,90,.35)"); g.addColorStop(1, "rgba(210,242,90,0)"); c.fillStyle = g; c.fillRect(gx - 42, L.boxY - 30, 84, 70);
        var lg = c.createRadialGradient(gx, 8, 1, gx, 8, 26); lg.addColorStop(0, "rgba(255,242,184,.35)"); lg.addColorStop(1, "rgba(255,242,184,0)"); c.fillStyle = lg; c.fillRect(gx - 32, 0, 64, 40); R(gx - 2, 7, 5, 1, "#fff2b8");
      }
    }
    return { draw: draw, hit: function (x, y) { for (var k in hits) { var r = hits[k]; if (x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return k; } return null; }, hits: function () { return hits; } };
  }

  // ---------- 画面の部品 ----------
  // 吹き出しの位置(しっぽの先)。右寄りの人は左向きに出す
  function bubblePos(L, s, id) {
    var p;
    if (s.meeting && L.meet && ["kikaku", "gijutsu", "henshu"].indexOf(id) >= 0) { var m = L.meet[["kikaku", "gijutsu", "henshu"].indexOf(id)]; p = [m[0] + 6, m[1] - 2]; }
    else if (id === "boss") p = s.boss === "board" ? [L.meetBoss[0] + 7, L.meetBoss[1] - 2] : [L.boss.cx + 2, L.boss.figY - 2];
    else if (id === "lime") p = [L.lime[0] + 6, L.lime[1] - 2];
    else p = [L.staff[["kikaku", "gijutsu", "henshu"].indexOf(id)] - 7, L.boxY - 2];
    return [p[0], p[1], p[0] > L.W * 0.6];
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }
  function mmdd(d) { var p = (d || "").split("-"); return p.length === 3 ? p[1] + "/" + p[2] : d; }

  function mount(root) {
    var mode = root.getAttribute("data-peek") || "band";
    var detail = root.getAttribute("data-detail") || "/samples/detail/#";
    var stage = root.querySelector(".peek-stage");
    var L = LAYOUTS[mode === "hero" ? "hero" : "band"], W = L.W, H = L.H;
    stage.style.aspectRatio = W + " / " + H;
    stage.innerHTML = '<canvas width="' + W + '" height="' + H + '" role="img"></canvas><div class="peek-board" aria-hidden="true"></div><div class="peek-bubbles" aria-hidden="true"></div><div class="peek-card" role="dialog" aria-modal="false" hidden></div>';
    var canvas = stage.querySelector("canvas"), ctx = canvas.getContext("2d");
    var boardEl = stage.querySelector(".peek-board"), bubblesEl = stage.querySelector(".peek-bubbles"), card = stage.querySelector(".peek-card");
    var bd = L.board; boardEl.style.left = ((bd[0] + 4) / W * 100) + "%"; boardEl.style.top = ((bd[1] + 3) / H * 100) + "%"; boardEl.style.width = ((bd[2] - 10) / W * 100) + "%";
    var clockEl = root.querySelector(".peek-clock"), liveEl = root.querySelector(".peek-live"), chips = root.querySelector(".peek-chips");
    var painter = Painter(ctx, L), data = null, f = 0, bubbleIdx = 0, lastKey = "";

    function present(s) { return ["kikaku", "gijutsu", "henshu", "lime", "boss"].filter(function (id) { return s[id] !== "away"; }); }

    function renderBoard() {
      if (!data || !data.works) return;
      boardEl.innerHTML = "<b>最近の公開</b>" + data.works.slice(0, 3).map(function (w) { return "<span>" + esc(mmdd(w.date)) + " #" + w.no + " " + esc(w.name) + "</span>"; }).join("");
    }
    function renderChips(s) {
      var ids = present(s);
      chips.innerHTML = ids.map(function (id) { return '<button type="button" data-who="' + id + '"><i style="background:' + (PEOPLE[id].color || "#f3d0a8") + '"></i>' + PEOPLE[id].name + "</button>"; }).join("");
    }
    function renderText(s, n) {
      var hh = ("0" + n.h).slice(-2) + ":" + ("0" + n.m).slice(-2);
      if (clockEl) clockEl.textContent = "日本時間 " + hh + " ・ " + (s.meeting ? "週次会議" : s.label);
      var ids = present(s);
      var names = ids.map(function (id) { return PEOPLE[id].name; }).join("・");
      var lines = ids.filter(function (id) { return s.bubbles[id]; }).map(function (id) { return PEOPLE[id].name + ":" + s.bubbles[id]; });
      canvas.setAttribute("aria-label", "テアシ商会の事務所のドット絵。いまいるのは " + names + "。");
      if (liveEl) liveEl.textContent = lines.join(" / ") + (data && data.works ? " / 最近の公開:" + data.works.slice(0, 3).map(function (w) { return "#" + w.no + " " + w.name; }).join("、") : "");
    }
    function showBubble(s) {
      var ids = Object.keys(s.bubbles).filter(function (id) { return s[id] !== "away"; });
      bubblesEl.innerHTML = "";
      if (!ids.length) return;
      var id = ids[bubbleIdx % ids.length], pos = bubblePos(L, s, id);
      var b = document.createElement("div"); b.className = "peek-bubble" + (pos[2] ? " is-boss" : "");
      b.style.left = (pos[0] / W * 100) + "%"; b.style.top = (pos[1] / H * 100) + "%";
      b.innerHTML = "<small>" + PEOPLE[id].name + "</small>" + esc(s.bubbles[id]);
      bubblesEl.appendChild(b);
      bubbleIdx++;
    }
    function openCard(id, s) {
      var p = PEOPLE[id], w = data && data.works && data.works[0], recent;
      if (id === "lime") recent = "毎朝、SNSの数字を記録している";
      else if (w) recent = '<a href="' + esc(detail + w.id) + '">#' + w.no + " " + esc(w.name) + "</a>" + p.verb;
      else recent = "—";
      card.innerHTML = '<button type="button" class="peek-close" aria-label="閉じる">×</button><p class="peek-card-kind">' + p.kind + "</p><p class=\"peek-card-name\">" + p.name + "</p><p>" + p.role + '</p><p class="peek-card-recent"><span>最近の仕事</span>' + recent + "</p>" + (s.bubbles[id] ? '<p class="peek-card-now"><span>いま</span>' + esc(s.bubbles[id]) + "</p>" : "");
      var r = painter.hits()[id], left = r ? Math.min(Math.max((r[0] + r[2] / 2) / W * 100, 14), 80) : 50;
      card.style.left = left + "%";
      card.hidden = false;
      card.querySelector(".peek-close").addEventListener("click", function () { card.hidden = true; });
    }

    var current = null;
    function tick() {
      var n = nowJST(), s = scene(n, data), key = s.sky + s.meeting + present(s).join() + n.h + ":" + n.m;
      current = s;
      root.classList.toggle("is-night", s.sky === "night");
      painter.draw(s, n, f);
      if (key !== lastKey) { renderText(s, n); renderChips(s); lastKey = key; }
      f++;
    }
    function rotate() { if (current) showBubble(current); }

    canvas.addEventListener("click", function (e) {
      var rect = canvas.getBoundingClientRect(), x = (e.clientX - rect.left) / rect.width * W, y = (e.clientY - rect.top) / rect.height * H;
      var id = painter.hit(x, y);
      if (id) openCard(id, current); else card.hidden = true;
    });
    canvas.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect(), x = (e.clientX - rect.left) / rect.width * W, y = (e.clientY - rect.top) / rect.height * H;
      canvas.style.cursor = painter.hit(x, y) ? "pointer" : "default";
    });
    chips.addEventListener("click", function (e) { var b = e.target.closest("button[data-who]"); if (b) openCard(b.getAttribute("data-who"), current); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") card.hidden = true; });

    tick(); rotate();
    if (DATA_URL) fetch(DATA_URL).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) { data = d; renderBoard(); lastKey = ""; tick(); bubblesEl.innerHTML = ""; bubbleIdx = 0; rotate(); } }).catch(function () {});
    // 絵は止まっていても時刻は進める(動きを減らす設定では1分ごと)
    setInterval(tick, reduce ? 60000 : 260);
    setInterval(rotate, reduce ? 15000 : 4200);
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll("[data-peek]"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
