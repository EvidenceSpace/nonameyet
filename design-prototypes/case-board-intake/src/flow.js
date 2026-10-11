// ===== flow: writing, files, checking, drafting =====
function toast(html, cls = '') {
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = html;
  const box = document.getElementById('toasts'); box.appendChild(t); while (box.children.length > 2) box.firstChild.remove();
  setTimeout(() => t.classList.add('out'), 4200); setTimeout(() => t.remove(), 4700);
}
function flash(ids) { ids.forEach((i) => S.flash.add(i)); setTimeout(() => { ids.forEach((i) => S.flash.delete(i)); document.querySelectorAll('.flash').forEach((e) => e.classList.remove('flash')); }, 1800); }

function deskAct(a, el) {
  if (a === 'noop') return;
  if (a === 'write') { S.words = 'writing'; return renderDesk(); }
  if (a === 'write2') { S.words = 'writing'; return renderDesk(); }
  if (a === 'review') { S.words = 'review'; S.pick = {}; return renderDesk(); }
  if (a === 'addwords') {
    const fo = F(); const pick = {};
    document.querySelectorAll('.rv input').forEach((c) => { pick[c.dataset.k] = c.checked; });
    for (const k of Object.keys(fo)) if (pick[k] !== false) pick[k] = true;
    S.pick = pick; S.words = 'saved';
    flash(['you', 'p1', 'point']); renderDesk();
    if (pick.theirs) toast(`${ic('scale')}<span><b>New disputed point</b>What colour was the van’s light? Right now it’s your word against his.</span>`);
    return;
  }
  if (a === 'files') return openFiles();
  if (a === 'addfiles') return startReading();
  if (a === 'closemodal') { document.getElementById('modal').className = ''; return; }
  if (a === 'check') { S.sheetOpen = true; S.lastHit = null; S.lastPay = null; document.getElementById('toasts').innerHTML = ''; return renderDesk(); }
  if (a === 'qadd') return qAnswer('add');
  if (a === 'qedit') return qAnswer('edit');
  if (a === 'qnot') return qAnswer('not');
  if (a === 'qclose') { S.sheetOpen = false; return renderDesk(); }
  if (a === 'draft') return openDraft();
  if (a === 'savedraft') { S.draft = 2; closeSide(); renderDesk(); toast(`${ic('check')}<span><b>Saved as a draft</b>Nothing has been sent. It’s in Work, under Drafts.</span>`); return; }
  if (a === 'closeside') return closeSide();
  if (a === 'loose') return openLoose();
  if (a.startsWith('recheck:')) { const id = a.slice(8); S.notnow = S.notnow.filter((x) => x !== id); S.q.push(QUEUE.find((q) => q.id === id)); S.sheetOpen = true; closeSide(); return renderDesk(); }
  if (a === 'joantext') return openJoan();
  if (a.startsWith('view:')) { S.view = a.slice(5); return renderDesk(); }
  if (a.startsWith('cite:')) { const id = a.slice(5); flash([id]); renderBoard(); return; }
}

