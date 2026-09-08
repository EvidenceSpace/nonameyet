import fixture, {
  DESKTOP_SPIKE_FIXTURE_SHA256,
} from "./desktop-spike-fixture.js";
import {
  DESKTOP_SPIKE_FRAME_SAMPLE_COUNT,
  DESKTOP_SPIKE_FRAME_TIMEOUT_MS,
  DESKTOP_SPIKE_FRAME_WARMUP_COUNT,
  summarizeDesktopSpikeFrameSamples,
  validateDesktopSpikeMeasurementFixture,
} from "./spike-measurement.js";

const RELATION_STYLES = Object.freeze({
  supports: Object.freeze({ color: "#187653", dash: [] }),
  contradicts: Object.freeze({ color: "#b33a52", dash: [7, 4] }),
  sequence: Object.freeze({ color: "#3659d9", dash: [2, 3] }),
  "depends-on": Object.freeze({ color: "#8a5a00", dash: [10, 4, 2, 4] }),
});
function requireElement(selector) {
  const element = document.querySelector(selector);
  if (!element)
    throw new Error("The measurement renderer contract is incomplete.");
  return element;
}

const fixtureStatus = requireElement("#fixture-status");
const fixtureCounts = requireElement("#fixture-counts");
const fixtureHash = requireElement("#fixture-hash");
const boardDescription = requireElement("#board-description");
const canvas = requireElement("#board-canvas");
const runButton = requireElement("#run-measurement");
const measurementStatus = requireElement("#measurement-status");
const sampleCount = requireElement("#sample-count");
const sampleMinimum = requireElement("#sample-minimum");
const sampleMaximum = requireElement("#sample-maximum");
const sampleP95 = requireElement("#sample-p95");
const outlineBody = requireElement("#outline-body");
const outlineStatus = requireElement("#outline-status");
const boardTab = requireElement("#board-tab");
const outlineTab = requireElement("#outline-tab");
const boardPanel = requireElement("#board-panel");
const outlinePanel = requireElement("#outline-panel");
const context = canvas.getContext("2d", { alpha: false });

let measurementRun = 0;
let frameRequest = 0;
let outlineRendered = false;
let renderModel = null;

function setFixtureFailure() {
  document.body.dataset.ready = "true";
  document.body.dataset.fixtureState = "invalid";
  fixtureStatus.textContent = "Fixture rejected";
  fixtureCounts.textContent = "Nothing was measured";
  fixtureHash.textContent = "SHA-256 unavailable";
  measurementStatus.textContent =
    "The synthetic fixture was invalid. Nothing was measured or saved; rebuild the staged candidate before retrying.";
}

function createRenderModel(model) {
  const padding = 26;
  const scale = Math.min(
    (canvas.width - padding * 2) / model.boardWidth,
    (canvas.height - padding * 2) / model.boardHeight,
  );
  const offsetX = (canvas.width - model.boardWidth * scale) / 2;
  const offsetY = (canvas.height - model.boardHeight * scale) / 2;
  const nodes = model.objects.map((object) =>
    Object.freeze({
      id: object.id,
      kind: object.kind,
      x: offsetX + object.x * scale,
      y: offsetY + object.y * scale,
      width: Math.max(3, object.width * scale),
      height: Math.max(2, object.height * scale),
      centerX: offsetX + (object.x + object.width / 2) * scale,
      centerY: offsetY + (object.y + object.height / 2) * scale,
    }),
  );
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const relationGroups = new Map(
    Object.keys(RELATION_STYLES).map((type) => [type, []]),
  );
  for (const connection of model.connections) {
    relationGroups.get(connection.type).push(
      Object.freeze({
        from: byId.get(connection.fromId),
        to: byId.get(connection.toId),
      }),
    );
  }
  return Object.freeze({ model, nodes: Object.freeze(nodes), relationGroups });
}

