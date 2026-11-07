import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";
import { MAX_NAME_LENGTH, normalizeName } from "../src/name-rule.js";

const EXAMPLES = [
  // The examples table in REQUIREMENTS.md, "Name rule".
  ["Juan Perez", "Juan Perez"],
  ["  Juan", "Juan"],
  ["José", "Jos_"],
  ["O'Brien", "O&#39;Brien"],
  ["AC/DC", "AC_DC"],
  ["   ", ""],
  // One example per row of the conversion table.
  ["Ada_Lovelace 99", "Ada_Lovelace 99"],
  [
    "! $ ( ) * , - . : ; @ [ \\ ] ^ { | } ~ `",
    "! $ ( ) * , - . : ; @ [ \\ ] ^ { | } ~ `",
  ],
  [`<>&"'`, "&lt;&gt;&amp;&quot;&#39;"],
  ["?#%+/=", "______"],
  ["ñandú", "_and_"],
  ["a\tb\nc\u0000d", "a_b_c_d"],
  ["😀", "_"],
  ["", ""],
];

for (const [input, expected] of EXAMPLES) {
  test(`normalizeName(${JSON.stringify(input)}) is ${JSON.stringify(expected)}`, () => {
    assert.equal(normalizeName(input), expected);
  });
}

test("normalizeName treats a missing value as empty", () => {
  assert.equal(normalizeName(undefined), "");
  assert.equal(normalizeName(null), "");
});

test("the maximum length is counted before conversion", () => {
  assert.equal(normalizeName("a".repeat(60)), "a".repeat(MAX_NAME_LENGTH));
  assert.equal(normalizeName('"'.repeat(60)), "&quot;".repeat(MAX_NAME_LENGTH));
});

test("a space left at the end by the length limit is trimmed", () => {
  assert.equal(normalizeName("a".repeat(49) + "  b"), "a".repeat(49));
});

test("only spaces are trimmed; a tab at the start becomes _", () => {
  assert.equal(normalizeName("\tJuan"), "_Juan");
});

async function loadBrowserNormalizeName() {
  const html = await readFile(
    join(import.meta.dirname, "..", "src", "views", "name-rule.html"),
    "utf8",
  );
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script, "name-rule.html must contain a <script>");
  const context = vm.createContext({});
  vm.runInContext(script, context);
  return context.normalizeName;
}

function sampleInputs() {
  const inputs = EXAMPLES.map(([input]) => input);
  for (let code = 0; code <= 0x17f; code++)
    inputs.push(String.fromCodePoint(code));
  inputs.push("😀 emoji", "a".repeat(60), " ".repeat(5) + "x" + " ".repeat(5));
  // Deterministic pseudo-random strings mixing every kind of character.
  const pool = Array.from(`aZ09_ -!$<>&"'?#%+/=é\t\n😀`);
  let seed = 42;
  for (let i = 0; i < 300; i++) {
    let text = "";
    const length = i % 70;
    for (let j = 0; j < length; j++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      text += pool[seed % pool.length];
    }
    inputs.push(text);
  }
  return inputs;
}

test("the browser name check gives the same result as the server (FR-6)", async () => {
  const browserNormalizeName = await loadBrowserNormalizeName();
  for (const input of sampleInputs()) {
    assert.equal(
      browserNormalizeName(input),
      normalizeName(input),
      `different result for ${JSON.stringify(input)}`,
    );
  }
});
