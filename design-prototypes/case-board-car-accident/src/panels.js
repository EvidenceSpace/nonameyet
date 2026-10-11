// ===== must-prove panel =====
const proveEl = $("#prove");
function nextStep() {
  const v1 = verdict("light"), v2 = verdict("speed"), lt = ledgerTotals();
  if (!state.sightDone) return { by: "DO", t: "Dana asks: could Ade even see the van’s light from the bus stop?", b: "Check Ade’s view", act: "sight" };
  if (!state.links.some((l) => l.id === "lf")) return { t: "Joan’s dashcam can settle the light. Pin the frame where the van reaches its stop line.", b: "Go to the dashcam", act: "dash" };
  if (v2.st !== "strong" && v2.st !== "lean") return { t: "They’ll say you were speeding. Measure your speed from the dashcam.", b: "Measure it", act: "measure" };
  if (lt.missing) return { t: `${lt.missing} ${lt.missing > 1 ? "costs have" : "cost has"} no paper yet. The papers are already in Loose papers.`, b: "Open loose papers", act: "loose" };
  if (!state.leadSent) return { t: "Ask Hale Pharmacy to keep their CCTV before it’s deleted on 3 Apr.", b: "Draft the request", act: "lead" };
  return { t: "Every point has evidence behind it. Send the letter of claim to Northway.", b: "Draft letter of claim", act: "letter" };
}
const ST = { none: ["q", "Nothing yet"], disputed: ["warn", "Disputed"], lean: ["mid", "Leaning your way"], strong: ["ok", "Strongly supported"], leanagainst: ["bad", "Not answered yet"], against: ["bad", "Against you"] };
function renderProve() {
  const v1 = verdict("light"), v2 = verdict("speed"), lt = ledgerTotals(), ns = nextStep();
  const item = (n, t, sub, st, target) => `<button class="pi" data-go="${target}"><span class="n s-${st[0]}">${st[0] === "ok" ? ic("check") : n}</span><span class="tx"><b>${t}</b><small class="s-${st[0]}">${sub}</small></span></button>`;
  const s2 = v2.st === "strong" || v2.st === "lean" ? ["ok", "Answered: measured about 22 mph"] : ST[v2.st];
  proveEl.innerHTML = `<div class="ph3"><h2>What you need to prove</h2><small>Negligence claim against Marek Kowalski</small></div>
  <div class="plist">${item(1, "He had to stop at a red light", "Settled by law · Highway Code rule 175", ["ok"], "r175")}
  ${item(2, "His light was red", ST[v1.st][1], ST[v1.st], "f1")}
  ${item(3, "That caused the crash", "Scene and damage fit", ["ok"], "damage")}
  ${item(4, "What it cost you", lt.missing ? `${money(lt.shown)} so far · ${lt.missing} papers missing` : `${money(lt.shown)} · injury valued after 2 Apr`, lt.missing ? ["warn"] : ["ok"], "ledger")}</div>
  <div class="psec">What they’ll say</div><div class="plist">${item("!", "You were speeding", s2[1], [s2[0]], "f2")}</div>
  <div class="psec">Deadlines</div><div class="dls">
  <button class="dlr ${state.leadSent ? "" : "hot"}" data-go="lead"><span>${state.leadSent ? "CCTV request sent" : "CCTV may be deleted"}</span><b>${state.leadSent ? "27 Mar" : "3 Apr · 7 days"}</b></button>
  <div class="dlr"><span>Medical report due</span><b>2 Apr</b></div><div class="dlr"><span>Last day to start a court claim</span><b>4 Mar 2028</b></div></div>
  <div class="next"><small>${ns.by ? `<i>${ns.by}</i>` : ""}Next step</small><p>${esc(ns.t)}</p><button class="btn pri sm" data-next="${ns.act}">${esc(ns.b)}${ic("arrow")}</button></div>`;
}
proveEl.addEventListener("click", (ev) => { const g = ev.target.closest("[data-go]"); if (g) { select(g.dataset.go); revealEl(g.dataset.go); flashCard(g.dataset.go); return; }
  const n = ev.target.closest("[data-next]"); if (!n) return; const k = n.dataset.next;
  if (k === "sight") checkSight(); else if (k === "dash") { select(null); focusOn("dash", 1.3); flashCard("dash"); } else if (k === "measure") startMeasure(); else if (k === "loose") openLoose(); else if (k === "lead") openRequest(); else openLetter(); });

