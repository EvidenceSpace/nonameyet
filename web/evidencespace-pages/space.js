import { buildShellHref } from "../evidencespace-shell-model.js";
import { evidenceFixture, spaceLibraryFixture } from "./fixtures.js";
import { escapeHtml, statePage } from "./page-utils.js";
import {
  DEFAULT_SIZES,
  LINK_KINDS,
  LINK_LABELS,
  NOTE_COLORS,
  INK_COLORS,
  SHAPE_KINDS,
  TEMPLATES,
  boundsOf,
  clipToBox,
  contains,
  defaultWorkspace,
  libraryLookup,
  linkEndpoints,
  makeId,
  newBoard,
  pendingSuggestions,
  sanitizeWorkspace,
  storageKey,
  strokeHit,
  strokePath,
  distanceToSegment,
} from "./space-model.js";

const ICONS = {
  select: '<path d="M5.5 3.5l12.5 7-5.4 1.5 3.2 5.6-2.3 1.3-3.2-5.6-4 3.8z"/>',
  hand: '<path d="M8 12.5V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5v-1a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v4.5c0 4-2.7 6.5-6.5 6.5H13c-2.3 0-3.7-.9-5-2.6L4.7 14a1.5 1.5 0 0 1 2.3-1.9L8 13.3"/>',
  note: '<path d="M5 4h14v10l-5 6H5z"/><path d="M14 20v-6h5"/>',
  text: '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6"/>',
  shape: '<rect x="3.5" y="10" width="9.5" height="9.5" rx="1.5"/><circle cx="15.5" cy="8.5" r="5"/>',
  frame: '<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>',
  connect: '<circle cx="5.5" cy="18.5" r="2.4"/><circle cx="18.5" cy="5.5" r="2.4"/><path d="M7.6 16.8C11 15.5 9.5 10 13 8.2c1-.5 2.1-.9 3.2-1.1"/>',
  pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  highlighter: '<path d="M9.5 14.5L6 18v2h3.5l2.5-2.5"/><path d="M9.5 14.5L15 4l5 5-10.5 5.5z"/><path d="M14 21h6"/>',
  eraser: '<path d="M4.6 12.6l8-8a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L11 18H7.4l-2.8-2.8a1.8 1.8 0 0 1 0-2.6z"/><path d="M9 8.2l5.8 5.8M11 18h9"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  library: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12.5l8.5 4.5 8.5-4.5"/><path d="M3.5 16.5l8.5 4.5 8.5-4.5"/>',
  suggest: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M17 10h.01M7 14h10"/>',
  chevron: '<path d="M7 10l5 5 5-5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h3.5"/>',
  front: '<path d="M5 4h14M12 20V9M7.5 13.5L12 9l4.5 4.5"/>',
  back: '<path d="M5 20h14M12 4v11M7.5 10.5L12 15l4.5-4.5"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  swap: '<path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  label: '<path d="M3.5 12V4.5H11l9.5 9.5-7.5 7.5z"/><circle cx="7.8" cy="8.8" r="1.4"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  diamond: '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  rename: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14 20h6"/>',
  board: '<rect x="3.5" y="4.5" width="17" height="13" rx="2"/><path d="M8 21l4-3.5 4 3.5"/>',
};

export function svgIcon(name) {
  return `<svg class="es-wb-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

const TOOL_GROUPS = [
  [
    { id: "select", label: "Select", key: "V" },
    { id: "hand", label: "Hand", key: "H" },
  ],
  [
    { id: "note", label: "Sticky note", key: "N" },
    { id: "text", label: "Text", key: "T" },
    { id: "shape", label: "Shape", key: "R" },
    { id: "frame", label: "Frame", key: "F" },
  ],
  [
    { id: "connect", label: "Connect", key: "C" },
    { id: "pen", label: "Pen", key: "P" },
    { id: "highlighter", label: "Highlighter", key: "M" },
    { id: "eraser", label: "Eraser", key: "E" },
  ],
];
const TOOLS = TOOL_GROUPS.flat();
const TOOL_HINTS = {
  select: "Drag to move · Double-click to write · Drag from a dot to connect",
  hand: "Drag to move around the board",
  note: "Click to place a sticky note",
  text: "Click to add text",
  shape: "Drag to draw a shape · Click for a default size",
  frame: "Drag to draw a frame · Items inside move with it",
  connect: "Drag from one item to another",
  pen: "Draw anywhere",
  highlighter: "Highlight anything on the board",
  eraser: "Drag over drawings to erase them",
};
const SHORTCUTS = [
  ["Tools", [["V", "Select"], ["H / Space (hold)", "Hand"], ["N", "Sticky note"], ["T", "Text"], ["R", "Shape"], ["F", "Frame"], ["C", "Connect"], ["P", "Pen"], ["M", "Highlighter"], ["E", "Eraser"]]],
  ["Edit", [["Double-click", "Write, or add a note"], ["Enter", "Edit selected"], ["Esc", "Finish / deselect"], ["Delete", "Remove"], ["Ctrl+D", "Duplicate"], ["Ctrl+C / Ctrl+V", "Copy, paste"], ["Ctrl+A", "Select all"], ["Arrows", "Nudge"]]],
  ["Board", [["Ctrl+Z", "Undo"], ["Ctrl+Shift+Z", "Redo"], ["Scroll", "Pan"], ["Ctrl+Scroll / Pinch", "Zoom"], ["Shift+1", "Fit everything"], ["Ctrl+0", "Zoom to 100%"], ["?", "Shortcuts"]]],
];
const COLOR_NAMES = { yellow: "Yellow", pink: "Pink", green: "Green", blue: "Blue", violet: "Violet", orange: "Orange", white: "White", ink: "Ink", red: "Red", amber: "Amber" };
const TYPE_NAMES = { note: "Sticky note", text: "Text", shape: "Shape", frame: "Frame", evidence: "Evidence", person: "Person", date: "Date", question: "Question" };
const EDITABLE = new Set(["note", "text", "shape", "frame", "question"]);

function toolButton(tool) {
  return `<button class="es-wb-tool" type="button" data-tool="${tool.id}" aria-pressed="false" aria-label="${tool.label}" data-tip="${tool.label} · ${tool.key}" aria-keyshortcuts="${tool.key}">${svgIcon(tool.id)}</button>`;
}

function shortcutsMarkup() {
  return SHORTCUTS.map(([group, rows]) => `<section><h3>${group}</h3><dl>${rows
    .map(([key, label]) => `<div><dt>${escapeHtml(label)}</dt><dd>${key.split(" / ").map((combo) => combo.split("+").map((part) => `<kbd>${escapeHtml(part)}</kbd>`).join("")).join("<span>or</span>")}</dd></div>`)
    .join("")}</dl></section>`).join("");
}

function templatePreview(id) {
  const previews = {
    blank: '<rect x="12" y="10" width="96" height="60" rx="6" class="is-dash"/>',
    "case-map": '<rect x="46" y="32" width="28" height="16" rx="3" class="is-q"/><rect x="10" y="12" width="22" height="12" rx="2"/><rect x="10" y="34" width="22" height="12" rx="2"/><rect x="10" y="56" width="22" height="12" rx="2"/><rect x="88" y="20" width="22" height="12" rx="2" class="is-c"/><rect x="88" y="46" width="22" height="12" rx="2"/><path d="M32 40h14M88 26L74 36M32 62L46 46" class="is-line"/>',
    timeline: '<path d="M10 40h100" class="is-line"/><circle cx="20" cy="40" r="3"/><circle cx="45" cy="40" r="3"/><circle cx="70" cy="40" r="3"/><circle cx="95" cy="40" r="3" class="is-c"/><rect x="12" y="50" width="16" height="12" rx="2"/><rect x="37" y="50" width="16" height="12" rx="2"/><rect x="62" y="50" width="16" height="12" rx="2"/><rect x="87" y="50" width="16" height="12" rx="2" class="is-c"/><rect x="12" y="20" width="16" height="10" rx="2" class="is-n"/>',
    claims: '<rect x="8" y="10" width="46" height="60" rx="4" class="is-frame"/><rect x="66" y="10" width="46" height="60" rx="4" class="is-frame"/><rect x="14" y="18" width="24" height="16" rx="2" class="is-g"/><rect x="72" y="18" width="24" height="16" rx="2" class="is-p"/><rect x="14" y="42" width="34" height="10" rx="2"/><rect x="72" y="42" width="34" height="10" rx="2" class="is-c"/>',
    people: '<circle cx="24" cy="28" r="8"/><circle cx="24" cy="56" r="8"/><circle cx="92" cy="40" r="9" class="is-c"/><path d="M32 28L83 38M32 56L83 43" class="is-line"/>',
  };
  return `<svg viewBox="0 0 120 80" aria-hidden="true">${previews[id] || ""}</svg>`;
}

export function renderPage(location) {
  if (location.viewState !== "ready") {
    return statePage({ title: "Space", state: location.viewState, primaryHref: buildShellHref("brief", location.caseId), primaryLabel: "Return to Brief" });
  }
  return `
    <section class="es-board" data-space-root aria-labelledby="page-title" data-tool="select">
      <div class="es-wb-viewport" data-viewport tabindex="0" role="application" aria-roledescription="whiteboard" aria-label="Case whiteboard. Press question mark for keyboard shortcuts." aria-describedby="wb-hint">
        <div class="es-wb-world" data-world>
          <div class="es-wb-layer" data-frames></div>
          <svg class="es-wb-svg" data-links aria-hidden="true"></svg>
          <div class="es-wb-layer" data-items></div>
          <div class="es-wb-layer" data-labels></div>
          <svg class="es-wb-svg is-ink" data-ink></svg>
          <div class="es-wb-selection" data-selection hidden></div>
          <div class="es-wb-marquee" data-marquee hidden></div>
        </div>
      </div>

      <div class="es-wb-empty" data-empty hidden>
        <p class="es-wb-empty-title">This board is empty</p>
        <p>Double-click anywhere to add a sticky note, press <kbd>P</kbd> to draw, or bring in sources from the case.</p>
        <div><button class="es-button is-primary" type="button" data-action="open-library">${svgIcon("library")} Add from case</button><button class="es-button" type="button" data-action="new-board">Start from a template</button></div>
      </div>

      <header class="es-wb-bar es-wb-header">
        <div class="es-wb-board-name">
          <h1 id="page-title" tabindex="-1" data-board-title>Case map</h1>
          <button class="es-wb-icon-button" type="button" data-action="board-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Boards">${svgIcon("chevron")}</button>
        </div>
        <span class="es-wb-save" data-save-status role="status">Saved in this browser</span>
      </header>
      <div class="es-wb-menu" data-board-menu role="menu" aria-label="Boards" hidden></div>

      <div class="es-wb-bar es-wb-actions">
        <button class="es-wb-text-button" type="button" data-action="suggest" aria-pressed="false">${svgIcon("suggest")}<span>Suggest links</span><span class="es-wb-count" data-suggest-count hidden></span></button>
        <button class="es-wb-text-button is-strong" type="button" data-action="open-library" aria-expanded="false" aria-controls="wb-library">${svgIcon("library")}<span>Add from case</span></button>
        <button class="es-wb-icon-button" type="button" data-action="shortcuts" aria-label="Keyboard shortcuts" data-tip="Shortcuts · ?">${svgIcon("keyboard")}</button>
      </div>

      <div class="es-wb-bar es-wb-toolbar" role="toolbar" aria-label="Whiteboard tools" aria-orientation="vertical">
        ${TOOL_GROUPS.map((group) => group.map(toolButton).join("")).join('<span class="es-wb-sep" aria-hidden="true"></span>')}
      </div>
      <div class="es-wb-bar es-wb-tool-options" data-tool-options hidden></div>
      <p class="es-wb-hint" id="wb-hint" data-hint>${TOOL_HINTS.select}</p>

      <div class="es-wb-bar es-wb-context" data-context role="toolbar" aria-label="Selection" hidden></div>

      <div class="es-wb-bar es-wb-history">
        <button class="es-wb-icon-button" type="button" data-action="undo" aria-label="Undo" data-tip="Undo · Ctrl Z" disabled>${svgIcon("undo")}</button>
        <button class="es-wb-icon-button" type="button" data-action="redo" aria-label="Redo" data-tip="Redo · Ctrl Shift Z" disabled>${svgIcon("redo")}</button>
      </div>

      <div class="es-wb-corner">
        <canvas class="es-wb-minimap" data-minimap width="176" height="112" aria-label="Board overview. Click to move there." role="img"></canvas>
        <div class="es-wb-bar es-wb-zoom">
          <button class="es-wb-icon-button" type="button" data-action="zoom-out" aria-label="Zoom out">${svgIcon("minus")}</button>
          <button class="es-wb-zoom-value" type="button" data-action="zoom-reset" data-zoom-label aria-label="Reset zoom to 100%">100%</button>
          <button class="es-wb-icon-button" type="button" data-action="zoom-in" aria-label="Zoom in">${svgIcon("plus")}</button>
          <button class="es-wb-icon-button" type="button" data-action="fit" aria-label="Fit everything" data-tip="Fit · Shift 1">${svgIcon("fit")}</button>
        </div>
      </div>

      <aside class="es-wb-drawer" id="wb-library" data-library aria-label="Add from case" hidden>
        <header><h2>Add from case</h2><button class="es-wb-icon-button" type="button" data-action="close-library" aria-label="Close">${svgIcon("close")}</button></header>
        <p class="es-wb-drawer-lede">Drag onto the board, or press Add.</p>
        <div class="es-wb-tabs" role="tablist" aria-label="Case items">
          <button role="tab" type="button" data-lib-tab="evidence" aria-selected="true">Evidence</button>
          <button role="tab" type="button" data-lib-tab="person" aria-selected="false" tabindex="-1">People</button>
          <button role="tab" type="button" data-lib-tab="date" aria-selected="false" tabindex="-1">Dates</button>
          <button role="tab" type="button" data-lib-tab="question" aria-selected="false" tabindex="-1">Questions</button>
        </div>
        <div class="es-wb-library-list" data-library-list role="tabpanel"></div>
      </aside>

      <dialog class="es-wb-dialog" data-template-dialog aria-labelledby="wb-template-title">
        <form method="dialog">
          <header><h2 id="wb-template-title">New board</h2><button class="es-wb-icon-button" value="cancel" aria-label="Close">${svgIcon("close")}</button></header>
          <label class="es-wb-field"><span>Board name</span><input name="name" maxlength="80" placeholder="Untitled board" autocomplete="off"></label>
          <fieldset class="es-wb-templates"><legend>Start with</legend>
            ${TEMPLATES.map((template, index) => `<label class="es-wb-template"><input type="radio" name="template" value="${template.id}" ${index === 1 ? "checked" : ""}><span class="es-wb-template-preview">${templatePreview(template.id)}</span><strong>${escapeHtml(template.name)}</strong><small>${escapeHtml(template.description)}</small></label>`).join("")}
          </fieldset>
          <footer><button class="es-button" value="cancel">Cancel</button><button class="es-button is-primary" value="create">Create board</button></footer>
        </form>
      </dialog>

      <dialog class="es-wb-dialog is-shortcuts" data-shortcuts-dialog aria-labelledby="wb-shortcuts-title">
        <form method="dialog">
          <header><h2 id="wb-shortcuts-title">Keyboard shortcuts</h2><button class="es-wb-icon-button" value="close" aria-label="Close">${svgIcon("close")}</button></header>
          <div class="es-wb-shortcuts">${shortcutsMarkup()}</div>
          <p class="es-wb-dialog-note">On a Mac, use ⌘ instead of Ctrl.</p>
        </form>
      </dialog>
    </section>`;
}

function shapeSvg(kind) {
  const body = kind === "ellipse"
    ? '<ellipse cx="50" cy="50" rx="49" ry="49"/>'
    : kind === "diamond"
      ? '<polygon points="50,1 99,50 50,99 1,50"/>'
      : '<rect x="1" y="1" width="98" height="98" rx="6"/>';
  return `<svg class="es-wb-shape-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;
}

