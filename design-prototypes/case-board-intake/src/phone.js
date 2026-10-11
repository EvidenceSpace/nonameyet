// ===== phone: at the scene, 08:51 =====
const P = { step: 'what', sheet: null, photos: 0, driver: 0, people: 0, voice: 0, insurer: 0, rec: 0, back: [] };
const TIMES = { what: '08:51', when: '08:51', hurt: '08:52', list: '08:53', save: '08:58', saved: '08:58' };
const PHOTO_ORDER = ['side', 'van', 'junction', 'pharmacy'];

function phoneGo(step) { P.back.push(P.step); P.step = step; P.sheet = null; renderPhone(); }
function phoneBack() { if (P.back.length) { P.step = P.back.pop(); P.sheet = null; renderPhone(); } }

function opt(icon, label, act, sub = '') {
  return `<button class="popt" data-act="${act}">${ic(icon)}<span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span>${ic('right', 'go')}</button>`;
}

function listRow(k, icon, title, hint, doneText) {
  const d = P[k];
  return `<button class="prow ${d ? 'done' : ''}" data-act="sheet:${k}"><span class="pdot">${d ? ic('check') : ic(icon)}</span><span class="ptx"><b>${title}</b><small>${d ? doneText : hint}</small></span>${d ? '' : ic('right', 'go')}</button>`;
}

function phoneScreen() {
  const back = `<button class="pback" data-act="back">${ic('left')}</button>`;
  switch (P.step) {
    case 'what': return `<div class="pbody"><div class="pbrand"><span class="logo sm"><i></i></span>EvidenceSpace</div>
      <h1>What happened?</h1><p class="plead">Pick the closest. You can change it later.</p>
      <div class="popts">${opt('car', 'Car accident', 'go:when')}${opt('pound', 'Someone owes me money', 'noop')}${opt('home2', 'Landlord or deposit', 'noop')}${opt('work', 'Problem at work', 'noop')}${opt('more', 'Something else', 'noop')}</div>
      <p class="pnote">${ic('lock')}No account needed yet. Everything stays on this phone until you save it.</p></div>`;
    case 'when': return `<div class="pbody">${back}<h1>When did it happen?</h1><p class="plead">So we show what matters right now.</p>
      <div class="popts">${opt('bolt', 'Just now', 'go:hurt', 'I’m still there')}${opt('clock', 'Earlier today', 'noop')}${opt('flag', 'Days or weeks ago', 'noop')}</div></div>`;
    case 'hurt': return `<div class="pbody">${back}<h1>Is anyone hurt?</h1>
      <p class="plead">If anyone is hurt or the road is blocked, call 999 first. If it’s safe, move out of the traffic.</p>
      <div class="pact"><a class="pbtn red" data-act="noop">${ic('phone')}Call 999</a><button class="pbtn pri" data-act="go:list">No one is hurt</button></div></div>`;
    case 'list': {
      const n = ['photos', 'driver', 'people', 'voice', 'insurer'].filter((k) => P[k]).length;
      return `<div class="pbody">${back}<h1>While you’re still there</h1><p class="plead">Five things that are hard to get later.</p>
      <div class="pprog"><i style="width:${n * 20}%"></i></div><small class="pcount">${n} of 5</small>
      <div class="prows">
        ${listRow('photos', 'camera', 'Photos', 'Both cars, the plates, the junction, the lights', `${P.photos} photos · location saved`)}
        ${listRow('driver', 'idcard', 'The other driver', 'Photo of their insurance or licence', 'Marek Kowalski · WV19 KXR')}
        ${listRow('people', 'people', 'People who saw it', 'Name and number. Ask now.', `${P.people === 2 ? 'Joan Pike, Ade Bello' : 'Joan Pike'}`)}
        ${listRow('voice', 'mic', 'What was said', 'A voice note while you remember', 'Voice note · 0:14')}
        ${listRow('insurer', 'phone', 'Tell your insurer', 'Most policies say to tell them quickly', 'Done')}
      </div>
      <div class="ptip">Don’t say whose fault it was. Just swap details.</div>
      <button class="pbtn pri wide" data-act="go:save">${n === 5 ? 'That’s everything' : 'Done for now'}</button></div>`;
    }
    case 'save': return `<div class="pbody">${back}<h1>That’s the important part done.</h1>
      <div class="psum">${P.photos ? `<span>${ic('check')}${P.photos} photos</span>` : ''}${P.driver ? `<span>${ic('check')}Other driver’s details</span>` : ''}${P.people ? `<span>${ic('check')}${P.people} ${P.people === 1 ? 'person' : 'people'} who saw it</span>` : ''}${P.voice ? `<span>${ic('check')}Voice note</span>` : ''}${P.insurer ? `<span>${ic('check')}Insurer told</span>` : ''}</div>
      <p class="plead">Save it so you can open it later, on any device.</p>
      <label class="pfield"><small>Email</small><input id="pmail" value="sam.reyes@example.com"></label>
      <button class="pbtn pri wide" data-act="go:saved">Save case</button></div>`;
    case 'saved': return `<div class="pbody center"><span class="bigok">${ic('check')}</span><h1>Saved</h1>
      <p class="plead">Look after yourself today. Tonight, open EvidenceSpace on your laptop with the same email, and we’ll help you make sense of it.</p>
      <p class="pnote">${ic('bell')}We’ll remind you at 7pm.</p></div>`;
  }
}