// ===== side panel (reader, loose papers, request, letter) =====
const side = $("#side"); let letterOpen = false;
function openSide(html, cls) { side.className = "panel2 glassbar open " + (cls || ""); side.innerHTML = html; letterOpen = cls === "letter"; }
function closeSide() { side.classList.remove("open"); letterOpen = false; }
side.addEventListener("click", (ev) => { if (ev.target.closest("[data-close]")) closeSide(); });
const reader = side, letter = side;
function openDoc(k) { const d = DOCS[k]; if (k === "dash") { select("dash"); revealEl("dash"); return; }
  openSide(`<div class="sh2"><div><span class="ref">${d.ref} · ${d.kind}</span><h3>${esc(d.title)}</h3><small>${esc(d.sub)}</small></div><button class="xb" data-close>${ic("close")}</button></div><div class="sb"><div class="paper serif">${d.html}</div></div><div class="sf">${ic("pin")}Highlighted lines are on the board</div>`, "reader"); }

function openLoose() { select(null); const rows = state.loose.map((k) => { const L = LOOSE.find((x) => x.k === k), d = DOCS[k];
    const dest = L.fits ? `Add to ${state.ledger.find((r) => r.id === L.fits).t.split(",")[0]}` : "Add to the scene";
    return `<div class="lp" data-loose="${k}"><div class="lpt">${ic("doc")}</div><div class="lpb"><span class="ref">${d.ref} · ${d.kind}</span><b>${esc(d.title)}</b><div class="fd">Found: ${L.found.map((f) => `<span>${esc(f)}</span>`).join("")}</div><button class="act sm" data-place="${k}">${ic("plus")}${dest}</button></div></div>`; }).join("");
  openSide(`<div class="sh2"><div><span class="ref">Uploaded, not on the board yet</span><h3>Loose papers</h3><small>Read for amounts, dates and places</small></div><button class="xb" data-close>${ic("close")}</button></div><div class="sb">${rows || `<p class="empty">Everything is on the board.</p>`}</div><div class="sf">Drag a paper onto the board, or use the button</div>`, "loose"); }
side.addEventListener("click", (ev) => { const b = ev.target.closest("[data-place]"); if (b) placeLoose(b.dataset.place); });
side.addEventListener("pointerdown", (ev) => { const p = ev.target.closest(".lp"); if (!p || ev.target.closest("button")) return; startPaperDrag(ev, p.dataset.loose); });
let paper = null;
function startPaperDrag(ev, k) { const g = document.createElement("div"); g.className = "pghost"; g.innerHTML = `${ic("doc")}<span>${DOCS[k].ref} · ${esc(DOCS[k].title)}</span>`; ov.appendChild(g); paper = { k, g }; movePaper(ev); }
function movePaper(ev) { const p = local(ev.clientX, ev.clientY); paper.g.style.left = p.x - 20 + "px"; paper.g.style.top = p.y - 18 + "px"; const t = paperTarget(ev); nodes.forEach((n, id) => n.classList.toggle("target", id === t)); }
function paperTarget(ev) { const L = LOOSE.find((x) => x.k === paper.k), w = toWorld(ev.clientX, ev.clientY); const id = L.fits ? "ledger" : "scene"; const r = rectOf(id); return w.x > r.x && w.x < r.x + r.w && w.y > r.y && w.y < r.y + r.h ? id : null; }
addEventListener("pointermove", (ev) => { if (paper) movePaper(ev); });
addEventListener("pointerup", (ev) => { if (!paper) return; const t = paperTarget(ev), k = paper.k; paper.g.remove(); paper = null; nodes.forEach((n) => n.classList.remove("target")); if (t) placeLoose(k); else toast(LOOSE.find((x) => x.k === k).fits ? "Drop it on “What it cost you”" : "Drop it on the scene"); });
function placeLoose(k) { const L = LOOSE.find((x) => x.k === k); state.loose = state.loose.filter((x) => x !== k);
  if (L.fits) { const r = state.ledger.find((x) => x.id === L.fits); r.have = r.amt; if (r.doc) r.doc2 = k; else r.doc = k; toast(`${r.t.split(",")[0]}: ${money(r.amt)} now backed by ${DOCS[k].ref}`); refresh(); flashCard("ledger"); }
  else { state.planPinned = true; toast("Timing plan added: the scene can now work out the Hale Road light"); refresh(); flashCard("scene"); }
  $("#loosen").textContent = state.loose.length; $("#loosebtn").classList.toggle("none", !state.loose.length); openLoose(); }
$("#loosebtn").onclick = () => (side.classList.contains("loose") && side.classList.contains("open") ? closeSide() : openLoose());

