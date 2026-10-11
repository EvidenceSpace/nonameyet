// ===== card renderers =====
const SIDE = { you: ["You", "s-you"], wit: ["Independent", "s-wit"], them: ["Other side", "s-them"] };
const AVC = { sam: ["#e6ecff", "#3552c9"], joan: ["#e3f3ec", "#1d7a52"], ade: ["#fff1dc", "#9a6410"], marek: ["#fde8ec", "#b2384f"] };
function claimInfo(cid) { const l = state.links.find((x) => x.claim === cid); if (!l) return null; const F = FACTS[l.fact], ex = state.excluded[l.id];
  return { l, eff: ex ? "struck" : l.ver === F.good ? "helps" : "hurts", ex }; }
const EFF = { helps: "Helps you", hurts: "Hurts you", struck: "Not counted" };
function avatar(id, ini, cls = "pav2") { const c = AVC[id] || ["#eef1f6", "#4f5b73"]; return `<span class="${cls}" style="background:${c[0]};color:${c[1]}">${ini}</span>`; }

function personHTML(e) {
  const [st, sc] = SIDE[e.side];
  const stm = e.stmts.map((s, i) => { const d = DOCS[s.doc];
    const rows = s.claims.map((c) => { const ci = claimInfo(c.id); const eff = ci ? ci.eff : "";
      return `<div class="claim ${eff ? "c-" + eff : ""}" data-claim="${c.id}"><span class="cq">“${esc(c.t)}”</span>${eff ? `<span class="ct">${EFF[eff]}</span>` : ""}${ci && ci.ex ? `<span class="why">${esc(ci.ex)}</span>` : ""}</div>`; }).join("");
    const between = e.changed && i === 1 ? `<button class="changed" data-act="compare">${ic("swap")}<span>His story changed</span><b>Compare</b></button>` : "";
    return between + `<div class="stmt"><div class="sh"><span class="ref">${d.ref}</span><span class="sd">${esc(s.date)}</span><button class="lnk" data-act="open" data-doc="${s.doc}">${ic("doc")}Read</button></div>${rows}</div>`; }).join("");
  const act = e.act ? (state.sight && e.act.k === "sight" ? `<div class="done-act">${ic("check")}View checked on the scene</div>` : `<button class="act" data-act="${e.act.k}">${ic(e.act.i)}${esc(e.act.t)}</button>`) : "";
  return `<div class="card person p-${e.side}"><div class="ph2">${avatar(e.id, e.ini)}<div class="pn"><b>${esc(e.name)}</b><small>${esc(e.role)}</small></div><span class="side ${sc}">${st}</span></div>
  <button class="where" data-act="where" data-spot="${e.spot}">${ic("pin")}<span>${esc(e.where)}</span><em>Show on scene</em></button>${stm}${act}</div>`;
}

function factHTML(e) {
  const F = FACTS[e.fact], v = verdict(e.fact);
  const col = (ver) => { const rows = v.sp.filter((s) => s.l.ver === ver).map((s) => {
      const av = s.l.kind === "frame" ? `<span class="thumb">${state.frameImg ? `<img src="${state.frameImg}">` : ic("film")}</span>` : s.l.kind ? `<span class="pav2 obj">${ic(s.ini)}</span>` : avatar(s.src.id, s.src.ini);
      const nm = s.l.kind ? s.name : s.src.name.split(" ")[0];
      return `<div class="sup ${s.ex ? "ex" : ""} ${s.w >= 4 ? "obj" : ""}" data-link="${s.l.id}">${av}<div><b>${esc(nm)}</b><small>${s.ex ? esc(s.ex) : esc(s.kind) + (s.w >= 2 ? (s.w >= 4 ? " · counts most" : " · counts double") : "")}</small></div></div>`; }).join("");
    return rows || `<div class="sup none">Nothing yet</div>`; };
  const glyph = (ver) => e.fact === "light" ? `<i class="lamp" style="background:${F.vers[ver].dot}"></i>` : `<i class="lamp sq" style="background:${F.vers[ver].dot}"></i>`;
  const tot = Math.max(6, v.g + v.b), pos = 50 - (Math.max(-tot, Math.min(tot, v.d)) / tot) * 46;
  const extra = e.fact === "speed" ? (state.measured ? `<div class="done-act">${ic("check")}Measured on the plan: about 22 mph</div>` : `<button class="act" data-act="measure">${ic("ruler")}Measure it from the dashcam</button>`) : "";
  return `<div class="card fact"><div class="fk">${ic("scale")}<span>Disputed point</span><em>at ${F.at}</em></div><h3>${esc(F.q)}</h3>
  <div class="sides"><div class="col good"><div class="vh">${glyph(F.good)}<span>Your version</span><b>${F.vers[F.good].label}</b></div>${col(F.good)}</div>
  <div class="col bad"><div class="vh">${glyph(F.bad)}<span>Their version</span><b>${F.vers[F.bad].label}</b></div>${col(F.bad)}</div></div>
  <div class="bal"><span class="ln"></span><span class="pip st-${v.st}" style="left:${pos}%"></span></div>
  <div class="verdict st-${v.st}">${esc(v.txt)}</div>${extra}</div>`;
}

