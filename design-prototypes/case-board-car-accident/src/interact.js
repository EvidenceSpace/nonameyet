// ===== mount & refresh =====
let playing = false, sel = null, focusSet = null, tool = "select";
function mount(e, appear) { const n = document.createElement("div"); n.className = "el t-" + e.type + (appear ? " appear" : ""); n.dataset.id = e.id; n.style.width = e.w + "px"; world.appendChild(n); nodes.set(e.id, n); pos(e); paint(e); return n; }
function pos(e) { const n = node(e.id); n.style.left = e.x + "px"; n.style.top = e.y + "px"; }
function paint(e) { const n = node(e.id); if (!n) return; n.innerHTML = RENDER[e.type](e) + (e.id === "ade" ? `<button class="cpin" data-act="thread"><span>DO</span>${thread.length > 1 ? `<b>${thread.length}</b>` : ""}</button>` : "");
  if (e.type === "scene") drawMap(); if (e.type === "video") drawCam(); }
function refresh(...ids) { (ids.length ? ids : state.els.map((e) => e.id)).forEach((id) => { const e = byId(id); e && paint(e); }); reflow(); renderProve(); applyFocus(); if (letterOpen) buildLetter(); }
function updateTime() { drawMap(); drawCam(); const p = (state.t / 9) * 100; $$(".scrub .fill").forEach((f) => (f.style.width = p + "%")); $$(".scrub .knob").forEach((f) => (f.style.left = p + "%")); $$(".vc .tm").forEach((f) => (f.textContent = fmtT(state.t, 1).slice(3))); $$('[data-act="play"]').forEach((b) => (b.innerHTML = ic(playing ? "pause" : "play"))); }
function setT(t) { state.t = Math.max(0, Math.min(9, t)); if (!state.reviewed && state.t > 5.9 && watchSrc === "dash") markReviewed(); updateTime(); }
let watchSrc = null;
function markReviewed() { state.reviewed = true; refresh("dash", "scene"); toast("Dashcam reviewed: the Mill Lane light is red as the van reaches the line"); }
let lastT = 0;
function play(src) { watchSrc = src; if (playing) { playing = false; updateTime(); return; } if (state.t >= 8.9) state.t = 4; playing = true; lastT = performance.now(); requestAnimationFrame(tick); }
function tick(now) { if (!playing) return; const dt = (now - lastT) / 1000; lastT = now; setT(state.t + dt); if (state.t >= 9) { playing = false; updateTime(); return; } requestAnimationFrame(tick); }

// ===== strings =====
const SVGNS = "http://www.w3.org/2000/svg", linkEls = new Map();
function lkStyle(l) { if (l.kind) return ["obj", "#2f9e73"]; if (l.fact) { if (state.excluded[l.id]) return ["struck", "#b3bccb"]; return l.ver === FACTS[l.fact].good ? ["helps", "#2f9e73"] : ["hurts", "#d24a64"]; } if (l.type === "rule") return ["rule", "#7c6bd6"]; return ["rel", "#98a2b5"]; }
function geom(A, B) { const ax = A.x + A.w / 2, ay = A.y + A.h / 2, bx = B.x + B.w / 2, by = B.y + B.h / 2, dx = bx - ax, dy = by - ay; let p1, p2, n1, n2;
  const gapX = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w)); if (gapX > 16 || (gapX > -40 && Math.abs(dx) / (A.w + B.w) > Math.abs(dy) / (A.h + B.h))) { const s = Math.sign(dx) || 1; p1 = [s > 0 ? A.x + A.w : A.x, clampY(ay, A, B)]; p2 = [s > 0 ? B.x : B.x + B.w, clampY(by, B, A)]; n1 = [s, 0]; n2 = [-s, 0]; }
  else { const s = Math.sign(dy) || 1; p1 = [ax, s > 0 ? A.y + A.h : A.y]; p2 = [bx, s > 0 ? B.y : B.y + B.h]; n1 = [0, s]; n2 = [0, -s]; }
  const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(30, dist * 0.4); const c1 = [p1[0] + n1[0] * k, p1[1] + n1[1] * k], c2 = [p2[0] + n2[0] * k, p2[1] + n2[1] * k];
  const at = (t) => { const u = 1 - t; return [u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]; };
  return { d: `M${p1[0] + 5000} ${p1[1] + 5000} C ${c1[0] + 5000} ${c1[1] + 5000}, ${c2[0] + 5000} ${c2[1] + 5000}, ${p2[0] + 5000} ${p2[1] + 5000}`, at, p1, p2 }; }