function openRequest() { if (state.leadSent) { select("lead"); revealEl("lead"); return; }
  openSide(`<div class="sh2"><div><span class="ref">Draft · to Hale Pharmacy</span><h3>Please keep your CCTV</h3><small>Short, polite, and sent today</small></div><button class="xb" data-close>${ic("close")}</button></div><div class="sb"><div class="paper serif"><p>Dear Hale Pharmacy,</p><p>On Tuesday 4 March 2025 at about 08:42 there was a collision at the Hale Road and Mill Lane junction, outside your shop. Your camera faces the junction.</p><p>Please keep the footage from 08:30 to 09:00 that morning and don’t let it be recorded over. I’m happy to pay any reasonable cost of a copy.</p><p>Kind regards,<br>Sam Reyes</p></div></div><div class="sf"><button class="btn pri sm" id="sendreq">${ic("send")}Send by email</button><span>Copy saved to Room</span></div>`, "req");
  $("#sendreq").onclick = () => { state.leadSent = true; closeSide(); refresh(); flashCard("lead"); toast("Request sent to Hale Pharmacy"); badge(); }; }
function badge() { const t = $$(".tabs span").find((s) => s.textContent.startsWith("Room")); if (t && !t.querySelector(".tbadge")) t.insertAdjacentHTML("beforeend", `<i class="tbadge">1</i>`); }

// ===== compare Marek's two accounts =====
const cmp = $("#compare");
function openCompare() { select(null); const A = DOCS.police, B = DOCS.insurer;
  cmp.innerHTML = `<div class="ch">${ic("swap")}Marek’s two accounts<span class="sp"></span><button class="xb" data-close>${ic("close")}</button></div>
  <div class="cols"><div><div class="cap">${A.ref} · ${A.kind} · 4 Mar, 09:10 · 28 minutes after the crash</div><div class="paper serif">${A.html}</div></div><div><div class="cap">${B.ref} · ${B.kind} · 21 Mar · 17 days later</div><div class="paper serif">${B.html}</div></div></div>
  <div class="cfoot"><p>At the scene he said he <b>didn’t see the lights change</b>. Seventeen days later his insurer says he <b>had a green light</b>. He can’t say what colour a light was if he didn’t see it.</p><div class="cacts">${state.excluded.l4 ? `<span class="okline">${ic("check")}Noted on the light question</span>` : `<button class="btn" data-close>Not now</button><button class="btn pri" id="notel4">Don’t count his “green” claim</button>`}</div></div>`;
  cmp.classList.add("open"); const n = $("#notel4"); if (n) n.onclick = () => { state.excluded.l4 = "Told police he didn’t see the lights"; cmp.classList.remove("open"); refresh(); flashCard("f1"); toast("His “green light” claim no longer counts"); }; }
cmp.addEventListener("click", (ev) => { if (ev.target.closest("[data-close]")) cmp.classList.remove("open"); });

