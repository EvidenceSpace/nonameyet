/*
 * Space whiteboard model: pure data helpers shared by the page and tests.
 * Boards hold items (cards, notes, shapes, frames), links between items, and
 * freehand strokes. Everything is stored in world pixels.
 */
import { evidenceFixture, spaceLibraryFixture } from "./fixtures.js";

export const ITEM_TYPES = Object.freeze(["note", "text", "shape", "frame", "evidence", "person", "date", "question"]);
export const LINK_KINDS = Object.freeze(["supports", "contradicts", "related", "question"]);
export const LINK_LABELS = Object.freeze({ supports: "Supports", contradicts: "Contradicts", related: "Related", question: "Open question" });
export const NOTE_COLORS = Object.freeze(["yellow", "pink", "green", "blue", "violet", "orange", "white"]);
export const INK_COLORS = Object.freeze(["ink", "blue", "red", "green", "violet", "amber"]);
export const SHAPE_KINDS = Object.freeze(["rect", "ellipse", "diamond"]);
export const TEMPLATES = Object.freeze([
  { id: "blank", name: "Blank board", description: "An empty canvas. Draw, add notes, or drag in case items." },
  { id: "case-map", name: "Case map", description: "The question in the middle, sources around it, links showing what supports or contradicts it." },
  { id: "timeline", name: "Timeline", description: "Key dates in order with the source behind each one." },
  { id: "claims", name: "Claims vs evidence", description: "Each side’s position with the sources that back it." },
  { id: "people", name: "People & parties", description: "Who is involved and how they connect." },
]);

const MAX_TEXT = 2000;
const MAX_ITEMS = 2000;
const MAX_POINTS = 4000;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

let idCounter = 0;
export function makeId(prefix = "i") {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function evidenceById(id) {
  return evidenceFixture.find((item) => item.id === id) || null;
}

export function libraryLookup(type, ref) {
  if (type === "evidence") return evidenceById(ref);
  if (type === "person") return spaceLibraryFixture.people.find((item) => item.id === ref) || null;
  if (type === "date") return spaceLibraryFixture.dates.find((item) => item.id === ref) || null;
  if (type === "question") return spaceLibraryFixture.questions.find((item) => item.id === ref) || null;
  return null;
}

export const DEFAULT_SIZES = Object.freeze({
  note: [190, 150],
  text: [240, 44],
  shape: [180, 110],
  frame: [520, 340],
  evidence: [248, 118],
  person: [212, 64],
  date: [176, 74],
  question: [260, 96],
});

function finite(value, fallback, min = -1e6, max = 1e6) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function cleanText(value) {
  return typeof value === "string" ? value.slice(0, MAX_TEXT) : "";
}

function cleanId(value) {
  return typeof value === "string" && SAFE_ID.test(value) ? value : null;
}

/** Validate one item loaded from storage; returns null when it can't be trusted. */
export function sanitizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = cleanId(raw.id);
  if (!id || !ITEM_TYPES.includes(raw.type)) return null;
  const [dw, dh] = DEFAULT_SIZES[raw.type];
  const item = {
    id,
    type: raw.type,
    x: finite(raw.x, 0),
    y: finite(raw.y, 0),
    w: finite(raw.w, dw, 24, 6000),
    h: finite(raw.h, dh, 24, 6000),
    text: cleanText(raw.text),
  };
  if (raw.type === "note" || raw.type === "shape" || raw.type === "frame") {
    item.color = NOTE_COLORS.includes(raw.color) ? raw.color : raw.type === "note" ? "yellow" : "white";
  }
  if (raw.type === "shape") item.shape = SHAPE_KINDS.includes(raw.shape) ? raw.shape : "rect";
  if (["evidence", "person", "date", "question"].includes(raw.type)) {
    const ref = cleanId(raw.ref);
    if (raw.type !== "question" && (!ref || !libraryLookup(raw.type, ref))) return null;
    if (ref && libraryLookup(raw.type, ref)) item.ref = ref;
  }
  return item;
}

export function sanitizeLink(raw, itemIds) {
  if (!raw || typeof raw !== "object") return null;
  const id = cleanId(raw.id);
  if (!id || !itemIds.has(raw.from) || !itemIds.has(raw.to) || raw.from === raw.to) return null;
  return {
    id,
    from: raw.from,
    to: raw.to,
    kind: LINK_KINDS.includes(raw.kind) ? raw.kind : "related",
    label: cleanText(raw.label).slice(0, 120),
  };
}