function ruleHTML(e) { return `<div class="card rule" data-act="open" data-doc="${e.doc}"><div class="rk">${ic("scale")}${esc(e.head)}</div><p class="serif">${esc(e.text)}</p></div>`; }
function stickyHTML(e) { return `<div class="sticky2"><p class="hand">${esc(e.text)}</p><span class="by">${e.by ? `<i style="background:${PEOPLE[e.by].bg};color:${PEOPLE[e.by].color}">${e.by}</i>${PEOPLE[e.by].first}` : ""}</span></div>`; }

function leadHTML(e) {
  const sent = state.leadSent;
  return `<div class="card lead ${sent ? "sent" : ""}"><div class="lk2">${ic("camera")}<span>Lead · not obtained</span></div><h4>Hale Pharmacy CCTV</h4>
  <p>Their camera faces the junction. It could show both lights.</p>
  ${sent ? `<div class="dl ok">${ic("check")}<span><b>Request sent 27 Mar</b><small>Asked them to keep 08:30–09:00 on 4 Mar</small></span></div>`
    : `<div class="dl">${ic("clock")}<span><b>Likely deleted by 3 Apr</b><small>Shops often keep footage 31 days · 7 days left</small></span></div><button class="act" data-act="lead">${ic("send")}Draft a request to keep it</button>`}</div>`;
}

function ledgerHTML(e) {
  const t = ledgerTotals();
  const rows = state.ledger.map((r) => { if (r.pending) return `<div class="lr pend"><span>${esc(r.t)}</span><em>${esc(r.pending)}</em></div>`;
    const h = r.have != null ? r.have : r.amt, short = h < r.amt;
    return `<div class="lr ${short ? "short" : ""}" data-row="${r.id}"><span>${esc(r.t)}</span>${short ? `<span class="hole" data-hole="${r.id}">${ic("plus")}${esc(r.miss)}</span>` : `<span class="refs"><button class="ref2" data-act="open" data-doc="${r.doc}">${DOCS[r.doc].ref}</button>${r.doc2 ? `<button class="ref2 new" data-act="open" data-doc="${r.doc2}">${DOCS[r.doc2].ref}</button>` : ""}</span>`}<b>${money(h)}</b></div>`; }).join("");
  return `<div class="card ledger"><div class="fk">${ic("money")}<span>What it cost you</span><em>backed by papers</em></div>${rows}
  <div class="ltot"><span>Shown so far</span><b>${money(t.shown)}</b></div><div class="lnote">${t.missing ? `${t.missing} ${t.missing > 1 ? "items need papers" : "item needs papers"} · ` : "Every amount has a paper · "}injury valued later</div></div>`;
}

function damageHTML(e) {
  return `<div class="card damage"><div class="fk">${ic("car")}<span>Damage</span><em>photos 4 Mar</em></div>
  <svg viewBox="0 0 220 150" class="dmg"><defs><pattern id="hz" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#e0475f" stroke-width="2"/></pattern></defs>
  <g transform="translate(150 18)"><rect x="0" y="0" width="38" height="92" rx="10" fill="#dfe7ff" stroke="#4d70f7" stroke-width="1.6"/><rect x="5" y="16" width="28" height="16" rx="4" fill="#b9c8f7"/><rect x="5" y="62" width="28" height="12" rx="4" fill="#b9c8f7"/>
  <path d="M0 38 q7 12 0 26" fill="url(#hz)" stroke="#e0475f" stroke-width="1.6"/><text x="19" y="108" text-anchor="middle">Your Fiesta</text></g>
  <g transform="translate(28 44)"><rect x="0" y="0" width="104" height="40" rx="6" fill="#f3f4f7" stroke="#8a95ab" stroke-width="1.6"/><rect x="80" y="5" width="18" height="30" rx="3" fill="#dfe3ea"/>
  <path d="M104 6 v28" stroke="#e0475f" stroke-width="3" stroke-linecap="round"/><text x="52" y="58" text-anchor="middle">The van</text></g>
  <path d="M136 64 h10" stroke="#e0475f" stroke-width="1.6" marker-end="url(#ah)"/><defs><marker id="ah" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#e0475f"/></marker></defs>
  <g class="pm"><circle cx="146" cy="50" r="7"/><text x="146" y="53.5">1</text><circle cx="192" cy="82" r="7"/><text x="192" y="85.5">2</text><circle cx="128" cy="38" r="7"/><text x="128" y="41.5">3</text></g></svg>
  <p>Van’s front hit your passenger doors. That fits a van driving into the side of a car already crossing.</p></div>`;
}