// ===== letter of claim, written from the board =====
function cite(ref, go, t) { return `<button class="cite" data-go="${go}"${t != null ? ` data-t="${t}"` : ""}>${ref}</button>`; }
function buildLetter() { if (!letterOpen) select(null); const v1 = verdict("light"), v2 = verdict("speed"), lt = ledgerTotals(), frameL = state.links.find((l) => l.id === "lf");
  const weak = []; if (v1.st !== "strong" && v1.st !== "lean") weak.push(["f1", "His light: still disputed on the board"]); if (!(v2.st === "strong" || v2.st === "lean")) weak.push(["f2", "Speed: their point isn’t answered yet"]); if (lt.missing) weak.push(["ledger", `${lt.missing} costs have no paper`]);
  const P = [];
  P.push(`<p>At 08:42 on Tuesday 4 March 2025 I was driving north on Hale Road, Leeds, through the junction with Mill Lane on a green light. Your insured’s van, travelling east on Mill Lane, entered the junction against a red light and hit the passenger side of my car. ${cite("S-01", "sam")} ${cite("Damage", "damage")}</p>`);
  let p2 = `<p>Joan Pike, an independent witness driving behind the van, states that their light was red and the van did not stop. ${cite("S-02", "joan")}`;
  if (frameL && frameL.ver === "red") p2 += ` Her dashcam shows the Mill Lane signal red as the van reaches the stop line at ${fmtT(frameL.t, 1)}. ${cite("V-01 · " + fmtT(frameL.t, 1).slice(3), "dash", frameL.t)}`;
  if (state.planPinned) p2 += ` The council’s timing plan confirms Hale Road and Mill Lane are never green at the same time. ${cite("D-04", "scene")}`;
  P.push(p2 + `</p>`);
  if (state.excluded.l4) P.push(`<p>At the scene your insured told PC Hart he was checking his sat nav and did not see the lights change. ${cite("P-01", "marek")} Your letter of 21 March now says he had a green light. ${cite("L-01", "marek")} He cannot say what colour the light was if he did not see it.</p>`);
  if (state.measured) P.push(`<p>You say I was going too fast. Measured from the dashcam, my car covered 7.7 metres in 0.79 seconds before the impact: about 22 mph, under the 30 mph limit. ${cite("V-01 · 05.41–06.20", "scene", 5.41)} ${cite("R-02", "r30")}</p>`);
  P.push(`<p>Rule 175 of the Highway Code requires a driver to stop at a red light. ${cite("R-01", "r175")} Your insured did not, and I hold him responsible for the collision.</p>`);
  const rows = state.ledger.filter((r) => !r.pending).map((r) => { const h = r.have != null ? r.have : r.amt; return `<tr><td>${esc(r.t)}</td><td>${h < r.amt ? `<em>paper missing</em>` : DOCS[r.doc].ref + (r.doc2 ? ", " + DOCS[r.doc2].ref : "")}</td><td>${money(h)}</td></tr>`; }).join("");
  P.push(`<p>My losses so far:</p><table>${rows}<tr class="tt"><td>Total so far</td><td></td><td>${money(lt.shown)}</td></tr></table><p>My neck injury will be valued once I have the medical report, due on 2 April.</p>`);
  P.push(`<p>Please keep any dashcam or tracking data from the van.${state.leadSent ? " I have asked Hale Pharmacy to keep their CCTV." : ""} Please acknowledge this letter within 21 days.</p><p>Yours faithfully,<br>Sam Reyes</p>`);
  openSide(`<div class="sh2"><div><span class="ref">Draft · written from the board</span><h3>Letter of claim</h3><small>To Northway Insurance, for Marek Kowalski</small></div><button class="xb" data-close>${ic("close")}</button></div>
  <div class="sb">${weak.length ? `<div class="weak"><b>${ic("alert")}Weak spots</b>${weak.map((w) => `<button data-go="${w[0]}">${esc(w[1])}</button>`).join("")}</div>` : `<div class="weak ok"><b>${ic("check")}Every point has evidence behind it</b></div>`}<div class="paper serif letterp"><p class="lh">Re: collision at Hale Road / Mill Lane, Leeds · 4 March 2025, 08:42</p>${P.join("")}</div></div>
  <div class="sf"><button class="btn pri sm" id="todana" ${state.toDana ? "disabled" : ""}>${state.toDana ? ic("check") + "Sent to Dana" : ic("send") + "Send to Dana for review"}</button><span>Click a reference to see it on the board</span></div>`, "letter");
  $("#todana").onclick = () => { state.toDana = true; buildLetter(); toast("Sent to Dana for review"); danaSays("Read it. Two small edits, then it’s ready to go. I’ll mark them in the draft.", 2400); }; }
function openLetter() { buildLetter(); }
side.addEventListener("click", (ev) => { const c = ev.target.closest(".cite, .weak button"); if (!c) return; const go = c.dataset.go; if (c.dataset.t) { state.t = +c.dataset.t; updateTime(); } select(go); revealEl(go); flashCard(go); });
$("#letterbtn").onclick = () => (letterOpen ? closeSide() : openLetter());

// ===== Dana: live cursor + comment thread =====
const thread = [{ by: "DO", t: "Could Ade even see the van’s light from the bus stop? Check his view on the scene.", at: "2h ago" }];
let threadOpen = false;
function openThread() { threadOpen = true; renderThread(); }
function renderThread() { let t = $("#thread"); if (!threadOpen) { t && t.remove(); return; } if (!t) { t = document.createElement("div"); t.id = "thread"; t.className = "thread2 glassbar"; ov.appendChild(t); t.addEventListener("pointerdown", (e) => e.stopPropagation()); }
  t.innerHTML = `<div class="th"><b>Comment on Ade Bello</b><button class="xb" data-x>${ic("close")}</button></div>` + thread.map((m) => `<div class="m"><span class="a" style="background:${PEOPLE[m.by].bg};color:${PEOPLE[m.by].color}">${m.by}</span><div><b>${PEOPLE[m.by].name}</b>${m.by === "DO" ? `<span class="role">Solicitor</span>` : ""}<time>${m.at}</time><p>${esc(m.t)}</p></div></div>`).join("") + `<input placeholder="Reply">`;
  t.querySelector("[data-x]").onclick = () => { threadOpen = false; renderThread(); };
  const inp = t.querySelector("input"); inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inp.value.trim()) { thread.push({ by: "SR", t: inp.value.trim(), at: "now" }); renderThread(); paint(byId("ade")); } }); placeOverlays(); }