export function sanitizeStroke(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = cleanId(raw.id);
  if (!id || !Array.isArray(raw.points) || raw.points.length < 2) return null;
  const points = raw.points
    .slice(0, MAX_POINTS)
    .filter((point) => Array.isArray(point) && point.length === 2)
    .map(([x, y]) => [finite(x, 0), finite(y, 0)]);
  if (points.length < 2) return null;
  return {
    id,
    points,
    color: INK_COLORS.includes(raw.color) ? raw.color : "ink",
    size: finite(raw.size, 3, 1, 40),
    highlighter: raw.highlighter === true,
  };
}

export function sanitizeBoard(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = cleanId(raw.id);
  if (!id) return null;
  const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, MAX_ITEMS).map(sanitizeItem).filter(Boolean);
  const unique = new Map(items.map((item) => [item.id, item]));
  const itemIds = new Set(unique.keys());
  const links = (Array.isArray(raw.links) ? raw.links : []).map((link) => sanitizeLink(link, itemIds)).filter(Boolean);
  const strokes = (Array.isArray(raw.strokes) ? raw.strokes : []).slice(0, MAX_ITEMS).map(sanitizeStroke).filter(Boolean);
  const view = raw.view && typeof raw.view === "object"
    ? { x: finite(raw.view.x, 0), y: finite(raw.view.y, 0), zoom: finite(raw.view.zoom, 1, 0.1, 4) }
    : null;
  const name = cleanText(raw.name).trim().slice(0, 80) || "Untitled board";
  return { id, name, items: [...unique.values()], links, strokes, view };
}

export function sanitizeWorkspace(raw) {
  if (!raw || typeof raw !== "object" || raw.version !== 1) return null;
  const boards = (Array.isArray(raw.boards) ? raw.boards : []).slice(0, 50).map(sanitizeBoard).filter(Boolean);
  if (!boards.length) return null;
  const activeId = boards.some((board) => board.id === raw.activeId) ? raw.activeId : boards[0].id;
  return { version: 1, boards, activeId };
}

/* ---------- geometry ---------- */

export function itemCenter(item) {
  return [item.x + item.w / 2, item.y + item.h / 2];
}

/** Point where the segment from the item's centre towards (tx, ty) leaves its box. */
export function clipToBox(item, tx, ty, pad = 6) {
  const [cx, cy] = itemCenter(item);
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const hw = item.w / 2 + pad;
  const hh = item.h / 2 + pad;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return [cx + dx * scale, cy + dy * scale];
}

export function linkEndpoints(from, to) {
  const [fx, fy] = itemCenter(from);
  const [tx, ty] = itemCenter(to);
  return [clipToBox(from, tx, ty), clipToBox(to, fx, fy)];
}

export function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function strokeHit(stroke, x, y, tolerance) {
  const reach = tolerance + stroke.size / 2;
  for (let index = 1; index < stroke.points.length; index += 1) {
    if (distanceToSegment(x, y, stroke.points[index - 1], stroke.points[index]) <= reach) return true;
  }
  return false;
}

