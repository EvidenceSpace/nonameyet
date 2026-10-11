// ===== Car accident case: Reyes v Kowalski (fictional) =====
const PEOPLE = {
  SR: { name: "Sam Reyes", first: "You", color: "#4d70f7", bg: "#e6ecff" },
  DO: { name: "Dana Okafor", first: "Dana", role: "Solicitor", color: "#0f8a7e", bg: "#d9f0ee" },
};
// Documents behind every card (what "Open" shows)
const DOCS = {
  sam:   { ref: "S-01", kind: "Statement", title: "Your account", sub: "Written by you · Wed 5 Mar 2025", by: "Sam Reyes",
    html: `<p>I was driving north on Hale Road on my way to work, about 8:40 in the morning.</p><p data-c="sam-green">As I came up to the Mill Lane lights <mark>they were green, so I carried on</mark>.</p><p data-c="sam-25">I was doing <mark>about 25 mph</mark>.</p><p>A white van came from my left and hit the passenger side of my car. I didn’t see it until the last second.</p>` },
  joan:  { ref: "S-02", kind: "Statement", title: "Joan Pike’s statement", sub: "Emailed to you · Thu 6 Mar 2025", by: "Joan Pike",
    html: `<p>I was driving east on Mill Lane behind a white van.</p><p data-c="joan-red"><mark>Our lights were red</mark> and I slowed down to stop.</p><p data-c="joan-nostop">The van didn’t stop. It went straight into the junction and hit a blue car crossing from the right.</p><p data-c="joan-cam">My dashcam was on. I can send you the clip.</p>` },
  ade:   { ref: "S-03", kind: "Statement", title: "Ade Bello’s account", sub: "Phone call, your notes · Wed 12 Mar 2025", by: "Ade Bello",
    html: `<p>I was waiting at the bus stop on Hale Road, just past the lights.</p><p data-c="ade-green"><mark>I think the van’s light was green</mark>, it didn’t slow down at all.</p><p data-c="ade-fast">The blue car was going <mark>quite fast</mark>.</p>` },
  police:{ ref: "P-01", kind: "Police note", title: "PC Hart’s notebook, at the scene", sub: "Police report, page 2 · Tue 4 Mar 2025, 09:10", by: "Marek Kowalski",
    html: `<p class="hd2">Driver of the van, Mr M. Kowalski, states:</p><p data-c="mk-satnav">“<mark>I was checking the sat nav, I didn’t see the lights change.</mark> The car came out of nowhere.”</p><p class="qt">Both drivers breath tested: negative. No injuries reported at the scene.</p>` },
  insurer:{ ref: "L-01", kind: "Letter", title: "Letter from Northway Insurance", sub: "On behalf of Marek Kowalski · Fri 21 Mar 2025", by: "Marek Kowalski",
    html: `<p>Dear Mr Reyes,</p><p data-c="mk-green"><mark>Our insured had a green signal</mark> when entering the junction.</p><p data-c="mk-fast">Your client was travelling at <mark>excessive speed</mark> and failed to take care.</p><p>Liability is denied.</p>` },
  dash:  { ref: "V-01", kind: "Video", title: "Joan’s dashcam clip", sub: "Sent by Joan Pike · Mon 24 Mar 2025 · 0:12", by: "Joan Pike" },
  r175:  { ref: "R-01", kind: "Rule", title: "Highway Code, rule 175", sub: "Traffic light signals",
    html: `<p><mark>You MUST stop behind the white ‘Stop’ line across your side of the road unless the light is green.</mark></p><p class="qt">Laws RTA 1988 sect 36 & TSRGD.</p>` },
  r30:   { ref: "R-02", kind: "Rule", title: "Speed limit, Hale Road", sub: "Council traffic order · signs at both ends",
    html: `<p><mark>The speed limit on Hale Road is 30 mph.</mark></p>` },
  plan:  { ref: "D-04", kind: "Record", title: "Signal timing plan, junction J14", sub: "Leeds City Council · sent 18 Mar 2025",
    html: `<p>Junction J14, Hale Road / Mill Lane.</p><p><mark>Hale Road and Mill Lane never show green at the same time.</mark></p><p>Between them: 3 seconds amber, then 2 seconds red in all directions.</p>` },
  repair:{ ref: "D-01", kind: "Estimate", title: "Repair estimate", sub: "Halden Motors · 7 Mar 2025", html: `<p>Ford Fiesta, near-side doors and B-pillar. Parts and labour: <mark>£3,420.00</mark></p>` },
  excess:{ ref: "D-02", kind: "Record", title: "Insurance policy schedule", sub: "Your insurer · policy excess", html: `<p>Policy excess: <mark>£250.00</mark>, paid 10 Mar 2025.</p>` },
  hire:  { ref: "D-03", kind: "Invoice", title: "Hire car invoice", sub: "Swift Hire · 12 days", html: `<p>Vauxhall Corsa, 5–17 Mar, 12 days: <mark>£890.00</mark></p>` },
  physio:{ ref: "D-05", kind: "Receipts", title: "Physiotherapy receipts 1–4", sub: "Kirk Physio · 4 × £60", html: `<p>Sessions 1–4, neck: <mark>£240.00</mark></p>` },
  physio2:{ ref: "D-06", kind: "Receipts", title: "Physiotherapy receipts 5–6", sub: "Kirk Physio · 2 × £60", html: `<p>Sessions 5–6, neck: <mark>£120.00</mark></p>` },
  payslip:{ ref: "D-07", kind: "Payslip", title: "March payslip", sub: "Brightwell Logistics", html: `<p>Unpaid absence 5–7 Mar, 3 days: <mark>£540.00</mark></p>` },
};
// Loose papers: uploaded but not pinned yet (with what was found in them)
const LOOSE = [
  { k: "physio2", found: ["£120", "2 sessions", "Kirk Physio"], fits: "physio" },
  { k: "payslip", found: ["£540", "5–7 Mar", "3 days"], fits: "earnings" },
  { k: "plan", found: ["Hale Road", "Mill Lane", "never green together"] },
];
// ---------- the scene (top-down, 10 units = 1 metre) ----------
// Hale Road runs north–south (x 265–335), Mill Lane east–west (y 175–245). UK: drive on the left.
const SCENE = {
  sigNB: { x: 252, y: 258, face: 90, label: "Hale Rd signal" },      // faces south (towards northbound traffic)
  sigEB: { x: 256, y: 166, face: 180, label: "Mill Ln signal" }, sigEB2: { x: 346, y: 166, face: 180 },     // faces west (towards eastbound traffic)
  ade: { x: 352, y: 118 }, joanSeat: null, shelter: { x: 340, y: 128, w: 44, h: 16 },
  cctv: { x: 344, y: 254, dir: 225 }, postA: { x: 304, y: 395 }, stopNB: 255, stopEB: 255, impact: { x: 273, y: 192 },
};
// vehicle motion, t = seconds after 08:42:00
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fiestaAt(t) { // front centre + heading (deg, 0 = north)
  if (t <= 6.2) return { x: 282, y: 178 + 98 * (6.2 - t), r: 0 };
  const k = clamp((t - 6.2) / 0.9, 0, 1), e = 1 - Math.pow(1 - k, 3);
  return { x: 282 + 34 * e, y: 178 - 6 * e, r: 24 * e };
}
function vanAt(t) { // front centre, heading 90 = east
  if (t <= 6.2) return { x: 273 - 134 * (6.2 - t), y: 192, r: 90 };
  const k = clamp((t - 6.2) / 0.9, 0, 1), e = 1 - Math.pow(1 - k, 3);
  return { x: 273 + 30 * e, y: 192 + 4 * e, r: 90 + 6 * e };
}
function joanAt(t) { // 12 m/s, braking from 08:42:05 for the red light; ~15 m behind the van when it crosses
  if (t <= 5) return { x: -61 - 120 * (5 - t), y: 192, r: 90 };
  const k = Math.min(t - 5, 4); return { x: -61 + 120 * k - 15 * k * k, y: 192, r: 90 };
}
// signal plan: Hale Rd green until 08:42:12, Mill Ln red until 08:42:17
const sigState = (which, t, theory) => {
  if (theory === "marek") return which === "EB" ? "green" : "red";
  if (theory === "sam") return which === "EB" ? "red" : "green";
  if (which === "NB") return t < 12 ? "green" : t < 15 ? "amber" : "red";
  return t < 17 ? "red" : "green";
};
