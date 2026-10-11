// ===== data: Sam Reyes, day 0 (fictional) =====
// Today is Tuesday 4 March 2025. The crash was at about 08:42.
const I = {
  home: '<path d="M4 11l8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="16.8" cy="9.5" r="2.5"/><path d="M15.5 14.6c2.4-.2 4.4 1.2 5 4"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  shield: '<path d="M12 3.5l7 2.8v5.4c0 4.4-3 7.6-7 8.8-4-1.2-7-4.4-7-8.8V6.3z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  dots: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
  chev: '<path d="M7 10l5 5 5-5"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  camera: '<path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z"/><circle cx="12" cy="13.2" r="3.3"/>',
  car: '<path d="M4 15.5v-3l2-4.5h12l2 4.5v3z"/><circle cx="7.5" cy="16" r="1.6"/><circle cx="16.5" cy="16" r="1.6"/><path d="M6.2 12h11.6"/>',
  pound: '<path d="M15.5 6.5a3.5 3.5 0 0 0-6 2.5V18M7 12.5h6M7 18h10"/>',
  home2: '<path d="M4 11l8-6.5 8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
  work: '<rect x="4" y="7.5" width="16" height="12" rx="2"/><path d="M9 7.5V5.5h6v2M4 12.5h16"/>',
  more: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C10.6 18.5 5.5 13.4 5 6.1A1.5 1.5 0 0 1 6.5 4z"/>',
  idcard: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 15.5c.5-1.4 1.6-2 3-2s2.5.6 3 2M14 10h4M14 13h3"/>',
  pin: '<path d="M12 20.5s-6-5.6-6-10.5a6 6 0 0 1 12 0c0 4.9-6 10.5-6 10.5z"/><circle cx="12" cy="10" r="2.2"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  flag: '<path d="M6 21V4M6 4.5h11l-2.5 4 2.5 4H6"/>',
  scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z"/>',
  edit: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  lead: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4M11 8.5v5M8.5 11h5"/>',
  upload: '<path d="M12 15.5V4.5M7.5 9L12 4.5 16.5 9"/><path d="M4.5 15v3.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V15"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  board: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M8 9h3v3H8zM14 13h3v3h-3zM11 10.5l3 4"/>',
  list: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
  warn: '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4M12 17h.01"/>',
  bolt: '<path d="M13 3.5L5.5 13h6l-1 7.5L18 11h-6z"/>',
  print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6" rx="1"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Four phone photos, drawn as simple flat illustrations (prototype only).
const PHOTO = {
  side: { cap: 'Your car, passenger side', svg: `<defs><linearGradient id="sk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd9e6"/><stop offset="1" stop-color="#e9edf2"/></linearGradient></defs><rect width="160" height="120" fill="url(#sk1)"/><rect y="78" width="160" height="42" fill="#8d939b"/><rect y="76" width="160" height="4" fill="#b9bdc2"/><path d="M14 86l6-18c2-6 6-9 12-10l26-4c8-1 16 0 22 4l20 13 28 4c6 1 10 5 10 11v6H14z" fill="#3f63b8"/><path d="M40 60l22-3c7-1 13 0 18 3l14 10H36z" fill="#2a3a55" opacity=".85"/><path d="M78 66l6 4-3 9 5 6-7 3" fill="none" stroke="#1d2f5e" stroke-width="2"/><path d="M70 72c6 3 12 8 14 14" fill="none" stroke="#9fb4e6" stroke-width="1.4"/><circle cx="40" cy="92" r="11" fill="#22252b"/><circle cx="40" cy="92" r="5" fill="#9aa0a8"/><circle cx="124" cy="92" r="11" fill="#22252b"/><circle cx="124" cy="92" r="5" fill="#9aa0a8"/>` },
  van: { cap: 'The van, WV19 KXR', svg: `<rect width="160" height="120" fill="#d6dde6"/><rect y="84" width="160" height="36" fill="#8f959c"/><rect x="38" y="18" width="84" height="74" rx="6" fill="#f4f5f6"/><rect x="38" y="18" width="84" height="74" rx="6" fill="none" stroke="#c9ced4"/><path d="M80 22v66" stroke="#c9ced4"/><rect x="44" y="26" width="30" height="20" rx="2" fill="#5d6773"/><rect x="86" y="26" width="30" height="20" rx="2" fill="#5d6773"/><rect x="40" y="56" width="6" height="10" rx="1" fill="#d14b3c"/><rect x="114" y="56" width="6" height="10" rx="1" fill="#d14b3c"/><rect x="58" y="72" width="44" height="11" rx="1.5" fill="#f2c94c" stroke="#2b2b2b" stroke-width=".6"/><text x="80" y="80.5" font-family="Arial" font-weight="700" font-size="7.2" text-anchor="middle" fill="#1b1b1b">WV19 KXR</text><rect x="34" y="88" width="92" height="6" rx="2" fill="#30343a"/>` },
  junction: { cap: 'The junction and lights', svg: `<rect width="160" height="120" fill="#d3dbe5"/><path d="M0 70h160v50H0z" fill="#8e949b"/><path d="M60 70L40 120h80l-20-50z" fill="#9aa0a7"/><path d="M80 74v8M80 90v10M80 106v12" stroke="#f3f3f0" stroke-width="2"/><path d="M0 84h46M114 84h46" stroke="#eceae2" stroke-width="2" stroke-dasharray="8 6"/><rect x="0" y="34" width="44" height="38" fill="#b9a68f"/><rect x="118" y="30" width="42" height="42" fill="#a99a88"/><rect x="6" y="42" width="10" height="12" fill="#6b7480"/><rect x="24" y="42" width="10" height="12" fill="#6b7480"/><rect x="124" y="38" width="12" height="14" fill="#6b7480"/><rect x="142" y="38" width="12" height="14" fill="#6b7480"/><rect x="101" y="30" width="3" height="46" fill="#3a3f46"/><rect x="96" y="20" width="13" height="30" rx="2.5" fill="#22262b"/><circle cx="102.5" cy="27" r="3" fill="#5a2a2a"/><circle cx="102.5" cy="35" r="3" fill="#5a4a22"/><circle cx="102.5" cy="43" r="3" fill="#3fd17a"/>` },
  pharmacy: { cap: 'Corner of Mill Lane', svg: `<rect width="160" height="120" fill="#d5dce4"/><rect x="0" y="12" width="160" height="80" fill="#c7b7a2"/><rect x="0" y="12" width="160" height="80" fill="none" stroke="#b3a28c"/><rect x="0" y="40" width="160" height="16" fill="#2f7d5b"/><text x="70" y="51.5" font-family="Arial" font-weight="700" font-size="8" fill="#fff" letter-spacing="1">HALE PHARMACY</text><rect x="12" y="42" width="12" height="12" fill="#fff"/><path d="M18 44v8M14 48h8" stroke="#2f7d5b" stroke-width="2.6"/><rect x="10" y="60" width="38" height="32" fill="#5f6b77"/><rect x="58" y="60" width="26" height="32" fill="#4e5862"/><rect x="94" y="60" width="56" height="32" fill="#5f6b77"/><rect y="92" width="160" height="28" fill="#9da3aa"/><path d="M146 30h8v4h-8z" fill="#33383e"/><path d="M138 26h10v8h-10z" fill="#e9ecef" stroke="#33383e" stroke-width=".8"/><circle cx="139.5" cy="30" r="1.6" fill="#1f2328"/><path d="M118 20h22v4h-22z" fill="#c7b7a2"/>` },
};
const photoSvg = (k, extra = '', fit = 'xMidYMid slice') => `<svg viewBox="0 0 160 120" preserveAspectRatio="${fit}">${PHOTO[k].svg}${extra}</svg>`;

const PEOPLE = {
  joan: { name: 'Joan Pike', role: 'In the car behind the van', phone: '07700 900412', init: 'JP', bg: '#e2f4ec', fg: '#1d7a52' },
  ade: { name: 'Ade Bello', role: 'At the bus stop', phone: '07700 900873', init: 'AB', bg: '#fff1d1', fg: '#8a5a07' },
};

// Sam's own words. Used by "Type it for me" in the prototype bar. People can also type their own.
const SAM_WORDS = "I was driving north on Hale Road at about 8:40, on my way to work. My light was green. A white van came out of Mill Lane on my left and hit my passenger side. I was doing about 25. The driver said his light was green and that I came out of nowhere. A woman in the car behind the van stopped and gave me her number.";

// What we pick out while someone writes. Prototype patterns; the product uses extraction with review.
const FINDS = [
  { k: 'theirs', label: 'What he said', re: /\b(?:the driver|he) said his light was green\b/i, add: 'He said his light was green' },
  { k: 'witness', label: 'Someone who saw it', re: /\ba (?:woman|man|lady) in the car behind the van\b/i, add: 'The woman in the car behind the van is probably Joan Pike' },
  { k: 'yours', label: 'Your version', re: /\bmy light was green\b/i, add: 'Your light was green' },
  { k: 'speed', label: 'Your speed', re: /\b(?:doing|going|at) (?:about |around )?\d{2}(?: ?mph)?(?=[\s.,])/i, add: 'You were doing about 25 mph' },
  { k: 'event', label: 'What happened', re: /\bcame out of Mill Lane\b/i },
  { k: 'damage', label: 'Damage', re: /\bpassenger side\b/i },
  { k: 'time', label: 'Time', re: /\b(?:about |around )?\d{1,2}[:.]\d{2}\b/i },
  { k: 'place', label: 'Place', re: /\b(?:Hale Road|Mill Lane)\b/i },
];

const FILES = [
  { id: 'email', name: 'Joan Pike: Re: this morning', type: 'Email', size: '4 KB', icon: 'mail', found: '1 account · 1 lead' },
  { id: 'receipt', name: 'Hale Recovery receipt.pdf', type: 'PDF', size: '86 KB', icon: 'doc', found: '£165' },
  { id: 'police', name: 'Text from police.png', type: 'Screenshot', size: '210 KB', icon: 'doc', found: 'A reference number' },
];

const JOAN_EMAIL = (mark) => {
  const a = 'Our lights were red and the van didn’t stop.';
  const b = 'I’ve got a dashcam, so it might have caught it.';
  const m = (t, on) => (on ? `<mark>${t}</mark>` : t);
  return `<div class="mailh"><b>Joan Pike</b><span>18:12</span></div><div class="mailsub">Re: this morning</div><p>Hi Sam, it’s Joan from this morning. I hope you’re OK. I was in the car behind the van. ${m(a, mark === 'a')} ${m(b, mark === 'b')} I’ll try to get the clip off tonight.</p><p>Joan</p>`;
};

const QUEUE = [
  { id: 'joanAccount', src: 'email', srcLabel: 'Joan’s email · 18:12', view: () => JOAN_EMAIL('a'),
    say: 'Joan says the van’s light was red and it didn’t stop.',
    where: ['What colour was the van’s light?', 'as helping your version'],
    payoff: 'Joan backs your version. She’s independent, so it counts for more.' },
  { id: 'joanDashcam', src: 'email', srcLabel: 'Joan’s email · 18:12', view: () => JOAN_EMAIL('b'),
    say: 'Joan may have dashcam footage of the crash.',
    where: ['A new lead', 'Get Joan’s dashcam clip'],
    payoff: 'Video could settle the lights question.' },
  { id: 'receipt', src: 'receipt', srcLabel: 'Hale Recovery receipt.pdf · page 1',
    view: () => `<div class="rcpt"><b>HALE RECOVERY LTD</b><small>Unit 4, Brook Street · VAT 318 2207 51</small><div class="rr"><span>Recovery: Hale Rd to 14 Arden Close</span><span></span></div><div class="rr"><span>Vehicle: Ford Fiesta</span><span></span></div><div class="rr t"><mark><span>Total paid (card)</span><span>£165.00</span></mark></div><small>4 March 2025 · 10:05</small></div>`,
    say: 'You paid £165 to have your car taken home.',
    where: ['What it cost you', 'Recovery'],
    payoff: 'Your costs so far: £165.' },
  { id: 'camera', src: 'photo', srcLabel: 'Your photo · 08:47 · Corner of Mill Lane',
    view: () => `<div class="ph big">${photoSvg('pharmacy', '<circle cx="142" cy="30" r="9" fill="none" stroke="#f5b400" stroke-width="2" stroke-dasharray="4 3"/>', 'xMidYMid meet')}</div>`,
    say: 'There may be a camera on Hale Pharmacy facing the junction.',
    where: ['A new lead', 'Hale Pharmacy camera'],
    payoff: 'Footage like this is often deleted after about 30 days, so there’s now a deadline.' },
  { id: 'batch', src: 'several', srcLabel: 'Two small things',
    view: () => `<div class="smalls"><div><b>Text from police</b><span>“Your reference is <mark>CAD 2291</mark>. Quote this if you call.”</span></div><div><b>Marek’s insurance certificate</b><span>Photographed 08:49 · Insurer: <mark>Northgate Insurance</mark></span></div></div>`,
    say: 'Police reference CAD 2291, and Marek’s insurer is Northgate Insurance.',
    where: ['Filed with', 'Papers and Marek Kowalski'],
    payoff: 'Your insurer will ask for both.', addLabel: 'Add both' },
];