/** Smooth path through freehand points using midpoint quadratic curves. */
export function strokePath(points) {
  if (points.length < 2) return "";
  const round = (value) => Math.round(value * 10) / 10;
  let path = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index];
    const [nx, ny] = points[index + 1];
    path += ` Q${round(x)} ${round(y)} ${round((x + nx) / 2)} ${round((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  return `${path} L${round(last[0])} ${round(last[1])}`;
}

export function boundsOf(board) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const item of board.items) {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y - (item.type === "frame" ? 28 : 0));
    maxX = Math.max(maxX, item.x + item.w);
    maxY = Math.max(maxY, item.y + item.h);
  }
  for (const stroke of board.strokes) {
    for (const [x, y] of stroke.points) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return Number.isFinite(minX) ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null;
}

export function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}

/** Suggestions whose two ends are both on the board and not yet connected. */
export function pendingSuggestions(board, dismissed = new Set()) {
  const byRef = new Map();
  for (const item of board.items) if (item.ref && !byRef.has(item.ref)) byRef.set(item.ref, item);
  const connected = new Set(board.links.flatMap((link) => [`${link.from}>${link.to}`, `${link.to}>${link.from}`]));
  return spaceLibraryFixture.suggestions
    .map((suggestion) => ({ ...suggestion, key: `${suggestion.from}>${suggestion.to}`, fromItem: byRef.get(suggestion.from), toItem: byRef.get(suggestion.to) }))
    .filter((suggestion) => suggestion.fromItem && suggestion.toItem && !dismissed.has(suggestion.key)
      && !connected.has(`${suggestion.fromItem.id}>${suggestion.toItem.id}`));
}

/* ---------- templates ---------- */

function card(type, ref, x, y, extra = {}) {
  const [w, h] = DEFAULT_SIZES[type];
  return { id: makeId("i"), type, ref, x, y, w, h, text: "", ...extra };
}

function note(text, x, y, color = "yellow", extra = {}) {
  return { id: makeId("i"), type: "note", x, y, w: 190, h: 150, text, color, ...extra };
}

function frame(text, x, y, w, h, color = "white") {
  return { id: makeId("i"), type: "frame", x, y, w, h, text, color };
}

function link(from, to, kind, label = "") {
  return { id: makeId("l"), from: from.id, to: to.id, kind, label };
}

function wobblyEllipse(cx, cy, rx, ry, seed = 1) {
  const points = [];
  for (let step = 0; step <= 40; step += 1) {
    const angle = -0.4 + (step / 40) * Math.PI * 2.08;
    const wobble = 1 + Math.sin(step * 1.7 + seed) * 0.025;
    points.push([cx + Math.cos(angle) * rx * wobble, cy + Math.sin(angle) * ry * wobble]);
  }
  return points;
}

function questionCard(ref, x, y, extra = {}) {
  const question = libraryLookup("question", ref);
  return card("question", ref, x, y, { text: question?.text || "", ...extra });
}

export function buildTemplate(templateId, { withCaseContent = true } = {}) {
  const items = [];
  const links = [];
  const strokes = [];
  const add = (item) => {
    items.push(item);
    return item;
  };

  if (templateId === "case-map") {
    if (!withCaseContent) {
      const centre = add({ ...card("question", undefined, -130, -48), text: "What do we need to show?" });
      const left = add(note("What supports it?", -520, -220, "green"));
      const right = add(note("What works against it?", 330, -220, "pink"));
      links.push(link(left, centre, "supports"), link(right, centre, "contradicts"));
      return { items, links, strokes };
    }
    const centre = add(questionCard("Q-1", -130, -48));
    const e01 = add(card("evidence", "E-01", -520, -250));
    add(card("evidence", "E-02", -520, -60));
    const e03 = add(card("evidence", "E-03", -520, 130));
    const e04 = add(card("evidence", "E-04", 290, -150));
    const e05 = add(card("evidence", "E-05", 290, 60));
    add(card("evidence", "E-06", 290, 250));
    const mia = add(card("person", "P-MC", 600, -330));
    add(note("Ask Mia for the full change list before 2 Sept.", 600, 40, "yellow", { w: 180, h: 130 }));
    add(note("Was the 29 July signature unconditional?", -500, 300, "pink", { w: 190, h: 120 }));
    links.push(
      link(e03, centre, "supports", "Signed 29 Jul, before the concern"),
      link(e04, centre, "contradicts", "Concern raised 2 Aug"),
      link(e05, e04, "related", "Same layouts"),
      link(e01, centre, "related", "Clause 4.2 · acceptance"),
      link(mia, e04, "related", "Sent by"),
    );
    strokes.push({ id: makeId("s"), points: wobblyEllipse(-396, 189, 158, 84, 2), color: "red", size: 3, highlighter: false });
    return { items, links, strokes };
  }

  if (templateId === "timeline") {
    const width = 1240;
    add(frame("Timeline", -620, -230, width, 470));
    strokes.push({ id: makeId("s"), points: [[-570, -40], [570, -40]], color: "ink", size: 3, highlighter: false });
    if (!withCaseContent) {
      ["First event", "Next event", "Latest event"].forEach((label, index) => add(note(label, -500 + index * 380, -170, "blue", { w: 170, h: 100 })));
      return { items, links, strokes };
    }
    const pairs = [["D-1", "E-01"], ["D-2", "E-02"], ["D-3", "E-03"], ["D-4", "E-04"], ["D-5", "E-06"]];
    pairs.forEach(([dateRef, evidenceRef], index) => {
      const x = -580 + index * 240;
      const date = add(card("date", dateRef, x + 30, -150));
      const source = add(card("evidence", evidenceRef, x, 30, { w: 224 }));
      links.push(link(date, source, evidenceRef === "E-04" ? "contradicts" : "supports"));
    });
    add(note("Only 4 days between acknowledgement and the concern.", 70, -360, "pink", { w: 220, h: 110 }));
    strokes.push(
      { id: makeId("s"), points: [[172, -244], [162, -214], [150, -188], [140, -166]], color: "red", size: 3, highlighter: false },
      { id: makeId("s"), points: [[128, -182], [140, -165], [155, -179]], color: "red", size: 3, highlighter: false },
    );
    return { items, links, strokes };
  }

  if (templateId === "claims") {
    const ours = add(frame("Our position", -700, -260, 520, 560, "green"));
    const theirs = add(frame("Their position", 180, -260, 520, 560, "pink"));
    void ours;
    void theirs;
    if (!withCaseContent) {
      add(note("What we say happened", -650, -200, "green", { w: 220, h: 120 }));
      add(note("What they say happened", 230, -200, "pink", { w: 220, h: 120 }));
      add({ ...card("question", undefined, -130, 340), text: "What decides between them?" });
      return { items, links, strokes };
    }
    const claimA = add(note("The work was delivered and accepted on 29 July.", -650, -200, "green", { w: 230, h: 130 }));
    const claimB = add(note("The mobile layouts weren’t finished.", 230, -200, "pink", { w: 230, h: 130 }));
    const e01 = add(card("evidence", "E-01", -650, -20, { w: 236 }));
    const e02 = add(card("evidence", "E-02", -650, 130, { w: 236 }));
    const e03 = add(card("evidence", "E-03", -400, 0, { w: 200, h: 130 }));
    const e04 = add(card("evidence", "E-04", 230, -20, { w: 236 }));
    const e05 = add(card("evidence", "E-05", 230, 130, { w: 236 }));
    const q = add(questionCard("Q-2", -130, 340));
    links.push(
      link(e03, claimA, "supports"), link(e01, claimA, "supports", "Clause 4.2"), link(e02, e01, "related"),
      link(e04, claimB, "supports"), link(e05, claimB, "supports"),
      link(q, e03, "question"),
    );
    return { items, links, strokes };
  }

  if (templateId === "people") {
    add(frame("Our side", -640, -220, 520, 400, "blue"));
    add(frame("Harbor Studio", 200, -220, 420, 400, "orange"));
    if (!withCaseContent) {
      add(note("Add the people involved and how they’re connected.", -580, -150, "yellow"));
      return { items, links, strokes };
    }
    const alex = add(card("person", "P-AM", -590, -140));
    const riley = add(card("person", "P-RM", -590, -10));
    const jordan = add(card("person", "P-JK", -590, 100));
    const mia = add(card("person", "P-MC", 300, -60));
    const e01 = add(card("evidence", "E-01", -100, 260));
    add(note("Mia signed the acknowledgement and later raised the concern.", 300, 40, "yellow", { w: 220, h: 120 }));
    links.push(
      link(alex, mia, "related", "Contract"), link(riley, alex, "related", "Case editor"),
      link(jordan, riley, "related", "Comments"), link(e01, mia, "supports", "Signed by"),
    );
    return { items, links, strokes };
  }

  return { items, links, strokes };
}

export function newBoard(templateId, options = {}) {
  const template = TEMPLATES.find((entry) => entry.id === templateId) || TEMPLATES[0];
  const content = buildTemplate(template.id, options);
  return { id: makeId("b"), name: options.name || (template.id === "blank" ? "Untitled board" : template.name), ...content, view: null };
}

export function defaultWorkspace(options = {}) {
  const board = newBoard("case-map", options);
  return { version: 1, boards: [board], activeId: board.id };
}

export function storageKey(caseId) {
  return `evidencespace.space.v1.${caseId}`;
}