const PORTS = '<span class="es-wb-port" data-port="n" aria-hidden="true"></span><span class="es-wb-port" data-port="e" aria-hidden="true"></span><span class="es-wb-port" data-port="s" aria-hidden="true"></span><span class="es-wb-port" data-port="w" aria-hidden="true"></span>';

function itemInner(item) {
  const text = escapeHtml(item.text || "");
  if (item.type === "note") return `<div class="es-wb-text" data-text>${text}</div>${PORTS}`;
  if (item.type === "text") return `<div class="es-wb-text" data-text>${text}</div>${PORTS}`;
  if (item.type === "shape") return `${shapeSvg(item.shape)}<div class="es-wb-text" data-text>${text}</div>${PORTS}`;
  if (item.type === "frame") return `<div class="es-wb-frame-title" data-text>${text || "Frame"}</div>`;
  if (item.type === "question") return `<span class="es-wb-q-mark" aria-hidden="true">?</span><div class="es-wb-text" data-text>${text}</div>${PORTS}`;
  const source = libraryLookup(item.type, item.ref);
  if (!source) return PORTS;
  if (item.type === "evidence") {
    const note = spaceLibraryFixture.evidenceNotes[source.id] || "";
    return `<div class="es-wb-ev-meta"><span class="es-wb-ev-kind">${escapeHtml(source.kind)}</span><span>${escapeHtml(source.id)} · ${escapeHtml(source.date)}</span><span class="es-wb-ev-state" data-tone="${escapeHtml(source.tone)}">${escapeHtml(source.state)}</span></div><strong>${escapeHtml(source.title)}</strong><p>${escapeHtml(note)}</p>${PORTS}`;
  }
  if (item.type === "person") return `<span class="es-wb-avatar" aria-hidden="true">${escapeHtml(source.initials)}</span><span><strong>${escapeHtml(source.name)}</strong><small>${escapeHtml(source.role)}</small></span>${PORTS}`;
  if (item.type === "date") return `<span class="es-wb-date-day">${escapeHtml(source.date)}</span><span class="es-wb-date-label">${escapeHtml(source.label)}</span>${PORTS}`;
  return PORTS;
}

function itemLabel(item) {
  const source = item.ref ? libraryLookup(item.type, item.ref) : null;
  const detail = item.type === "evidence" && source ? `${source.id} ${source.title}, ${source.state}`
    : item.type === "person" && source ? `${source.name}, ${source.role}`
      : item.type === "date" && source ? `${source.date}, ${source.label}`
        : (item.text || "").trim().slice(0, 120) || "empty";
  return `${TYPE_NAMES[item.type]}: ${detail}`;
}

