// ===== scene: to-scale plan of the junction (10 units = 1 m) =====
function mapStatic() {
  const lbl = (x, y, t, r = 0) => `<text class="ml" x="${x}" y="${y}" ${r ? `transform="rotate(${r} ${x} ${y})"` : ""}>${t}</text>`;
  return `<rect x="0" y="0" width="600" height="480" fill="#e8ebe4"/>
  <g class="blk"><rect x="40" y="40" width="210" height="120" rx="4"/><rect x="392" y="40" width="200" height="120" rx="4"/><rect x="40" y="260" width="210" height="200" rx="4"/><rect x="350" y="260" width="250" height="200" rx="4"/></g>
  ${lbl(145, 112, "Mill Lane Garage")}${lbl(476, 112, "Shops")}${lbl(145, 345, "Houses")}<g class="ph"><rect x="392" y="282" width="16" height="16" rx="3"/><path d="M400 285v10M395 290h10"/></g>${lbl(460, 296, "Hale Pharmacy")}
  <g class="pave"><rect x="250" y="40" width="15" height="440"/><rect x="335" y="40" width="15" height="440"/><rect x="0" y="160" width="600" height="15"/><rect x="0" y="245" width="600" height="15"/></g>
  <g class="road"><rect x="265" y="40" width="70" height="440"/><rect x="0" y="175" width="600" height="70"/></g>
  <g class="lane"><path d="M300 40V160M300 260V480M0 210H250M350 210H600"/></g>
  <g class="stop"><path d="M265 255H300M300 165H335M255 175V210M345 210V245"/></g>
  <rect class="shelter" x="352" y="126" width="34" height="12" rx="2"/>${lbl(369, 150, "Bus stop", 0)}
  ${lbl(318, 400, "HALE ROAD", -90)}${lbl(110, 232, "MILL LANE")}
  <g class="north" transform="translate(536 92)"><circle r="11"/><path d="M0 -7L4 4L0 2L-4 4z"/><text y="-15">N</text></g>
  <g class="scale" transform="translate(60 398)"><path d="M0 0h100M0 -4v8M100 -4v8"/><text x="50" y="-7">10 m</text></g>`;
}
const SIGCOL = { red: "#e0475f", amber: "#e6a817", green: "#22a06b", unknown: "#b9c1ce" };
function sigShown(which) {
  const th = state.theory, t = state.t;
  if (th !== "evidence") return sigState(which, t, th);
  if (which === "EB") return state.reviewed ? sigState("EB", t) : "unknown";
  return state.reviewed && state.planPinned ? sigState("NB", t) : "unknown";
}
function sigSvg(s, st, small) {
  const a = (s.face * Math.PI) / 180, vx = Math.cos(a), vy = Math.sin(a), c = SIGCOL[st];
  return `<g class="sig ${st}"><path d="M${s.x - vy * 7} ${s.y + vx * 7}L${s.x + vy * 7} ${s.y - vx * 7}" stroke="#4a5468" stroke-width="3" stroke-linecap="round"/>${st !== "unknown" ? `<circle cx="${s.x + vx * 5}" cy="${s.y + vy * 5}" r="${small ? 9 : 12}" fill="${c}" opacity=".22"/>` : ""}<circle cx="${s.x + vx * 4}" cy="${s.y + vy * 4}" r="${small ? 4.6 : 6}" fill="${c}" stroke="#fff" stroke-width="1.6"/>${st === "unknown" ? `<text x="${s.x + vx * 4}" y="${s.y + vy * 4 + 3}" class="q">?</text>` : ""}</g>`;
}
function vehSvg(p, w, l, cls) { return `<g class="veh ${cls}" transform="translate(${p.x} ${p.y}) rotate(${p.r})"><rect x="${-w / 2}" y="0" width="${w}" height="${l}" rx="${w > 18 ? 3 : 5}"/><rect class="ws" x="${-w / 2 + 2.5}" y="${l * 0.18}" width="${w - 5}" height="${l * 0.18}" rx="2"/></g>`; }
function drawMap() {
  const g = $("#mapdyn"); if (!g) return; const t = state.t; let h = "";
  // CCTV lead
  h += `<g class="cctv ${state.leadSent ? "asked" : ""}"><path d="M356 266 L300 196 A90 90 0 0 0 328 182 Z"/><circle cx="356" cy="266" r="5"/><text x="362" y="276">${state.leadSent ? "CCTV · requested" : "CCTV · not obtained"}</text></g>`;
  // sight wedges
  if (state.sight) {
    [SCENE.sigEB, SCENE.sigEB2].forEach((s, i) => { const R = 230, a1 = Math.PI - 0.5, a2 = Math.PI + 0.5;
      h += `<path class="wedge" d="M${s.x} ${s.y}L${s.x + Math.cos(a1) * R} ${s.y + Math.sin(a1) * R}A${R} ${R} 0 0 1 ${s.x + Math.cos(a2) * R} ${s.y + Math.sin(a2) * R}Z"/>`; });
    h += `<text class="wl" x="120" y="150">Where the Mill Lane lights can be seen</text>`;
  }
  // trails
  const tr = (fn, t0) => { let d = ""; for (let k = t0; k <= Math.min(t, 6.2); k += 0.25) { const p = fn(k); d += (d ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1); } return d ? `<path class="trail" d="${d}"/>` : ""; };
  h += tr(fiestaAt, 0) + tr(vanAt, 0);
  // signals
  h += sigSvg(SCENE.sigNB, sigShown("NB")) + sigSvg(SCENE.sigEB, sigShown("EB")) + sigSvg(SCENE.sigEB2, sigShown("EB"), true);
  // vehicles
  const J = joanAt(t), F = fiestaAt(t), V = vanAt(t);
  h += vehSvg({ x: J.x, y: J.y, r: 90 }, 17, 42, "joan") + vehSvg(F, 17, 40, "fiesta") + vehSvg(V, 20, 55, "van");
  if (t >= 6.2) { const k = Math.min(1, (t - 6.2) / 0.6); h += `<circle class="burst" cx="${SCENE.impact.x}" cy="${SCENE.impact.y}" r="${8 + 22 * k}" opacity="${1 - k * 0.7}"/><path class="ix" d="M268 187l10 10M278 187l-10 10"/>`; }
  // people / labels
  h += `<g class="who"><circle cx="${SCENE.ade.x}" cy="${SCENE.ade.y}" r="5.5"/><text x="${SCENE.ade.x + 10}" y="${SCENE.ade.y - 6}">Ade</text></g>`;
  if (J.x > 46) h += `<text class="vl" x="${J.x - 21}" y="${J.y - 14}">Joan</text>`;
  if (F.y < 410) h += `<text class="vl b" x="${F.x + 14}" y="${F.y + 24}">You</text>`;
  if (V.x > 30) h += `<text class="vl" x="${V.x - 28}" y="${V.y + 22}">Van</text>`;
  // sightlines
  if (state.sight) {
    const s = SCENE.sigEB, a = SCENE.ade;
    h += `<path class="sl bad" d="M${a.x} ${a.y}L${s.x} ${s.y}"/><path class="sl bad" d="M${a.x} ${a.y}L${SCENE.sigEB2.x} ${SCENE.sigEB2.y}"/>`;
    h += `<g class="tagb" transform="translate(${a.x + 8} ${a.y + 22})"><rect width="128" height="30" rx="6"/><text x="8" y="12.5">Ade sees the backs</text><text x="8" y="24.5">of both signals</text></g>`;
    if (J.x > 40) h += `<path class="sl good" d="M${J.x - 8} ${J.y}L${SCENE.sigEB2.x} ${SCENE.sigEB2.y}"/><g class="tagg" transform="translate(${Math.max(60, J.x - 120)} ${J.y + 24})"><rect width="118" height="18" rx="6"/><text x="8" y="12.5">Joan faces them</text></g>`;
  }
  // ruler
  if (state.ruler) {
    h += `<g class="ruler"><path d="M258 255V178"/>${Array.from({ length: 8 }, (_, i) => `<path d="M254 ${255 - i * 10}h8"/>`).join("")}<path d="M254 178h8"/><rect x="206" y="207" width="44" height="18" rx="5"/><text x="228" y="220">7.7 m</text>
    <text class="rt" x="250" y="268" text-anchor="end">your stop line · 05.41</text><text class="rt" x="250" y="172" text-anchor="end">impact · 06.20</text></g>`;
  }
  if (state.spot) { const P = { fiesta: F, van: V, joan: { x: J.x - 20, y: J.y }, ade: SCENE.ade }[state.spot]; if (P) h += `<circle class="spot" cx="${P.x}" cy="${P.y + (state.spot === "fiesta" ? 20 : 0)}" r="26"/>`; }
  g.innerHTML = h;
}

