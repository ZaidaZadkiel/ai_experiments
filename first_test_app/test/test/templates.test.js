import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { fillTemplate, VIEWS_DIR } from "../src/templates.js";

test("fillTemplate replaces every occurrence of a placeholder", () => {
  assert.equal(
    fillTemplate("{{__NAME__}} and {{__NAME__}}", { NAME: "Ada" }),
    "Ada and Ada",
  );
});

test("fillTemplate turns placeholders without a value into empty text", () => {
  assert.equal(fillTemplate("[{{__MESSAGE__}}]"), "[]");
});

test("fillTemplate leaves text that is not a known placeholder untouched", () => {
  assert.equal(
    fillTemplate("{{__OTHER__}} {{NAME}}"),
    "{{__OTHER__}} {{NAME}}",
  );
});

test("fillTemplate never replaces a placeholder that arrives inside a value", () => {
  assert.equal(
    fillTemplate("{{__NAME__}} {{__ROWS__}}", {
      NAME: "{{__ROWS__}}",
      ROWS: "rows",
    }),
    "{{__ROWS__}} rows",
  );
});

test("fillTemplate rejects placeholders outside the fixed list (FR-12)", () => {
  assert.throws(
    () => fillTemplate("", { UNKNOWN: "x" }),
    /Unknown placeholder/,
  );
});

test("every template file named in the requirements exists", async () => {
  const files = await readdir(VIEWS_DIR);
  for (const file of [
    "index.html",
    "index-row.html",
    "index-empty.html",
    "greet.html",
    "greeting.html",
    "consider.html",
    "considered.html",
    "unknown.html",
    "name-rule.html",
  ]) {
    assert.ok(files.includes(file), `missing src/views/${file}`);
  }
});