function clampY(y, A, B) { const lo = Math.max(A.y + 24, B.y + 10), hi = Math.min(A.y + A.h - 24, B.y + B.h - 10); return lo < hi ? Math.max(lo, Math.min(hi, y)) : Math.max(A.y + 24, Math.min(A.y + A.h - 24, y)); }
function ensureLink(l) { let o = linkEls.get(l.id); const [cls, col] = lkStyle(l); const key = cls + (l.label || "");
  if (o && o.key === key) return o; if (o) dropLink(l.id);
  const g = document.createElementNS(SVGNS, "g"); g.classList.add("lk", "k-" + cls); g.dataset.id = l.id;
  g.innerHTML = `<path class="hit" fill="none" stroke="transparent" stroke-width="16"/><path class="vis" fill="none" stroke="${col}" stroke-width="${cls === "obj" ? 3 : 2.2}" ${cls === "struck" ? 'stroke-dasharray="3 6"' : cls === "rule" ? 'stroke-dasharray="7 6"' : cls === "rel" ? 'stroke-dasharray="2 6"' : ""} stroke-linecap="round"/><circle class="pin1" r="4.2" fill="${col}"/><circle class="pin2" r="4.2" fill="${col}"/>`;
  linksSvg.appendChild(g); const lb = document.createElement("div"); lb.className = "lbl l-" + cls; lb.textContent = l.label || ""; lb.dataset.id = l.id; world.appendChild(lb);
  o = { g, lb, key, w: 0 }; linkEls.set(l.id, o); if (appearing.has(l.id)) { g.classList.add("new"); lb.classList.add("new"); appearing.delete(l.id); } return o; }
const appearing = new Set();
function dropLink(id) { const o = linkEls.get(id); if (o) { o.g.remove(); o.lb.remove(); linkEls.delete(id); } }
function hitsCard(x, y, w, h, skip) { for (const e of state.els) { if (skip.includes(e.id)) continue; const r = rectOf(e.id); if (!r) continue; if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) return true; } return false; }
function drawLinks() { const live = new Set(), placed = [];
  state.links.forEach((l) => { const A = rectOf(l.a), B = rectOf(l.b); if (!A || !B) return; live.add(l.id); const o = ensureLink(l), gm = geom(A, B);
    o.g.querySelectorAll("path").forEach((p) => p.setAttribute("d", gm.d)); const c1 = o.g.querySelector(".pin1"), c2 = o.g.querySelector(".pin2"); c1.setAttribute("cx", gm.p1[0] + 5000); c1.setAttribute("cy", gm.p1[1] + 5000); c2.setAttribute("cx", gm.p2[0] + 5000); c2.setAttribute("cy", gm.p2[1] + 5000);
    if (!o.w) { o.w = o.lb.offsetWidth; o.h = o.lb.offsetHeight; }
    let best = null; for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) { const p = gm.at(t), bx = p[0] - o.w / 2 - 4, by = p[1] - o.h / 2 - 3; if (!hitsCard(bx, by, o.w + 8, o.h + 6, []) && !placed.some((q) => bx < q[0] + q[2] && bx + o.w + 8 > q[0] && by < q[1] + q[3] && by + o.h + 6 > q[1])) { best = p; placed.push([bx, by, o.w + 8, o.h + 6]); break; } }
    const hot = focusSet && focusSet.has(l.a) && focusSet.has(l.b) && sel; const tight = !best && !hot; const p = best || gm.at(0.5);
    o.lb.style.left = p[0] + "px"; o.lb.style.top = p[1] + "px"; o.lb.classList.toggle("tight", tight);
    const dim = focusSet && !(focusSet.has(l.a) && focusSet.has(l.b)); o.g.style.opacity = dim ? 0.12 : 1; o.lb.classList.toggle("dim", !!dim); o.lb.classList.toggle("hot", !!hot || hoverLink === l.id); o.g.classList.toggle("hot", hoverLink === l.id); });
  linkEls.forEach((o, id) => { if (!live.has(id)) dropLink(id); }); placeOverlays(); requestAnimationFrame(drawLinks); }