// ===== Joan's dashcam, rendered from her seat =====
function drawCam() {
  const c = $("#camc"); if (!c) return; const x = c.getContext("2d"), W = c.width, H = c.height, t = state.t, HZ = 190, FL = 470;
  const cam = joanAt(t).x - 12, CY = 192, CZ = 12;
  const P = (X, Y, Z) => { const d = X - cam; if (d < 3) return null; return [W / 2 + (FL * (Y - CY)) / d, HZ + (FL * (CZ - Z)) / d, d]; };
  const poly = (pts, fill, stroke) => { const q = pts.map((p) => P(...p)); if (q.some((v) => !v)) return; x.beginPath(); q.forEach((v, i) => (i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1]))); x.closePath(); x.fillStyle = fill; x.fill(); if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1.5; x.stroke(); } };
  const near = Math.max(cam + 4, -2000);
  const sky = x.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, "#c9d3df"); sky.addColorStop(1, "#e7ebee"); x.fillStyle = sky; x.fillRect(0, 0, W, HZ);
  const gr = x.createLinearGradient(0, HZ, 0, H); gr.addColorStop(0, "#9aa093"); gr.addColorStop(1, "#7d8378"); x.fillStyle = gr; x.fillRect(0, HZ, W, H - HZ);
  // roads
  poly([[near, 160, 0], [900, 160, 0], [900, 260, 0], [near, 260, 0]], "#b4b8b9");
  poly([[near, 175, 0], [900, 175, 0], [900, 245, 0], [near, 245, 0]], "#6c7075");
  if (cam < 250) poly([[250, -600, 0], [350, -600, 0], [350, 900, 0], [250, 900, 0]], "#b4b8b9");
  if (cam < 265) poly([[265, -600, 0], [335, -600, 0], [335, 900, 0], [265, 900, 0]], "#6c7075");
  // markings
  for (let X = Math.ceil(near / 30) * 30; X < 900; X += 30) { if (X > 245 && X < 350) continue; poly([[X, 209, 0], [X + 14, 209, 0], [X + 14, 211, 0], [X, 211, 0]], "#e9e9e2"); }
  if (cam < 253) poly([[253, 175, 0], [257, 175, 0], [257, 210, 0], [253, 210, 0]], "#f4f4ee");
  if (cam < 263) poly([[265, 253, 0], [300, 253, 0], [300, 257, 0], [265, 257, 0]], "#f4f4ee");
  for (let Y = -600; Y < 900; Y += 30) { if (Y > 150 && Y < 260) continue; if (cam < 298) poly([[299, Y, 0], [301, Y, 0], [301, Y + 14, 0], [299, Y + 14, 0]], "#e9e9e2"); }
  // buildings: far first
  const box = (x1, x2, y1, y2, hgt, col, side) => { // visible faces from the camera
    if (x1 > cam + 3) poly([[x1, y1, 0], [x1, y2, 0], [x1, y2, hgt], [x1, y1, hgt]], col[0]);
    const yy = y2 < CY ? y2 : y1; const xa = Math.max(x1, cam + 4); if (x2 > xa) poly([[xa, yy, 0], [x2, yy, 0], [x2, yy, hgt], [xa, yy, hgt]], col[1]); };
  box(392, 700, -200, 150, 60, ["#d3cabd", "#c2b8a8"]); box(350, 700, 270, 600, 56, ["#dbd3c6", "#c9bfae"]);
  box(-900, 250, -200, 110, 52, ["#cdc6ba", "#bfb6a7"]); box(-900, 250, 310, 600, 46, ["#d6cec2", "#c6bdad"]);
  box(-900, 250, 150, 158, 9, ["#7f9a6e", "#8aa577"]); box(-900, 250, 262, 270, 9, ["#7f9a6e", "#8aa577"]);
  // signals (face west = towards Joan)
  const sig = (sx, sy, facing) => { const b = P(sx, sy, 0), top = P(sx, sy, 34); if (!b || !top) return; const s = FL / b[2];
    x.strokeStyle = "#3b4048"; x.lineWidth = Math.max(1.5, 1.2 * s); x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(top[0], top[1]); x.stroke();
    const hw = 5 * s, hh = 13 * s, hx = top[0] - hw / 2, hy = top[1] - hh; x.fillStyle = "#23272e"; x.fillRect(hx, hy, hw, hh);
    if (!facing) return; const st = sigState("EB", t); ["red", "amber", "green"].forEach((k, i) => { const on = st === k; x.beginPath(); x.arc(top[0], hy + hh * (0.18 + i * 0.32), hw * 0.38, 0, 7); x.fillStyle = on ? SIGCOL[k] : "#3a3f47"; if (on) { x.shadowColor = SIGCOL[k]; x.shadowBlur = 18; } x.fill(); x.shadowBlur = 0; }); };
  sig(SCENE.sigEB2.x, SCENE.sigEB2.y, true); sig(SCENE.sigNB.x, SCENE.sigNB.y, false); sig(SCENE.sigEB.x, SCENE.sigEB.y, true);
  // vehicles, far to near
  const F = fiestaAt(t), V = vanAt(t), items = [];
  items.push({ d: F.x - 8.5 - cam, f: () => { const x0 = F.x - 8.5, ya = F.y, yb = F.y + 40; poly([[x0, ya, 1], [x0, yb, 1], [x0, yb, 13], [x0, ya, 13]], "#3f63e0");
    poly([[x0, ya + 10, 9], [x0, yb - 8, 9], [x0, yb - 10, 14.5], [x0, ya + 13, 14.5]], "#a9bff2");
    if (ya > CY) poly([[x0, ya, 1], [x0 + 17, ya, 1], [x0 + 17, ya, 12], [x0, ya, 12]], "#2f4fc0");
    [ya + 8, yb - 8].forEach((wy) => { const w = P(x0, wy, 3); if (w) { x.beginPath(); x.arc(w[0], w[1], 3.2 * FL / w[2], 0, 7); x.fillStyle = "#1f2329"; x.fill(); } }); } });
  items.push({ d: V.x - 55 - cam, f: () => { const xr = V.x - 55; poly([[xr, 182, 2], [xr, 202, 2], [xr, 202, 27], [xr, 182, 27]], "#f2f3f5", "#c9ced6");
    poly([[xr, 191.6, 4], [xr, 192.4, 4], [xr, 192.4, 26], [xr, 191.6, 26]], "#c9ced6");
    poly([[xr, 183, 9], [xr, 185, 9], [xr, 185, 14], [xr, 183, 14]], "#d9354f"); poly([[xr, 199, 9], [xr, 201, 9], [xr, 201, 14], [xr, 199, 14]], "#d9354f");
    poly([[xr, 189, 4], [xr, 195, 4], [xr, 195, 6.5], [xr, 189, 6.5]], "#f0cf3a"); } });
  items.sort((a, b) => b.d - a.d).forEach((i) => i.d > 3 && i.f());
  // camera feel
  const v = x.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.35)"); x.fillStyle = v; x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(20,24,30,.55)"; x.fillRect(0, H - 34, W, 34); // dashboard edge
  const ts = $("#camts"); if (ts) ts.textContent = "04/03/2025 " + fmtT(t, 2);
}
