// ===== engine =====
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (o) => JSON.parse(JSON.stringify(o));
const stage = $(".stage"); let S = 1;
function fit() { S = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${S})`; stage.style.left = (innerWidth - 1920 * S) / 2 + "px"; stage.style.top = (innerHeight - 1080 * S) / 2 + "px"; }
addEventListener("resize", fit); fit();
const frame = $(".frame"), vp = $("#vp"), world = $("#world"), linksSvg = $("#links"), inkSvg = $("#ink"), ov = $("#ov");
const local = (cx, cy) => { const r = frame.getBoundingClientRect(); return { x: (cx - r.left) / S, y: (cy - r.top) / S }; };
const view = { x: 352, y: 176, z: 0.76 };
const toWorld = (cx, cy) => { const p = local(cx, cy); return { x: (p.x - view.x) / view.z, y: (p.y - view.y) / view.z }; };
const toLocal = (wx, wy) => ({ x: wx * view.z + view.x, y: wy * view.z + view.y });
function applyView() { world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.z})`; const g = 26 * view.z; $("#grid").style.backgroundSize = `${g}px ${g}px`; $("#grid").style.backgroundPosition = `${view.x}px ${view.y}px`; $("#zl").textContent = Math.round(view.z * 100) + "%"; }
let tween = null;
function animView(tx, ty, tz, ms = 700) { const f = { ...view }, t0 = performance.now(); cancelAnimationFrame(tween);
  return new Promise((res) => { const step = (t) => { let k = Math.min(1, (t - t0) / ms); k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; view.x = f.x + (tx - f.x) * k; view.y = f.y + (ty - f.y) * k; view.z = f.z + (tz - f.z) * k; applyView(); if (k < 1) tween = requestAnimationFrame(step); else res(); }; tween = requestAnimationFrame(step); }); }
function zoomAt(lx, ly, nz) { nz = Math.max(0.3, Math.min(2, nz)); const wx = (lx - view.x) / view.z, wy = (ly - view.y) / view.z; view.z = nz; view.x = lx - wx * nz; view.y = ly - wy * nz; applyView(); }
function fitAll() { const xs = state.els.map((e) => rectOf(e.id)).filter(Boolean); const x0 = Math.min(...xs.map((r) => r.x)), y0 = Math.min(...xs.map((r) => r.y)), x1 = Math.max(...xs.map((r) => r.x + r.w)), y1 = Math.max(...xs.map((r) => r.y + r.h));
  const L = 352, W = frame.offsetWidth - L - 30, T = 176, H = frame.offsetHeight - T - 110; const z = Math.min(1, W / (x1 - x0), H / (y1 - y0)); return animView(L + (W - (x1 - x0) * z) / 2 - x0 * z, T + (H - (y1 - y0) * z) / 2 - y0 * z, z, 800); }
function revealEl(id, pad = 40) { const r = rectOf(id); if (!r) return Promise.resolve(); const L = 340, T = 170, R = frame.offsetWidth - (reader.classList.contains("open") || letter.classList.contains("open") ? 640 : 24), B = frame.offsetHeight - 110;
  const a = toLocal(r.x, r.y), b = toLocal(r.x + r.w, r.y + r.h); let dx = 0, dy = 0; if (a.x < L) dx = L - a.x + pad; else if (b.x > R) dx = R - b.x - pad; if (a.y < T) dy = T - a.y + pad; else if (b.y > B) dy = B - b.y - pad;
  if (!dx && !dy) return Promise.resolve(); return animView(view.x + dx, view.y + dy, view.z, 600); }

// ===== state =====
const state = { els: clone(EL0), links: clone(LK0), ledger: clone(LEDGER0), loose: LOOSE.map((l) => l.k), excluded: {}, notes: {}, t: 5.0, theory: "evidence", sight: false, ruler: false, reviewed: false, measured: false, leadSent: false, strokes: [] };
const byId = (id) => state.els.find((e) => e.id === id);
const nodes = new Map(); const node = (id) => nodes.get(id);
function rectOf(id) { const n = node(id), e = byId(id); if (!n || !e) return null; return { x: e.x, y: e.y, w: n.offsetWidth, h: n.offsetHeight }; }
let nid = 1; const newId = (p) => p + "-" + nid++;

