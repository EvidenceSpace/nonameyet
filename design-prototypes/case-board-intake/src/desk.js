// ===== desk: that evening, 19:40 =====
const S = { words: 'empty', text: '', pick: {}, files: 'none', readStep: 0, q: [], done: {}, notnow: [], edit: null, view: 'board', draft: 0, pos: {}, seen: new Set(), flash: new Set(), chipSeen: new Set() };
const has = (id) => !!S.done[id];

// ---- what we found in the words ----
function findSpans(text) {
  const spans = [];
  for (const f of FINDS) {
    const re = new RegExp(f.re.source, 'gi'); let m;
    while ((m = re.exec(text))) {
      const a = m.index, b = a + m[0].length;
      if (!spans.some((s) => a < s.b && b > s.a)) spans.push({ a, b, k: f.k, label: f.label, t: m[0], add: f.add });
    }
  }
  return spans.sort((x, y) => x.a - y.a);
}
function found(text) { const o = {}; for (const s of findSpans(text)) if (!o[s.k]) o[s.k] = s; return o; }
const F = () => found(S.text);
const saidTheirs = () => S.words === 'saved' && S.pick.theirs;

// ---- proof panel (worked out from the case, never typed) ----
function proof() {
  const f = S.words === 'saved' ? S.pick : {};
  const items = [{ t: 'He had to stop at a red light', s: 'ok', sub: 'Settled by law · Highway Code rule 175' }];
  if (!f.theirs && !f.yours) items.push({ t: 'His light was red', s: 'q', sub: 'Usually shown by people who saw it, dashcam or CCTV' });
  else if (!has('joanAccount')) items.push({ t: 'His light was red', s: 'warn', sub: f.theirs ? 'Disputed · your word against his' : 'Your version so far' });
  else items.push({ t: 'His light was red', s: 'mid', sub: `Disputed · Joan backs you${has('joanDashcam') || has('camera') ? ' · video may settle it' : ''}` });
  items.push(P.photos ? { t: 'That caused the crash', s: 'mid', sub: `${P.photos} photos${f.event ? ' · the van came out of Mill Lane' : ''}` } : { t: 'That caused the crash', s: 'q', sub: 'Usually shown by photos of the damage and where the cars ended up' });
  items.push(has('receipt') ? { t: 'What it cost you', s: 'mid', sub: '£165 so far · keep every receipt' } : { t: 'What it cost you', s: 'q', sub: 'Usually shown by receipts, a repair estimate, payslips' });
  return items;
}
function deadlines() {
  const d = [];
  d.push(P.insurer ? { t: 'Tell your insurer', v: 'Done', ok: 1 } : { t: 'Tell your insurer', v: 'Today', hot: 1 });
  if (has('camera')) d.push({ t: 'CCTV may be deleted', v: '3 Apr', hot: 1, id: 'leadCctv' });
  d.push({ t: 'Last day to start a court claim', v: '4 Mar 2028', tip: '3 years if you were hurt, 6 years for the car only. A solicitor can confirm this.' });
  return d;
}
function nextStep() {
  if (S.words === 'empty') return { p: 'Tell us what happened, in your own words. A few sentences is enough.', b: 'Start writing', a: 'write' };
  if (S.words !== 'saved') return { p: 'Write it like you’d tell a friend. We’ll pick out the parts that matter.' };
  if (S.files === 'none') return { p: 'Add anything you have: emails, receipts, a text from the police.', b: 'Add files', a: 'files' };
  if (S.files === 'reading') return { p: 'Reading your files…' };
  const left = S.q.length;
  if (left && S.sheetOpen) return { p: 'Checking what we found. Each thing you add shows up on the board.' };
  if (left) return { p: `${left} ${left === 1 ? 'thing' : 'things'} to check from your files. About a minute.`, b: 'Check them', a: 'check' };
  if (has('camera') && S.draft < 2) return { p: 'Ask Hale Pharmacy to keep their camera footage. It’s often deleted after about 30 days.', b: 'Draft the request', a: 'draft' };
  if (S.draft === 2) return { p: 'Hand the request in tomorrow. Then ask Joan for the original dashcam file, not a phone video of her screen.', b: 'Draft a text to Joan', a: 'joantext' };
  return { p: 'Ask Joan for her dashcam clip while she still has it.', b: 'Draft a text to Joan', a: 'joantext' };
}