function videoHTML(e) {
  return `<div class="card video ${state.reviewed ? "rev" : ""}"><div class="fk">${ic("film")}<span>Joan’s dashcam</span><em>V-01 · 0:12</em>${state.reviewed ? `<span class="badge ok">${ic("check")}Reviewed</span>` : `<span class="badge">Not reviewed yet</span>`}</div>
  <div class="cam"><canvas id="camc" width="728" height="410"></canvas><div class="ts" id="camts"></div><span class="rec">● JOAN-CAM</span></div>
  <div class="vc"><button class="pb2" data-act="play">${ic(playing ? "pause" : "play")}</button><div class="scrub" data-scrub="1"><div class="tk" style="left:${(5.41 / 9) * 100}%" title="Your car crosses its stop line"></div><div class="tk r" style="left:${(6.07 / 9) * 100}%" title="Van crosses its stop line"></div><div class="fill" style="width:${(state.t / 9) * 100}%"></div><div class="knob" style="left:${(state.t / 9) * 100}%"></div></div><span class="tm">${fmtT(state.t, 1).slice(3)}</span></div>
  <div class="vf"><button class="act sm" data-act="pinframe">${ic("pin")}Pin this frame</button><span class="hint">${state.reviewed ? "Drag it onto a disputed point" : "Red mark: van reaches its line"}</span></div></div>`;
}

function sceneHTML(e) {
  const th = state.theory;
  return `<div class="card scene"><div class="fk">${ic("pin")}<span>The junction</span><em>Hale Rd × Mill Ln</em>
  <div class="seg2"><button data-th="evidence" class="${th === "evidence" ? "on" : ""}">What the evidence shows</button><button data-th="sam" class="${th === "sam" ? "on" : ""}">Your version</button><button data-th="marek" class="${th === "marek" ? "on" : ""}">Marek’s version</button></div></div>
  <div class="map"><svg id="mapsvg" viewBox="40 64 520 352">${mapStatic()}<g id="mapdyn"></g></svg><div id="maptip"></div></div>
  <div class="vc"><button class="pb2" data-act="play">${ic(playing ? "pause" : "play")}</button><div class="scrub" data-scrub="1"><div class="tk" style="left:${(5.41 / 9) * 100}%"></div><div class="tk r" style="left:${(6.07 / 9) * 100}%"></div><div class="fill" style="width:${(state.t / 9) * 100}%"></div><div class="knob" style="left:${(state.t / 9) * 100}%"></div></div><span class="tm">${fmtT(state.t, 1).slice(3)}</span>
  <button class="tg ${state.sight ? "on" : ""}" data-act="togsight">${ic("eye")}Sightlines</button><button class="tg ${state.ruler ? "on" : ""}" data-act="togruler">${ic("ruler")}Ruler</button></div>
  <div class="fit" id="fitbox">${fitHTML()}</div></div>`;
}
function fitHTML() {
  const row = (k, t) => `<div class="fr f-${k}">${k === "yes" ? ic("check") : k === "no" ? ic("close") : ic("alert")}<span>${t}</span></div>`;
  if (state.theory !== "evidence") {
    const sam = state.theory === "sam", rows = [];
    rows.push(row(sam ? "yes" : "no", "Joan, behind the van, says the Mill Lane light was red"));
    rows.push(state.reviewed ? row(sam ? "yes" : "no", "Joan’s dashcam shows it red as the van reaches the line") : row("q", "Joan’s dashcam could settle this · not reviewed yet"));
    if (!sam) rows.push(row(state.excluded.l4 ? "no" : "q", state.excluded.l4 ? "He told police he didn’t see the lights" : "What did he tell the police at the scene?"));
    rows.push(state.excluded.l3 ? row("q", "Ade thought the van’s light was green, but he stood behind the signal") : row(sam ? "no" : "yes", "Ade thinks the van’s light was green"));
    return `<b>${sam ? "Your version: you had green, the van had red." : "Marek’s version: he had green, you had red."}</b>${rows.join("")}`;
  }
  const tip = state.sightMsg || state.rulerMsg; if (tip) return tip;
  const eb = state.reviewed ? "red on the dashcam" : "unknown until the dashcam is reviewed";
  const nb = state.reviewed && state.planPinned ? "green, worked out from the council’s timing plan" : state.reviewed ? "unknown · the council’s timing plan would tell us" : "unknown";
  return `<b>Only what the evidence proves is shown.</b><div class="kv"><span>Mill Lane light</span>${eb}</div><div class="kv"><span>Hale Road light</span>${nb}</div>`;
}
const RENDER = { person: personHTML, fact: factHTML, rule: ruleHTML, sticky: stickyHTML, lead: leadHTML, ledger: ledgerHTML, damage: damageHTML, video: videoHTML, scene: sceneHTML };
