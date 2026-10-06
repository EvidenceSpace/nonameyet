import { buildShellHref } from "../evidencespace-shell-model.js";
import { caseFixture, spaceBoardFixture } from "./fixtures.js";
import { KIND_ICON, escapeHtml, icon, previewLimitPage, statePage } from "./page-utils.js";

const BOARD = Object.freeze({ width: 1200, height: 560 });
const STEP = 16;
const LINK_TYPES = Object.freeze([
  ["supports", "Supports"],
  ["contradicts", "Contradicts"],
  ["question", "Open point"],
  ["research", "Guidance"],
  ["suggestion", "Suggested"],
]);
const GROUPS = Object.freeze([
  ["supports", "Supports the question"],
  ["contradicts", "Cuts against it"],
  ["research", "Guidance"],
  ["question", "Open points"],
  ["work", "Planned"],
  ["suggestion", "Suggested, not added"],
]);
/* Board changes last until the page reloads, matching the public preview's promise. */
const savedBoards = new Map();

function initialState() {
  return {
    cards: spaceBoardFixture.cards.map((card) => ({ ...card })),
    links: spaceBoardFixture.links.map((link) => ({ ...link })),
  };
}

function loadState(caseId) {
  const saved = savedBoards.get(caseId);
  return saved ? structuredClone(saved) : initialState();
}

function saveState(caseId, state) {
  savedBoards.set(caseId, structuredClone(state));
}

function cardMarkup(card) {
  const isSuggestion = card.kind === "suggestion";
  return `
    <div class="es-board-card is-${escapeHtml(card.kind)}" data-card="${escapeHtml(card.id)}" data-vt-target="${escapeHtml(card.id)}"
      role="button" tabindex="0" aria-pressed="false" aria-describedby="board-hint"
      aria-label="${escapeHtml(`${card.tag}: ${card.title}`)}"
      style="--x:${card.x}px;--y:${card.y}px">
      <span class="es-board-icon">${icon(card.icon || KIND_ICON[card.kind] || "file")}</span>
      <span class="es-board-copy">
        <span class="es-board-tag">${escapeHtml(card.tag)}</span>
        <strong>${escapeHtml(card.title)}</strong>
        <small>${escapeHtml(card.note)}</small>
      </span>
      ${isSuggestion ? `<span class="es-board-actions"><button type="button" class="es-button is-small is-primary" data-accept="${escapeHtml(card.id)}">Add to Work</button><button type="button" class="es-button is-small is-quiet" data-dismiss="${escapeHtml(card.id)}">Dismiss</button></span>` : ""}
    </div>`;
}

function outlineMarkup(state, caseId) {
  const focus = state.cards.find((card) => card.kind === "focus");
  return GROUPS.map(([type, label]) => {
    const members = state.links
      .filter((link) => link.type === type)
      .map((link) => state.cards.find((card) => card.id === link.from))
      .filter(Boolean);
    if (!members.length) return "";
    return `
      <section class="es-outline-group" data-tone="${type}">
        <h3>${escapeHtml(label)} <span>${members.length}</span></h3>
        <ul>${members.map((card) => `
          <li>
            <span class="es-board-icon is-${escapeHtml(card.kind)}">${icon(card.icon || KIND_ICON[card.kind] || "file")}</span>
            <div><span class="es-board-tag">${escapeHtml(card.tag)}</span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(card.note)}</small></div>
            ${card.id.startsWith("E-") ? `<a class="es-text-link" data-route-link href="${buildShellHref("evidence", caseId, { evidenceId: card.id, from: "space" })}">Open</a>` : ""}
          </li>`).join("")}</ul>
      </section>`;
  }).join("") + (focus ? `<p class="es-outline-foot">Everything above points at <strong>${escapeHtml(focus.title)}</strong></p>` : "");
}