let hoverLink = null;

// ===== focus =====
function applyFocus() { if (!sel) focusSet = null; else { focusSet = new Set([sel]); state.links.forEach((l) => { if (l.a === sel) focusSet.add(l.b); if (l.b === sel) focusSet.add(l.a); }); }
  nodes.forEach((n, id) => { n.classList.toggle("dim", !!focusSet && !focusSet.has(id)); n.classList.toggle("sel", id === sel); }); }
function select(id) { sel = id; applyFocus(); }

// ===== pointer =====
let drag = null, pan = null, ghost = null, ink = null, conn = null;
const NODRAG = "button, .claim, .scrub, .seg2, .hole, .sup, input, textarea, [contenteditable=true], .lbl, a, .tg, svg#mapsvg";
vp.addEventListener("pointerdown", (ev) => { if (ev.button !== 0) return; closeMenu();
  const elN = ev.target.closest(".el"); const w = toWorld(ev.clientX, ev.clientY);
  if (tool === "hand" || ev.target === vp || ev.target.id === "grid" || ev.target === world || ev.target.closest("#links")) {
    if (tool === "sticky" && !elN) { addSticky(w); return; } if (tool === "pen") { startInk(w); return; }
    pan = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y, moved: false }; vp.classList.add("panning"); return; }
  if (tool === "pen") { startInk(w); return; }
  if (elN && tool === "connect") { conn = { a: elN.dataset.id }; return; }
  if (elN && !ev.target.closest(NODRAG)) { const e = byId(elN.dataset.id); drag = { e, ox: w.x - e.x, oy: w.y - e.y, moved: false, sx: ev.clientX, sy: ev.clientY }; }
});
addEventListener("pointermove", (ev) => {
  if (ghost) { moveGhost(ev); return; }
  if (scrubbing) { scrubTo(ev); return; }
  if (ink) { const w = toWorld(ev.clientX, ev.clientY); ink.pts.push([w.x, w.y]); renderInk(); return; }
  if (conn) { const w = toWorld(ev.clientX, ev.clientY); const r = rectOf(conn.a); tmpLine.setAttribute("d", `M${r.x + r.w / 2 + 5000} ${r.y + r.h / 2 + 5000} L${w.x + 5000} ${w.y + 5000}`); tmpLine.style.display = ""; return; }
  if (pan) { const dx = (ev.clientX - pan.x) / S, dy = (ev.clientY - pan.y) / S; if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true; view.x = pan.vx + dx; view.y = pan.vy + dy; applyView(); return; }
  if (drag) { if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 4) return; drag.moved = true; node(drag.e.id).classList.add("dragging"); const w = toWorld(ev.clientX, ev.clientY); drag.e.x = Math.round(w.x - drag.ox); drag.e.y = Math.round(w.y - drag.oy); pos(drag.e); }
});
addEventListener("pointerup", (ev) => {
  if (ghost) { dropGhost(ev); return; }
  if (scrubbing) { scrubbing = null; return; }
  if (ink) { if (ink.pts.length > 2) state.strokes.push(ink); ink = null; renderInk(); return; }
  if (conn) { tmpLine.style.display = "none"; const n = document.elementFromPoint(ev.clientX, ev.clientY); const b = n && n.closest(".el"); if (b && b.dataset.id !== conn.a) { const l = { id: newId("u"), a: conn.a, b: b.dataset.id, type: "rel", label: "Linked" }; appearing.add(l.id); state.links.push(l); toast("String added"); } conn = null; return; }
  if (pan) { vp.classList.remove("panning"); if (!pan.moved) { select(null); } pan = null; return; }
  if (drag) { node(drag.e.id).classList.remove("dragging"); if (!drag.moved) select(sel === drag.e.id ? null : drag.e.id); drag = null; }
});
vp.addEventListener("wheel", (ev) => { ev.preventDefault(); const p = local(ev.clientX, ev.clientY); if (ev.ctrlKey || ev.metaKey) zoomAt(p.x, p.y, view.z * Math.exp(-ev.deltaY * 0.01)); else { view.x -= ev.deltaX / S; view.y -= ev.deltaY / S; applyView(); } }, { passive: false });
const tmpLine = document.createElementNS(SVGNS, "path"); tmpLine.classList.add("tmpline"); tmpLine.style.display = "none"; linksSvg.appendChild(tmpLine);