function renderProve() {
  const ns = nextStep();
  const nIcon = (s, i) => (s === 'ok' ? ic('check') : s === 'q' ? i + 1 : i + 1);
  document.getElementById('prove').innerHTML = `<div class="ph3"><h2>What you need to prove</h2><small>Negligence claim · car accident</small></div>
    <div class="plist">${proof().map((p, i) => `<div class="pi ${S.flash.has('p' + i) ? 'flash' : ''}"><span class="n s-${p.s}">${nIcon(p.s, i)}</span><span class="tx"><b>${p.t}</b><small class="s-${p.s}">${p.sub}</small></span></div>`).join('')}</div>
    ${saidTheirs() ? `<div class="psec">What they’ll say</div><div class="plist"><div class="pi"><span class="n s-bad">!</span><span class="tx"><b>His light was green</b><small class="s-q">He said it at the scene</small></span></div></div>` : ''}
    <div class="psec">Deadlines</div><div class="dls">${deadlines().map((d) => `<div class="dlr ${d.hot ? 'hot' : ''} ${d.ok ? 'ok' : ''}" ${d.tip ? `title="${esc(d.tip)}"` : ''}><span>${d.t}</span><b>${d.ok ? ic('check') : ''}${d.v}</b></div>${d.tip ? `<small class="dtip">${d.tip}</small>` : ''}`).join('')}</div>
    <div class="next"><small>Next step</small><p>${ns.p}</p>${ns.b ? `<button class="btn pri sm" data-act="${ns.a}">${ns.b}${ic('right')}</button>` : ''}</div>`;
}

// ---- header ----
function renderHeader() {
  const bits = [P.photos && `${P.photos} photos`, P.people && `${P.people} ${P.people === 1 ? 'person' : 'people'} who saw it`, P.voice && 'a voice note'].filter(Boolean);
  const loose = S.notnow.length;
  const reading = S.files === 'reading';
  const tocheck = S.files === 'read' && S.q.length && !S.sheetOpen;
  document.getElementById('hdr').innerHTML = `<div><h1>Hale Road crash</h1><p class="sub">Started this morning on your phone${bits.length ? ' · ' + bits.join(', ') : ''}</p></div>
    <div class="hright">
      ${reading ? `<div class="reading">${spinner()}<span>Reading 3 files and ${P.photos || 0} photos</span><div class="rpop">${readRows()}</div></div>` : ''}
      ${tocheck ? `<button class="btn pri" data-act="check">${ic('check')}${S.q.length} to check</button>` : ''}
      <button class="btn ${loose ? '' : 'none'}" id="loosebtn" data-act="loose">${ic('doc')}Loose papers<b>${loose}</b></button>
      <div class="seg2"><button class="${S.view === 'board' ? 'on' : ''}" data-act="view:board">${ic('board')}Board</button><button class="${S.view === 'simple' ? 'on' : ''}" data-act="view:simple">${ic('list')}Simple</button></div>
    </div>`;
}
const spinner = () => '<span class="spin"></span>';
function readRows() {
  const rows = [...FILES.map((f) => ({ n: f.name, f: f.found, icon: f.icon })), { n: `${P.photos || 0} photos from this morning`, f: '1 thing to check', icon: 'camera' }];
  return rows.map((r, i) => `<div class="rrw ${i < S.readStep ? 'ok' : i === S.readStep ? 'on' : ''}">${i < S.readStep ? ic('check') : i === S.readStep ? spinner() : ic(r.icon)}<span>${r.n}</span><em>${i < S.readStep ? r.f : ''}</em></div>`).join('');
}

// ---- board cards ----
const tag = (t, c = '') => `<span class="tg ${c}">${t}</span>`;
const av = (init, bg, fg) => `<span class="av2" style="background:${bg};color:${fg}">${init}</span>`;
const src = (t) => `<div class="src">${t}</div>`;