function phoneSheet() {
  const s = P.sheet; if (!s) return '';
  let h = '';
  if (s === 'photos') {
    const cur = PHOTO_ORDER[Math.min(P.rec, 3)];
    h = `<div class="cam"><div class="vf">${photoSvg(cur)}<span class="vfcap">${PHOTO[cur].cap}</span></div>
      <div class="thumbs">${PHOTO_ORDER.slice(0, P.rec).map((k) => `<span>${photoSvg(k)}</span>`).join('')}</div>
      <div class="camrow"><button class="ptext" data-act="close">Cancel</button><button class="shutter" data-act="shoot" ${P.rec >= 4 ? 'disabled' : ''}><i></i></button><button class="ptext b" data-act="photosdone" ${P.rec ? '' : 'disabled'}>Done</button></div></div>`;
  } else if (s === 'driver') {
    h = P.rec < 1 ? `<div class="sh"><h3>The other driver</h3><p>Take a photo of their insurance certificate or driving licence. You can type it instead.</p>
      <div class="cert">${ic('idcard')}<span>Point the camera at the document</span></div>
      <div class="pact"><button class="pbtn" data-act="noop">Type it</button><button class="pbtn pri" data-act="certshot">Take photo</button></div></div>`
      : `<div class="sh"><h3>Check these</h3><p>We read them from the photo. Fix anything that’s wrong.</p>
      <div class="fields"><label><small>Name</small><input value="Marek Kowalski"></label><label><small>Number plate</small><input value="WV19 KXR"></label><label><small>Insurer</small><input value="Northgate Insurance"></label><label><small>Policy number</small><input value="NG-448210"></label></div>
      <button class="pbtn pri wide" data-act="driverdone">Looks right</button></div>`;
  } else if (s === 'people') {
    const ade = P.rec >= 1;
    const p = ade ? PEOPLE.ade : PEOPLE.joan;
    h = `<div class="sh"><h3>${ade ? 'Add another' : 'Someone who saw it'}</h3><p>Ask them now. It’s much harder to find them later.</p>
      <div class="fields"><label><small>Name</small><input value="${p.name}"></label><label><small>Phone</small><input value="${p.phone}"></label><label><small>Where were they?</small><input value="${p.role}"></label></div>
      ${ade ? `<button class="pbtn pri wide" data-act="peopledone">Add</button>` : `<div class="pact"><button class="pbtn" data-act="peopledone1">Add and finish</button><button class="pbtn pri" data-act="addperson">Add another</button></div>`}</div>`;
  } else if (s === 'voice') {
    h = P.rec === 0 ? `<div class="sh center"><h3>What was said</h3><p>Say what you remember: what they said, what you saw. Only you hear this.</p><button class="mic" data-act="rec">${ic('mic')}</button><small class="muted">Tap to record</small></div>`
      : P.rec === 1 ? `<div class="sh center"><h3>Recording</h3><div class="wave">${Array.from({ length: 28 }, (_, i) => `<i style="animation-delay:${(i * 53) % 700}ms"></i>`).join('')}</div><b class="rt" id="rt">0:00</b><button class="mic on" data-act="stop"><i></i></button></div>`
      : `<div class="sh"><h3>Voice note · 0:14</h3><p class="quote">“He said his light was green. He said I came out of nowhere. I didn’t say anything about whose fault it was.”</p><small class="muted">Written out from your recording. Check it later.</small><button class="pbtn pri wide" data-act="voicedone">Save</button></div>`;
  } else if (s === 'insurer') {
    h = `<div class="sh"><h3>Tell your insurer</h3><p>Their number is on your policy or insurance card. Most policies say to tell them as soon as you can, even if it wasn’t your fault.</p>
      <div class="pact"><button class="pbtn" data-act="close">Later</button><button class="pbtn pri" data-act="insurerdone">I’ve told them</button></div></div>`;
  }
  return `<div class="pscrim" data-act="close"></div><div class="psheet ${s}">${h}</div>`;
}

