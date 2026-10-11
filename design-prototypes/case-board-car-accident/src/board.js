// ===== board content =====
const EL0 = [
  { id: "sam", type: "person", x: 0, y: 0, w: 292, side: "you", ini: "SR", name: "Sam Reyes", role: "Driver · blue Ford Fiesta", where: "Northbound on Hale Road", spot: "fiesta",
    stmts: [{ doc: "sam", date: "5 Mar", claims: [{ id: "sam-green", t: "My light was green" }, { id: "sam-25", t: "About 25 mph" }] }] },
  { id: "joan", type: "person", x: 0, y: 222, w: 292, side: "wit", ini: "JP", name: "Joan Pike", role: "Driver · car behind the van", where: "Eastbound on Mill Lane, behind the van", spot: "joan",
    stmts: [{ doc: "joan", date: "6 Mar", claims: [{ id: "joan-red", t: "Our lights were red" }, { id: "joan-nostop", t: "The van didn’t stop" }, { id: "joan-cam", t: "Dashcam was on" }] }] },
  { id: "ade", type: "person", x: 0, y: 474, w: 292, side: "wit", ini: "AB", name: "Ade Bello", role: "Pedestrian · waiting for a bus", where: "Bus stop, just past the lights", spot: "ade",
    stmts: [{ doc: "ade", date: "12 Mar", claims: [{ id: "ade-green", t: "I think the van’s light was green" }, { id: "ade-fast", t: "The car was going quite fast" }] }], act: { k: "sight", t: "Check what Ade could see", i: "eye" } },
  { id: "lead", type: "lead", x: 0, y: 744, w: 292 },
  { id: "scene", type: "scene", x: 1242, y: 334, w: 668 },
  { id: "damage", type: "damage", x: 1662, y: 0, w: 248 },
  { id: "f2", type: "fact", x: 382, y: 378, w: 400, fact: "speed" },
  { id: "dash", type: "video", x: 1242, y: 0, w: 396 },
  { id: "f1", type: "fact", x: 382, y: 0, w: 400, fact: "light" },
  { id: "ledger", type: "ledger", x: 382, y: 716, w: 400 },
  { id: "marek", type: "person", x: 862, y: 0, w: 306, side: "them", ini: "MK", name: "Marek Kowalski", role: "Driver · white van", where: "Eastbound on Mill Lane", spot: "van",
    stmts: [{ doc: "police", date: "4 Mar · to police", claims: [{ id: "mk-satnav", t: "Didn’t see the lights change" }, { id: "mk-nowhere", t: "The car came out of nowhere" }] },
            { doc: "insurer", date: "21 Mar · insurer’s letter", claims: [{ id: "mk-green", t: "I had a green light" }, { id: "mk-fast", t: "Sam was going too fast" }] }], changed: true },
  { id: "r175", type: "rule", x: 862, y: 420, w: 306, doc: "r175", head: "Highway Code · rule 175", text: "You MUST stop behind the white ‘Stop’ line unless the light is green." },
  { id: "r30", type: "rule", x: 862, y: 566, w: 306, doc: "r30", head: "Speed limit · Hale Road", text: "30 mph" },
  { id: "note1", type: "sticky", x: 900, y: 700, w: 230, by: "DO", text: "Ask Joan for the original file, not a phone recording of it" },
];
// strings. fact/ver = this string is evidence for one version of a disputed fact
const LK0 = [
  { id: "l1", a: "sam", b: "f1", fact: "light", ver: "red", claim: "sam-green", label: "Green for me" },
  { id: "l2", a: "joan", b: "f1", fact: "light", ver: "red", claim: "joan-red", label: "Red for the van" },
  { id: "l3", a: "ade", b: "f1", fact: "light", ver: "green", claim: "ade-green", label: "Van’s light green?" },
  { id: "l4", a: "marek", b: "f1", fact: "light", ver: "green", claim: "mk-green", label: "Green for me" },
  { id: "l5", a: "ade", b: "f2", fact: "speed", ver: "fast", claim: "ade-fast", label: "Quite fast" },
  { id: "l6", a: "marek", b: "f2", fact: "speed", ver: "fast", claim: "mk-fast", label: "Too fast" },
  { id: "l7", a: "sam", b: "f2", fact: "speed", ver: "under", claim: "sam-25", label: "About 25 mph" },
  { id: "l8", a: "r175", b: "f1", type: "rule", label: "If red, he had to stop" },
  { id: "l9", a: "r30", b: "f2", type: "rule", label: "Limit 30 mph" },
  { id: "l10", a: "scene", b: "damage", type: "rel", label: "Point of impact" },
];
const FACTS = {
  light: { q: "What colour was the van’s light when it crossed the stop line?", at: "08:42:06", good: "red", bad: "green",
    vers: { red: { label: "Red", dot: "#e0475f" }, green: { label: "Green", dot: "#22a06b" } } },
  speed: { q: "How fast was Sam going into the junction?", at: "08:42:05", good: "under", bad: "fast",
    vers: { under: { label: "Within the 30 limit", dot: "#4d70f7" }, fast: { label: "Too fast", dot: "#c38b16" } } },
};
const LEDGER0 = [
  { id: "repair", t: "Car repairs", amt: 3420, doc: "repair" },
  { id: "excess", t: "Insurance excess", amt: 250, doc: "excess" },
  { id: "hire", t: "Hire car, 12 days", amt: 890, doc: "hire" },
  { id: "physio", t: "Physiotherapy, 6 sessions", amt: 360, have: 240, doc: "physio", need: "physio2", miss: "2 receipts missing" },
  { id: "earnings", t: "Lost pay, 3 days", amt: 540, have: 0, need: "payslip", miss: "Payslip missing" },
  { id: "injury", t: "Neck injury", pending: "Valued from the medical report · 2 Apr" },
];