function cards() {
  const f = S.words === 'saved' ? S.pick : {};
  const C = [];
  const collapsed = S.words === 'saved';
  C.push({ id: 'you', x: 360, y: 140, w: 260, html: `<div class="chd">${av('SR', '#e6ecff', '#3552c9')}<span><b>Sam Reyes</b><small>Driver · blue Ford Fiesta</small></span>${tag('You', 'b')}</div>
    ${f.yours || f.speed ? `<div class="stl">${f.yours ? `<div class="st"><span>“My light was green”</span>${tag('Your version', 'b')}</div>` : ''}${f.speed ? `<div class="st"><span>“About 25 mph”</span>${tag('Your version', 'b')}</div>` : ''}</div>${src('Your account · 19:44')}` : `<div class="emptyl">Your account goes here</div>`}` });
  if (P.driver) C.push({ id: 'marek', x: 1190, y: 140, w: 260, html: `<div class="chd">${av('MK', '#fde8ec', '#b2384f')}<span><b>Marek Kowalski</b><small>Other driver · white van</small></span>${tag('Other side', 'r')}</div>
    <div class="kv"><span>Plate</span><b>WV19 KXR</b></div><div class="kv"><span>Policy</span><b>NG-448210</b></div>${has('batch') ? `<div class="kv new"><span>Insurer</span><b>Northgate Insurance</b></div>` : ''}${src('From his insurance certificate · 08:49')}` });
  if (P.people >= 1) C.push({ id: 'joan', x: 360, y: collapsed ? 390 : 380, w: 260, html: `<div class="chd">${av('JP', PEOPLE.joan.bg, PEOPLE.joan.fg)}<span><b>Joan Pike</b><small>${PEOPLE.joan.role}</small></span>${tag('Saw it', 'g')}</div>
    ${has('joanAccount') ? `<div class="stl"><div class="st"><span>“${esc(S.edit && S.edit.joanAccount || 'Our lights were red and the van didn’t stop.')}”</span>${tag('Helps you', 'g')}</div></div>${src('Her email · 18:12')}` : `<div class="kv"><span>Phone</span><b>${PEOPLE.joan.phone}</b></div>${f.witness ? `<div class="hint">Probably the woman you mention in your account</div>` : ''}`}` });
  if (P.people >= 2) C.push({ id: 'ade', x: 360, y: 640, w: 260, html: `<div class="chd">${av('AB', PEOPLE.ade.bg, PEOPLE.ade.fg)}<span><b>Ade Bello</b><small>${PEOPLE.ade.role}</small></span>${tag('Saw it', 'g')}</div>
    <div class="kv"><span>Phone</span><b>${PEOPLE.ade.phone}</b></div><div class="hint">Not asked yet what he saw</div>` });
  if (P.voice) C.push({ id: 'voice', x: 1190, y: has('batch') ? 420 : 380, w: 260, html: `<div class="chd"><span class="ico">${ic('mic')}</span><span><b>Voice note</b><small>08:50 · 0:14 · your phone</small></span></div>
    <div class="vn"><button class="playb" data-act="noop">${ic('play')}</button><div class="wavs">${Array.from({ length: 34 }, (_, i) => `<i style="height:${4 + ((i * 37) % 17)}px"></i>`).join('')}</div></div>
    <p class="tr">“He said ${saidTheirs() ? '<mark>his light was green</mark>' : 'his light was green'}. He said I came out of nowhere.”</p>` });
  if (P.photos) C.push({ id: 'photos', x: 1490, y: 140, w: 270, html: `<div class="chd"><span class="ico">${ic('camera')}</span><span><b>Photos</b><small>08:47 · Hale Road · your phone</small></span></div>
    <div class="pgrid">${PHOTO_ORDER.slice(0, P.photos).map((k) => `<span class="pth">${photoSvg(k, k === 'pharmacy' && has('camera') ? '<circle cx="142" cy="30" r="10" fill="none" stroke="#f5b400" stroke-width="2.4" stroke-dasharray="4 3"/>' : '')}</span>`).join('')}</div>` });
  C.push({ id: 'place', x: 1490, y: P.photos ? 420 : 140, w: 270, html: `<div class="chd"><span class="ico">${ic('pin')}</span><span><b>Hale Road × Mill Lane</b><small>From your photos’ location</small></span></div>${miniMap()}` });
  C.push({ id: 'words', x: 650, y: 140, w: 500, cls: 'words ' + S.words, html: wordsCard() });
  if (saidTheirs()) {
    const yours = 1 + (has('joanAccount') ? 2 : 0), theirs = 1;
    const pct = Math.round((yours / (yours + theirs)) * 100);
    C.push({ id: 'point', x: 650, y: 360, w: 340, cls: 'pt', html: `<div class="lab">${ic('scale')}Disputed point</div><h3>What colour was the van’s light?</h3>
      <div class="vs"><div class="vy"><small>Your version</small><b>Red</b><div class="whos"><span>${av('SR', '#e6ecff', '#3552c9')}Sam · you</span>${has('joanAccount') ? `<span class="nw">${av('JP', PEOPLE.joan.bg, PEOPLE.joan.fg)}Joan · saw it</span>` : ''}</div></div>
      <div class="vt"><small>His version</small><b>Green</b><div class="whos"><span>${av('MK', '#fde8ec', '#b2384f')}Marek · at the scene</span></div></div></div>
      <div class="meter"><i style="width:${pct}%"></i><em style="left:50%"></em></div>
      <p class="cap">${has('joanAccount') ? 'Leaning your way, not settled.' : 'Your word against his. Someone who saw it would help.'}</p>` });
  }
  if (has('joanDashcam')) C.push({ id: 'leadDash', x: 650, y: 640, w: 255, cls: 'lead', html: `<div class="lab o">${ic('lead')}Lead · not got yet</div><h4>Joan’s dashcam clip</h4><p>Ask for the original file, not a phone video of her screen.</p><button class="lbtn" data-act="joantext">${ic('mail')}Draft a text to Joan</button>` });
  if (has('camera')) C.push({ id: 'leadCctv', x: 925, y: 640, w: 245, cls: 'lead', html: `<div class="lab o">${ic('lead')}Lead · not got yet</div><h4>Hale Pharmacy camera</h4><p>It may face the junction. Often deleted after about 30 days.</p><div class="dchip">${ic('clock')}Ask before 3 Apr · 30 days</div><button class="lbtn" data-act="draft">${ic('edit')}Draft a request</button>` });
  if (has('receipt')) C.push({ id: 'money', x: 1190, y: 660, w: 260, html: `<div class="chd"><span class="ico">${ic('pound')}</span><span><b>What it cost you</b><small>Backed by papers</small></span></div>
    <div class="mr"><span>Recovery</span><em>R-01</em><b>£165</b></div><div class="mr add"><span>+ Repair estimate</span><em>ask the garage</em></div><div class="mr add"><span>+ Time off work</span><em>payslips</em></div><div class="mr tot"><span>Shown so far</span><b>£165</b></div>` });
  if (has('batch')) C.push({ id: 'police', x: 1490, y: 720, w: 270, html: `<div class="chd"><span class="ico">${ic('shield')}</span><span><b>Police reference</b><small>CAD 2291 · 4 Mar</small></span></div>${src('From a text from the police · 11:20')}` });
  return C;
}

