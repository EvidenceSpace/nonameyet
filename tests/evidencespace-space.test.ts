import assert from "node:assert/strict";
import test from "node:test";

import {
  TEMPLATES,
  boundsOf,
  buildTemplate,
  clipToBox,
  defaultWorkspace,
  newBoard,
  pendingSuggestions,
  sanitizeWorkspace,
  storageKey,
  strokeHit,
  strokePath,
} from "../web/evidencespace-pages/space-model.js";

test("every template builds a board whose links point at its own items", () => {
  for (const { id } of TEMPLATES) {
    for (const withCaseContent of [true, false]) {
      const board = buildTemplate(id, { withCaseContent });
      const ids = new Set(board.items.map((item) => item.id));
      assert.equal(ids.size, board.items.length, `${id} has unique item ids`);
      for (const link of board.links) {
        assert.ok(ids.has(link.from) && ids.has(link.to), `${id} link ${link.id} is connected`);
      }
    }
  }
  assert.equal(buildTemplate("blank").items.length, 0);
});

test("the default workspace opens on a case map that survives a storage round trip", () => {
  const workspace = defaultWorkspace();
  assert.equal(workspace.boards.length, 1);
  assert.equal(workspace.boards[0].name, "Case map");
  const restored = sanitizeWorkspace(JSON.parse(JSON.stringify(workspace)));
  assert.deepEqual(restored.boards[0].items, workspace.boards[0].items);
  assert.deepEqual(restored.boards[0].links, workspace.boards[0].links);
  assert.equal(restored.activeId, workspace.activeId);
  assert.equal(storageKey("C-03"), "evidencespace.space.v1.C-03");
});

test("stored boards are validated before they are drawn", () => {
  const board = newBoard("blank", { name: "  Notes  " });
  const raw = {
    version: 1,
    activeId: "missing",
    boards: [{
      ...board,
      items: [
        { id: "ok1", type: "note", x: 10, y: 20, w: 100, h: 80, text: "<img src=x onerror=alert(1)>", color: "neon" },
        { id: "bad id!", type: "note", x: 0, y: 0 },
        { id: "ev1", type: "evidence", ref: "E-99", x: 0, y: 0 },
        { id: "ev2", type: "evidence", ref: "E-04", x: "nope", y: Infinity, w: -5 },
        { id: "q1", type: "question", text: "Custom question" },
        { id: "x1", type: "script", x: 0, y: 0 },
      ],
      links: [
        { id: "l1", from: "ok1", to: "ev2", kind: "supports" },
        { id: "l2", from: "ok1", to: "ev1", kind: "supports" },
        { id: "l3", from: "ok1", to: "ok1", kind: "supports" },
        { id: "l4", from: "q1", to: "ev2", kind: "weird", label: 42 },
      ],
      strokes: [{ id: "s1", points: [[0, 0], [5, 5]], color: "ink", size: 3 }, { id: "s2", points: [[1, 1]] }],
    }],
  };
  const workspace = sanitizeWorkspace(raw);
  const [restored] = workspace.boards;
  assert.equal(workspace.activeId, restored.id);
  assert.equal(restored.name, "Notes");
  assert.deepEqual(restored.items.map((item) => item.id), ["ok1", "ev2", "q1"]);
  assert.equal(restored.items[0].color, "yellow");
  assert.equal(restored.items[0].text, "<img src=x onerror=alert(1)>", "text is kept as data and escaped when drawn");
  assert.equal(restored.items[1].x, 0);
  assert.equal(restored.items[1].w, 24);
  assert.deepEqual(restored.links.map((link) => [link.id, link.kind, link.label]), [["l1", "supports", ""], ["l4", "related", ""]]);
  assert.deepEqual(restored.strokes.map((stroke) => stroke.id), ["s1"]);
  assert.equal(sanitizeWorkspace({ version: 2, boards: [board] }), null);
  assert.equal(sanitizeWorkspace({ version: 1, boards: [] }), null);
});

test("geometry helpers clip links to card edges and hit-test drawings", () => {
  const item = { x: 0, y: 0, w: 100, h: 50 };
  assert.deepEqual(clipToBox(item, 500, 25, 0), [100, 25]);
  assert.deepEqual(clipToBox(item, 50, -500, 0), [50, 0]);
  const stroke = { points: [[0, 0], [100, 0]], size: 4 };
  assert.equal(strokeHit(stroke, 50, 3, 2), true);
  assert.equal(strokeHit(stroke, 50, 20, 2), false);
  assert.match(strokePath([[0, 0], [10, 10], [20, 0]]), /^M0 0 Q10 10 15 5 L20 0$/);
  assert.deepEqual(boundsOf({ items: [item], strokes: [{ points: [[-10, 80], [5, 5]] }] }), { x: -10, y: 0, w: 110, h: 80 });
});

test("link suggestions only appear when both ends are on the board and unlinked", () => {
  const board = defaultWorkspace().boards[0];
  const keys = pendingSuggestions(board).map((entry) => entry.key);
  assert.deepEqual(keys.sort(), ["E-02>E-01", "E-06>E-05"]);
  assert.deepEqual(pendingSuggestions(board, new Set(["E-02>E-01"])).map((entry) => entry.key), ["E-06>E-05"]);
  assert.deepEqual(pendingSuggestions({ items: [], links: [], strokes: [] }), []);
});