function canvasPalette() {
  const styles = getComputedStyle(document.documentElement);
  return Object.freeze({
    background:
      styles.getPropertyValue("--es-color-surface-muted").trim() || "#f4f6fb",
    node: styles.getPropertyValue("--es-color-surface").trim() || "#ffffff",
    nodeBorder:
      styles.getPropertyValue("--es-color-border-strong").trim() || "#aab5c7",
  });
}

function drawBoard(model, palette) {
  if (!context) return;
  context.save();
  context.fillStyle = palette.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 0.72;
  context.globalAlpha = 0.42;

  for (const [type, edges] of model.relationGroups) {
    const style = RELATION_STYLES[type];
    context.beginPath();
    context.strokeStyle = style.color;
    context.setLineDash(style.dash);
    for (const edge of edges) {
      context.moveTo(edge.from.centerX, edge.from.centerY);
      context.lineTo(edge.to.centerX, edge.to.centerY);
    }
    context.stroke();
  }

  context.globalAlpha = 0.94;
  context.setLineDash([]);
  context.fillStyle = palette.node;
  context.strokeStyle = palette.nodeBorder;
  context.lineWidth = 0.65;
  context.beginPath();
  for (const node of model.nodes) {
    context.rect(node.x, node.y, node.width, node.height);
  }
  context.fill();
  context.stroke();
  context.restore();
}

function relationTextByObject(model) {
  const byObject = new Map(model.objects.map((object) => [object.id, []]));
  for (const relation of model.outlineRelations) {
    byObject
      .get(relation.fromObjectId)
      .push(`${relation.type} → ${relation.toObjectId}`);
  }
  return byObject;
}

function appendCell(row, value, header = false) {
  const cell = document.createElement(header ? "th" : "td");
  if (header) cell.scope = "row";
  cell.textContent = String(value);
  row.append(cell);
}

function renderOutline() {
  if (outlineRendered || !renderModel) return;
  const relations = relationTextByObject(renderModel.model);
  const fragment = document.createDocumentFragment();

  for (const entry of renderModel.model.outlineEntries) {
    const row = document.createElement("tr");
    appendCell(row, entry.position);
    appendCell(row, entry.objectId, true);
    appendCell(row, entry.kind);
    appendCell(row, entry.incomingRelationCount);
    appendCell(row, relations.get(entry.objectId).join("; "));
    fragment.append(row);
  }

  outlineBody.append(fragment);
  outlineRendered = true;
  outlineStatus.textContent = `${renderModel.model.outlineEntries.length.toLocaleString("en-US")} objects and ${renderModel.model.outlineRelations.length.toLocaleString("en-US")} typed relationships are available in source order.`;
}

function selectView(selected) {
  const boardSelected = selected === "board";
  boardTab.setAttribute("aria-selected", String(boardSelected));
  outlineTab.setAttribute("aria-selected", String(!boardSelected));
  boardTab.tabIndex = boardSelected ? 0 : -1;
  outlineTab.tabIndex = boardSelected ? -1 : 0;
  boardPanel.hidden = !boardSelected;
  outlinePanel.hidden = boardSelected;
  if (!boardSelected) renderOutline();
}

function installViewSwitcher() {
  boardTab.addEventListener("click", () => selectView("board"));
  outlineTab.addEventListener("click", () => selectView("outline"));
  for (const tab of [boardTab, outlineTab]) {
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const next = tab === boardTab ? outlineTab : boardTab;
      selectView(next === boardTab ? "board" : "outline");
      next.focus();
    });
  }
}

function setMetricOutputs(summary) {
  sampleCount.textContent = String(summary.sampleCount);
  sampleMinimum.textContent = `${summary.minMs.toFixed(3)} ms`;
  sampleMaximum.textContent = `${summary.maxMs.toFixed(3)} ms`;
  sampleP95.textContent = `${summary.p95Ms.toFixed(3)} ms`;
  sampleP95.dataset.summary = JSON.stringify({
    fixtureVersion: renderModel.model.fixtureVersion,
    fixtureSha256: DESKTOP_SPIKE_FIXTURE_SHA256,
    objects: renderModel.model.objects.length,
    connections: renderModel.model.connections.length,
    sampleCount: summary.sampleCount,
    p95Ms: summary.p95Ms,
    minMs: summary.minMs,
    maxMs: summary.maxMs,
    limitMs: summary.limitMs,
    passed: summary.passed,
  });
}