function miniMap() {
  return `<svg class="mm" viewBox="0 0 250 150"><rect width="250" height="150" rx="10" fill="#eef1f6"/><rect x="104" y="0" width="42" height="150" fill="#fff"/><rect x="0" y="58" width="250" height="36" fill="#fff"/>
    <path d="M125 0v52M125 100v50" stroke="#d8dde6" stroke-dasharray="6 5"/><rect x="152" y="98" width="70" height="40" rx="4" fill="#e1efe7"/><text x="187" y="122" font-size="8.5" text-anchor="middle" fill="#3e7a5b" font-family="Inter" font-weight="600">Hale Pharmacy</text>
    <text x="24" y="52" font-size="8" fill="#8a95ab" font-family="Inter" font-weight="650" letter-spacing=".6">MILL LANE</text><text x="0" y="0" transform="translate(98 140) rotate(-90)" font-size="8" fill="#8a95ab" font-family="Inter" font-weight="650" letter-spacing=".6">HALE ROAD</text>
    <circle cx="125" cy="76" r="15" fill="none" stroke="#e65d72" stroke-width="1.6" stroke-dasharray="3 3"/>${has('camera') ? '<circle cx="158" cy="100" r="5" fill="#f5b400" stroke="#fff" stroke-width="2"/>' : ''}</svg><div class="src">Where the photos were taken</div>`;
}

function wordsCard() {
  if (S.words === 'empty') return `<div class="lab">${ic('edit')}Your account</div><h3>What happened, in your own words</h3><p class="wl">Write it like you’d tell a friend. We’ll pick out the parts that matter, and you decide what goes on the board.</p><button class="btn pri" data-act="write">Start writing</button>`;
  if (S.words === 'writing') return `<div class="lab">${ic('edit')}Your account</div><div class="wbox"><div class="mirror" id="mirror"></div><textarea id="wt" spellcheck="false" placeholder="I was driving…">${esc(S.text)}</textarea></div>
    <div class="fnd" id="fnd"></div><div class="wfoot"><small>${ic('lock')}Only you can see this until you share the case.</small><button class="btn pri" id="wsave" data-act="review">Save</button></div>`;
  if (S.words === 'review') {
    const fo = F(); const rows = [['yours', 'Sam Reyes'], ['speed', 'Sam Reyes'], ['theirs', 'A new disputed point'], ['witness', 'Joan Pike']].filter(([k]) => fo[k]);
    return `<div class="lab">${ic('edit')}Your account</div><h3>Add these to your case?</h3><p class="wl">Your words are saved either way.</p>
      <div class="rvw">${rows.map(([k, to]) => `<label class="rv"><input type="checkbox" data-k="${k}" ${S.pick[k] !== false ? 'checked' : ''}><span><b>${FINDS.find((x) => x.k === k).add}</b><small>Goes to: ${to}</small></span></label>`).join('')}</div>
      <div class="wfoot"><button class="btn" data-act="write2">Back to writing</button><button class="btn pri" id="addn" data-act="addwords">Add ${rows.length}</button></div>`;
  }
  return `<div class="lab">${ic('edit')}Your account · 19:44</div><p class="wsaved">${markText(S.text, true)}</p><button class="lbtn" data-act="noop">Read it all</button>`;
}