function renderPhone() {
  const el = document.getElementById('pscr');
  el.innerHTML = `<div class="pstat"><b>${TIMES[P.step]}</b><span class="pnotch"></span><span class="psig"><i></i><i></i><i></i><i></i></span></div>${phoneScreen()}${phoneSheet()}`;
  document.getElementById('storycap').innerHTML = storyCaption();
}

function storyCaption() {
  const c = {
    what: ['08:51 · Hale Road', 'A van has just hit Sam’s car at the junction. He’s shaken but not hurt. A friend mentioned EvidenceSpace a few weeks ago.'],
    when: ['08:51', 'No sign-up, no tour. One plain question at a time.'],
    hurt: ['08:52', 'Safety first. Nothing else matters if someone is hurt.'],
    list: ['08:53', 'Only what’s hard to get later. Every item is optional.'],
    save: ['08:58', 'Seven minutes. He has what he needs, without thinking about the law.'],
    saved: ['08:58', 'Nothing else is asked of him today until the evening.'],
  }[P.step];
  return `<small>${c[0]}</small><p>${c[1]}</p>${P.step === 'saved' ? `<button class="btn pri" data-act="evening">That evening ${ic('right')}</button>` : ''}`;
}

function phoneAct(a) {
  if (a === 'noop') return;
  if (a === 'back') return phoneBack();
  if (a.startsWith('go:')) return phoneGo(a.slice(3));
  if (a.startsWith('sheet:')) { P.sheet = a.slice(6); P.rec = 0; return renderPhone(); }
  if (a === 'close') { P.sheet = null; return renderPhone(); }
  if (a === 'shoot') { P.rec = Math.min(4, P.rec + 1); renderPhone(); const v = document.querySelector('.vf'); v && v.classList.add('flash'); return; }
  if (a === 'photosdone') { P.photos = P.rec; P.sheet = null; return renderPhone(); }
  if (a === 'certshot') { P.rec = 1; return renderPhone(); }
  if (a === 'driverdone') { P.driver = 1; P.sheet = null; return renderPhone(); }
  if (a === 'addperson') { P.rec = 1; return renderPhone(); }
  if (a === 'peopledone1') { P.people = 1; P.sheet = null; return renderPhone(); }
  if (a === 'peopledone') { P.people = 2; P.sheet = null; return renderPhone(); }
  if (a === 'rec') {
    P.rec = 1; renderPhone(); let t = 0;
    const iv = setInterval(() => { t++; const r = document.getElementById('rt'); if (r) r.textContent = `0:${String(t).padStart(2, '0')}`; if (t >= 14 || P.rec !== 1) clearInterval(iv); }, 160);
    return;
  }
  if (a === 'stop') { P.rec = 2; return renderPhone(); }
  if (a === 'voicedone') { P.voice = 1; P.sheet = null; return renderPhone(); }
  if (a === 'insurerdone') { P.insurer = 1; P.sheet = null; return renderPhone(); }
  if (a === 'evening') return goDesk();
}