// scrubbers
let scrubbing = null;
document.addEventListener("pointerdown", (ev) => { const s = ev.target.closest(".scrub"); if (!s) return; ev.stopPropagation(); playing = false; scrubbing = s; watchSrc = s.closest(".t-video") ? "dash" : "scene"; scrubTo(ev); }, true);
function scrubTo(ev) { const r = scrubbing.getBoundingClientRect(); setT(((ev.clientX - r.left) / r.width) * 9); }

// hover claims → light up their string
world.addEventListener("pointerover", (ev) => { const c = ev.target.closest(".claim, .sup, .lbl"); let id = null; if (c) { if (c.dataset.claim) { const l = state.links.find((x) => x.claim === c.dataset.claim); id = l && l.id; } else id = c.dataset.link || c.dataset.id; } hoverLink = id; });

// ===== ink & sticky =====
function startInk(w) { ink = { id: newId("k"), pts: [[w.x, w.y]] }; }
function renderInk() { const all = ink ? [...state.strokes, ink] : state.strokes; inkSvg.innerHTML = all.map((s) => { let d = `M${s.pts[0][0] + 5000} ${s.pts[0][1] + 5000}`; s.pts.slice(1).forEach((p) => (d += ` L${p[0] + 5000} ${p[1] + 5000}`)); return `<path d="${d}" fill="none" stroke="#e0475f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`; }).join(""); }
function addSticky(w) { const e = { id: newId("n"), type: "sticky", x: Math.round(w.x - 100), y: Math.round(w.y - 40), w: 210, by: "SR", text: "" }; state.els.push(e); const n = mount(e, true); setTool("select"); const p = n.querySelector("p"); p.contentEditable = "true"; p.focus(); p.addEventListener("blur", () => { e.text = p.textContent.trim(); if (!e.text) { state.els = state.els.filter((x) => x !== e); n.remove(); nodes.delete(e.id); } else p.contentEditable = "false"; }); }
function setTool(t) { tool = t; $$(".dock .tb[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === t)); vp.className = "t-" + t; }
$$(".dock .tb[data-t]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.t)));
addEventListener("keydown", (ev) => { if (ev.target.closest("input, [contenteditable=true]")) return; const k = { v: "select", h: "hand", n: "sticky", c: "connect", p: "pen" }[ev.key.toLowerCase()]; if (k) setTool(k); if (ev.key === "Escape") { closeMenu(); closeSide(); select(null); } if (ev.key === " ") { ev.preventDefault(); play(watchSrc || "scene"); } });
$("#zin").onclick = () => zoomAt(frame.offsetWidth / 2, frame.offsetHeight / 2, view.z * 1.2); $("#zout").onclick = () => zoomAt(frame.offsetWidth / 2, frame.offsetHeight / 2, view.z / 1.2); $("#zl").onclick = () => { select(null); fitAll(); };

// ===== card actions =====
world.addEventListener("click", (ev) => {
  const th = ev.target.closest("[data-th]"); if (th) { state.theory = th.dataset.th; state.sightMsg = state.sightMsg && state.theory === "evidence" ? state.sightMsg : state.sightMsg; refresh("scene"); return; }
  const a = ev.target.closest("[data-act]"); if (!a) return; ev.stopPropagation(); const k = a.dataset.act;
  if (k === "open") openDoc(a.dataset.doc);
  else if (k === "where") showSpot(a.dataset.spot);
  else if (k === "compare") openCompare();
  else if (k === "sight") checkSight();
  else if (k === "togsight") { if (state.sight) { state.sight = false; if (!state.sightDone) state.sightMsg = ""; refresh("scene"); } else checkSight(true); }
  else if (k === "togruler") { if (state.ruler) { state.ruler = false; state.rulerMsg = ""; refresh("scene"); } else startMeasure(true); }
  else if (k === "measure") startMeasure();
  else if (k === "addmeasure") addMeasure();
  else if (k === "sightyes") decideAde(true);
  else if (k === "sightno") decideAde(false);
  else if (k === "lead") openRequest();
  else if (k === "play") play(a.closest(".t-video") ? "dash" : "scene");
  else if (k === "thread") openThread();
});
world.addEventListener("pointerdown", (ev) => { const p = ev.target.closest('[data-act="pinframe"]'); if (p) { ev.stopPropagation(); startGhost(ev); } });

async function showSpot(spot) { state.spot = spot; if (state.theory !== "evidence" && false) state.theory = "evidence"; await revealEl("scene"); drawMap(); clearTimeout(showSpot.tm); showSpot.tm = setTimeout(() => { state.spot = null; drawMap(); }, 2600); }
async function checkSight(fromToggle) { select(null); state.theory = "evidence"; state.sight = true; state.ruler = false; state.rulerMsg = ""; state.spot = "ade"; if (state.t < 6.3) state.t = 6.6;
  if (!state.sightDone) state.sightMsg = `<b>Ade stood behind both Mill Lane signals.</b> They face west, towards the van. From the bus stop he could only see their backs, so he couldn’t see the van’s light.<div class="fa"><button class="act sm" data-act="sightyes">Don’t count his light claim</button><button class="lnk2" data-act="sightno">Keep counting it</button></div>`;
  refresh("scene", "ade"); await focusOn("scene"); setTimeout(() => { state.spot = null; drawMap(); }, 2600); }
function decideAde(yes) { if (yes) { state.excluded.l3 = "Stood behind the signal · couldn’t see it"; state.sightMsg = `<b>Ade’s light claim no longer counts.</b> His view of your speed still does. That’s on “How fast was Sam going?”`; danaSays("Good catch. That leaves Joan and her dashcam. Pin the frame where the van reaches its line.", 1800); }
  else state.sightMsg = `<b>Ade’s light claim still counts.</b> You can change this any time from Sightlines.`;
  state.sightDone = true; refresh(); flashCard("f1"); }
async function startMeasure(fromToggle) { select(null); state.theory = "evidence"; state.ruler = true; state.sight = false; state.sightMsg = ""; playing = false;
  state.rulerMsg = `<b>Measuring your speed.</b> Your car crosses its stop line at 05.41 on the dashcam and reaches the impact point at 06.20.`; refresh("scene"); await focusOn("scene");
  state.t = 5.41; updateTime(); await sleep(600); const t0 = performance.now(); await new Promise((res) => { const st = (n) => { const k = Math.min(1, (n - t0) / 1600); state.t = 5.41 + 0.79 * k; updateTime(); k < 1 ? requestAnimationFrame(st) : res(); }; requestAnimationFrame(st); });
  state.rulerMsg = `<b>7.7 m in 0.79 seconds: about 22 mph.</b> That’s under the 30 mph limit. Distance from the council plan, times from Joan’s dashcam.` + (state.measured ? `<div class="fa"><span class="okline">${ic("check")}Added to “How fast was Sam going?”</span></div>` : `<div class="fa"><button class="act sm" data-act="addmeasure">${ic("plus")}Add to “How fast was Sam going?”</button></div>`); refresh("scene"); }
function addMeasure() { if (state.measured) return; state.measured = true; const l = { id: "lm", a: "scene", b: "f2", fact: "speed", ver: "under", kind: "measure", label: "Measured · about 22 mph" }; appearing.add(l.id); state.links.push(l);
  state.rulerMsg = state.rulerMsg.replace(/<div class="fa">.*<\/div>$/, `<div class="fa"><span class="okline">${ic("check")}Added to “How fast was Sam going?”</span></div>`); refresh(); flashCard("f2"); toast("Their speeding point now has an answer"); }
function flashCard(id) { const n = node(id); if (!n) return; n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash"); }

// ===== frame ghost =====
function startGhost(ev) { if (Math.abs(state.t - 6.07) > 0.35) { toast("Moved to 08:42:06, where the van reaches its stop line"); watchSrc = "dash"; setT(6.07); }
  if (!state.reviewed) { state.reviewed = true; refresh("dash", "scene"); }
  state.frameImg = $("#camc").toDataURL("image/jpeg", 0.8); state.frameT = state.t;
  const g = document.createElement("div"); g.className = "ghost"; g.innerHTML = `<img src="${state.frameImg}"><span>${fmtT(state.t, 2)}</span>`; ov.appendChild(g); ghost = { g, sx: ev.clientX, sy: ev.clientY, moved: false }; moveGhost(ev); }
function moveGhost(ev) { const p = local(ev.clientX, ev.clientY); ghost.g.style.left = p.x - 70 + "px"; ghost.g.style.top = p.y - 44 + "px"; if (Math.hypot(ev.clientX - ghost.sx, ev.clientY - ghost.sy) > 6) ghost.moved = true;
  const w = toWorld(ev.clientX, ev.clientY); const over = factAt(w); nodes.forEach((n, id) => n.classList.toggle("target", id === over)); }
function factAt(w) { let hit = null; state.els.forEach((e) => { if (e.type !== "fact") return; const r = rectOf(e.id); if (w.x > r.x && w.x < r.x + r.w && w.y > r.y && w.y < r.y + r.h) hit = e.id; }); return hit; }
function dropGhost(ev) { if (!ghost.moved) return; const w = toWorld(ev.clientX, ev.clientY), f = factAt(w); nodes.forEach((n) => n.classList.remove("target")); const g = ghost.g; ghost = null;
  if (!f) { g.remove(); toast("Drop the frame onto a disputed point"); return; }
  if (f === "f2") { g.remove(); toast("A single frame can’t show speed. Use “Measure it” instead"); return; }
  g.classList.add("landed"); menuAt(ev, "What does this frame show about the van’s light?", [["red", "Red", "#e0475f"], ["green", "Green", "#22a06b"], ["none", "Can’t tell from this frame", ""]], (v) => { g.remove(); if (!v || v === "none") { if (v) toast("Not added"); return; }
    state.links = state.links.filter((l) => l.id !== "lf"); const l = { id: "lf", a: "dash", b: "f1", fact: "light", ver: v, kind: "frame", t: state.frameT, label: `Frame ${fmtT(state.frameT, 1).slice(3)} · ${v === "red" ? "red" : "green"}` }; appearing.add(l.id); state.links.push(l); refresh(); flashCard("f1"); toast("Frame pinned to the light question");
    if (verdict("light").st === "strong") danaSays("That’s enough for the letter of claim. Still ask the pharmacy to keep their CCTV.", 2200); }); }

// ===== menu =====
let menuEl = null, menuCb = null;
function menuAt(ev, title, items, cb) { closeMenu(); const p = local(ev.clientX, ev.clientY); const m = document.createElement("div"); m.className = "menu2 glassbar"; m.innerHTML = `<p>${esc(title)}</p>` + items.map((it) => `<button data-v="${it[0]}">${it[2] ? `<i style="background:${it[2]}"></i>` : ""}${esc(it[1])}</button>`).join("");
  m.style.left = Math.min(p.x + 10, frame.offsetWidth - 300) + "px"; m.style.top = Math.min(p.y + 10, frame.offsetHeight - 200) + "px"; ov.appendChild(m); menuEl = m; menuCb = cb;
  m.addEventListener("pointerdown", (e) => e.stopPropagation()); m.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const c = menuCb; menuCb = null; m.remove(); menuEl = null; c(b.dataset.v); }); }
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; const c = menuCb; menuCb = null; c && c(null); } }

// keep columns tidy when cards grow: push later cards down, never up
const COLS = [["sam", "joan", "ade", "lead"], ["f1", "f2", "ledger"], ["marek", "r175", "r30", "note1"], ["dash", "scene"], ["damage", "scene"]];
function reflow() { COLS.forEach((ids) => { let prev = null; ids.forEach((id) => { const e = byId(id), n = node(id); if (!e || !n) return;
  if (prev) { const pr = rectOf(prev); const overlapX = e.x < pr.x + pr.w && e.x + n.offsetWidth > pr.x; const minY = pr.y + pr.h + 24; if (overlapX && e.y < minY) { n.classList.add("anim"); e.y = minY; pos(e); setTimeout(() => n.classList.remove("anim"), 800); } }
  prev = id; }); }); }

function focusOn(id, zmax = 1.15) { const r = rectOf(id); if (!r) return Promise.resolve(); const L = 340, T = 150, R = frame.offsetWidth - (side.classList.contains("open") ? 600 : 30), B = frame.offsetHeight - 100;
  const z = Math.min(zmax, (R - L) / r.w, (B - T) / r.h); return animView(L + (R - L - r.w * z) / 2 - r.x * z, T + (B - T - r.h * z) / 2 - r.y * z, z, 800); }