function markText(text, short) {
  let t = short && text.length > 170 ? text.slice(0, 170) : text;
  const spans = findSpans(t); let out = '', i = 0;
  for (const s of spans) { out += esc(t.slice(i, s.a)) + `<mark class="k-${s.k}">${esc(t.slice(s.a, s.b))}</mark>`; i = s.b; }
  return out + esc(t.slice(i)) + (short && text.length > 170 ? '…' : '');
}

function updateWords() {
  const m = document.getElementById('mirror'); if (!m) return;
  m.innerHTML = markText(S.text) + '\u200b';
  const fo = findSpans(S.text);
  const seen = new Set();
  document.getElementById('fnd').innerHTML = fo.length ? `<small>Picked out so far</small>${fo.filter((s) => !seen.has(s.k) && seen.add(s.k)).map((s) => { const nw = !S.chipSeen.has(s.k); S.chipSeen.add(s.k); return `<span class="fc k-${s.k} ${nw ? 'new' : ''}"><em>${s.label}</em>${esc(s.t)}</span>`; }).join('')}` : '<small>As you write, the parts that matter show up here.</small>';
  document.getElementById('wsave').disabled = S.text.trim().length < 20;
  layoutStrings();
}

// ---- strings between cards ----
const STR = [
  { a: 'you', b: 'point', l: 'Your version', c: '#4d70f7', when: () => saidTheirs() && (S.pick.yours !== false) },
  { a: 'voice', b: 'point', l: 'His version', c: '#e65d72', when: saidTheirs },
  { a: 'joan', b: 'point', l: 'Helps you', c: '#2f9e73', when: () => saidTheirs() && has('joanAccount') },
  { a: 'joan', b: 'leadDash', l: '', c: '#c38b16', when: () => has('joanDashcam') },
  { a: 'photos', b: 'leadCctv', l: '', c: '#c38b16', when: () => has('camera') },
  { a: 'marek', b: 'voice', l: 'What he said', c: '#b8c0cf', when: () => P.voice && P.driver },
];
function rectOf(id) { const e = document.querySelector(`.el[data-id="${id}"]`); if (!e) return null; return { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight }; }
function layoutStrings() {
  const svg = document.getElementById('strings'); if (!svg) return;
  let h = '', lab = '';
  for (const s of STR) {
    if (!s.when()) continue;
    const A = rectOf(s.a), B = rectOf(s.b); if (!A || !B) continue;
    let x1, y1, x2, y2, c1, c2;
    const acx = A.x + A.w / 2, bcx = B.x + B.w / 2;
    if (Math.abs(acx - bcx) < (A.w + B.w) / 2 - 20) { // stacked: vertical
      const down = B.y > A.y; x1 = acx; y1 = down ? A.y + A.h : A.y; x2 = bcx; y2 = down ? B.y : B.y + B.h;
      const d = Math.max(40, Math.abs(y2 - y1) / 2) * (down ? 1 : -1); c1 = [x1, y1 + d]; c2 = [x2, y2 - d];
    } else {
      const right = bcx > acx; x1 = right ? A.x + A.w : A.x; x2 = right ? B.x : B.x + B.w;
      y1 = Math.min(Math.max(B.y + B.h / 2, A.y + 30), A.y + A.h - 30); y2 = Math.min(Math.max(A.y + A.h / 2, B.y + 30), B.y + B.h - 30);
      const d = Math.max(50, Math.abs(x2 - x1) / 2) * (right ? 1 : -1); c1 = [x1 + d, y1]; c2 = [x2 - d, y2];
    }
    const key = s.a + s.b, isNew = !S.seen.has('s' + key); S.seen.add('s' + key);
    h += `<path class="${isNew ? 'draw' : ''}" d="M${x1} ${y1}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${x2} ${y2}" stroke="${s.c}"/><circle cx="${x1}" cy="${y1}" r="3.5" fill="${s.c}"/><circle cx="${x2}" cy="${y2}" r="3.5" fill="${s.c}"/>`;
    if (s.l && Math.hypot(x2 - x1, y2 - y1) > 150) { const mx = 0.125 * x1 + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * x2, my = 0.125 * y1 + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * y2; lab += `<span class="slab" style="left:${mx}px;top:${my}px;color:${s.c}">${s.l}</span>`; }
  }
  svg.innerHTML = h; document.getElementById('slabs').innerHTML = lab;
}