function itemTone(item) {
  if (item.type === "evidence") return libraryLookup("evidence", item.ref)?.tone || "neutral";
  if (item.type === "date") return libraryLookup("date", item.ref)?.tone || "neutral";
  return "";
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;

export function mountPage({ root, location, announce, toast }) {
  const space = root.querySelector("[data-space-root]");
  if (!space) return undefined;
  const $ = (selector) => space.querySelector(selector);
  const viewport = $("[data-viewport]");
  const world = $("[data-world]");
  const framesLayer = $("[data-frames]");
  const itemsLayer = $("[data-items]");
  const labelsLayer = $("[data-labels]");
  const linksSvg = $("[data-links]");
  const inkSvg = $("[data-ink]");
  const selectionBox = $("[data-selection]");
  const marquee = $("[data-marquee]");
  const contextBar = $("[data-context]");
  const toolOptions = $("[data-tool-options]");
  const hint = $("[data-hint]");
  const emptyState = $("[data-empty]");
  const boardTitle = $("[data-board-title]");
  const boardMenu = $("[data-board-menu]");
  const saveStatus = $("[data-save-status]");
  const library = $("[data-library]");
  const libraryList = $("[data-library-list]");
  const minimap = $("[data-minimap]");
  const templateDialog = $("[data-template-dialog]");
  const shortcutsDialog = $("[data-shortcuts-dialog]");
  const zoomLabel = $("[data-zoom-label]");
  const suggestCount = $("[data-suggest-count]");
  const caseId = location.caseId;
  const key = storageKey(caseId);
  const cleanups = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  /* ---------- state ---------- */
  let storageAvailable = true;
  function load() {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? sanitizeWorkspace(JSON.parse(raw)) : null;
    } catch {
      storageAvailable = false;
      return null;
    }
  }
  let workspace = load() || defaultWorkspace();
  let board = workspace.boards.find((entry) => entry.id === workspace.activeId) || workspace.boards[0];
  let view = { x: 0, y: 0, zoom: 1 };
  let tool = "select";
  const toolSettings = { noteColor: "yellow", shape: "rect", inkColor: "ink", highlightColor: "amber" };
  let selected = new Set();
  let editing = null;
  let undoStack = [];
  let redoStack = [];
  let suggestionsOn = false;
  const dismissed = new Set();
  let clipboard = null;
  let spaceHeld = false;
  let drag = null;
  let libraryTab = "evidence";
  let saveTimer;
  let viewSaveTimer;
  let frameRequest = 0;
  let deleteArmed = false;
  const itemElements = new Map();
  const pointers = new Map();
  let pinch = null;
  let pasteOffset = 0;

  const findItem = (id) => board.items.find((item) => item.id === id);
  const findLink = (id) => board.links.find((link) => link.id === id);
  const findStroke = (id) => board.strokes.find((stroke) => stroke.id === id);
  const kindOf = (id) => (findItem(id) ? "item" : findLink(id) ? "link" : findStroke(id) ? "stroke" : null);
  const selectedItems = () => board.items.filter((item) => selected.has(item.id));

  /* ---------- persistence & history ---------- */
  function setSaveStatus(state) {
    saveStatus.dataset.state = state;
    saveStatus.textContent = state === "saving" ? "Saving…" : state === "failed" ? "Not saved · browser storage is unavailable" : "Saved in this browser";
  }
  function writeNow() {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    board.view = { ...view };
    workspace.activeId = board.id;
    try {
      window.localStorage.setItem(key, JSON.stringify(workspace));
      storageAvailable = true;
      setSaveStatus("saved");
    } catch {
      storageAvailable = false;
      setSaveStatus("failed");
    }
  }
  function save() {
    setSaveStatus("saving");
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(writeNow, 350);
  }
  function saveViewSoon() {
    clearTimeout(viewSaveTimer);
    viewSaveTimer = window.setTimeout(() => { if (!saveTimer) writeNow(); }, 800);
  }
  const snapshot = () => JSON.stringify({ items: board.items, links: board.links, strokes: board.strokes });
  function restore(serialized) {
    const data = JSON.parse(serialized);
    board.items = data.items;
    board.links = data.links;
    board.strokes = data.strokes;
    selected = new Set([...selected].filter((id) => kindOf(id)));
  }
  function pushUndo(before) {
    undoStack.push(before);
    if (undoStack.length > 150) undoStack.shift();
    redoStack = [];
  }
  function mutate(change, { message } = {}) {
    const before = snapshot();
    change();
    if (snapshot() === before) return false;
    pushUndo(before);
    render();
    save();
    if (message) announce(message);
    return true;
  }
  function undo() {
    if (!undoStack.length) return;
    finishEdit();
    redoStack.push(snapshot());
    restore(undoStack.pop());
    render();
    save();
    announce("Undone.");
  }
  function redo() {
    if (!redoStack.length) return;
    finishEdit();
    undoStack.push(snapshot());
    restore(redoStack.pop());
    render();
    save();
    announce("Redone.");
  }

  /* ---------- view ---------- */
  const rect = () => viewport.getBoundingClientRect();
  function toWorld(clientX, clientY) {
    const box = rect();
    return [(clientX - box.left - view.x) / view.zoom, (clientY - box.top - view.y) / view.zoom];
  }
  function toScreen(x, y) {
    return [x * view.zoom + view.x, y * view.zoom + view.y];
  }
  function applyView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
    space.style.setProperty("--wb-zoom", view.zoom);
    space.style.setProperty("--wb-inv", 1 / view.zoom);
    const grid = 24 * view.zoom;
    const visibleGrid = grid < 9 ? grid * 4 : grid;
    viewport.style.backgroundSize = `${visibleGrid}px ${visibleGrid}px`;
    viewport.style.backgroundPosition = `${view.x}px ${view.y}px`;
    zoomLabel.textContent = `${Math.round(view.zoom * 100)}%`;
    positionContext();
    scheduleMinimap();
    saveViewSoon();
  }
  function zoomAt(nextZoom, clientX, clientY) {
    cancelAnimationFrame(frameRequest);
    const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const box = rect();
    const sx = (clientX ?? box.left + box.width / 2) - box.left;
    const sy = (clientY ?? box.top + box.height / 2) - box.top;
    const wx = (sx - view.x) / view.zoom;
    const wy = (sy - view.y) / view.zoom;
    view = { zoom, x: sx - wx * zoom, y: sy - wy * zoom };
    applyView();
  }
  function fitTo(bounds, { maxZoom = 1, animate = true } = {}) {
    const box = rect();
    if (!bounds || !box.width) {
      view = { x: box.width / 2, y: box.height / 2, zoom: 1 };
      applyView();
      return;
    }
    const narrow = box.width < 720;
    const padX = narrow ? 24 : 96;
    const padTop = narrow ? 76 : 84;
    const padBottom = narrow ? 120 : 84;
    const zoom = clamp(Math.min((box.width - padX * 2) / Math.max(bounds.w, 1), (box.height - padTop - padBottom) / Math.max(bounds.h, 1), maxZoom), MIN_ZOOM, MAX_ZOOM);
    const target = {
      zoom,
      x: box.width / 2 - (bounds.x + bounds.w / 2) * zoom,
      y: padTop + (box.height - padTop - padBottom) / 2 - (bounds.y + bounds.h / 2) * zoom,
    };
    animateView(target, animate);
  }
  function animateView(target, animate = true) {
    cancelAnimationFrame(frameRequest);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) {
      view = target;
      applyView();
      return;
    }
    const start = { ...view };
    const began = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - began) / 260);
      const ease = 1 - (1 - t) ** 3;
      view = { x: start.x + (target.x - start.x) * ease, y: start.y + (target.y - start.y) * ease, zoom: start.zoom + (target.zoom - start.zoom) * ease };
      applyView();
      if (t < 1) frameRequest = requestAnimationFrame(step);
    };
    frameRequest = requestAnimationFrame(step);
  }
  function fitAll(animate = true, { initial = false } = {}) {
    const bounds = boundsOf(board);
    const box = rect();
    if (initial && bounds && box.width < 720) {
      // On small screens a whole-board fit is unreadable; start at a legible zoom on the board's centre.
      const focus = board.items.find((item) => item.type === "question") || null;
      const centre = focus ? [focus.x + focus.w / 2, focus.y + focus.h / 2] : [bounds.x + bounds.w / 2, bounds.y + bounds.h / 2];
      const zoom = 0.6;
      animateView({ zoom, x: box.width / 2 - centre[0] * zoom, y: (box.height - 50) / 2 - centre[1] * zoom }, false);
      return;
    }
    fitTo(bounds, { animate });
  }
  function viewportCentre() {
    const box = rect();
    return toWorld(box.left + box.width / 2, box.top + box.height / 2);
  }

  /* ---------- rendering ---------- */
  function renderItems() {
    const seen = new Set();
    board.items.forEach((item, index) => {
      seen.add(item.id);
      let element = itemElements.get(item.id);
      const layer = item.type === "frame" ? framesLayer : itemsLayer;
      if (!element) {
        element = document.createElement("div");
        element.className = "es-wb-item";
        element.dataset.itemId = item.id;
        element.tabIndex = 0;
        itemElements.set(item.id, element);
      }
      if (element.parentElement !== layer) layer.append(element);
      const signature = `${item.type}|${item.shape || ""}|${item.ref || ""}|${item.text}`;
      if (element.dataset.signature !== signature && editing?.id !== item.id) {
        element.innerHTML = itemInner(item);
        element.dataset.signature = signature;
      }
      element.dataset.type = item.type;
      if (item.color) element.dataset.color = item.color; else delete element.dataset.color;
      if (item.shape) element.dataset.shape = item.shape;
      const tone = itemTone(item);
      if (tone) element.dataset.tone = tone; else delete element.dataset.tone;
      element.style.left = `${item.x}px`;
      element.style.top = `${item.y}px`;
      element.style.width = `${item.w}px`;
      element.style.height = `${item.h}px`;
      element.style.zIndex = String(index + 1);
      element.classList.toggle("is-selected", selected.has(item.id) && selected.size > 1);
      element.classList.toggle("is-empty", EDITABLE.has(item.type) && !item.text && item.type !== "frame");
      element.setAttribute("aria-label", itemLabel(item));
      element.setAttribute("aria-selected", selected.has(item.id) ? "true" : "false");
    });
    for (const [id, element] of itemElements) {
      if (!seen.has(id)) {
        element.remove();
        itemElements.delete(id);
      }
    }
  }

  function arrowHead([ax, ay], [bx, by], size = 10) {
    const angle = Math.atan2(by - ay, bx - ax);
    const left = [bx - size * Math.cos(angle - 0.45), by - size * Math.sin(angle - 0.45)];
    const right = [bx - size * Math.cos(angle + 0.45), by - size * Math.sin(angle + 0.45)];
    return `M${left[0]} ${left[1]} L${bx} ${by} L${right[0]} ${right[1]}`;
  }

  function linkGeometry(from, to) {
    const [start, end] = linkEndpoints(from, to);
    const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    return { start, end, mid, d: `M${start[0]} ${start[1]} L${end[0]} ${end[1]}`, head: arrowHead(start, end) };
  }

  function renderLinks() {
    const byId = new Map(board.items.map((item) => [item.id, item]));
    let paths = "";
    let labels = "";
    for (const link of board.links) {
      const from = byId.get(link.from);
      const to = byId.get(link.to);
      if (!from || !to) continue;
      const g = linkGeometry(from, to);
      const isSelected = selected.has(link.id);
      paths += `<g class="es-wb-link ${isSelected ? "is-selected" : ""}" data-kind="${link.kind}" data-link-id="${link.id}"><path class="es-wb-link-hit" d="${g.d}"/><path class="es-wb-link-line" d="${g.d}"/><path class="es-wb-link-head" d="${g.head}"/></g>`;
      const text = link.label || LINK_LABELS[link.kind];
      const isEditingLabel = editing?.linkId === link.id;
      if (!isEditingLabel && (link.label || link.kind !== "related" || isSelected)) {
        labels += `<span class="es-wb-link-label ${isSelected ? "is-selected" : ""}" data-kind="${link.kind}" data-link-label="${link.id}" style="left:${g.mid[0]}px;top:${g.mid[1]}px">${escapeHtml(text)}</span>`;
      }
    }
    if (suggestionsOn) {
      for (const suggestion of pendingSuggestions(board, dismissed)) {
        const g = linkGeometry(suggestion.fromItem, suggestion.toItem);
        paths += `<g class="es-wb-link is-suggested"><path class="es-wb-link-line" d="${g.d}"/><path class="es-wb-link-head" d="${g.head}"/></g>`;
        labels += `<span class="es-wb-suggestion" style="left:${g.mid[0]}px;top:${g.mid[1]}px" data-suggestion="${escapeHtml(suggestion.key)}" title="${escapeHtml(suggestion.reason)}"><span class="es-wb-suggestion-text"><b>Suggested</b><small>${escapeHtml(LINK_LABELS[suggestion.kind])} · ${escapeHtml(suggestion.reason)}</small></span><button type="button" data-action="accept-suggestion" aria-label="Add suggested link">${svgIcon("check")}</button><button type="button" data-action="dismiss-suggestion" aria-label="Dismiss suggestion">${svgIcon("close")}</button></span>`;
      }
    }
    if (drag?.type === "connect" && drag.point) {
      const source = byId.get(drag.from);
      const target = drag.target ? byId.get(drag.target) : null;
      const end = target ? linkEndpoints(source, target)[1] : drag.point;
      const start = clipToBox(source, end[0], end[1]);
      paths += `<g class="es-wb-link is-draft"><path class="es-wb-link-line" d="M${start[0]} ${start[1]} L${end[0]} ${end[1]}"/><path class="es-wb-link-head" d="${arrowHead(start, end)}"/></g>`;
    }
    linksSvg.innerHTML = paths;
    labelsLayer.innerHTML = labels;
    if (editing?.linkId) labelsLayer.append(editing.element);
    const count = pendingSuggestions(board, dismissed).length;
    suggestCount.hidden = count === 0;
    suggestCount.textContent = String(count);
  }

  function renderInk() {
    let markup = "";
    for (const stroke of board.strokes) {
      markup += `<path class="es-wb-stroke ${stroke.highlighter ? "is-highlighter" : ""} ${selected.has(stroke.id) ? "is-selected" : ""}" data-stroke-id="${stroke.id}" data-color="${stroke.color}" stroke-width="${stroke.size}" d="${strokePath(stroke.points)}"/>`;
    }
    if (drag?.type === "draw" && drag.points.length > 1) {
      markup += `<path class="es-wb-stroke ${drag.highlighter ? "is-highlighter" : ""}" data-color="${drag.color}" stroke-width="${drag.size}" d="${strokePath(drag.points)}"/>`;
    }
    inkSvg.innerHTML = markup;
  }

  function selectionBounds() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of selected) {
      const item = findItem(id);
      if (item) {
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + item.w);
        maxY = Math.max(maxY, item.y + item.h);
        continue;
      }
      const stroke = findStroke(id);
      if (stroke) {
        for (const [x, y] of stroke.points) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        continue;
      }
      const link = findLink(id);
      if (link) {
        const from = findItem(link.from);
        const to = findItem(link.to);
        if (from && to) {
          const { mid } = linkGeometry(from, to);
          minX = Math.min(minX, mid[0] - 20);
          maxX = Math.max(maxX, mid[0] + 20);
          minY = Math.min(minY, mid[1] - 14);
          maxY = Math.max(maxY, mid[1] + 14);
        }
      }
    }
    return Number.isFinite(minX) ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null;
  }

  function renderSelection() {
    const items = selectedItems();
    const strokesSelected = [...selected].some((id) => findStroke(id));
    const bounds = selectionBounds();
    const showBox = bounds && (items.length > 1 || strokesSelected || items.length === 1);
    selectionBox.hidden = !showBox || Boolean(editing);
    if (!showBox) return;
    const pad = 4 / view.zoom;
    selectionBox.style.left = `${bounds.x - pad}px`;
    selectionBox.style.top = `${bounds.y - pad}px`;
    selectionBox.style.width = `${bounds.w + pad * 2}px`;
    selectionBox.style.height = `${bounds.h + pad * 2}px`;
    const resizable = items.length === 1 && selected.size === 1;
    selectionBox.innerHTML = resizable
      ? ["nw", "ne", "sw", "se"].map((corner) => `<span class="es-wb-handle" data-handle="${corner}"></span>`).join("")
      : "";
  }

  function swatches(colors, current, action) {
    return colors.map((color) => `<button type="button" class="es-wb-swatch" data-action="${action}" data-value="${color}" data-color="${color}" aria-pressed="${color === current}" aria-label="${COLOR_NAMES[color]}"></button>`).join("");
  }

  function contextMarkup() {
    if (editing || !selected.size || drag) return "";
    const ids = [...selected];
    const items = selectedItems();
    const links = ids.map(findLink).filter(Boolean);
    const strokes = ids.map(findStroke).filter(Boolean);
    const parts = [];
    const sep = '<span class="es-wb-sep" aria-hidden="true"></span>';
    if (links.length === 1 && ids.length === 1) {
      const link = links[0];
      parts.push(`<div class="es-wb-segment" role="group" aria-label="Relationship">${LINK_KINDS.map((kind) => `<button type="button" data-action="link-kind" data-value="${kind}" data-kind="${kind}" aria-pressed="${link.kind === kind}">${LINK_LABELS[kind]}</button>`).join("")}</div>`);
      parts.push(sep);
      parts.push(`<button class="es-wb-icon-button" type="button" data-action="link-label" aria-label="Edit label" data-tip="Edit label">${svgIcon("label")}</button>`);
      parts.push(`<button class="es-wb-icon-button" type="button" data-action="link-reverse" aria-label="Reverse direction" data-tip="Reverse">${svgIcon("swap")}</button>`);
    } else if (strokes.length && !items.length && !links.length) {
      const color = strokes[0].color;
      parts.push(swatches(INK_COLORS, color, "ink-color"));
    } else if (items.length) {
      const colorable = items.filter((item) => item.color);
      if (colorable.length) parts.push(swatches(NOTE_COLORS, colorable[0].color, "item-color"));
      if (items.length === 1 && items[0].type === "shape") {
        parts.push(sep);
        parts.push(`<div class="es-wb-segment" role="group" aria-label="Shape">${SHAPE_KINDS.map((kind) => `<button type="button" class="is-icon" data-action="shape-kind" data-value="${kind}" aria-pressed="${items[0].shape === kind}" aria-label="${kind === "rect" ? "Rectangle" : kind === "ellipse" ? "Ellipse" : "Diamond"}">${svgIcon(kind)}</button>`).join("")}</div>`);
      }
      if (items.length === 1 && items[0].type === "evidence" && items[0].ref === "E-04") {
        if (parts.length) parts.push(sep);
        parts.push(`<a class="es-wb-text-button" data-route-link href="${buildShellHref("space", caseId, { contextId: "E-04" })}">${svgIcon("info")}<span>Details</span></a>`);
        parts.push(`<a class="es-wb-text-button" data-route-link href="${buildShellHref("evidence", caseId, { evidenceId: "E-04" })}">${svgIcon("open")}<span>Open source</span></a>`);
      }
      if (items.length === 1 && EDITABLE.has(items[0].type)) {
        if (parts.length) parts.push(sep);
        parts.push(`<button class="es-wb-icon-button" type="button" data-action="edit" aria-label="Edit text" data-tip="Edit · Enter">${svgIcon("rename")}</button>`);
      }
      if (items.length > 1) {
        if (parts.length) parts.push(sep);
        parts.push(`<button class="es-wb-text-button" type="button" data-action="wrap-frame">${svgIcon("frame")}<span>Frame</span></button>`);
      }
      if (parts.length) parts.push(sep);
      parts.push(`<button class="es-wb-icon-button" type="button" data-action="front" aria-label="Bring to front" data-tip="Bring to front">${svgIcon("front")}</button>`);
      parts.push(`<button class="es-wb-icon-button" type="button" data-action="back" aria-label="Send to back" data-tip="Send to back">${svgIcon("back")}</button>`);
      parts.push(`<button class="es-wb-icon-button" type="button" data-action="duplicate" aria-label="Duplicate" data-tip="Duplicate · Ctrl D">${svgIcon("copy")}</button>`);
    }
    if (parts.length) parts.push(sep);
    parts.push(`<button class="es-wb-icon-button is-danger" type="button" data-action="delete" aria-label="Delete" data-tip="Delete">${svgIcon("trash")}</button>`);
    return parts.join("");
  }

  function renderContext() {
    const markup = contextMarkup();
    contextBar.hidden = !markup;
    if (contextBar.dataset.markup !== markup) {
      const focused = contextBar.contains(document.activeElement) ? document.activeElement.dataset.action : null;
      contextBar.innerHTML = markup;
      contextBar.dataset.markup = markup;
      if (focused) contextBar.querySelector(`[data-action="${focused}"]`)?.focus();
    }
    positionContext();
  }

  function positionContext() {
    if (contextBar.hidden) return;
    const bounds = selectionBounds();
    if (!bounds) return;
    const [left, top] = toScreen(bounds.x, bounds.y);
    const [right, bottom] = toScreen(bounds.x + bounds.w, bounds.y + bounds.h);
    const box = rect();
    const width = contextBar.offsetWidth;
    const height = contextBar.offsetHeight;
    let x = (left + right) / 2 - width / 2;
    let y = top - height - 14;
    if (y < 64) y = bottom + 14;
    if (y + height > box.height - 64) y = Math.max(64, top + 12);
    x = clamp(x, 12, Math.max(12, box.width - width - 12));
    contextBar.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  let minimapQueued = false;
  function scheduleMinimap() {
    if (minimapQueued) return;
    minimapQueued = true;
    requestAnimationFrame(() => {
      minimapQueued = false;
      drawMinimap();
    });
  }
  let minimapTransform = null;
  function drawMinimap() {
    const context = minimap.getContext?.("2d");
    if (!context || minimap.offsetParent === null) return;
    const ratio = window.devicePixelRatio || 1;
    const width = minimap.clientWidth;
    const height = minimap.clientHeight;
    if (minimap.width !== Math.round(width * ratio)) {
      minimap.width = Math.round(width * ratio);
      minimap.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const box = rect();
    const visible = { x: -view.x / view.zoom, y: -view.y / view.zoom, w: box.width / view.zoom, h: box.height / view.zoom };
    const content = boundsOf(board);
    const all = content
      ? { x: Math.min(content.x, visible.x), y: Math.min(content.y, visible.y), w: 0, h: 0 }
      : { ...visible };
    if (content) {
      all.w = Math.max(content.x + content.w, visible.x + visible.w) - all.x;
      all.h = Math.max(content.y + content.h, visible.y + visible.h) - all.y;
    }
    const pad = 8;
    const scale = Math.min((width - pad * 2) / all.w, (height - pad * 2) / all.h);
    const ox = pad + (width - pad * 2 - all.w * scale) / 2 - all.x * scale;
    const oy = pad + (height - pad * 2 - all.h * scale) / 2 - all.y * scale;
    minimapTransform = { scale, ox, oy };
    const styles = getComputedStyle(space);
    for (const item of board.items) {
      context.fillStyle = item.type === "frame" ? styles.getPropertyValue("--wb-mini-frame") : item.type === "note" ? styles.getPropertyValue("--wb-mini-note") : styles.getPropertyValue("--wb-mini-item");
      context.fillRect(ox + item.x * scale, oy + item.y * scale, Math.max(2, item.w * scale), Math.max(2, item.h * scale));
    }
    context.strokeStyle = styles.getPropertyValue("--wb-mini-view");
    context.lineWidth = 1.5;
    context.strokeRect(ox + visible.x * scale, oy + visible.y * scale, visible.w * scale, visible.h * scale);
  }

  function renderLibrary() {
    const onBoard = new Map(board.items.filter((item) => item.ref).map((item) => [`${item.type}:${item.ref}`, item]));
    const entries = libraryTab === "evidence"
      ? evidenceFixture.map((source) => ({ ref: source.id, title: source.title, meta: `${source.id} · ${source.kind} · ${source.date}`, tone: source.tone, state: source.state }))
      : libraryTab === "person"
        ? spaceLibraryFixture.people.map((person) => ({ ref: person.id, title: person.name, meta: person.role, initials: person.initials }))
        : libraryTab === "date"
          ? spaceLibraryFixture.dates.map((date) => ({ ref: date.id, title: date.label, meta: date.date, tone: date.tone }))
          : spaceLibraryFixture.questions.map((question) => ({ ref: question.id, title: question.text, meta: question.id }));
    const rows = entries.map((entry) => {
      const placed = onBoard.get(`${libraryTab}:${entry.ref}`);
      return `<div class="es-wb-lib-item" draggable="true" data-lib-type="${libraryTab}" data-lib-ref="${entry.ref}" ${entry.tone ? `data-tone="${entry.tone}"` : ""}>
        ${entry.initials ? `<span class="es-wb-avatar" aria-hidden="true">${escapeHtml(entry.initials)}</span>` : `<span class="es-wb-lib-dot" aria-hidden="true"></span>`}
        <span class="es-wb-lib-copy"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.meta)}${entry.state ? ` · ${escapeHtml(entry.state)}` : ""}</small></span>
        ${placed ? `<button class="es-wb-lib-button is-placed" type="button" data-action="find-item" data-value="${placed.id}" aria-label="Show ${escapeHtml(entry.title)} on the board">On board</button>` : `<button class="es-wb-lib-button" type="button" data-action="add-library" aria-label="Add ${escapeHtml(entry.title)}">Add</button>`}
      </div>`;
    }).join("");
    const form = libraryTab === "question"
      ? `<form class="es-wb-lib-form" data-question-form><label class="es-sr-only" for="wb-new-question">New question</label><input id="wb-new-question" name="question" maxlength="200" placeholder="Write a new question" autocomplete="off"><button class="es-button" type="submit">Add</button></form>`
      : "";
    libraryList.innerHTML = `${form}${rows}`;
    space.querySelectorAll("[data-lib-tab]").forEach((tab) => {
      const active = tab.dataset.libTab === libraryTab;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  function renderChrome() {
    boardTitle.textContent = board.name;
    space.dataset.tool = tool;
    space.querySelectorAll("[data-tool]").forEach((button) => {
      if (button === space) return;
      button.setAttribute("aria-pressed", String(button.dataset.tool === tool));
    });
    $('[data-action="undo"]').disabled = !undoStack.length;
    $('[data-action="redo"]').disabled = !redoStack.length;
    $('[data-action="suggest"]').setAttribute("aria-pressed", String(suggestionsOn));
    emptyState.hidden = Boolean(board.items.length || board.strokes.length);
    hint.textContent = TOOL_HINTS[tool];
    renderToolOptions();
  }

  function renderToolOptions() {
    let markup = "";
    if (tool === "note") markup = swatches(NOTE_COLORS, toolSettings.noteColor, "tool-note-color");
    if (tool === "shape") markup = SHAPE_KINDS.map((kind) => `<button type="button" class="es-wb-icon-button" data-action="tool-shape" data-value="${kind}" aria-pressed="${toolSettings.shape === kind}" aria-label="${kind === "rect" ? "Rectangle" : kind === "ellipse" ? "Ellipse" : "Diamond"}">${svgIcon(kind)}</button>`).join("");
    if (tool === "pen") markup = swatches(INK_COLORS, toolSettings.inkColor, "tool-ink-color");
    if (tool === "highlighter") markup = swatches(["amber", "green", "blue", "red", "violet"], toolSettings.highlightColor, "tool-highlight-color");
    toolOptions.hidden = !markup;
    toolOptions.innerHTML = markup;
    if (markup) {
      const button = space.querySelector(`.es-wb-toolbar [data-tool="${tool}"]`);
      const toolbarBox = button.closest(".es-wb-toolbar").getBoundingClientRect();
      const box = space.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      const vertical = toolbarBox.height > toolbarBox.width;
      toolOptions.dataset.orientation = vertical ? "column" : "row";
      toolOptions.style.transform = vertical
        ? `translate(${Math.round(toolbarBox.right - box.left + 8)}px, ${Math.round(buttonBox.top - box.top - 4)}px)`
        : `translate(${Math.round(clamp(buttonBox.left - box.left - 40, 8, box.width - 260))}px, ${Math.round(toolbarBox.top - box.top - 52)}px)`;
    }
  }

  function render() {
    renderItems();
    renderLinks();
    renderInk();
    renderSelection();
    renderContext();
    renderChrome();
    if (!library.hidden) renderLibrary();
    scheduleMinimap();
  }

  /* ---------- actions ---------- */
  function select(ids, { additive = false } = {}) {
    if (!additive) selected = new Set();
    for (const id of ids) {
      if (additive && selected.has(id)) selected.delete(id);
      else selected.add(id);
    }
    render();
  }
  function clearSelection() {
    if (!selected.size) return;
    selected = new Set();
    render();
  }
  function setTool(next) {
    if (!TOOLS.some((entry) => entry.id === next)) return;
    finishEdit();
    tool = next;
    if (tool !== "select") selected = new Set();
    render();
  }

  function createItem(type, x, y, extra = {}) {
    const [w, h] = DEFAULT_SIZES[type];
    const item = { id: makeId("i"), type, x: Math.round(x - (extra.w || w) / 2), y: Math.round(y - (extra.h || h) / 2), w, h, text: "", ...extra };
    if (type === "note") item.color = extra.color || toolSettings.noteColor;
    if (type === "shape") {
      item.shape = extra.shape || toolSettings.shape;
      item.color = extra.color || "white";
    }
    if (type === "frame") item.color = extra.color || "white";
    return item;
  }

  function addItems(items, { message, edit = false } = {}) {
    mutate(() => {
      for (const item of items) {
        if (item.type === "frame") board.items.unshift(item);
        else board.items.push(item);
      }
      selected = new Set(items.map((item) => item.id));
    }, { message });
    if (edit && items.length === 1) startEdit(items[0].id, { selectAll: false });
  }

  function addFromLibrary(type, ref, x, y) {
    const source = libraryLookup(type, ref);
    if (!source) return;
    const [cx, cy] = x === undefined ? nextDropPoint(type) : [x, y];
    const item = createItem(type, cx, cy, { ref, text: type === "question" ? source.text : "" });
    addItems([item], { message: `${TYPE_NAMES[type]} added to the board.` });
  }

  function nextDropPoint(type = "note") {
    const [cx, cy] = viewportCentre();
    const [w, h] = DEFAULT_SIZES[type];
    const margin = 20;
    const blockers = board.items.filter((item) => item.type !== "frame");
    const free = (x, y) => blockers.every((item) => x - w / 2 - margin > item.x + item.w || x + w / 2 + margin < item.x || y - h / 2 - margin > item.y + item.h || y + h / 2 + margin < item.y);
    for (let ring = 0; ring < 24; ring += 1) {
      const steps = ring === 0 ? 1 : 8 + ring * 4;
      for (let step = 0; step < steps; step += 1) {
        const angle = (step / steps) * Math.PI * 2;
        const x = cx + Math.cos(angle) * ring * 60;
        const y = cy + Math.sin(angle) * ring * 45;
        if (free(x, y)) return [Math.round(x), Math.round(y)];
      }
    }
    pasteOffset = (pasteOffset + 1) % 6;
    return [cx + pasteOffset * 24, cy + pasteOffset * 24];
  }

  function deleteSelection() {
    if (!selected.size) return;
    const count = selected.size;
    mutate(() => {
      const removed = new Set(selected);
      board.items = board.items.filter((item) => !removed.has(item.id));
      board.strokes = board.strokes.filter((stroke) => !removed.has(stroke.id));
      board.links = board.links.filter((link) => !removed.has(link.id) && !removed.has(link.from) && !removed.has(link.to));
      selected = new Set();
    }, { message: `${count === 1 ? "1 thing" : `${count} things`} removed. Press Ctrl Z to undo.` });
    viewport.focus({ preventScroll: true });
  }

  function cloneSelection(offset = 24) {
    const items = selectedItems();
    const strokes = [...selected].map(findStroke).filter(Boolean);
    const idMap = new Map();
    const newItems = items.map((item) => {
      const copy = { ...item, id: makeId("i"), x: item.x + offset, y: item.y + offset };
      idMap.set(item.id, copy.id);
      return copy;
    });
    const newLinks = board.links
      .filter((link) => idMap.has(link.from) && idMap.has(link.to))
      .map((link) => ({ ...link, id: makeId("l"), from: idMap.get(link.from), to: idMap.get(link.to) }));
    const newStrokes = strokes.map((stroke) => ({ ...stroke, id: makeId("s"), points: stroke.points.map(([x, y]) => [x + offset, y + offset]) }));
    return { items: newItems, links: newLinks, strokes: newStrokes };
  }

  function insertClone(clone, message) {
    mutate(() => {
      board.items.push(...clone.items.filter((item) => item.type !== "frame"));
      board.items.unshift(...clone.items.filter((item) => item.type === "frame"));
      board.links.push(...clone.links);
      board.strokes.push(...clone.strokes);
      selected = new Set([...clone.items, ...clone.strokes].map((entry) => entry.id));
    }, { message });
  }

  function duplicateSelection() {
    if (![...selected].some((id) => kindOf(id) !== "link")) return;
    insertClone(cloneSelection(), "Duplicated.");
  }

  function reorder(toFront) {
    mutate(() => {
      const moving = board.items.filter((item) => selected.has(item.id));
      const rest = board.items.filter((item) => !selected.has(item.id));
      board.items = toFront ? [...rest, ...moving] : [...moving, ...rest];
    });
  }

  function wrapInFrame() {
    const items = selectedItems();
    if (!items.length) return;
    const bounds = selectionBounds();
    const pad = 32;
    const frame = { id: makeId("i"), type: "frame", x: Math.round(bounds.x - pad), y: Math.round(bounds.y - pad), w: Math.round(bounds.w + pad * 2), h: Math.round(bounds.h + pad * 2), text: "Frame", color: "white" };
    mutate(() => {
      board.items.unshift(frame);
      selected = new Set([frame.id]);
    }, { message: "Frame added around the selection." });
    startEdit(frame.id);
  }

  function createLink(fromId, toId) {
    if (fromId === toId) return null;
    const existing = board.links.find((link) => (link.from === fromId && link.to === toId) || (link.from === toId && link.to === fromId));
    if (existing) {
      select([existing.id]);
      announce("These are already connected.");
      return existing;
    }
    const from = findItem(fromId);
    const to = findItem(toId);
    const contrary = itemTone(from) === "contrary" || itemTone(to) === "contrary";
    const kind = contrary ? "contradicts" : to.type === "question" || from.type === "question" ? "supports" : "related";
    const link = { id: makeId("l"), from: fromId, to: toId, kind, label: "" };
    mutate(() => {
      board.links.push(link);
      selected = new Set([link.id]);
    }, { message: `Connected as ${LINK_LABELS[kind].toLowerCase()}. Change it in the toolbar.` });
    return link;
  }

  /* ---------- text editing ---------- */
  function startEdit(id, { selectAll = true } = {}) {
    const item = findItem(id);
    if (!item || !EDITABLE.has(item.type)) return;
    finishEdit();
    const element = itemElements.get(id);
    const field = element?.querySelector("[data-text]");
    if (!field) return;
    const before = snapshot();
    editing = { id, before, field };
    selected = new Set([id]);
    element.classList.add("is-editing");
    if (item.type === "frame" && !item.text) field.textContent = "";
    try {
      field.contentEditable = "plaintext-only";
    } catch {
      field.contentEditable = "true";
    }
    if (field.contentEditable !== "plaintext-only") field.contentEditable = "true";
    field.setAttribute("role", "textbox");
    field.setAttribute("aria-multiline", item.type === "frame" ? "false" : "true");
    field.setAttribute("aria-label", `${TYPE_NAMES[item.type]} text`);
    field.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(field);
    if (!selectAll) range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    renderSelection();
    renderContext();
  }

  function finishEdit({ cancel = false } = {}) {
    if (!editing) return;
    const current = editing;
    editing = null;
    if (current.linkId) {
      const link = findLink(current.linkId);
      const value = current.element.textContent.replace(/\s+/g, " ").trim().slice(0, 120);
      current.element.remove();
      if (link && !cancel) {
        const label = value === LINK_LABELS[link.kind] ? "" : value;
        mutate(() => { link.label = label; });
      }
      render();
      return;
    }
    const item = findItem(current.id);
    const element = itemElements.get(current.id);
    element?.classList.remove("is-editing");
    if (current.field) {
      current.field.removeAttribute("contenteditable");
      current.field.removeAttribute("role");
    }
    if (!item) return render();
    const value = cancel ? item.text : (current.field.innerText || "").replace(/\n$/, "").slice(0, 2000);
    const before = current.before;
    item.text = item.type === "frame" ? value.replace(/\s+/g, " ").trim() : value;
    if (item.type === "text" && current.field) item.h = Math.max(DEFAULT_SIZES.text[1], Math.ceil(current.field.scrollHeight));
    if (item.type === "text" && !item.text.trim()) {
      board.items = board.items.filter((entry) => entry.id !== item.id);
      board.links = board.links.filter((link) => link.from !== item.id && link.to !== item.id);
      selected.delete(item.id);
    }
    if (element) element.dataset.signature = "";
    if (snapshot() !== before) {
      pushUndo(before);
      save();
    }
    render();
    window.getSelection()?.removeAllRanges();
  }

  function editLinkLabel(id) {
    const link = findLink(id);
    if (!link) return;
    finishEdit();
    const from = findItem(link.from);
    const to = findItem(link.to);
    const { mid } = linkGeometry(from, to);
    const element = document.createElement("span");
    element.className = "es-wb-link-label is-editing";
    element.dataset.kind = link.kind;
    element.style.left = `${mid[0]}px`;
    element.style.top = `${mid[1]}px`;
    element.textContent = link.label || LINK_LABELS[link.kind];
    element.contentEditable = "true";
    element.setAttribute("role", "textbox");
    element.setAttribute("aria-label", "Connection label");
    editing = { linkId: id, element };
    renderLinks();
    renderContext();
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }

  /* ---------- boards ---------- */
  function switchBoard(id) {
    finishEdit();
    writeNow();
    const next = workspace.boards.find((entry) => entry.id === id);
    if (!next) return;
    board = next;
    workspace.activeId = id;
    selected = new Set();
    undoStack = [];
    redoStack = [];
    itemElements.forEach((element) => element.remove());
    itemElements.clear();
    render();
    if (board.view) {
      view = { ...board.view };
      applyView();
    } else {
      fitAll(false, { initial: true });
    }
    writeNow();
    announce(`Opened board ${board.name}.`);
  }

  function renderBoardMenu() {
    const rows = workspace.boards.map((entry) => `<button type="button" role="menuitemradio" aria-checked="${entry.id === board.id}" data-action="open-board" data-value="${entry.id}">${svgIcon("board")}<span>${escapeHtml(entry.name)}</span><small>${entry.items.length} items</small></button>`).join("");
    boardMenu.innerHTML = `<div class="es-wb-menu-group">${rows}</div>
      <div class="es-wb-menu-group">
        <button type="button" role="menuitem" data-action="new-board">${svgIcon("plus")}<span>New board…</span></button>
        <button type="button" role="menuitem" data-action="rename-board">${svgIcon("rename")}<span>Rename</span></button>
        <button type="button" role="menuitem" data-action="duplicate-board">${svgIcon("copy")}<span>Duplicate board</span></button>
        <button type="button" role="menuitem" class="is-danger" data-action="delete-board" ${workspace.boards.length < 2 ? "disabled" : ""}>${svgIcon("trash")}<span>${deleteArmed ? "Click again to delete" : "Delete board"}</span></button>
      </div>`;
  }
  function toggleBoardMenu(open = boardMenu.hidden) {
    deleteArmed = false;
    boardMenu.hidden = !open;
    $('[data-action="board-menu"]').setAttribute("aria-expanded", String(open));
    if (open) {
      renderBoardMenu();
      boardMenu.querySelector('[aria-checked="true"]')?.focus();
    }
  }

  function renameBoard() {
    toggleBoardMenu(false);
    boardTitle.contentEditable = "true";
    boardTitle.setAttribute("role", "textbox");
    boardTitle.setAttribute("aria-label", "Board name");
    boardTitle.focus();
    const range = document.createRange();
    range.selectNodeContents(boardTitle);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    const finish = (commit) => {
      boardTitle.removeAttribute("contenteditable");
      boardTitle.removeAttribute("role");
      boardTitle.removeAttribute("aria-label");
      boardTitle.removeEventListener("keydown", onKey);
      boardTitle.removeEventListener("blur", onBlur);
      const value = boardTitle.textContent.replace(/\s+/g, " ").trim().slice(0, 80);
      if (commit && value) {
        board.name = value;
        writeNow();
        announce(`Board renamed to ${value}.`);
      }
      boardTitle.textContent = board.name;
    };
    const onKey = (event) => {
      if (event.key === "Enter") { event.preventDefault(); finish(true); viewport.focus(); }
      if (event.key === "Escape") { event.preventDefault(); finish(false); viewport.focus(); }
      event.stopPropagation();
    };
    const onBlur = () => finish(true);
    boardTitle.addEventListener("keydown", onKey);
    boardTitle.addEventListener("blur", onBlur);
  }

  function duplicateBoard() {
    toggleBoardMenu(false);
    const copy = JSON.parse(JSON.stringify(board));
    const idMap = new Map();
    copy.id = makeId("b");
    copy.name = `${board.name} copy`.slice(0, 80);
    copy.items.forEach((item) => { const id = makeId("i"); idMap.set(item.id, id); item.id = id; });
    copy.links.forEach((link) => { link.id = makeId("l"); link.from = idMap.get(link.from); link.to = idMap.get(link.to); });
    copy.strokes.forEach((stroke) => { stroke.id = makeId("s"); });
    workspace.boards.push(copy);
    switchBoard(copy.id);
    toast("Board duplicated", `“${copy.name}” is ready.`);
  }

  function deleteBoard() {
    if (workspace.boards.length < 2) return;
    if (!deleteArmed) {
      deleteArmed = true;
      renderBoardMenu();
      boardMenu.querySelector('[data-action="delete-board"]')?.focus();
      return;
    }
    const name = board.name;
    workspace.boards = workspace.boards.filter((entry) => entry.id !== board.id);
    toggleBoardMenu(false);
    switchBoard(workspace.boards[0].id);
    toast("Board deleted", `“${name}” was removed from this browser.`);
  }

  function openTemplateDialog() {
    toggleBoardMenu(false);
    templateDialog.querySelector('input[name="name"]').value = "";
    templateDialog.showModal?.();
    if (!templateDialog.open) templateDialog.setAttribute("open", "");
    templateDialog.querySelector('input[name="template"]:checked')?.focus();
  }

  function createBoardFromDialog() {
    const form = templateDialog.querySelector("form");
    const data = new FormData(form);
    const templateId = String(data.get("template") || "blank");
    const name = String(data.get("name") || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const created = newBoard(templateId, { name: name || undefined });
    workspace.boards.push(created);
    switchBoard(created.id);
    toast("Board created", `“${created.name}” is saved in this browser.`);
  }

  /* ---------- pointer interactions ---------- */
  function itemAt(clientX, clientY, exclude) {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const element of stack) {
      const host = element.closest?.("[data-item-id]");
      if (host && space.contains(host) && host.dataset.itemId !== exclude) {
        if (host.dataset.type === "frame" && !element.closest(".es-wb-frame-title") && element === host) continue;
        return host.dataset.itemId;
      }
    }
    return null;
  }

  function startMove(event, [wx, wy]) {
    const moving = new Set(selectedItems().map((item) => item.id));
    for (const frame of selectedItems().filter((item) => item.type === "frame")) {
      for (const item of board.items) if (item.type !== "frame" && contains(frame, item)) moving.add(item.id);
    }
    const strokes = [...selected].map(findStroke).filter(Boolean);
    for (const frame of selectedItems().filter((item) => item.type === "frame")) {
      for (const stroke of board.strokes) {
        if (stroke.points.every(([x, y]) => x >= frame.x && y >= frame.y && x <= frame.x + frame.w && y <= frame.y + frame.h) && !strokes.includes(stroke)) strokes.push(stroke);
      }
    }
    drag = {
      type: "move",
      start: [wx, wy],
      before: snapshot(),
      moved: false,
      items: [...moving].map((id) => { const item = findItem(id); return { item, x: item.x, y: item.y }; }),
      strokes: strokes.map((stroke) => ({ stroke, points: stroke.points.map((point) => [...point]) })),
    };
  }

  function onPointerDown(event) {
    if (event.target.closest(".es-wb-suggestion, .es-wb-link-label.is-editing")) return;
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      drag = null;
      pinch = { distance: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom: view.zoom, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], view: { ...view } };
      render();
      return;
    }
    if (editing) {
      const inside = editing.field?.contains(event.target) || editing.element?.contains(event.target);
      if (inside) return;
      finishEdit();
    }
    toggleBoardMenu(false);
    const [wx, wy] = toWorld(event.clientX, event.clientY);
    viewport.setPointerCapture?.(event.pointerId);
    if (document.activeElement !== viewport && !itemElements.has(document.activeElement?.dataset?.itemId)) viewport.focus({ preventScroll: true });

    if (event.button === 1 || tool === "hand" || spaceHeld) {
      cancelAnimationFrame(frameRequest);
      drag = { type: "pan", client: [event.clientX, event.clientY], view: { ...view } };
      space.classList.add("is-panning");
      event.preventDefault();
      return;
    }
    if (event.button !== 0) return;
    const target = event.target;
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;

    if (tool === "pen" || tool === "highlighter") {
      const highlighter = tool === "highlighter";
      drag = { type: "draw", points: [[wx, wy]], highlighter, color: highlighter ? toolSettings.highlightColor : toolSettings.inkColor, size: highlighter ? 18 : 3 };
      return;
    }
    if (tool === "eraser") {
      drag = { type: "erase", before: snapshot() };
      eraseAt(wx, wy);
      return;
    }
    if (tool === "note" || tool === "text") {
      const item = createItem(tool, wx, wy);
      if (tool === "text") item.y = Math.round(wy - 20);
      addItems([item], { edit: true });
      tool = "select";
      render();
      return;
    }
    if (tool === "shape" || tool === "frame") {
      drag = { type: "create", kind: tool, start: [wx, wy], current: [wx, wy] };
      return;
    }
    if (tool === "connect") {
      const from = itemId && findItem(itemId)?.type !== "frame" ? itemId : null;
      if (from) drag = { type: "connect", from, point: [wx, wy], target: null };
      return;
    }

    // Select tool
    const port = target.closest("[data-port]");
    if (port && itemId) {
      drag = { type: "connect", from: itemId, point: [wx, wy], target: null };
      return;
    }
    const handle = target.closest("[data-handle]");
    if (handle) {
      const item = selectedItems()[0];
      drag = { type: "resize", corner: handle.dataset.handle, item, origin: { x: item.x, y: item.y, w: item.w, h: item.h }, start: [wx, wy], before: snapshot() };
      return;
    }
    const linkLabel = target.closest("[data-link-label]");
    const linkHit = target.closest("[data-link-id]");
    const linkId = linkLabel?.dataset.linkLabel || linkHit?.dataset.linkId;
    if (linkId) {
      select([linkId], { additive: event.shiftKey });
      return;
    }
    const strokeId = target.closest("[data-stroke-id]")?.dataset.strokeId;
    const hitId = itemId && (findItem(itemId)?.type !== "frame" || target.closest(".es-wb-frame-title") || event.altKey === false) ? itemId : null;
    const pickedId = strokeId || hitId;
    if (pickedId) {
      if (event.shiftKey) {
        select([pickedId], { additive: true });
        if (!selected.has(pickedId)) return;
      } else if (!selected.has(pickedId)) {
        select([pickedId]);
      }
      startMove(event, [wx, wy]);
      drag.clickId = pickedId;
      drag.shift = event.shiftKey;
      return;
    }
    if (!event.shiftKey) selected = new Set();
    drag = { type: "marquee", start: [wx, wy], base: new Set(selected) };
    render();
  }

  function eraseAt(wx, wy) {
    const tolerance = 8 / view.zoom;
    const hit = board.strokes.filter((stroke) => strokeHit(stroke, wx, wy, tolerance));
    if (!hit.length) return;
    const removed = new Set(hit.map((stroke) => stroke.id));
    board.strokes = board.strokes.filter((stroke) => !removed.has(stroke.id));
    renderInk();
    scheduleMinimap();
  }

  function onPointerMove(event) {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      view = { ...pinch.view, x: pinch.view.x + mid[0] - pinch.mid[0], y: pinch.view.y + mid[1] - pinch.mid[1] };
      zoomAt(pinch.zoom * (distance / pinch.distance), mid[0], mid[1]);
      return;
    }
    if (tool === "eraser") {
      const box = rect();
      space.style.setProperty("--wb-cursor-x", `${event.clientX - box.left}px`);
      space.style.setProperty("--wb-cursor-y", `${event.clientY - box.top}px`);
    }
    if (!drag) return;
    const [wx, wy] = toWorld(event.clientX, event.clientY);
    if (drag.type === "pan") {
      view = { ...drag.view, x: drag.view.x + event.clientX - drag.client[0], y: drag.view.y + event.clientY - drag.client[1] };
      applyView();
    } else if (drag.type === "move") {
      const dx = wx - drag.start[0];
      const dy = wy - drag.start[1];
      if (!drag.moved && Math.hypot(dx * view.zoom, dy * view.zoom) < 3) return;
      if (!drag.moved) {
        drag.moved = true;
        space.classList.add("is-dragging");
        contextBar.hidden = true;
      }
      for (const entry of drag.items) {
        entry.item.x = Math.round(entry.x + dx);
        entry.item.y = Math.round(entry.y + dy);
        const element = itemElements.get(entry.item.id);
        if (element) {
          element.style.left = `${entry.item.x}px`;
          element.style.top = `${entry.item.y}px`;
        }
      }
      for (const entry of drag.strokes) entry.stroke.points = entry.points.map(([x, y]) => [x + dx, y + dy]);
      if (drag.strokes.length) renderInk();
      renderLinks();
      renderSelection();
    } else if (drag.type === "resize") {
      const { origin, corner, item } = drag;
      const dx = wx - drag.start[0];
      const dy = wy - drag.start[1];
      const min = item.type === "frame" ? 120 : 40;
      let { x, y, w, h } = origin;
      if (corner.includes("e")) w = Math.max(min, origin.w + dx);
      if (corner.includes("s")) h = Math.max(min / 2, origin.h + dy);
      if (corner.includes("w")) { w = Math.max(min, origin.w - dx); x = origin.x + origin.w - w; }
      if (corner.includes("n")) { h = Math.max(min / 2, origin.h - dy); y = origin.y + origin.h - h; }
      if (event.shiftKey) {
        const ratio = origin.w / origin.h;
        if (w / h > ratio) w = h * ratio; else h = w / ratio;
        if (corner.includes("w")) x = origin.x + origin.w - w;
        if (corner.includes("n")) y = origin.y + origin.h - h;
      }
      Object.assign(item, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
      renderItems();
      renderLinks();
      renderSelection();
      contextBar.hidden = true;
    } else if (drag.type === "marquee") {
      const x = Math.min(drag.start[0], wx);
      const y = Math.min(drag.start[1], wy);
      const w = Math.abs(wx - drag.start[0]);
      const h = Math.abs(wy - drag.start[1]);
      drag.box = { x, y, w, h };
      marquee.hidden = false;
      Object.assign(marquee.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      const hits = board.items.filter((item) => (item.type === "frame" ? contains(drag.box, item) : item.x < x + w && item.x + item.w > x && item.y < y + h && item.y + item.h > y)).map((item) => item.id);
      const strokeHits = board.strokes.filter((stroke) => stroke.points.some(([px, py]) => px >= x && px <= x + w && py >= y && py <= y + h)).map((stroke) => stroke.id);
      selected = new Set([...drag.base, ...hits, ...strokeHits]);
      renderItems();
      renderInk();
    } else if (drag.type === "create") {
      drag.current = [wx, wy];
      const x = Math.min(drag.start[0], wx);
      const y = Math.min(drag.start[1], wy);
      marquee.hidden = false;
      marquee.classList.add("is-create");
      Object.assign(marquee.style, { left: `${x}px`, top: `${y}px`, width: `${Math.abs(wx - drag.start[0])}px`, height: `${Math.abs(wy - drag.start[1])}px` });
    } else if (drag.type === "connect") {
      drag.point = [wx, wy];
      const targetId = itemAt(event.clientX, event.clientY, drag.from);
      drag.target = targetId && findItem(targetId)?.type !== "frame" ? targetId : null;
      itemElements.forEach((element, id) => element.classList.toggle("is-link-target", id === drag.target));
      renderLinks();
    } else if (drag.type === "draw") {
      const last = drag.points[drag.points.length - 1];
      if (Math.hypot(wx - last[0], wy - last[1]) * view.zoom >= 1.5) {
        drag.points.push([Math.round(wx * 10) / 10, Math.round(wy * 10) / 10]);
        renderInk();
      }
    } else if (drag.type === "erase") {
      eraseAt(wx, wy);
    }
  }

  function onPointerUp(event) {
    pointers.delete(event.pointerId);
    if (pinch) {
      if (pointers.size < 2) pinch = null;
      return;
    }
    const current = drag;
    drag = null;
    space.classList.remove("is-panning", "is-dragging");
    marquee.hidden = true;
    marquee.classList.remove("is-create");
    if (!current) return;
    if (current.type === "move") {
      if (current.moved) {
        pushUndo(current.before);
        save();
      } else if (!current.shift && current.clickId && selected.size > 1) {
        selected = new Set([current.clickId]);
      }
      render();
    } else if (current.type === "resize") {
      if (snapshot() !== current.before) {
        pushUndo(current.before);
        save();
      }
      render();
    } else if (current.type === "marquee") {
      render();
      if (selected.size) announce(`${selected.size} selected.`);
    } else if (current.type === "create") {
      const [sx, sy] = current.start;
      const [ex, ey] = current.current;
      const w = Math.abs(ex - sx);
      const h = Math.abs(ey - sy);
      const tiny = w * view.zoom < 8 && h * view.zoom < 8;
      const [dw, dh] = DEFAULT_SIZES[current.kind];
      const item = createItem(current.kind, 0, 0);
      Object.assign(item, tiny
        ? { x: Math.round(sx - dw / 2), y: Math.round(sy - dh / 2), w: dw, h: dh }
        : { x: Math.round(Math.min(sx, ex)), y: Math.round(Math.min(sy, ey)), w: Math.round(Math.max(40, w)), h: Math.round(Math.max(30, h)) });
      if (current.kind === "frame") item.text = "Frame";
      addItems([item]);
      tool = "select";
      render();
      startEdit(item.id);
    } else if (current.type === "connect") {
      itemElements.forEach((element) => element.classList.remove("is-link-target"));
      if (current.target) {
        createLink(current.from, current.target);
      } else {
        const source = findItem(current.from);
        const [px, py] = current.point;
        const far = source && Math.hypot(px - (source.x + source.w / 2), py - (source.y + source.h / 2)) > Math.max(source.w, source.h) / 2 + 30;
        if (far) {
          const note = createItem("note", px, py);
          const link = { id: makeId("l"), from: current.from, to: note.id, kind: "related", label: "" };
          mutate(() => {
            board.items.push(note);
            board.links.push(link);
            selected = new Set([note.id]);
          }, { message: "New note connected." });
          startEdit(note.id);
        } else {
          render();
        }
      }
      if (tool === "connect") render();
    } else if (current.type === "draw") {
      const points = current.points.length > 1 ? current.points : [current.points[0], [current.points[0][0] + 0.5, current.points[0][1] + 0.5]];
      const stroke = { id: makeId("s"), points, color: current.color, size: current.size, highlighter: current.highlighter };
      mutate(() => { board.strokes.push(stroke); });
    } else if (current.type === "erase") {
      if (snapshot() !== current.before) {
        pushUndo(current.before);
        save();
        announce("Drawing erased.");
      }
      render();
    } else if (current.type === "pan") {
      render();
    }
  }

  function onDoubleClick(event) {
    if (tool !== "select" || event.target.closest(".es-wb-suggestion")) return;
    const linkLabel = event.target.closest("[data-link-label]");
    if (linkLabel) return editLinkLabel(linkLabel.dataset.linkLabel);
    const itemId = event.target.closest("[data-item-id]")?.dataset.itemId;
    const item = itemId && findItem(itemId);
    if (item && EDITABLE.has(item.type) && (item.type !== "frame" || event.target.closest(".es-wb-frame-title"))) {
      startEdit(item.id, { selectAll: false });
      return;
    }
    if (item && item.type !== "frame") return;
    if (event.target.closest("[data-link-id], [data-stroke-id]")) return;
    const [wx, wy] = toWorld(event.clientX, event.clientY);
    addItems([createItem("note", wx, wy)], { edit: true, message: "Sticky note added." });
  }

  function onWheel(event) {
    if (event.target.closest(".es-wb-drawer, .es-wb-menu, dialog")) return;
    event.preventDefault();
    cancelAnimationFrame(frameRequest);
    if (event.ctrlKey || event.metaKey) {
      zoomAt(view.zoom * Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0025) * (event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 50 ? 4 : 1)), event.clientX, event.clientY);
    } else {
      const unit = event.deltaMode === 1 ? 32 : 1;
      const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      const dy = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
      view = { ...view, x: view.x - dx * unit, y: view.y - dy * unit };
      applyView();
    }
  }

  /* ---------- keyboard ---------- */
  const isTyping = (element) => element && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));

  function onKeyDown(event) {
    if (!space.isConnected) return;
    const active = document.activeElement;
    if (templateDialog.open || shortcutsDialog.open) return;
    if (editing) {
      if (event.key === "Escape" || ((event.metaKey || event.ctrlKey) && event.key === "Enter") || (editing.linkId && event.key === "Enter")) {
        event.preventDefault();
        const id = editing.id;
        finishEdit();
        if (id && itemElements.has(id)) itemElements.get(id).focus({ preventScroll: true });
        else viewport.focus({ preventScroll: true });
      } else if (editing.id && findItem(editing.id)?.type === "frame" && event.key === "Enter") {
        event.preventDefault();
        finishEdit();
      }
      return;
    }
    if (event.key === "Escape" && !library.hidden && library.contains(active)) { event.preventDefault(); closeLibrary(); return; }
    if (isTyping(active)) return;
    if (active && active !== document.body && !space.contains(active)) return;
    const mod = event.metaKey || event.ctrlKey;
    const keyName = event.key.toLowerCase();
    if (!boardMenu.hidden && event.key === "Escape") {
      toggleBoardMenu(false);
      $('[data-action="board-menu"]').focus();
      return;
    }
    if (event.key === " " && !spaceHeld) {
      if (active?.tagName === "BUTTON" || active?.tagName === "A") return;
      spaceHeld = true;
      space.classList.add("is-space-pan");
      event.preventDefault();
      return;
    }
    if (mod && keyName === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
    if (mod && keyName === "y") { event.preventDefault(); redo(); return; }
    if (mod && keyName === "d") { event.preventDefault(); duplicateSelection(); return; }
    if (mod && keyName === "a") {
      event.preventDefault();
      select([...board.items.map((item) => item.id), ...board.strokes.map((stroke) => stroke.id)]);
      announce(`${selected.size} selected.`);
      return;
    }
    if (mod && (event.key === "0")) { event.preventDefault(); zoomAt(1); return; }
    if (mod && (event.key === "=" || event.key === "+")) { event.preventDefault(); zoomAt(view.zoom * 1.2); return; }
    if (mod && event.key === "-") { event.preventDefault(); zoomAt(view.zoom / 1.2); return; }
    if (mod) return;
    if (event.shiftKey && (event.key === "!" || event.code === "Digit1")) { event.preventDefault(); fitAll(); return; }
    if (event.key === "?") { event.preventDefault(); openShortcuts(); return; }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (selected.size) { event.preventDefault(); deleteSelection(); }
      return;
    }
    if (event.key === "Escape") {
      if (drag) { drag = null; marquee.hidden = true; render(); return; }
      if (!library.hidden) { closeLibrary(); return; }
      if (tool !== "select") { setTool("select"); return; }
      clearSelection();
      viewport.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Enter" && selected.size === 1) {
      const [id] = selected;
      if (findItem(id) && EDITABLE.has(findItem(id).type)) { event.preventDefault(); startEdit(id, { selectAll: false }); }
      else if (findLink(id)) { event.preventDefault(); editLinkLabel(id); }
      return;
    }
    if (event.key.startsWith("Arrow") && selected.size) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
      const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
      mutate(() => {
        for (const item of selectedItems()) { item.x += dx; item.y += dy; }
        for (const id of selected) {
          const stroke = findStroke(id);
          if (stroke) stroke.points = stroke.points.map(([x, y]) => [x + dx, y + dy]);
        }
      });
      return;
    }
    const toolForKey = { v: "select", h: "hand", n: "note", t: "text", r: "shape", f: "frame", c: "connect", p: "pen", m: "highlighter", e: "eraser" }[keyName];
    if (toolForKey && !event.altKey) { event.preventDefault(); setTool(toolForKey); return; }
    if (event.key === "+" || event.key === "=") zoomAt(view.zoom * 1.2);
    if (event.key === "-") zoomAt(view.zoom / 1.2);
  }

  function onKeyUp(event) {
    if (event.key === " ") {
      spaceHeld = false;
      space.classList.remove("is-space-pan");
    }
  }

  function onCopy(event) {
    if (editing || isTyping(document.activeElement) || !space.contains(document.activeElement)) return;
    if (![...selected].some((id) => kindOf(id) !== "link")) return;
    clipboard = JSON.parse(JSON.stringify(cloneSelection(0)));
    pasteOffset = 0;
    event.clipboardData?.setData("text/plain", `evidencespace-board:${selectedItems().map((item) => item.text || itemLabel(item)).join("\n")}`);
    event.preventDefault();
    announce("Copied.");
  }

  function onPaste(event) {
    if (editing || isTyping(document.activeElement)) return;
    if (document.activeElement !== document.body && !space.contains(document.activeElement)) return;
    const text = event.clipboardData?.getData("text/plain") || "";
    event.preventDefault();
    if (clipboard && (!text || text.startsWith("evidencespace-board:"))) {
      pasteOffset += 1;
      const offset = 24 * pasteOffset;
      const idMap = new Map();
      const items = clipboard.items.map((item) => {
        const copy = { ...item, id: makeId("i"), x: item.x + offset, y: item.y + offset };
        idMap.set(item.id, copy.id);
        return copy;
      });
      const links = clipboard.links.filter((link) => idMap.has(link.from) && idMap.has(link.to)).map((link) => ({ ...link, id: makeId("l"), from: idMap.get(link.from), to: idMap.get(link.to) }));
      const strokes = clipboard.strokes.map((stroke) => ({ ...stroke, id: makeId("s"), points: stroke.points.map(([x, y]) => [x + offset, y + offset]) }));
      insertClone({ items, links, strokes }, "Pasted.");
      return;
    }
    if (text.trim()) {
      const [x, y] = nextDropPoint();
      addItems([createItem("note", x, y, { text: text.trim().slice(0, 2000) })], { message: "Pasted as a sticky note." });
    }
  }

  /* ---------- panels ---------- */
  function openLibrary() {
    library.hidden = false;
    space.classList.add("has-drawer");
    $('.es-wb-actions [data-action="open-library"]').setAttribute("aria-expanded", "true");
    renderLibrary();
    library.querySelector('[aria-selected="true"]')?.focus();
  }
  function closeLibrary() {
    library.hidden = true;
    space.classList.remove("has-drawer");
    const opener = $('.es-wb-actions [data-action="open-library"]');
    opener.setAttribute("aria-expanded", "false");
    opener.focus();
  }
  function openShortcuts() {
    shortcutsDialog.showModal?.();
    if (!shortcutsDialog.open) shortcutsDialog.setAttribute("open", "");
  }
  function focusItem(id) {
    const item = findItem(id);
    if (!item) return;
    selected = new Set([id]);
    render();
    fitTo({ x: item.x - 120, y: item.y - 120, w: item.w + 240, h: item.h + 240 });
    itemElements.get(id)?.focus({ preventScroll: true });
  }

  function onClick(event) {
    const control = event.target.closest("[data-action], [data-tool], [data-lib-tab]");
    if (!control || !space.contains(control) || control === space) return;
    if (control.matches(".es-wb-tool")) return setTool(control.dataset.tool);
    if (control.dataset.libTab) {
      libraryTab = control.dataset.libTab;
      renderLibrary();
      library.querySelector(`[data-lib-tab="${libraryTab}"]`)?.focus();
      return;
    }
    const { action, value } = control.dataset;
    const selectedLink = [...selected].map(findLink).find(Boolean);
    switch (action) {
      case "undo": return undo();
      case "redo": return redo();
      case "zoom-in": return zoomAt(view.zoom * 1.2);
      case "zoom-out": return zoomAt(view.zoom / 1.2);
      case "zoom-reset": return zoomAt(1);
      case "fit": return fitAll();
      case "shortcuts": return openShortcuts();
      case "open-library": return library.hidden ? openLibrary() : closeLibrary();
      case "close-library": return closeLibrary();
      case "board-menu": return toggleBoardMenu();
      case "open-board": toggleBoardMenu(false); return switchBoard(value);
      case "new-board": return openTemplateDialog();
      case "rename-board": return renameBoard();
      case "duplicate-board": return duplicateBoard();
      case "delete-board": return deleteBoard();
      case "suggest": {
        suggestionsOn = !suggestionsOn;
        if (suggestionsOn) selected = new Set();
        const count = pendingSuggestions(board, dismissed).length;
        render();
        if (suggestionsOn) announce(count ? `${count} suggested links shown. Review each one.` : "No suggestions right now. Suggestions appear when related case items are on the board.");
        if (suggestionsOn && !count) toast("No suggestions right now", "Suggestions appear when related case items are both on the board.");
        return;
      }
      case "accept-suggestion":
      case "dismiss-suggestion": {
        const keyValue = control.closest("[data-suggestion]")?.dataset.suggestion;
        const suggestion = pendingSuggestions(board, dismissed).find((entry) => entry.key === keyValue);
        if (!suggestion) return;
        if (action === "dismiss-suggestion") {
          dismissed.add(suggestion.key);
          render();
          announce("Suggestion dismissed.");
          return;
        }
        const link = { id: makeId("l"), from: suggestion.fromItem.id, to: suggestion.toItem.id, kind: suggestion.kind, label: "" };
        mutate(() => { board.links.push(link); selected = new Set([link.id]); }, { message: "Suggested link added." });
        return;
      }
      case "item-color": return mutate(() => { for (const item of selectedItems()) if (item.color) item.color = value; });
      case "ink-color": return mutate(() => { for (const id of selected) { const stroke = findStroke(id); if (stroke) stroke.color = value; } });
      case "shape-kind": return mutate(() => { for (const item of selectedItems()) if (item.type === "shape") item.shape = value; });
      case "link-kind": return selectedLink && mutate(() => { selectedLink.kind = value; }, { message: `Marked as ${LINK_LABELS[value].toLowerCase()}.` });
      case "link-label": return selectedLink && editLinkLabel(selectedLink.id);
      case "link-reverse": return selectedLink && mutate(() => { [selectedLink.from, selectedLink.to] = [selectedLink.to, selectedLink.from]; });
      case "edit": return startEdit([...selected][0], { selectAll: false });
      case "wrap-frame": return wrapInFrame();
      case "front": return reorder(true);
      case "back": return reorder(false);
      case "duplicate": return duplicateSelection();
      case "delete": return deleteSelection();
      case "tool-note-color": toolSettings.noteColor = value; return renderToolOptions();
      case "tool-shape": toolSettings.shape = value; return renderToolOptions();
      case "tool-ink-color": toolSettings.inkColor = value; return renderToolOptions();
      case "tool-highlight-color": toolSettings.highlightColor = value; return renderToolOptions();
      case "add-library": {
        const row = control.closest("[data-lib-type]");
        addFromLibrary(row.dataset.libType, row.dataset.libRef);
        renderLibrary();
        library.querySelector(`[data-lib-ref="${row.dataset.libRef}"] button`)?.focus();
        return;
      }
      case "find-item": return focusItem(value);
      default: return undefined;
    }
  }

  function onSubmit(event) {
    const form = event.target.closest("[data-question-form]");
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector("input");
    const text = input.value.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!text) { input.focus(); return; }
    const [x, y] = nextDropPoint("question");
    addItems([createItem("question", x, y, { text })], { message: "Question added to the board." });
    renderLibrary();
    library.querySelector("[data-question-form] input")?.focus();
  }

  function onDragStart(event) {
    const row = event.target.closest?.("[data-lib-type]");
    if (!row) return;
    event.dataTransfer.setData("application/x-evidencespace", JSON.stringify({ type: row.dataset.libType, ref: row.dataset.libRef }));
    event.dataTransfer.setData("text/plain", row.querySelector("strong")?.textContent || "");
    event.dataTransfer.effectAllowed = "copy";
    space.classList.add("is-receiving");
  }
  function onDragOver(event) {
    if (![...(event.dataTransfer?.types || [])].includes("application/x-evidencespace")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }
  function onDrop(event) {
    space.classList.remove("is-receiving");
    const raw = event.dataTransfer?.getData("application/x-evidencespace");
    if (!raw) return;
    event.preventDefault();
    try {
      const { type, ref } = JSON.parse(raw);
      const [x, y] = toWorld(event.clientX, event.clientY);
      addFromLibrary(type, ref, x, y);
    } catch {
      /* ignore malformed drops */
    }
  }

  function onFocusIn(event) {
    const id = event.target.dataset?.itemId;
    if (id && !selected.has(id) && !drag && !editing) {
      selected = new Set([id]);
      render();
    }
  }

  function onMinimapPointer(event) {
    cancelAnimationFrame(frameRequest);
    if (event.type === "pointerdown") minimap.setPointerCapture?.(event.pointerId);
    else if (!(event.buttons & 1)) return;
    if (!minimapTransform) return;
    const box = minimap.getBoundingClientRect();
    const wx = (event.clientX - box.left - minimapTransform.ox) / minimapTransform.scale;
    const wy = (event.clientY - box.top - minimapTransform.oy) / minimapTransform.scale;
    const viewBox = rect();
    view = { ...view, x: viewBox.width / 2 - wx * view.zoom, y: viewBox.height / 2 - wy * view.zoom };
    applyView();
  }

  listen(viewport, "pointerdown", onPointerDown);
  listen(viewport, "pointermove", onPointerMove);
  listen(viewport, "pointerup", onPointerUp);
  listen(viewport, "pointercancel", onPointerUp);
  listen(viewport, "dblclick", onDoubleClick);
  listen(viewport, "wheel", onWheel, { passive: false });
  listen(viewport, "dragover", onDragOver);
  listen(viewport, "drop", onDrop);
  listen(viewport, "focusin", onFocusIn);
  listen(space, "click", onClick);
  listen(space, "submit", onSubmit);
  listen(space, "dragstart", onDragStart);
  listen(space, "dragend", () => space.classList.remove("is-receiving"));
  listen(minimap, "pointerdown", onMinimapPointer);
  listen(minimap, "pointermove", onMinimapPointer);
  listen(window, "keydown", onKeyDown);
  listen(window, "keyup", onKeyUp);
  listen(window, "blur", () => { spaceHeld = false; space.classList.remove("is-space-pan"); });
  listen(document, "copy", onCopy);
  listen(document, "paste", onPaste);
  listen(document, "pointerdown", (event) => {
    if (!boardMenu.hidden && !boardMenu.contains(event.target) && !event.target.closest('[data-action="board-menu"]')) toggleBoardMenu(false);
  });
  listen(templateDialog, "close", () => {
    if (templateDialog.returnValue === "create") createBoardFromDialog();
    templateDialog.returnValue = "";
    viewport.focus({ preventScroll: true });
  });
  listen(shortcutsDialog, "close", () => $('[data-action="shortcuts"]').focus());
  listen(window, "resize", () => { positionContext(); renderToolOptions(); scheduleMinimap(); });
  listen(window, "pagehide", () => writeNow());

  /* ---------- start ---------- */
  render();
  if (board.view) {
    view = { ...board.view };
    applyView();
  } else {
    fitAll(false, { initial: true });
  }
  setSaveStatus(storageAvailable ? "saved" : "failed");
  try {
    if (!window.localStorage.getItem(key)) writeNow();
  } catch {
    setSaveStatus("failed");
  }

  return () => {
    finishEdit();
    if (saveTimer || viewSaveTimer) writeNow();
    clearTimeout(saveTimer);
    clearTimeout(viewSaveTimer);
    cancelAnimationFrame(frameRequest);
    cleanups.forEach((cleanup) => cleanup());
  };
}