// ===== icons =====
const IC = { pin: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>', eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>', play: '<path d="M8 5.5v13l10.5-6.5z"/>', pause: '<path d="M8 5v14M16 5v14"/>', film: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>', ruler: '<path d="M3 16.5L16.5 3l4.5 4.5L7.5 21z"/><path d="M7 12.5l2 2M10 9.5l2 2M13 6.5l2 2"/>', doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>', camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.3"/>', swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>', send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>', plus: '<path d="M12 5v14M5 12h14"/>', layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12.5l8.5 4.5 8.5-4.5"/><path d="M3.5 16.5l8.5 4.5 8.5-4.5"/>', select: '<path d="M6 4l12.5 6.8-5.3 1.5 3 5.6-2.2 1.2-3-5.6L7 17z"/>', hand: '<path d="M8 12.5V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5v-1a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v5.5a6.5 6.5 0 0 1-6.5 6.5h-1A6.5 6.5 0 0 1 6 18l-2.5-4.5a1.6 1.6 0 0 1 2.7-1.6L8 14"/>', connect: '<circle cx="5.5" cy="18.5" r="2.4"/><circle cx="18.5" cy="5.5" r="2.4"/><path d="M7.6 16.8C11 15.5 9.5 10 13 8.2c1-.5 2.1-.9 3.2-1.1"/>', penI: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/>', minus: '<path d="M5 12h14"/>', car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3.5 11h17v5h-17z"/><circle cx="7.5" cy="16.5" r="1.6"/><circle cx="16.5" cy="16.5" r="1.6"/>', chat: '<path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5z"/>', money: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/>', flag: '<path d="M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', spark: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8z"/>' };
const ic = (n, c = "i") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ""}</svg>`;

// ===== facts engine =====
const SIDEW = { you: [1, "Party"], them: [1, "Party"], wit: [2, "Independent"] };
function supportsOf(fk) {
  return state.links.filter((l) => l.fact === fk).map((l) => { const src = byId(l.a); if (!src) return null;
    let w = 1, kind = "Party", name = src.name || "", ini = src.ini || "";
    if (src.type === "person") { [w, kind] = SIDEW[src.side]; }
    if (l.kind === "frame") { w = 4; kind = "Footage"; name = "Dashcam frame " + fmtT(l.t, 2); ini = "film"; }
    if (l.kind === "measure") { w = 4; kind = "Measured"; name = "Measured on the plan"; ini = "ruler"; }
    if (l.kind === "plan") { w = 3; kind = "Council record"; name = "Signal timing plan"; ini = "doc"; }
    const ex = state.excluded[l.id]; if (ex) w = 0;
    return { l, src, w, kind, name, ini, ex }; }).filter(Boolean);
}
function verdict(fk) { const F = FACTS[fk], sp = supportsOf(fk); const g = sp.filter((s) => s.l.ver === F.good).reduce((a, s) => a + s.w, 0), b = sp.filter((s) => s.l.ver === F.bad).reduce((a, s) => a + s.w, 0); const d = g - b;
  const objG = sp.some((s) => s.w && s.l.ver === F.good && s.w >= 4), objB = sp.some((s) => s.w && s.l.ver === F.bad && s.w >= 4);
  let st, txt; if (!sp.length) { st = "none"; txt = "Nothing linked yet"; }
  else if (objG && !objB && d >= 2) { st = "strong"; txt = `Strongly supported: ${F.vers[F.good].label.toLowerCase()}`; }
  else if (Math.abs(d) <= 1) { st = "disputed"; txt = "Disputed. The evidence points both ways."; }
  else if (d >= 4) { st = "strong"; txt = `Strongly supported: ${F.vers[F.good].label.toLowerCase()}`; }
  else if (d >= 2) { st = "lean"; txt = `Leaning your way: ${F.vers[F.good].label.toLowerCase()}`; }
  else if (d <= -4) { st = "against"; txt = `Strongly against you: ${F.vers[F.bad].label.toLowerCase()}`; }
  else { st = "leanagainst"; txt = `Leaning against you: ${F.vers[F.bad].label.toLowerCase()}`; }
  return { g, b, d, st, txt, sp }; }
const fmtT = (t, dec = 1) => { const s = Math.max(0, t); const ss = Math.floor(s), f = Math.floor((s - ss) * Math.pow(10, dec)); return `08:42:${String(ss).padStart(2, "0")}${dec ? "." + String(f).padStart(dec, "0") : ""}`; };
const money = (n) => "£" + n.toLocaleString("en-GB");
function ledgerTotals() { let shown = 0, missing = 0, pend = 0; state.ledger.forEach((r) => { if (r.pending) { pend++; return; } const h = r.have != null ? r.have : r.amt; shown += h; if (h < r.amt) missing++; }); return { shown, missing, pend }; }