function renderBoard() {
  const b = document.getElementById('cards');
  const keepT = S.words === 'writing' && document.getElementById('wt');
  const cs = cards();
  if (keepT) { // don't rebuild the writing card while typing
    cs.filter((c) => c.id !== 'words').forEach(upsert); place(cs.find((c) => c.id === 'words'));
  } else cs.forEach(upsert);
  const ids = new Set(cs.map((c) => c.id));
  b.querySelectorAll('.el').forEach((e) => { if (!ids.has(e.dataset.id)) e.remove(); });
  function upsert(c) {
    let e = b.querySelector(`.el[data-id="${c.id}"]`);
    if (!e) { e = document.createElement('div'); e.className = 'el'; e.dataset.id = c.id; b.appendChild(e); if (S.seen.has(c.id) === false && S.started) e.classList.add('appear'); }
    S.seen.add(c.id);
    e.innerHTML = `<div class="card ${c.cls || ''}">${c.html}</div>`; place(c);
    e.classList.toggle('flash', S.flash.has(c.id));
  }
  function place(c) { const e = b.querySelector(`.el[data-id="${c.id}"]`); const p = S.pos[c.id] || c; e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; e.style.width = c.w + 'px'; }
  if (S.words === 'writing' && !keepT) { const t = document.getElementById('wt'); t.addEventListener('input', () => { S.text = t.value; updateWords(); }); t.focus(); t.setSelectionRange(t.value.length, t.value.length); updateWords(); }
  requestAnimationFrame(layoutStrings);
}

// ---- simple view: same case, as a list ----
function renderSimple() {
  const ns = nextStep();
  const people = [['Marek Kowalski', 'Other driver · WV19 KXR', P.driver], ['Joan Pike', has('joanAccount') ? 'Saw it · backs your version' : 'Saw it · ' + PEOPLE.joan.phone, P.people >= 1], ['Ade Bello', 'Saw it · not asked yet', P.people >= 2]].filter((x) => x[2]);
  const papers = [P.photos && [`${P.photos} photos`, 'This morning'], P.voice && ['Voice note', '0:14'], S.words === 'saved' && ['Your account', '19:44'], has('joanAccount') && ['Joan’s email', '18:12'], has('receipt') && ['Recovery receipt', '£165'], has('batch') && ['Police reference', 'CAD 2291']].filter(Boolean);
  document.getElementById('simple').innerHTML = `<div class="simw">
    <div class="snext"><small>Next step</small><p>${ns.p}</p>${ns.b ? `<button class="btn pri" data-act="${ns.a}">${ns.b}${ic('right')}</button>` : ''}</div>
    <div class="scols"><section><h3>What you need to prove</h3>${proof().map((p, i) => `<div class="pi big"><span class="n s-${p.s}">${p.s === 'ok' ? ic('check') : i + 1}</span><span class="tx"><b>${p.t}</b><small class="s-${p.s}">${p.sub}</small></span></div>`).join('')}</section>
    <section><h3>Deadlines</h3>${deadlines().map((d) => `<div class="dlr ${d.hot ? 'hot' : ''}"><span>${d.t}</span><b>${d.v}</b></div>`).join('')}
      <h3>People</h3>${people.map((p) => `<div class="srow"><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}
      <h3>Papers and photos</h3>${papers.map((p) => `<div class="srow"><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}</section></div>
    <p class="snote">Same case as the board. Switch any time.</p></div>`;
}

function renderDesk() {
  renderHeader();
  document.getElementById('desk').classList.toggle('simple', S.view === 'simple');
  if (S.view === 'simple') renderSimple(); else { renderProve(); renderBoard(); }
  renderSheet();
  document.getElementById('pbar-type').hidden = S.words !== 'writing';
}