function danaSays(t, delay) { setTimeout(() => { danaTo("ade"); setTimeout(() => { thread.push({ by: "DO", t, at: "now" }); paint(byId("ade")); if (!threadOpen) peek(t); else renderThread(); }, 900); }, delay || 0); }
function peek(t) { let b = $("#peek"); if (!b) { b = document.createElement("div"); b.id = "peek"; b.className = "peek glassbar"; ov.appendChild(b); b.addEventListener("click", () => { b.remove(); openThread(); }); }
  b.innerHTML = `<span class="a">DO</span><div><b>Dana</b><p>${esc(t)}</p></div>`; b.classList.remove("out"); placeOverlays(); clearTimeout(peek.tm); peek.tm = setTimeout(() => b.classList.add("out"), 7000); }
function placeOverlays() { const t = $("#thread"); if (t) { const r = rectOf("ade"); if (r) { const p = toLocal(r.x + r.w, r.y); t.style.left = Math.min(p.x + 14, frame.offsetWidth - 340) + "px"; t.style.top = Math.max(150, Math.min(p.y - 10, frame.offsetHeight - t.offsetHeight - 110)) + "px"; } }
  const pk = $("#peek"); if (pk) { const r = rectOf("ade"); if (r) { const q = toLocal(r.x + r.w, r.y); pk.style.left = q.x + 12 + "px"; pk.style.top = Math.max(150, q.y - 34) + "px"; } }
  const c = $("#dana"); if (c) { const p = toLocal(dana.x, dana.y); c.style.transform = `translate(${p.x}px,${p.y}px)`; } }
const dana = { x: 700, y: 820, tx: 700, ty: 820 };
function danaTo(id, dx = 0.8, dy = 0.15) { const r = rectOf(id); if (r) { dana.tx = r.x + r.w * dx; dana.ty = r.y + r.h * dy; } }
setInterval(() => { if (Math.random() < 0.35) { const ids = ["ledger", "f1", "lead", "marek", "r175", "note1", "f2"]; danaTo(ids[Math.floor(Math.random() * ids.length)], 0.3 + Math.random() * 0.6, 0.2 + Math.random() * 0.6); } }, 3800);
(function dloop() { dana.x += (dana.tx - dana.x) * 0.05; dana.y += (dana.ty - dana.y) * 0.05; requestAnimationFrame(dloop); })();

// ===== misc =====
function toast(t) { const old = $$("#toasts .toast"); if (old.length > 1) old[0].remove(); const d = document.createElement("div"); d.className = "toast"; d.innerHTML = ic("check") + esc(t); $("#toasts").appendChild(d); setTimeout(() => d.remove(), 3600); }
$("#catchgo").onclick = () => { select(null); revealEl("ade"); openThread(); };
document.addEventListener("pointerdown", (ev) => { if (side.classList.contains("open") && !ev.target.closest("#side, .hright, #prove, .el, .menu2, .pghost")) {} });

// ===== boot =====
state.els.forEach((e) => mount(e)); stack(); view.x = 356; view.y = 150; view.z = 0.7; applyView();
function stack() { const G = 24, col = (ids, x, y0 = 0) => { let y = y0; ids.forEach((id) => { const e = byId(id); e.x = x; e.y = y; pos(e); y += node(id).offsetHeight + G; }); return y; };
  col(["sam", "joan", "ade", "lead"], 0); col(["f1", "f2", "ledger"], 380); col(["marek", "r175", "r30"], 852); const n = byId("note1"); n.x = 884; n.y = byId("r30").y + node("r30").offsetHeight + 34; pos(n);
  const top = Math.max(node("dash").offsetHeight, node("damage").offsetHeight); byId("dash").x = 1220; byId("dash").y = 0; byId("damage").x = 1640; byId("damage").y = 0; byId("damage").w = 268; node("damage").style.width = "268px"; pos(byId("dash")); pos(byId("damage")); const s = byId("scene"); s.x = 1220; s.y = top + G; pos(s); } renderProve(); updateTime(); requestAnimationFrame(drawLinks);
window.__app = { state, refresh, setT, view, animView, revealEl, select, verdict };
