import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rulesDocument = JSON.parse(
  await readFile(new URL("../database.rules.json", import.meta.url), "utf8"),
);
const rules = rulesDocument.rules;

test("Realtime Database denies root reads and writes by default", () => {
  assert.equal(rules[".read"], false);
  assert.equal(rules[".write"], false);
});

test("bin directory and metadata are authenticated read-only", () => {
  const warehouseRules = rules.warehouses.$warehouseId;
  assert.equal(
    warehouseRules.binIndex[".read"],
    "auth != null && auth.token.dashboardReader == true",
  );
  assert.equal(warehouseRules.binIndex[".write"], false);
  assert.equal(
    warehouseRules.bins.$binId.metadata[".read"],
    "auth != null && auth.token.dashboardReader == true",
  );
  assert.equal(warehouseRules.bins.$binId.metadata[".write"], false);
});

test("only a token scoped to a bin can write its latest and history nodes", () => {
  const binRules = rules.warehouses.$warehouseId.bins.$binId;
  for (const node of ["latest", "history"]) {
    assert.equal(
      binRules[node][".read"],
      "auth != null && auth.token.dashboardReader == true",
    );
    assert.match(binRules[node][".write"], /auth != null/);
    assert.match(binRules[node][".write"], /auth\.token\.deviceWriter == true/);
    assert.match(binRules[node][".write"], /auth\.token\.binId == \$binId/);
  }
});