export function renderPage({ caseId, viewState }) {
  if (viewState !== "ready") {
    return statePage({ title: "Space", state: viewState, primaryHref: buildShellHref("brief", caseId), primaryLabel: "Return to Brief" });
  }
  if (caseId !== caseFixture.id) return previewLimitPage({ caseId, title: "Space", intro: "Nothing arranged on the board yet." });
  return `
    <section class="es-product-page es-space-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><h1 id="page-title" tabindex="-1">${escapeHtml(spaceBoardFixture.title)}</h1><p>Arrange sources around the question. Lines follow the cards.</p></div>
        <div class="es-header-actions">
          <div class="es-segmented" role="group" aria-label="View">
            <button type="button" data-space-view="board" aria-pressed="true">${icon("board")} Board</button>
            <button type="button" data-space-view="outline" aria-pressed="false">${icon("list")} Outline</button>
          </div>
          <button class="es-button is-quiet" type="button" id="reset-layout">Reset layout</button>
        </div>
      </header>

      <div class="es-space-stage" id="space-stage" data-view="board" data-inspector="closed">
        <div class="es-board-scroll" id="board-scroll">
          <div class="es-board" id="space-board" style="--board-w:${BOARD.width}px;--board-h:${BOARD.height}px">
            <svg class="es-board-lines" id="board-lines" viewBox="0 0 ${BOARD.width} ${BOARD.height}" width="${BOARD.width}" height="${BOARD.height}" aria-hidden="true"></svg>
            <div class="es-board-labels" id="board-labels" aria-hidden="true"></div>
            <div class="es-board-cards" id="board-cards"></div>
          </div>
        </div>
        <div class="es-outline" id="space-outline" hidden></div>
        <aside class="es-inspector" id="space-inspector" aria-labelledby="inspector-title" hidden></aside>
        <ul class="es-board-legend" aria-label="Line types">${LINK_TYPES.map(([type, label]) => `<li data-type="${type}"><svg viewBox="0 0 28 6" aria-hidden="true"><path d="M1 3h26"></path></svg>${label}</li>`).join("")}</ul>
        <p class="es-sr-only" id="board-hint">Press Enter to see details. Use the arrow keys to move the card; hold Shift to move further.</p>
      </div>
    </section>`;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function mountPage({ root, location, announce, toast }) {
  const stage = root.querySelector("#space-stage");
  if (!stage) return undefined;
  const caseId = location.caseId;
  const scroller = root.querySelector("#board-scroll");
  const cardsLayer = root.querySelector("#board-cards");
  const lines = root.querySelector("#board-lines");
  const labels = root.querySelector("#board-labels");
  const outline = root.querySelector("#space-outline");
  const inspector = root.querySelector("#space-inspector");
  const viewButtons = [...root.querySelectorAll("[data-space-view]")];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let state = loadState(caseId);
  let selectedId = null;
  let frame = 0;
  const cleanups = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  const cardEl = (id) => cardsLayer.querySelector(`[data-card="${CSS.escape(id)}"]`);
  const cardData = (id) => state.cards.find((card) => card.id === id);

  const size = (id) => {
    const el = cardEl(id);
    return [el?.offsetWidth || 270, el?.offsetHeight || 80];
  };

  /* Pick which side of each card a line leaves from, then spread lines that
     share a side so they don't pile into one point. */
  function routeLinks() {
    const routes = [];
    const bySide = new Map();
    for (const link of state.links) {
      const from = cardData(link.from);
      const to = cardData(link.to);
      if (!from || !to) continue;
      const [aw, ah] = size(from.id);
      const [bw, bh] = size(to.id);
      const dx = (to.x + bw / 2) - (from.x + aw / 2);
      const dy = (to.y + bh / 2) - (from.y + ah / 2);
      const horizontal = Math.abs(dx) > Math.abs(dy) * 0.9;
      const fromSide = horizontal ? (dx > 0 ? "right" : "left") : (dy > 0 ? "bottom" : "top");
      const toSide = horizontal ? (dx > 0 ? "left" : "right") : (dy > 0 ? "top" : "bottom");
      const route = { link, from, to, fromSide, toSide, fromSlot: 0.5, toSlot: 0.5 };
      routes.push(route);
      for (const [card, side, other, key] of [[from, fromSide, to, "fromSlot"], [to, toSide, from, "toSlot"]]) {
        const id = `${card.id}:${side}`;
        if (!bySide.has(id)) bySide.set(id, []);
        bySide.get(id).push({ route, key, along: side === "left" || side === "right" ? other.y : other.x });
      }
    }
    for (const entries of bySide.values()) {
      if (entries.length < 2) continue;
      entries.sort((a, b) => a.along - b.along);
      entries.forEach((entry, index) => { entry.route[entry.key] = 0.25 + (0.5 * index) / (entries.length - 1); });
    }
    return routes;
  }

  function point(card, side, slot) {
    const [w, h] = size(card.id);
    if (side === "left") return [card.x, card.y + h * slot];
    if (side === "right") return [card.x + w, card.y + h * slot];
    if (side === "top") return [card.x + w * slot, card.y];
    return [card.x + w * slot, card.y + h];
  }

  function curve({ from, to, fromSide, toSide, fromSlot, toSlot }) {
    const start = point(from, fromSide, fromSlot);
    const end = point(to, toSide, toSlot);
    const horizontal = fromSide === "left" || fromSide === "right";
    const span = horizontal ? Math.abs(end[0] - start[0]) : Math.abs(end[1] - start[1]);
    const pull = Math.max(36, span / 2);
    const dir = fromSide === "right" || fromSide === "bottom" ? 1 : -1;
    const c1 = horizontal ? [start[0] + pull * dir, start[1]] : [start[0], start[1] + pull * dir];
    const c2 = horizontal ? [end[0] - pull * dir, end[1]] : [end[0], end[1] - pull * dir];
    return [start, c1, c2, end];
  }

  function drawLines() {
    frame = 0;
    const paths = [];
    const tags = [];
    for (const route of routeLinks()) {
      const { link } = route;
      const [p0, p1, p2, p3] = curve(route);
      const active = selectedId && (link.from === selectedId || link.to === selectedId);
      const dim = selectedId && !active;
      const d = `M${p0[0]} ${p0[1]} C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`;
      paths.push(`<path class="es-link is-${link.type}${active ? " is-active" : ""}${dim ? " is-dim" : ""}" d="${d}"></path><circle class="es-link-end is-${link.type}${dim ? " is-dim" : ""}" cx="${p3[0]}" cy="${p3[1]}" r="3.5"></circle>`);
      const lx = cubicPoint(p0[0], p1[0], p2[0], p3[0], 0.5);
      const ly = cubicPoint(p0[1], p1[1], p2[1], p3[1], 0.5);
      tags.push(`<span class="es-link-label is-${link.type}${dim ? " is-dim" : ""}" style="--x:${lx}px;--y:${ly}px">${escapeHtml(link.label)}</span>`);
    }
    lines.innerHTML = paths.join("");
    labels.innerHTML = tags.join("");
  }
  const scheduleDraw = () => {
    if (!frame) frame = requestAnimationFrame(drawLines);
  };

  function renderCards() {
    cardsLayer.innerHTML = state.cards.map(cardMarkup).join("");
    if (selectedId) {
      const el = cardEl(selectedId);
      if (el) el.setAttribute("aria-pressed", "true");
      else selectedId = null;
    }
    drawLines();
    outline.innerHTML = outlineMarkup(state, caseId);
  }

  function linkSummary(card) {
    const related = state.links.filter((link) => link.from === card.id || link.to === card.id);
    if (!related.length) return `<p class="es-muted">Not connected to anything yet.</p>`;
    return `<ul class="es-inspector-links">${related.map((link) => {
      const otherId = link.from === card.id ? link.to : link.from;
      const other = cardData(otherId);
      const verb = link.from === card.id ? link.label : `${cardData(link.from)?.tag.split(" · ")[0]} · ${link.label.toLowerCase()}`;
      return `<li data-type="${escapeHtml(link.type)}"><span class="es-dot" data-tone="${escapeHtml(link.type)}" aria-hidden="true"></span><div><small>${escapeHtml(verb)}</small><button type="button" class="es-inline-button" data-select="${escapeHtml(otherId)}">${escapeHtml(other?.title || otherId)}</button></div></li>`;
    }).join("")}</ul>`;
  }

  function renderInspector() {
    const card = selectedId && cardData(selectedId);
    stage.dataset.inspector = card ? "open" : "closed";
    if (!card) {
      inspector.hidden = true;
      inspector.innerHTML = "";
      return;
    }
    const isEvidence = card.id.startsWith("E-");
    inspector.hidden = false;
    inspector.innerHTML = `
      <header>
        <div><p class="es-board-tag">${escapeHtml(card.tag)}</p><h2 id="inspector-title">${escapeHtml(card.title)}</h2></div>
        <button class="es-icon-button" type="button" data-close-inspector aria-label="Close details">${icon("close")}</button>
      </header>
      <p>${escapeHtml(card.note)}</p>
      <h3>Connections</h3>
      ${linkSummary(card)}
      <div class="es-inspector-actions">
        ${isEvidence ? `<a class="es-button is-primary" data-route-link data-vt="${escapeHtml(card.id)}" href="${buildShellHref("evidence", caseId, { evidenceId: card.id, from: "space" })}">${icon("file")} Open source</a>` : ""}
        ${card.id === "E-04" ? `<a class="es-button is-quiet" data-route-link href="${buildShellHref("space", caseId, { contextId: "E-04" })}">Comments</a>` : ""}
        ${card.kind === "suggestion" ? `<button class="es-button is-primary" type="button" data-accept="${escapeHtml(card.id)}">Add to Work</button><button class="es-button is-quiet" type="button" data-dismiss="${escapeHtml(card.id)}">Dismiss</button>` : ""}
        ${card.kind === "work" ? `<a class="es-button" data-route-link href="${buildShellHref("work", caseId)}">Open in Work</a>` : ""}
      </div>`;
  }

  function select(id, { focusCard = false } = {}) {
    selectedId = id;
    for (const el of cardsLayer.querySelectorAll("[data-card]")) el.setAttribute("aria-pressed", String(el.dataset.card === id));
    renderInspector();
    drawLines();
    if (id) {
      const el = cardEl(id);
      if (focusCard) el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
    }
  }

  function moveCard(id, x, y) {
    const card = cardData(id);
    const el = cardEl(id);
    if (!card || !el) return;
    card.x = Math.round(Math.min(BOARD.width - el.offsetWidth - 8, Math.max(8, x)));
    card.y = Math.round(Math.min(BOARD.height - el.offsetHeight - 8, Math.max(8, y)));
    el.style.setProperty("--x", `${card.x}px`);
    el.style.setProperty("--y", `${card.y}px`);
    scheduleDraw();
  }

  function settle(id) {
    const el = cardEl(id);
    if (!el) return;
    el.classList.add("is-settling");
    window.setTimeout(() => el.classList.remove("is-settling"), 700);
  }

  function acceptSuggestion(id) {
    const before = structuredClone(state);
    const card = cardData(id);
    if (!card) return;
    card.kind = "work";
    card.tag = "W-01 · Planned";
    card.note = "Added to Work · due 2 September";
    for (const link of state.links) {
      if (link.from === id) { link.type = "question"; link.label = "Would answer"; }
    }
    saveState(caseId, state);
    renderCards();
    select(id, { focusCard: true });
    settle(id);
    announce("Added to Work as W-01.");
    toast("Added to Work", "W-01 · Ask Mia for the list of changes", {
      actionLabel: "Undo",
      onAction: () => {
        state = before;
        saveState(caseId, state);
        renderCards();
        select(id, { focusCard: true });
        announce("Back to a suggestion.");
      },
    });
  }

  function dismissSuggestion(id) {
    const before = structuredClone(state);
    const el = cardEl(id);
    const finish = () => {
      state.cards = state.cards.filter((card) => card.id !== id);
      state.links = state.links.filter((link) => link.from !== id && link.to !== id);
      saveState(caseId, state);
      if (selectedId === id) selectedId = null;
      renderCards();
      renderInspector();
      announce("Suggestion dismissed.");
      toast("Suggestion dismissed", "It won’t come back unless you undo.", {
        actionLabel: "Undo",
        onAction: () => {
          state = before;
          saveState(caseId, state);
          renderCards();
          settle(id);
          announce("Suggestion restored.");
        },
      });
    };
    if (!el || reduceMotion.matches) return finish();
    el.classList.add("is-leaving");
    window.setTimeout(finish, 200);
    return undefined;
  }

  /* Pointer dragging. A press that barely moves counts as a click. */
  let drag = null;
  on(cardsLayer, "pointerdown", (event) => {
    const el = event.target.closest("[data-card]");
    if (!el || event.button !== 0 || event.target.closest("button, a")) return;
    const card = cardData(el.dataset.card);
    drag = { id: card.id, el, startX: event.clientX, startY: event.clientY, x: card.x, y: card.y, moved: false };
    el.setPointerCapture(event.pointerId);
  });
  on(cardsLayer, "pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.el.classList.add("is-dragging");
    }
    moveCard(drag.id, drag.x + dx, drag.y + dy);
  });
  const endDrag = () => {
    if (!drag) return;
    const { id, el, moved } = drag;
    drag = null;
    el.classList.remove("is-dragging");
    if (moved) {
      saveState(caseId, state);
      if (selectedId !== id) select(id);
    } else {
      select(selectedId === id ? null : id, { focusCard: true });
    }
  };
  on(cardsLayer, "pointerup", endDrag);
  on(cardsLayer, "pointercancel", endDrag);

  on(cardsLayer, "keydown", (event) => {
    const el = event.target.closest("[data-card]");
    if (!el || event.target !== el) return;
    const card = cardData(el.dataset.card);
    const step = event.shiftKey ? STEP * 4 : STEP;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[event.key]) {
      event.preventDefault();
      moveCard(card.id, card.x + moves[event.key][0], card.y + moves[event.key][1]);
      saveState(caseId, state);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(selectedId === card.id ? null : card.id, { focusCard: true });
    }
    if (event.key === "Escape" && selectedId) {
      event.stopPropagation();
      select(null, { focusCard: false });
      el.focus();
    }
  });

  on(root, "click", (event) => {
    const accept = event.target.closest("[data-accept]");
    const dismiss = event.target.closest("[data-dismiss]");
    const jump = event.target.closest("[data-select]");
    const close = event.target.closest("[data-close-inspector]");
    if (accept) acceptSuggestion(accept.dataset.accept);
    else if (dismiss) dismissSuggestion(dismiss.dataset.dismiss);
    else if (jump) select(jump.dataset.select, { focusCard: true });
    else if (close) {
      const id = selectedId;
      select(null);
      cardEl(id)?.focus();
    }
  });

  on(scroller, "pointerdown", (event) => {
    if (event.target === scroller || event.target.id === "space-board" || event.target.closest(".es-board-lines")) select(null);
  });

  function setView(view) {
    stage.dataset.view = view;
    for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.spaceView === view));
    scroller.hidden = view !== "board";
    outline.hidden = view !== "outline";
    if (view === "outline") select(null);
    else scheduleDraw();
  }
  for (const button of viewButtons) on(button, "click", () => {
    setView(button.dataset.spaceView);
    announce(button.dataset.spaceView === "board" ? "Board view." : "Outline view.");
  });

  on(root.querySelector("#reset-layout"), "click", () => {
    const before = structuredClone(state);
    state = initialState();
    saveState(caseId, state);
    selectedId = null;
    renderCards();
    renderInspector();
    toast("Layout reset", "Cards are back where they started.", {
      actionLabel: "Undo",
      onAction: () => {
        state = before;
        saveState(caseId, state);
        renderCards();
      },
    });
  });

  renderCards();
  if (window.matchMedia("(max-width: 700px)").matches) setView("outline");
  const resizeObserver = new ResizeObserver(scheduleDraw);
  resizeObserver.observe(cardsLayer);
  cleanups.push(() => resizeObserver.disconnect());
  cleanups.push(() => cancelAnimationFrame(frame));
  document.fonts?.ready.then(scheduleDraw);
  return () => cleanups.forEach((cleanup) => cleanup());
}
