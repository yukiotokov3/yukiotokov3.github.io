/* 動く絵図鑑 2巻: 見本の再生部品。動画ファイルは使わず、要素を Web Animations で動かす。
   押したら再生、1回最長6秒、勝手にくり返さない。音は押したときだけ(読み上げ・サウンドロゴ)。 */
(function(){
"use strict";
try { history.scrollRestoration = "manual"; } catch(e){}
if (!location.hash){
  window.scrollTo(0, 0);
  /* 確認用の画面のように外側がスクロールする所でも、ページの頭を見せる */
  addEventListener("load", () => { try { document.body.scrollIntoView({block:"start"}); } catch(e){} });
}
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const STOP = Symbol("stop");
const POP = "cubic-bezier(.34,1.56,.64,1)", OUT = "cubic-bezier(.22,1,.36,1)";

function el(p, cls, style, html){
  const d = document.createElement("div");
  if (cls) d.className = cls;
  if (style) d.style.cssText = style;
  if (html != null) d.innerHTML = html;
  if (p) p.appendChild(d);
  return d;
}
function layer(p, bg){ return el(p, "L " + (bg ? "bg-" + bg : "")); }
function chr(p, x, w, c){
  const d = el(p, "chr", `left:${x}%;width:${w}%;--cc:var(--${c||"tomato"})`,
    '<i class="bd"></i><i class="hd"><b class="ey l"></b><b class="ey r"></b><b class="mo"></b></i>');
  d.mo = d.querySelector(".mo");
  return d;
}
function town(p){
  const L = layer(p, "mint");
  el(L, "sun-o", "left:70%;top:12%;width:14%;aspect-ratio:1");
  el(L, "bld", "left:10%;width:18%;height:52%");
  el(L, "bld", "left:32%;width:14%;height:70%");
  el(L, "bld", "left:50%;width:20%;height:44%");
  return L;
}
function talkScene(p, bg, opt){
  const L = layer(p, bg || "sky");
  const o = Object.assign({x:50, w:30, c:"tomato"}, opt);
  L.ch = chr(L, o.x, o.w, o.c);
  return L;
}
function logoScene(p){
  const L = layer(p, "ink");
  const g = el(L, "logo", "", '<b class="mk" aria-hidden="true"><i></i><i></i><i></i></b><span>ほしの商店</span>');
  L.logo = g;
  return L;
}

/* 1つの見本の再生中だけ使う道具 */
function makeCtx(player, id){
  const alive = () => player.run === id;
  return {
    wait(ms){ return new Promise((res, rej) => setTimeout(() => alive() ? res() : rej(STOP), RM ? 1 : ms)); },
    A(e, kf, o){
      if (!alive()) return Promise.reject(STOP);
      const a = e.animate(kf, Object.assign({fill:"forwards", easing:POP}, o, {duration: RM ? 1 : (o && o.duration) || 500}));
      return a.finished.then(() => { if (!alive()) throw STOP; }, () => { throw STOP; });
    },
    talk(ch, ms){
      if (RM || !ch) return;
      ch.mo.animate([{transform:"scaleY(.25)"},{transform:"scaleY(1)"}], {duration:170, iterations:Math.max(1, Math.round(ms/170)), direction:"alternate"});
    },
    say(t){ player.cap.textContent = t; },
    alive
  };
}

/* 音(押したときだけ) */
let AC = null;
function chime(){
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime + .05;
    [[523.25,0],[659.25,.16],[783.99,.32],[1046.5,.5]].forEach(([f, dt], i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = i === 3 ? "triangle" : "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0+dt); g.gain.linearRampToValueAtTime(.22, t0+dt+.02);
      g.gain.exponentialRampToValueAtTime(.001, t0+dt+(i === 3 ? .9 : .35));
      o.connect(g).connect(AC.destination); o.start(t0+dt); o.stop(t0+dt+1);
    });
    return true;
  } catch(e){ return false; }
}
function speak(text){
  try {
    if (!("speechSynthesis" in window)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 1.05;
    const v = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    return true;
  } catch(e){ return false; }
}

/* ---------- 語ごとの見本 ---------- */
const D = {};

D.telop = { r:"169", dur:4200, vars:["あり","なし"],
  setup(s, v){ const L = talkScene(s, "sky"); if (v === "あり") L.t = el(s, "telop", "transform:translateX(-50%) scale(0)", "ここが大事！"); return L; },
  async run(c, L, v){
    c.say("人が話している"); c.talk(L.ch, 3800); await c.wait(1100);
    if (v === "あり"){
      c.say("文字が飛び出して、大事な所を強調する");
      await c.A(L.t, [{transform:"translateX(-50%) scale(0) rotate(-14deg)"},{transform:"translateX(-50%) scale(1) rotate(-3deg)"}], {duration:520});
      await c.A(L.t, [{transform:"translateX(-50%) scale(1) rotate(-3deg)"},{transform:"translateX(-50%) scale(1.08) rotate(2deg)"},{transform:"translateX(-50%) scale(1) rotate(-3deg)"}], {duration:600});
    } else { c.say("文字なし: 聞き逃すと、どこが大事か伝わらない"); }
    await c.wait(1800);
  }};

D.jimaku = { r:"169", dur:4600, vars:["あり","なし"],
  setup(s, v){ const L = talkScene(s, "mint", {c:"sky"}); if (v === "あり") L.sub = el(s, "subl", "opacity:0", ""); return L; },
  async run(c, L, v){
    const lines = ["こんにちは。", "今日は、字幕の話です。", "話した言葉を、そのまま文字に。"];
    for (const t of lines){
      c.talk(L.ch, 1300);
      if (L.sub){ L.sub.textContent = t; await c.A(L.sub, [{opacity:0, transform:"translateY(30%)"},{opacity:1, transform:"none"}], {duration:260, easing:OUT}); }
      c.say(v === "あり" ? "話した言葉が、そのまま下に出る" : "字幕なし: 音を消して見ている人には伝わらない");
      await c.wait(1250);
    }
  }};

D.wipe = { r:"169", dur:3600, vars:["場面の切り替え","小窓"],
  setup(s, v){
    if (v === "小窓"){
      const L = town(s);
      L.win = el(s, "mini", "right:4%;bottom:6%;width:30%;aspect-ratio:4/3;border-radius:2cqw;transform:scale(0);transform-origin:100% 100%");
      L.win.ch = talkScene(L.win, "sun", {w:46, c:"sky"}).ch;
      return L;
    }
    const B = town(s), A = talkScene(s, "sky"); A.B = B;
    A.band = el(s, "band", "");
    return A;
  },
  async run(c, L, v){
    if (v === "小窓"){
      c.say("いつもの映像の上に…"); await c.wait(800);
      c.say("隅に小窓(ワイプ)が開いて、話す人の顔が出る");
      await c.A(L.win, [{transform:"scale(0)"},{transform:"scale(1)"}], {duration:560});
      c.talk(L.win.ch, 1900); await c.wait(2000);
      return;
    }
    c.say("場面A"); c.talk(L.ch, 900); await c.wait(900);
    c.say("帯が横切って…");
    const a = c.A(L.band, [{transform:"translateX(-140%) skewX(-18deg)"},{transform:"translateX(260%) skewX(-18deg)"}], {duration:1100, easing:"cubic-bezier(.7,0,.3,1)"});
    await c.wait(520); L.hidden = true;
    await a; c.say("場面Bに切り替わった"); await c.wait(1200);
  }};

D.endcard = { r:"169", dur:5600, vars:["あり","なし"],
  setup(s){ const L = talkScene(s, "sky"); L.dark = layer(s, "ink"); L.dark.style.opacity = 0;
    L.copy = el(s, "copy", "opacity:0", "毎日に、<br>ちいさな楽しみを。");
    L.lg = logoScene(s); L.lg.style.opacity = 0; return L; },
  async run(c, L, v){
    c.say("動画の本編"); c.talk(L.ch, 1000); await c.wait(1100);
    await c.A(L.dark, [{opacity:0},{opacity:1}], {duration:400, easing:OUT});
    if (v === "なし"){ c.say("なし: 本編が終わって、そのまま真っ暗"); await c.wait(1800); return; }
    c.say("最後にキャッチコピー");
    await c.A(L.copy, [{opacity:0, transform:"translateY(6%)"},{opacity:1, transform:"none"}], {duration:600, easing:OUT});
    await c.wait(1000);
    await c.A(L.copy, [{opacity:1},{opacity:0}], {duration:300});
    c.say("ロゴと社名で締める。ここ全体がエンドカード");
    L.lg.style.opacity = 1;
    await c.A(L.lg.logo, [{transform:"translate(-50%,-50%) scale(.6)", opacity:0},{transform:"translate(-50%,-50%) scale(1)", opacity:1}], {duration:700});
    await c.wait(1300);
  }};

D.thumbnail = { r:"169", dur:4000, vars:["作り込んだサムネ","動画の1コマのまま"],
  setup(s, v){
    const L = layer(s, "white"); L.list = el(L, "L", "");
    const mk = (i, ours) => {
      const r = el(L.list, "row", `top:${4 + i*31}%`);
      const th = el(r, "th", ""); el(r, "tx", "", "<i></i><i></i><i></i>");
      if (ours){
        r.th = th;
        if (v === "作り込んだサムネ"){
          th.style.background = "var(--sun)";
          chr(th, 76, 38, "tomato");
          el(th, "", "position:absolute;left:6%;top:12%;font:5.2cqw/1.15 var(--f-pop)", "5分で<br>わかる！");
        } else { th.style.background = "#BFE2FF"; chr(th, 50, 34, "tomato"); th.style.filter = "saturate(.5)"; }
      } else { chr(th, 50, 34, ["sky","mint","sun","sky","mint"][i % 5]); th.style.filter = "grayscale(.6)"; }
    };
    for (let i = 0; i < 6; i++) mk(i, i === 4);
    return L;
  },
  async run(c, L, v){
    c.say("動画の一覧を流し見していると…");
    await c.A(L.list, [{transform:"translateY(0)"},{transform:"translateY(-93%)"}], {duration:1600, easing:OUT});
    const th = L.list.children[4].th;
    if (v === "作り込んだサムネ"){
      c.say("大きな文字と顔で、目が止まる");
      await c.A(th, [{transform:"scale(1)", boxShadow:"0 0 0 0 var(--tomato)"},{transform:"scale(1.1) rotate(-2deg)", boxShadow:"0 0 0 1.4cqw var(--tomato)"}], {duration:520});
    } else { c.say("動画の1コマのまま: ほかと似ていて埋もれる"); }
    await c.wait(1600);
  }};

D.endscreen = { r:"169", dur:5000, vars:["あり","なし"],
  setup(s){ const L = talkScene(s, "sky", {x:50}); L.dim = layer(s, "ink"); L.dim.style.opacity = 0;
    L.c1 = el(s, "card", "left:6%;top:16%;width:38%;aspect-ratio:16/11;transform:translateX(-140%)", '<i class="th bg-sun" style="position:absolute"></i><i class="tt"></i>');
    L.c2 = el(s, "card", "right:6%;top:16%;width:38%;aspect-ratio:16/11;transform:translateX(140%)", '<i class="th bg-mint" style="position:absolute"></i><i class="tt"></i>');
    L.sb = el(s, "sub-btn", "left:43%;top:66%;transform:scale(0)", "登録");
    L.cur = el(s, "cursor", "left:70%;top:90%;opacity:0");
    return L; },
  async run(c, L, v){
    c.say("動画の最後の数秒"); c.talk(L.ch, 1200); await c.wait(1200);
    if (v === "なし"){ c.say("なし: 見終わった人は、そのまま帰ってしまう"); await c.wait(1800); return; }
    c.say("YouTubeが、次に見る動画と登録ボタンを重ねる");
    c.A(L.dim, [{opacity:0},{opacity:.55}], {duration:300});
    c.A(L.c1, [{transform:"translateX(-140%)"},{transform:"none"}], {duration:600});
    await c.A(L.c2, [{transform:"translateX(140%)"},{transform:"none"}], {duration:600, delay:120});
    await c.A(L.sb, [{transform:"scale(0)"},{transform:"scale(1)"}], {duration:420});
    L.cur.style.opacity = 1;
    await c.A(L.cur, [{left:"70%", top:"90%"},{left:"72%", top:"36%"}], {duration:700, easing:OUT});
    c.say("押すと、次の動画へ");
    await c.A(L.c2, [{transform:"scale(1)"},{transform:"scale(.94)"},{transform:"scale(1.04)"}], {duration:320});
    await c.wait(900);
  }};

D.daihon = { r:"169", dur:5200, vars:[],
  setup(s){
    const L = layer(s, "sun");
    const p = el(L, "paper", "");
    L.lines = [["セリフ: こんにちは。","画面: 話す人"],["セリフ: ここが大事です。","画面: テロップ「ここが大事！」"],["セリフ: 街に出てみます。","画面: 街の景色"]]
      .map(([a, b]) => el(p, "ln", "", `${a}<small>${b}</small>`));
    L.m = el(L, "mini", "right:3%;top:22%;width:41%;aspect-ratio:16/9;border-radius:1.4cqw");
    return L; },
  async run(c, L){
    const show = i => {
      L.m.innerHTML = "";
      if (i === 2) town(L.m);
      else { const t = talkScene(L.m, "sky", {w:34}); c.talk(t.ch, 1300);
        if (i === 1) el(L.m, "telop", "font-size:4cqw;padding:.6cqw 1.4cqw;top:8%", "ここが大事！"); }
    };
    const said = ["1行目のとおりに、話す人を映す","2行目: 画面にテロップを出す","3行目: 街の景色に切り替える"];
    for (let i = 0; i < 3; i++){
      L.lines.forEach((e, k) => { e.style.background = k === i ? "#FFF3C9" : ""; e.style.borderColor = k === i ? "var(--ink)" : "transparent"; });
      c.say(said[i]); show(i);
      await c.A(L.m, [{transform:"scale(.9)"},{transform:"scale(1)"}], {duration:380});
      await c.wait(1300);
    }
  }};

D.hook = { r:"916", dur:5200, vars:["つかみあり","つかみなし"],
  setup(s, v){
    const L = layer(s, "white"); L.feed = el(L, "L", "");
    const v1 = el(L.feed, "L", ""); L.v1 = v1;
    const t = talkScene(v1, "sky", {w:62}); L.ch = t.ch;
    if (v === "つかみあり"){ L.big = el(v1, "big bg-sun", "", "結論から<br>言います！"); }
    else { el(v1, "subl", "bottom:10%;font-size:6cqw", "えー、どうも。<br>今日はですね…"); }
    const v2 = el(L.feed, "L", "transform:translateY(100%)"); talkScene(v2, "mint", {w:62, c:"sky"});
    L.v2 = v2;
    L.th = el(L, "thumb", "left:62%;top:105%;width:16%");
    return L; },
  async run(c, L, v){
    if (v === "つかみあり"){
      c.say("最初のコマで、結論を大きく");
      await c.A(L.big, [{transform:"scale(1.25)"},{transform:"scale(1)"}], {duration:600});
      await c.wait(900);
      await c.A(L.big, [{opacity:1},{opacity:0}], {duration:300});
      c.talk(L.ch, 2000);
      c.say("「続きが気になる」と思って、指が止まる");
      await c.A(L.th, [{top:"105%"},{top:"70%"}], {duration:500, easing:OUT});
      await c.wait(700);
      await c.A(L.th, [{top:"70%"},{top:"105%"}], {duration:500, easing:OUT});
      c.say("そのまま見続けてもらえる"); await c.wait(1000);
    } else {
      c.say("ゆっくりした始まり…"); c.talk(L.ch, 1600); await c.wait(1700);
      c.say("興味を持つ前に、指で上へスワイプ");
      await c.A(L.th, [{top:"105%"},{top:"72%"}], {duration:400, easing:OUT});
      const up = {duration:520, easing:"cubic-bezier(.5,0,.2,1)"};
      c.A(L.th, [{top:"72%"},{top:"20%", opacity:0}], up);
      await c.A(L.feed, [{transform:"none"},{transform:"translateY(-100%)"}], up);
      c.say("次の人の動画へ飛ばされた"); await c.wait(1200);
    }
  }};

D.jumpcut = { r:"169", dur:5600, vars:[],
  setup(s){
    const L = layer(s, "white");
    const top = el(L, "", "position:absolute;left:0;right:0;top:0;height:66%;overflow:hidden");
    L.sc = talkScene(top, "sky", {w:24});
    L.tr = el(L, "", "position:absolute;left:4%;right:4%;top:73%;height:16%");
    const segs = [["話",18,"var(--sky)"],["えーと",14,"#D7DAE6"],["話",22,"var(--sky)"],["…",12,"#D7DAE6"],["話",20,"var(--sky)"]];
    let x = 0; L.segs = segs.map(([t, w, bg]) => { const e = el(L.tr, "seg", `left:${x}%;width:${w}%;background:${bg}`, t); e.w = w; e.gap = t !== "話"; x += w + 1; return e; });
    L.ph = el(L.tr, "", "position:absolute;top:-14%;bottom:-14%;width:.6cqw;background:var(--tomato);left:0");
    el(L, "ax-l", "left:4%;top:93%", "タイムライン");
    return L; },
  async run(c, L){
    c.say("切る前: 間や「えーと」が入っている");
    await c.A(L.ph, [{left:"0%"},{left:"91%"}], {duration:1500, easing:"linear"});
    c.say("間の所を切り取って…");
    await Promise.all(L.segs.filter(e => e.gap).map(e => c.A(e, [{opacity:1, transform:"scaleY(1)"},{opacity:0, transform:"scaleY(0)"}], {duration:380})));
    let x = 0; const moves = [];
    L.segs.forEach(e => { if (e.gap) return; const from = e.style.left; moves.push(c.A(e, [{left:from},{left:x + "%"}], {duration:480})); x += e.w; });
    await Promise.all(moves);
    c.say("詰めてつなぐと、つなぎ目で人が少し跳ぶ");
    L.ph.style.left = "0%";
    const ch = L.sc.ch, pos = [50, 47, 53];
    for (let i = 0; i < 3; i++){
      ch.style.left = pos[i] + "%"; ch.style.width = (24 + i * 2) + "%"; c.talk(ch, 450);
      await c.A(L.ph, [{left:[0,18,40][i] + "%"},{left:[18,40,60][i] + "%"}], {duration:520, easing:"linear"});
    }
    c.say("テンポが良くなり、尺も短くなった"); await c.wait(900);
  }};

D.transition = { r:"169", dur:3400, vars:["カット","フェード","ワイプ","ズーム"],
  setup(s, v){ const B = town(s), A = talkScene(s, "sky"); A.B = B; A.v = v; if (v === "ワイプ") A.band = el(s, "band", "");
    A.lb = el(s, "lbl", "z-index:3", v); return A; },
  async run(c, A, v){
    c.say("場面A"); c.talk(A.ch, 1000); await c.wait(1100);
    if (v === "カット"){ c.say("カット: パッと一瞬で切り替える"); A.style.visibility = "hidden"; }
    if (v === "フェード"){ c.say("フェード: だんだん重ねて切り替える"); await c.A(A, [{opacity:1},{opacity:0}], {duration:1000, easing:"ease-in-out"}); }
    if (v === "ワイプ"){ c.say("ワイプ: 帯が横切って切り替える");
      const a = c.A(A.band, [{transform:"translateX(-140%) skewX(-18deg)"},{transform:"translateX(260%) skewX(-18deg)"}], {duration:1100, easing:"cubic-bezier(.7,0,.3,1)"});
      await c.wait(520); A.style.visibility = "hidden"; await a; }
    if (v === "ズーム"){ c.say("ズーム: 寄りながら次の場面へ");
      c.A(A.B, [{transform:"scale(.6)"},{transform:"scale(1)"}], {duration:800, easing:OUT});
      await c.A(A, [{transform:"scale(1)", opacity:1},{transform:"scale(3)", opacity:0}], {duration:800, easing:OUT}); }
    await c.wait(1200);
  }};

D.shaku = { r:"169", dur:4400, vars:[],
  setup(s){
    const L = layer(s, "white");
    const MAX = 180, X0 = 22, W = 72;
    [0, 60, 120, 180].forEach(t => { el(L, "ax-l", `left:${X0 + W*t/MAX}%;top:6%;transform:translateX(-50%)`, t === 0 ? "0" : (t/60) + "分");
      el(L, "", `position:absolute;left:${X0 + W*t/MAX}%;top:13%;bottom:6%;border-left:.3cqw dashed var(--line)`); });
    L.bars = [["CM", 15, "var(--sun)", "15秒"], ["ショート", 50, "var(--sky)", "50秒"], ["横の動画", 160, "var(--tomato)", "2分40秒"]].map(([n, sec, col, lab], i) => {
      const y = 30 + i * 22;
      el(L, "bar-l", `top:${y + 4.5}%`, n);
      const b = el(L, "bar", `top:${y}%;background:${col}`);
      const t = el(L, "bar-n", `top:${y + 4.5}%;left:${X0 + 1}%;opacity:0`, lab);
      return {b, t, w: W*sec/MAX, X0};
    });
    return L; },
  async run(c, L){
    c.say("尺 = 動画の長さ。出す場所ごとに並べると…");
    for (const o of L.bars){
      c.A(o.b, [{width:"0%"},{width:o.w + "%"}], {duration:900, easing:OUT});
      o.t.style.left = (o.X0 + o.w + 1.5) + "%";
      await c.A(o.t, [{opacity:0},{opacity:1}], {duration:300, delay:600});
    }
    c.say("出す場所によって、ちょうどいい尺が変わる"); await c.wait(1600);
  }};

D.yomiage = { r:"169", dur:4600, vars:["声を出す","声なし"],
  setup(s){
    const L = layer(s, "white");
    const text = "文字を、機械の声で読み上げます。";
    const box = el(L, "chars", "position:absolute;left:8%;right:8%;top:16%;text-align:center;font:6.4cqw/1.4 var(--f-pop);color:#B9BDD0");
    L.cs = [...text].map(ch => { const sp = document.createElement("span"); sp.textContent = ch; box.appendChild(sp); return sp; });
    L.text = text;
    const w = el(L, "wave", ""); L.bars = Array.from({length:28}, () => el(w, "", ""));
    return L; },
  async run(c, L, v){
    let ok = false;
    if (v === "声を出す") ok = speak(L.text);
    c.say(v === "声を出す" ? (ok ? "文字を順に、機械の声が読んでいく(ブラウザの声)" : "文字を順に、機械の声が読んでいく(この端末では声が出せません)") : "声なし: 文字を順に読む動きだけ");
    L.bars.forEach((b, i) => c.A(b, [{height:"12%"},{height:(30 + (i*37)%70) + "%"},{height:"12%"}], {duration:260 + (i%5)*40, iterations:9, easing:"ease-in-out"}).catch(() => {}));
    for (const sp of L.cs){
      sp.style.color = "var(--ink)";
      c.A(sp, [{transform:"translateY(0)"},{transform:"translateY(-18%)"},{transform:"translateY(0)"}], {duration:240}).catch(() => {});
      await c.wait(150);
    }
    await c.wait(1500);
  }};

D.soundlogo = { r:"169", dur:3600, vars:["音あり","音なし"],
  setup(s){ const L = logoScene(s); L.logo.style.opacity = 0;
    L.rings = [0, 1, 2].map(() => el(L, "ring", "")); return L; },
  async run(c, L, v){
    let ok = false;
    if (v === "音あり") ok = chime();
    c.say(v === "音あり" ? (ok ? "ロゴと一緒に、毎回同じ短い音" : "ロゴと一緒に短い音(この端末では音が出せません)") : "音なし: 画面を見ていないと気づかれない");
    c.A(L.logo, [{opacity:0, transform:"translate(-50%,-50%) scale(.5)"},{opacity:1, transform:"translate(-50%,-50%) scale(1)"}], {duration:700});
    if (v === "音あり") L.rings.forEach((r, i) => c.A(r, [{transform:"translate(-50%,-50%) scale(.2)", opacity:1},{transform:"translate(-50%,-50%) scale(3.2)", opacity:0}], {duration:1100, delay:i*170, easing:OUT}).catch(() => {}));
    await c.wait(2800);
  }};

D.tateyoko = { r:"43", dur:3400, vars:["横 16:9","縦 9:16"],
  setup(s, v){
    const L = layer(s, "white");
    const yoko = v === "横 16:9";
    L.f = el(L, "frame", yoko ? "width:34%;height:80%" : "width:88%;height:66%");
    L.ch = talkScene(L.f, "sky", {w:yoko ? 62 : 20}).ch;
    L.lb = el(L, "lbl", "", yoko ? "9:16" : "16:9");
    return L; },
  async run(c, L, v){
    const yoko = v === "横 16:9";
    c.say("同じ中身を、形を変えると…"); await c.wait(700);
    await c.A(L.f, yoko ? [{width:"34%", height:"80%"},{width:"88%", height:"66%"}] : [{width:"88%", height:"66%"},{width:"34%", height:"80%"}], {duration:900});
    L.lb.textContent = yoko ? "16:9" : "9:16";
    c.A(L.ch, yoko ? [{width:"62%"},{width:"20%"}] : [{width:"20%"},{width:"62%"}], {duration:600});
    c.say(yoko ? "横 16:9: YouTubeの普通の動画、テレビの形" : "縦 9:16: ショート・リール。スマホを縦に持ったまま見る");
    await c.wait(1800);
  }};

D.shorts = { r:"916", dur:5400, vars:[],
  setup(s){
    const L = layer(s, "ink"); L.feed = el(L, "L", "");
    L.vids = [["sky","tomato"],["mint","sky"],["sun","mint"]].map(([bg, cc], i) => {
      const v = el(L.feed, "L", `transform:translateY(${i*100}%)`);
      const t = talkScene(v, bg, {w:62, c:cc}); v.ch = t.ch;
      el(v, "", "position:absolute;left:5%;bottom:5%;font:700 5cqw/1.4 var(--f-body);color:var(--ink)", "#ショート " + (i + 1));
      return v; });
    el(L, "icons", "", "<i></i><i></i><i></i>");
    L.th = el(L, "thumb", "left:56%;top:105%;width:16%");
    return L; },
  async run(c, L){
    for (let i = 0; i < 2; i++){
      c.say(i === 0 ? "縦長で、1分前後の短い動画" : "指で上へ。次々に見ていく");
      c.talk(L.vids[i].ch, 1100); await c.wait(1100);
      await c.A(L.th, [{top:"105%"},{top:"74%"}], {duration:320, easing:OUT});
      const up = {duration:480, easing:"cubic-bezier(.5,0,.2,1)"};
      c.A(L.th, [{top:"74%"},{top:"24%", opacity:0}], up);
      await c.A(L.feed, [{transform:`translateY(${-i*100}%)`},{transform:`translateY(${-(i+1)*100}%)`}], up);
      L.th.style.opacity = 1;
    }
    c.say("見つけてもらいやすいが、飛ばされるのも一瞬"); c.talk(L.vids[2].ch, 900); await c.wait(1200);
  }};

D.retention = { r:"169", dur:4400, vars:["つかみが弱い","つかみが強い"],
  setup(s, v){
    const L = layer(s, "white");
    const ax = el(L, "axis", "");
    el(L, "ax-l", "left:3%;top:7%", "100%"); el(L, "ax-l", "left:5%;top:80%", "0%");
    el(L, "ax-l", "left:12%;top:88%", "はじめ"); el(L, "ax-l", "right:5%;top:88%", "おわり");
    const pts = v === "つかみが弱い" ? [100, 46, 36, 31, 27, 24, 22] : [100, 88, 79, 72, 66, 62, 58];
    const d = pts.map((p, i) => `${i ? "L" : "M"}${i * 100/6} ${100 - p}`).join(" ");
    ax.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><path d="${d} L100 100 L0 100Z" fill="${v === "つかみが弱い" ? "rgba(255,91,79,.16)" : "rgba(34,201,147,.18)"}" stroke="none" class="ar"/><path d="${d}" fill="none" stroke="${v === "つかみが弱い" ? "var(--tomato)" : "var(--mint)"}" stroke-width="3" vector-effect="non-scaling-stroke" class="ln"/></svg>`;
    L.ln = ax.querySelector("svg"); L.ln.style.clipPath = "inset(0 100% 0 0)"; L.ar = ax.querySelector(".ar"); L.ar.style.opacity = 0;
    L.note = el(L, "note", v === "つかみが弱い" ? "left:22%;top:30%;transform:scale(0)" : "left:40%;top:16%;transform:scale(0)", v === "つかみが弱い" ? "最初の数秒で、ごっそり離脱" : "最初を越えて、多くの人が残る");
    return L; },
  async run(c, L, v){
    c.say("再生が進むごとに、まだ見ている人の割合");
    await c.A(L.ln, [{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)"}], {duration:1800, easing:"linear"});
    c.A(L.ar, [{opacity:0},{opacity:1}], {duration:400});
    await c.A(L.note, [{transform:"scale(0)"},{transform:"scale(1)"}], {duration:480});
    c.say(v === "つかみが弱い" ? "グラフが急に落ちた所 = 見るのをやめられた所" : "冒頭を直すと、グラフの落ち方がゆるやかになる");
    await c.wait(1600);
  }};

/* ---------- 足した8語(2026-10-31) ---------- */
function ac(){ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); return AC; }
function tone(f, at, dur, type, vol){
  const a = ac(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
  o.type = type || "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  return o;
}
function bgm(vol, sec){
  try {
    const mel = [523.25,659.25,783.99,659.25,698.46,880,783.99,659.25];
    const n = Math.floor(sec / .3);
    for (let i = 0; i < n; i++){
      tone(mel[i % 8], i * .3, .28, "triangle", vol);
      if (i % 4 === 0) tone(mel[i % 8] / 4, i * .3, 1.1, "sine", vol * .9);
    }
    return true;
  } catch(e){ return false; }
}
function sePop(at){ try { const o = tone(880, at, .18, "sine", .3); o.frequency.exponentialRampToValueAtTime(1500, ac().currentTime + at + .08); return true; } catch(e){ return false; } }
function seSwish(at){
  try {
    const a = ac(), len = a.sampleRate * .35, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + at;
    s.buffer = buf; f.type = "bandpass"; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(5000, t + .3);
    g.gain.value = .35; s.connect(f).connect(g).connect(a.destination); s.start(t);
    return true;
  } catch(e){ return false; }
}
function seg(p, left, w, bg, txt){ return el(p, "seg", `left:${left}%;width:${w}%;background:${bg}`, txt || ""); }
function editor(s, h){
  const L = layer(s, "white");
  L.top = el(L, "", `position:absolute;left:0;right:0;top:0;height:${h}%;overflow:hidden;border-bottom:.5cqw solid var(--ink)`);
  L.bot = el(L, "", `position:absolute;left:0;right:0;top:${h}%;bottom:0;background:#F4F5FA`);
  return L;
}

D.cut = { r:"169", dur:4600, vars:[],
  setup(s){
    const L = editor(s, 64);
    L.sc = talkScene(L.top, "sky", {w:24});
    L.tr = el(L.bot, "", "position:absolute;left:4%;right:4%;top:24%;height:40%");
    L.a = seg(L.tr, 0, 55, "var(--sky)", "使う所");
    L.b = seg(L.tr, 55, 45, "#D7DAE6", "いらない所");
    L.line = el(L.tr, "", "position:absolute;left:55%;top:-30%;bottom:-30%;width:.7cqw;background:var(--tomato);transform:scaleY(0)");
    L.sci = el(L.tr, "", "position:absolute;left:55%;top:-95%;transform:translateX(-50%) scale(0);font:5cqw/1 var(--f-pop)", "✂");
    L.ph = el(L.tr, "", "position:absolute;top:-14%;bottom:-14%;width:.6cqw;background:var(--ink);left:0");
    return L; },
  async run(c, L){
    c.say("撮った映像には、いらない所もある");
    await c.A(L.ph, [{left:"0%"},{left:"80%"}], {duration:1100, easing:"linear"});
    c.say("ここで切る");
    L.ph.style.opacity = 0;
    c.A(L.sci, [{transform:"translateX(-50%) scale(0) rotate(-40deg)"},{transform:"translateX(-50%) scale(1) rotate(0)"}], {duration:400});
    await c.A(L.line, [{transform:"scaleY(0)"},{transform:"scaleY(1)"}], {duration:350});
    await c.wait(300);
    c.say("いらない所を捨てて、使う所だけ残す");
    await c.A(L.b, [{transform:"none", opacity:1},{transform:"translateY(120%) rotate(6deg)", opacity:0}], {duration:600, easing:"cubic-bezier(.5,0,.8,.4)"});
    L.line.style.opacity = 0; L.sci.style.opacity = 0;
    L.ph.style.opacity = 1; c.talk(L.sc.ch, 1200);
    await c.A(L.ph, [{left:"0%"},{left:"55%"}], {duration:1200, easing:"linear"});
    await c.wait(500);
  }};

D.timeline = { r:"169", dur:5200, vars:[],
  setup(s){
    const L = editor(s, 60);
    L.tr = el(L.bot, "", "position:absolute;left:4%;right:4%;top:30%;height:36%");
    [0,25,50,75,100].forEach(p => el(L.bot, "ax-l", `left:${4 + p*.92}%;top:8%;transform:translateX(-50%)`, `0:0${p/25}`));
    L.cl = [["sky","話す人"],["mint","街"],["sun","まとめ"]].map(([bg, t], i) => seg(L.tr, i*33.3, 32.3, `var(--${bg})`, t));
    L.cl.forEach(e => e.style.transform = "translateY(160%)");
    talkScene(L.top, "sky", {w:24});
    L.ph = el(L.tr, "", "position:absolute;top:-40%;bottom:-14%;width:.6cqw;background:var(--tomato);left:0");
    L.show = i => { L.top.innerHTML = ""; if (i === 1) town(L.top); else { const t = talkScene(L.top, i ? "sun" : "sky", {w:24, c: i ? "mint" : "tomato"}); c0.talk(t.ch, 1300); } };
    let c0 = {talk(){}}; L.setTalk = f => c0 = f;
    return L; },
  async run(c, L){
    L.setTalk(c);
    c.say("映像を、左から右へ時間の順に並べる");
    for (const e of L.cl) await c.A(e, [{transform:"translateY(160%)"},{transform:"none"}], {duration:380});
    c.say("縦の線がある所の映像が、上の画面に映る");
    for (let i = 0; i < 3; i++){
      L.show(i);
      await c.A(L.ph, [{left:(i*33.3) + "%"},{left:((i+1)*33.3 - .5) + "%"}], {duration:1100, easing:"linear"});
    }
    await c.wait(300);
  }};

D.track = { r:"169", dur:4800, vars:["正しい重ね順","背景を一番上に"],
  setup(s, v){
    const L = editor(s, 60);
    const top = L.top;
    L.bgL = town(top); L.winL = el(top, "mini", "right:5%;bottom:8%;width:28%;aspect-ratio:4/3;border-radius:2cqw"); L.winL.ch = talkScene(L.winL, "sun", {w:46, c:"sky"}).ch;
    L.tel = el(top, "telop", "font-size:6cqw", "ここが大事！");
    const bad = v === "背景を一番上に";
    const z = bad ? {bg:3, win:1, tel:2} : {bg:1, win:2, tel:3};
    L.bgL.style.zIndex = z.bg; L.winL.style.zIndex = z.win; L.tel.style.zIndex = z.tel;
    [L.bgL, L.winL, L.tel].forEach(e => e.style.opacity = 0);
    const rows = bad ? [["V3","背景(街)","var(--mint)"],["V2","文字","var(--sun)"],["V1","小窓","#FFD0CB"]] : [["V3","文字","var(--sun)"],["V2","小窓","#FFD0CB"],["V1","背景(街)","var(--mint)"]];
    L.rows = rows.map(([n, t, col], i) => { el(L.bot, "ax-l", `left:3%;top:${12 + i*29}%`, n);
      const r = el(L.bot, "", `position:absolute;left:12%;right:4%;top:${8 + i*29}%;height:22%`); const sg = seg(r, 0, 100, col, t); sg.style.transform = "scaleX(0)"; sg.style.transformOrigin = "0 50%"; return {sg, t}; });
    L.map = {"背景(街)":L.bgL, "小窓":L.winL, "文字":L.tel};
    return L; },
  async run(c, L, v){
    const order = ["背景(街)","小窓","文字"];
    for (const name of order){
      c.say(`「${name}」の段を置く`);
      const r = L.rows.find(x => x.t === name);
      await c.A(r.sg, [{transform:"scaleX(0)"},{transform:"scaleX(1)"}], {duration:420, easing:OUT});
      await c.A(L.map[name], [{opacity:0, transform:L.map[name] === L.tel ? "translateX(-50%) scale(.6)" : "scale(.96)"},{opacity:1, transform:L.map[name] === L.tel ? "translateX(-50%) rotate(-3deg)" : "none"}], {duration:420});
      await c.wait(350);
    }
    c.say(v === "正しい重ね順" ? "上の段ほど手前に見える。文字が一番手前" : "背景を一番上の段に置くと、ほかが全部かくれてしまう");
    await c.wait(1500);
  }};

D.bgm = { r:"169", dur:4200, vars:["音あり","音なし"],
  setup(s){ const L = talkScene(s, "sun", {c:"mint"});
    L.notes = [0,1,2,3,4].map(i => el(s, "", `position:absolute;left:${14 + i*17}%;top:62%;font:7cqw/1 var(--f-pop);color:var(--ink);opacity:0`, i % 2 ? "♪" : "♫"));
    return L; },
  async run(c, L, v){
    let ok = true; if (v === "音あり") ok = bgm(.07, 3.6);
    c.say(v === "音あり" ? (ok ? "後ろで音楽が流れて、楽しい雰囲気に" : "後ろで音楽(この端末では音が出せません)") : "音なし: 同じ映像でも、しんとした印象");
    if (v === "音あり") L.notes.forEach((n, i) => c.A(n, [{opacity:0, transform:"translateY(0)"},{opacity:1, transform:"translateY(-120%) rotate(-10deg)", offset:.5},{opacity:0, transform:"translateY(-260%) rotate(10deg)"}], {duration:1600, delay:i*300, iterations:2, easing:"ease-out"}).catch(() => {}));
    await c.wait(3800);
  }};

D.se = { r:"169", dur:4000, vars:["音あり","音なし"],
  setup(s){ const L = town(s);
    L.t = el(s, "telop", "transform:translateX(-50%) scale(0)", "ポン！");
    L.card = el(s, "card", "left:30%;top:38%;width:40%;aspect-ratio:16/10;transform:translateX(-200%)", '<i class="th bg-sky" style="position:absolute"></i><i class="tt"></i>');
    return L; },
  async run(c, L, v){
    const on = v === "音あり";
    c.say("文字が出る瞬間に…"); await c.wait(700);
    if (on) sePop(0);
    c.say(on ? "「ポン」と短い音" : "音なし: 動きが少し弱く見える");
    await c.A(L.t, [{transform:"translateX(-50%) scale(0)"},{transform:"translateX(-50%) scale(1) rotate(-3deg)"}], {duration:420});
    await c.wait(900);
    if (on) seSwish(0);
    c.say(on ? "動きに「シュッ」と音を合わせる" : "音なし: 横切っても気づきにくい");
    await c.A(L.card, [{transform:"translateX(-200%)"},{transform:"translateX(0)"}], {duration:420, easing:OUT});
    await c.wait(1400);
  }};

D.volume = { r:"169", dur:4600, vars:["BGMが大きすぎ","ちょうどいい"],
  setup(s){ const L = talkScene(s, "sky", {x:34});
    const box = el(s, "", "position:absolute;right:6%;top:12%;bottom:12%;width:30%;background:#fff;border:.5cqw solid var(--ink);border-radius:1.6cqw");
    L.m = ["声","BGM"].map((n, i) => { const w = el(box, "", `position:absolute;bottom:16%;top:10%;left:${16 + i*42}%;width:26%;background:#EEF0F7;border-radius:1cqw;overflow:hidden`);
      const b = el(w, "", `position:absolute;left:0;right:0;bottom:0;height:10%;background:var(--${i ? "sun" : "tomato"})`);
      el(box, "ax-l", `bottom:3%;left:${16 + i*42}%;width:26%;text-align:center;color:var(--ink)`, n); return b; });
    L.sub = el(s, "subl", "right:40%;opacity:0", "");
    return L; },
  async run(c, L, v){
    const bad = v === "BGMが大きすぎ";
    const text = "今日は、編集のこつを話します。";
    let ok = bgm(bad ? .2 : .025, 3.6);
    try { if ("speechSynthesis" in window){ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ja-JP"; u.volume = bad ? .45 : 1; speechSynthesis.speak(u); } } catch(e){ ok = false; }
    L.sub.textContent = text; L.sub.style.opacity = 1;
    c.say(bad ? "BGMが声より大きい: 何を話しているか聞き取れない" : "声のときはBGMを小さく: 話がはっきり聞こえる");
    c.talk(L.ch, 3000);
    const lv = bad ? [40, 92] : [88, 24];
    L.m.forEach((b, i) => c.A(b, [{height:"10%"},{height:(lv[i] - 14) + "%"},{height:lv[i] + "%"},{height:(lv[i] - 8) + "%"},{height:lv[i] + "%"}], {duration:700, iterations:4, easing:"ease-in-out"}).catch(() => {}));
    await c.wait(3600);
    if (!ok) c.say("この端末では音が出せません。メーターの高さで見比べてください");
    await c.wait(600);
  }};

D.export = { r:"169", dur:4600, vars:[],
  setup(s){
    const L = layer(s, "white");
    L.tl = el(L, "", "position:absolute;left:6%;right:6%;top:18%;height:40%");
    [["var(--sun)",0,30,0],["#FFD0CB",30,40,0],["var(--sky)",0,45,1],["var(--mint)",45,40,1],["#D7DAE6",0,85,2]].forEach(([col, l, w, row]) => {
      const r = el(L.tl, "", `position:absolute;left:0;right:0;top:${row*34}%;height:28%`); seg(r, l, w, col, ""); });
    L.file = el(L, "", "position:absolute;left:50%;top:22%;width:20%;aspect-ratio:4/5;transform:translateX(-50%) scale(0);background:#fff;border:.6cqw solid var(--ink);border-radius:1.4cqw 4cqw 1.4cqw 1.4cqw;display:grid;place-items:center;font:3.4cqw/1.2 var(--f-tc);text-align:center", "▶<br>video<br>.mp4");
    L.bar = el(L, "", "position:absolute;left:20%;right:20%;top:72%;height:6%;border:.5cqw solid var(--ink);border-radius:2cqw;overflow:hidden;background:#EEF0F7");
    L.fill = el(L.bar, "", "position:absolute;inset:0 auto 0 0;width:0;background:var(--mint)");
    L.pct = el(L, "", "position:absolute;left:0;right:0;top:82%;text-align:center;font:500 3.4cqw/1 var(--f-tc)", "書き出し 0%");
    return L; },
  async run(c, L){
    c.say("編集ソフトの中では、映像・文字・音がバラバラの段に並んでいる"); await c.wait(1100);
    c.say("書き出すと、1本の動画ファイルにまとまる");
    c.A(L.tl, [{transform:"none", opacity:1},{transform:"scale(.15)", opacity:0}], {duration:900, easing:"cubic-bezier(.6,0,.4,1)"}).catch(() => {});
    const steps = 20;
    c.A(L.fill, [{width:"0%"},{width:"100%"}], {duration:1800, easing:"linear"}).catch(() => {});
    for (let i = 1; i <= steps; i++){ await c.wait(90); L.pct.textContent = `書き出し ${Math.round(i/steps*100)}%`; }
    await c.A(L.file, [{transform:"translateX(-50%) scale(0) rotate(-12deg)"},{transform:"translateX(-50%) scale(1)"}], {duration:520});
    c.say("このファイルを、YouTubeなどに上げる"); await c.wait(1000);
  }};

D.resolution = { r:"169", dur:3800, vars:["1920×1080","320×180"],
  setup(s, v){
    const L = layer(s, "white");
    const hi = v === "1920×1080";
    const W = hi ? 384 : 32, H = Math.round(W * 9 / 16);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;transform-origin:36% 24%";
    const g = cv.getContext("2d"), k = W / 384;
    g.fillStyle = "#BFE2FF"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#FF5B4F"; g.strokeStyle = "#18182E"; g.lineWidth = 3 * k;
    g.beginPath(); g.ellipse(200*k, 216*k, 52*k, 70*k, 0, Math.PI, 0); g.fill(); g.stroke();
    g.fillStyle = "#FFE0C4"; g.beginPath(); g.arc(200*k, 90*k, 40*k, 0, Math.PI*2); g.fill(); g.stroke();
    g.fillStyle = "#18182E"; [[186,84],[214,84]].forEach(([x, y]) => { g.beginPath(); g.arc(x*k, y*k, 4*k, 0, Math.PI*2); g.fill(); });
    g.fillStyle = "#FFC83D"; g.fillRect(24*k, 20*k, 120*k, 36*k); g.strokeRect(24*k, 20*k, 120*k, 36*k);
    g.fillStyle = "#18182E"; g.font = `bold ${22*k}px sans-serif`; g.fillText("ここが大事", 32*k, 46*k);
    L.appendChild(cv); L.cv = cv;
    L.lb = el(L, "lbl", "z-index:2", v);
    return L; },
  async run(c, L, v){
    const hi = v === "1920×1080";
    c.say(hi ? "細かい点がたくさん: 寄っても、なめらか" : "点が少ない: 寄ると、ガタガタ");
    await c.wait(600);
    await c.A(L.cv, [{transform:"scale(1)"},{transform:"scale(2.4)"}], {duration:1400, easing:"cubic-bezier(.6,0,.3,1)"});
    c.say(hi ? "今のふつうはフルHD(1920×1080)" : "小さい解像度で書き出すと、文字も顔もぼやける");
    await c.wait(1600);
  }};

/* ---------- プレーヤー ---------- */
function fmt(ms){ const f = Math.floor(ms / (1000/30)); const s = Math.floor(f/30); return `00:00:${String(s).padStart(2,"0")};${String(f%30).padStart(2,"0")}`; }

function mount(root){
  const key = root.dataset.demo, Dm = D[key];
  if (!Dm) return;
  root.classList.add("player");
  const vars = Dm.vars;
  root.innerHTML = `<div class="mon"><div class="scr r${Dm.r}" role="img" aria-label="${root.dataset.label || ""}の動く見本"></div><button class="bigplay" type="button" aria-label="見本を再生">▶</button></div>
    <div class="tl"><span class="tcode">00:00:00;00</span><div class="track"><i></i><b></b></div><span class="tcode" style="min-width:0;color:#A9ABC2">${fmt(Dm.dur)}</span></div>
    <div class="ctrl"><button class="pbtn" type="button">▶ 再生</button>${vars.length ? `<div class="vars" role="group" aria-label="見比べ">${vars.map((v, i) => `<button type="button" aria-pressed="${i === 0}">${v}</button>`).join("")}</div>` : ""}</div>
    <p class="cap" aria-live="polite">${RM ? "動きを減らす設定のため、押すと最後の場面だけを表示します" : "押すと動きます"}</p>
    ${["yomiage","soundlogo","bgm","se","volume"].includes(key) ? '<p class="snd">音が出ます。音量にご注意ください。</p>' : ""}`;
  const P = { run: 0, cap: root.querySelector(".cap"), v: vars[0] || "" };
  const scr = root.querySelector(".scr"), big = root.querySelector(".bigplay"), btn = root.querySelector(".pbtn");
  const fill = root.querySelector(".track i"), head = root.querySelector(".track b"), tc = root.querySelector(".tcode");
  const poster = () => { scr.innerHTML = ""; Dm.setup(scr, P.v); };
  let raf = 0;
  async function play(){
    const id = ++P.run; cancelAnimationFrame(raf);
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch(e){}
    scr.innerHTML = ""; const S = Dm.setup(scr, P.v);
    big.hidden = true; btn.textContent = "↺ もう一度";
    const t0 = performance.now();
    const tick = now => { if (P.run !== id) return; const t = Math.min(now - t0, Dm.dur);
      const pc = t / Dm.dur * 100; fill.style.width = pc + "%"; head.style.left = `calc(${pc}% - 3px)`; tc.textContent = fmt(t);
      if (t < Dm.dur) raf = requestAnimationFrame(tick); };
    if (RM){ fill.style.width = "100%"; head.style.left = "calc(100% - 3px)"; tc.textContent = fmt(Dm.dur); } else raf = requestAnimationFrame(tick);
    try { await Dm.run(makeCtx(P, id), S, P.v); } catch(e){ if (e !== STOP) console.error(e); }
  }
  big.addEventListener("click", play);
  btn.addEventListener("click", play);
  root.querySelectorAll(".vars button").forEach(b => b.addEventListener("click", () => {
    root.querySelectorAll(".vars button").forEach(x => x.setAttribute("aria-pressed", x === b));
    P.v = b.textContent; play();
  }));
  poster();
}
document.querySelectorAll("[data-demo]").forEach(mount);

/* 表紙の題字: 読み込み時に1回だけ跳ねる(文字は最初から見えている) */
if (!RM) document.querySelectorAll(".hero h1 .w").forEach((w, i) =>
  w.animate([{transform:"translateY(-30%) rotate(-6deg)"},{transform:"none"}], {duration:700, delay:i*120, easing:POP, fill:"backwards"}));
})();