// ---- files ----
function openFiles() {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="mbox glassbar"><div class="mh"><h3>Add files</h3><button class="xb" data-act="closemodal">${ic('x')}</button></div>
    <div class="drop">${ic('upload')}<b>Drop files anywhere on the board</b><small>Or forward emails to <u>hale-road@in.evidencespace.app</u></small></div>
    <div class="flist"><small>From Downloads</small>${FILES.map((f) => `<label class="fl"><input type="checkbox" checked><span class="fi">${ic(f.icon)}</span><span><b>${f.name}</b><small>${f.type} · ${f.size}</small></span></label>`).join('')}</div>
    <div class="mf"><small>${ic('lock')}Files stay in this case. We read them to suggest what goes where.</small><button class="btn pri" data-act="addfiles">Add 3 files</button></div></div>`;
  m.className = 'open';
}
function startReading() {
  document.getElementById('modal').className = '';
  S.files = 'reading'; S.readStep = 0; renderDesk();
  const tick = () => {
    S.readStep++; renderHeader();
    if (S.readStep < 4) setTimeout(tick, 750);
    else setTimeout(() => {
      S.files = 'read'; S.q = QUEUE.slice(); renderDesk();
      toast(`${ic('check')}<span><b>Found 5 things to check</b>Nothing goes on the board until you say so.</span>`);
    }, 600);
  };
  setTimeout(tick, 800);
}

// ---- checking, one at a time ----
const TARGET = { joanAccount: ['point', 'joan'], joanDashcam: ['leadDash'], receipt: ['money'], camera: ['leadCctv', 'photos'], batch: ['police', 'marek'] };
const PROOF_HIT = { joanAccount: 'p1', joanDashcam: 'p1', receipt: 'p3', camera: 'p1' };
function panBoard() {
  const c = document.getElementById('cards');
  if (!S.sheetOpen || S.view !== 'board') { c.style.transform = ''; return; }
  const id = S.lastHit || (TARGET[S.q[0] && S.q[0].id] || [])[0];
  const r = id && rectOf(id); if (!r) return;
  const visTop = 120, visBot = 952 - 24 - 300 - 16;
  let dy = (visTop + visBot) / 2 - (r.y + r.h / 2);
  dy = Math.min(0, Math.max(-420, dy));
  if (r.y + dy < visTop) dy = visTop - r.y;
  c.style.transform = `translateY(${dy}px)`;
}
function renderSheet() {
  const sh = document.getElementById('sheet');
  const q = S.q[0];
  if (!S.sheetOpen || !q || S.view !== 'board') { sh.className = 'glassbar'; panBoard(); document.querySelectorAll('.el.target').forEach((e) => e.classList.remove('target')); return; }
  const total = S.q.length + Object.keys(S.done).length + S.notnow.length;
  const n = total - S.q.length + 1;
  const editing = S.editing === q.id;
  sh.innerHTML = `<div class="qsrc"><small>${ic(q.src === 'photo' ? 'camera' : q.src === 'receipt' ? 'doc' : q.src === 'email' ? 'mail' : 'doc')}${q.srcLabel}</small><div class="paper">${q.view()}</div></div>
    <div class="qmain"><div class="qtop"><span class="sugg">Suggested · not added</span><span class="qn">${n} of ${total}</span><button class="xb" data-act="qclose" title="Close">${ic('x')}</button></div>
    ${S.lastPay ? `<div class="qpay ${S.lastPay.ok ? 'ok' : ''}" key="${n}">${ic(S.lastPay.ok ? 'check' : 'doc')}<span>${S.lastPay.ok ? 'Added. ' : ''}${S.lastPay.t}</span></div>` : ''}
    ${editing ? `<textarea id="qedit" class="qe">${esc(q.say)}</textarea>` : `<p class="qsay">${esc(q.say)}</p>`}
    <div class="qwhere">${ic('right')}<span>${q.where[0]}</span><b>${q.where[1]}</b></div>
    <div class="qbtns"><button class="btn pri" data-act="qadd">${editing ? 'Save and add' : q.addLabel || 'Add'}<kbd>A</kbd></button>${editing ? '' : `<button class="btn" data-act="qedit">Edit<kbd>E</kbd></button>`}<button class="btn ghost" data-act="qnot">Not now<kbd>N</kbd></button></div></div>`;
  sh.className = 'glassbar open'; requestAnimationFrame(panBoard);
  if (editing) setTimeout(() => document.getElementById('qedit')?.focus(), 30);
}
function qAnswer(kind) {
  const q = S.q[0]; if (!q) return;
  if (kind === 'edit') { S.editing = q.id; return renderSheet(); }
  if (kind === 'add') {
    if (S.editing === q.id) { const v = document.getElementById('qedit').value.trim(); S.edit = S.edit || {}; if (q.id === 'joanAccount') S.edit.joanAccount = v.replace(/^Joan says /i, '').replace(/^./, (c) => c.toUpperCase()); }
    S.editing = null; S.done[q.id] = 1; S.q.shift(); S.lastHit = (TARGET[q.id] || [])[0];
    flash([...(TARGET[q.id] || []), PROOF_HIT[q.id]].filter(Boolean));
    S.lastPay = { ok: 1, t: q.payoff };
    renderDesk();
    if (!S.q.length) toast(`${ic('check')}<span><b>Added</b>${q.payoff}</span>`, 'ok');
  } else {
    S.editing = null; S.notnow.push(q.id); S.q.shift(); S.lastPay = { ok: 0, t: 'Moved to Loose papers. Nothing is lost.' }; renderDesk();
    if (!S.q.length) toast(`${ic('doc')}<span><b>In Loose papers</b>Nothing is lost. Check it whenever you like.</span>`);
  }
  if (!S.q.length) { S.sheetOpen = false; setTimeout(() => { renderDesk(); toast(`${ic('flag')}<span><b>That’s everything for tonight</b>Your next step is on the left.</span>`); }, 400); }
}

// ---- side panels ----
function openSide(html) { const s = document.getElementById('side'); s.innerHTML = html; s.classList.add('open'); document.body.classList.add('sideopen'); }
function closeSide() { document.getElementById('side').classList.remove('open'); document.body.classList.remove('sideopen'); }
function openDraft() {
  const c = (id, n) => `<sup><button data-act="cite:${id}">${n}</button></sup>`;
  openSide(`<div class="sh2"><div><span class="sugg">Draft · not sent</span><h3>Ask Hale Pharmacy to keep their footage</h3><small>A letter you can hand in or email. Built from your case.</small></div><button class="xb" data-act="closeside">${ic('x')}</button></div>
    <div class="sb"><div class="paper letter"><p class="hd2">To: The manager, Hale Pharmacy, 2 Mill Lane</p>
    <p><b>Please keep your camera recording from Tuesday 4 March 2025, 08:30 to 09:00</b></p>
    <p>Dear Manager,</p>
    <p>On Tuesday 4 March at about 8:40am, a van and my car collided at the junction of Hale Road and Mill Lane, outside your shop${c('words', 1)}. I think the camera above your door faces the junction${c('photos', 2)}.</p>
    <p>Please keep the recording from 08:30 to 09:00 that morning and don’t let it be deleted or recorded over. I’m in the recording, so I’m also asking for a copy of it under data protection law.</p>
    <p>I’m happy to come in and point out the cars, and to pay any reasonable cost of a copy.</p>
    <p>Thank you,<br>Sam Reyes<br>14 Arden Close · 07700 900155</p></div>
    <div class="cites"><small>Where this comes from</small><button data-act="cite:words"><b>1</b>Your account · 19:44</button><button data-act="cite:photos"><b>2</b>Your photo · 08:47 · Corner of Mill Lane</button></div></div>
    <div class="sf">${ic('lock')}<span>Nothing is sent until you choose to send it.</span><span style="flex:1"></span><button class="btn" data-act="noop">${ic('print')}Print</button><button class="btn pri" data-act="savedraft">Save draft</button></div>`);
}
function openJoan() {
  openSide(`<div class="sh2"><div><span class="sugg">Draft · not sent</span><h3>Text to Joan</h3><small>To 07700 900412</small></div><button class="xb" data-act="closeside">${ic('x')}</button></div>
    <div class="sb"><div class="paper letter"><p>Hi Joan, it’s Sam from this morning. Thank you so much for stopping and for your email.</p><p>If your dashcam caught it, could you send me the original video file from the camera or its app? A phone video of the screen loses detail. Please don’t edit or trim it.</p><p>Thanks again, Sam</p></div></div>
    <div class="sf">${ic('lock')}<span>Opens in your messages app. Nothing is sent from here.</span><span style="flex:1"></span><button class="btn" data-act="noop">${ic('copy')}Copy</button><button class="btn pri" data-act="closeside">Done</button></div>`);
}
function openLoose() {
  const items = S.notnow.map((id) => QUEUE.find((q) => q.id === id));
  openSide(`<div class="sh2"><div><h3>Loose papers</h3><small>Things you said “not now” to. Nothing is lost.</small></div><button class="xb" data-act="closeside">${ic('x')}</button></div>
    <div class="sb">${items.length ? items.map((q) => `<div class="lp"><span class="lpt">${ic('doc')}</span><span class="lpb"><small>${q.srcLabel}</small><b>${esc(q.say)}</b><button class="btn sm" data-act="recheck:${q.id}">Check now</button></span></div>`).join('') : '<p class="empty">Nothing here. Everything you added is on the board.</p>'}</div>`);
}

// ---- drag cards ----
function enableDrag() {
  const b = document.getElementById('cards'); let d = null;
  b.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.el'); if (!el || e.target.closest('button, textarea, input, label, .wbox')) return;
    const sc = stageScale();
    d = { el, id: el.dataset.id, x0: e.clientX, y0: e.clientY, l: el.offsetLeft, t: el.offsetTop, sc };
    el.classList.add('dragging'); el.setPointerCapture(e.pointerId);
  });
  b.addEventListener('pointermove', (e) => {
    if (!d) return; const x = d.l + (e.clientX - d.x0) / d.sc, y = d.t + (e.clientY - d.y0) / d.sc;
    d.el.style.left = x + 'px'; d.el.style.top = y + 'px'; S.pos[d.id] = { x, y }; layoutStrings();
  });
  const end = () => { if (d) { d.el.classList.remove('dragging'); d = null; } };
  b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
}

// ---- prototype controls (not product UI) ----
let typing = null;
function typeSam() {
  if (S.words !== 'writing') return;
  const t = document.getElementById('wt'); const full = SAM_WORDS; let i = S.text.length && full.startsWith(S.text) ? S.text.length : 0;
  if (!i) S.text = '';
  clearTimeout(typing);
  const step = () => {
    if (S.words !== 'writing' || i >= full.length) return;
    i++; S.text = full.slice(0, i); t.value = S.text; updateWords();
    const ch = full[i - 1]; typing = setTimeout(step, ch === '.' ? 260 : ch === ',' ? 120 : 22 + Math.random() * 26);
  };
  step();
}

function stageScale() { const st = document.querySelector('.stage'); return st._sc || 1; }
function fit() {
  const st = document.querySelector('.stage'); const sc = Math.min(innerWidth / 1920, innerHeight / 1080);
  st._sc = sc; st.style.transform = `translate(${(innerWidth - 1920 * sc) / 2}px, ${(innerHeight - 1080 * sc) / 2}px) scale(${sc})`;
}

function goPhone() { document.body.dataset.scene = 'phone'; renderPhone(); setBar(); }
function goDesk() {
  if (!P.photos && !P.driver) Object.assign(P, { photos: 4, driver: 1, people: 2, voice: 1, insurer: 1 });
  document.body.dataset.scene = 'desk'; S.started = false; renderDesk(); S.started = true; setBar();
  if (!S.welcomed) { S.welcomed = 1; setTimeout(() => toast(`${ic('check')}<span><b>Welcome back, Sam</b>Everything from your phone is here. Nothing has been shared.</span>`), 500); }
}
function setBar() { document.querySelectorAll('#pbar [data-scene]').forEach((b) => b.classList.toggle('on', b.dataset.scene === document.body.dataset.scene)); }

function boot() {
  fit(); addEventListener('resize', fit);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (b.closest('#phone')) return phoneAct(a);
    if (b.closest('#storycap') && a === 'evening') return goDesk();
    deskAct(a, b);
  });
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.scene !== 'desk' || !S.sheetOpen || e.target.matches('textarea, input')) return;
    const k = e.key.toLowerCase(); if (k === 'a') qAnswer('add'); else if (k === 'e') qAnswer('edit'); else if (k === 'n') qAnswer('not');
  });
  document.getElementById('pbar').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.scene === 'phone') goPhone();
    else if (b.dataset.scene === 'desk') goDesk();
    else if (b.id === 'pbar-type') typeSam();
    else if (b.id === 'pbar-reset') location.reload();
  });
  document.addEventListener('change', (e) => { if (e.target.closest('.rv')) { const n = document.querySelectorAll('.rv input:checked').length; const b = document.getElementById('addn'); b.textContent = n ? `Add ${n}` : 'Save without adding'; } });
  enableDrag();
  goPhone();
  window.__intake = { P, S, phoneAct, deskAct, goDesk, goPhone, typeSam, qAnswer };
}
boot();