function runFrameMeasurement() {
  if (!renderModel || !context) return;
  measurementRun += 1;
  const currentRun = measurementRun;
  const samples = [];
  let warmups = 0;
  let previousTimestamp = null;
  let finished = false;
  const palette = canvasPalette();
  selectView("board");
  runButton.disabled = true;
  document.body.dataset.measurementResult = "running";
  measurementStatus.textContent = `Collecting ${DESKTOP_SPIKE_FRAME_SAMPLE_COUNT} bounded frame intervals after ${DESKTOP_SPIKE_FRAME_WARMUP_COUNT} warm-up intervals…`;

  const timeout = window.setTimeout(() => {
    if (finished || currentRun !== measurementRun) return;
    finished = true;
    cancelAnimationFrame(frameRequest);
    runButton.disabled = false;
    document.body.dataset.measurementResult = "failed";
    measurementStatus.textContent =
      "The frame sample did not finish within 15 seconds. No partial result was accepted; it is safe to retry.";
  }, DESKTOP_SPIKE_FRAME_TIMEOUT_MS);

  function finish() {
    if (finished || currentRun !== measurementRun) return;
    finished = true;
    window.clearTimeout(timeout);
    const result = summarizeDesktopSpikeFrameSamples(samples);
    runButton.disabled = false;
    if (!result.ok) {
      document.body.dataset.measurementResult = "failed";
      measurementStatus.textContent =
        "The collected frame intervals were invalid. No result was accepted; it is safe to retry.";
      return;
    }

    setMetricOutputs(result.value);
    document.body.dataset.measurementResult = result.value.passed
      ? "passed"
      : "failed";
    measurementStatus.textContent = result.value.passed
      ? `Renderer sample met the ${result.value.limitMs.toFixed(1)} ms p95 gate. This is not packaged-host evidence.`
      : `Renderer sample exceeded the ${result.value.limitMs.toFixed(1)} ms p95 gate. Nothing was changed; inspect the packaged run before retrying.`;
  }

  function onFrame(timestamp) {
    if (finished || currentRun !== measurementRun) return;
    if (previousTimestamp !== null) {
      const interval = timestamp - previousTimestamp;
      if (warmups < DESKTOP_SPIKE_FRAME_WARMUP_COUNT) warmups += 1;
      else samples.push(interval);
    }
    previousTimestamp = timestamp;
    drawBoard(renderModel, palette);

    if (samples.length === DESKTOP_SPIKE_FRAME_SAMPLE_COUNT) finish();
    else frameRequest = requestAnimationFrame(onFrame);
  }

  frameRequest = requestAnimationFrame(onFrame);
}

installViewSwitcher();
const validation = validateDesktopSpikeMeasurementFixture(fixture);
if (!validation.ok || !context) {
  setFixtureFailure();
} else {
  renderModel = createRenderModel(validation.value);
  drawBoard(renderModel, canvasPalette());
  document.body.dataset.ready = "true";
  document.body.dataset.fixtureState = "valid";
  fixtureStatus.textContent = "Fixture validated";
  fixtureCounts.textContent = `${validation.value.objects.length.toLocaleString("en-US")} objects · ${validation.value.connections.length.toLocaleString("en-US")} relationships`;
  fixtureHash.textContent = `SHA-256 ${DESKTOP_SPIKE_FIXTURE_SHA256}`;
  boardDescription.textContent = `The fixed canvas renders all ${validation.value.objects.length.toLocaleString("en-US")} synthetic objects and ${validation.value.connections.length.toLocaleString("en-US")} typed relationships. Use Structured outline for the complete non-spatial equivalent.`;
  runButton.disabled = false;
  runButton.addEventListener("click", runFrameMeasurement);
  requestAnimationFrame(() => runFrameMeasurement());
}
