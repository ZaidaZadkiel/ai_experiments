import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const VIEWS_DIR = join(import.meta.dirname, "views");

/** The fixed, predefined placeholders (FR-12). Written as {{__NAME__}} in templates. */
export const PLACEHOLDERS = new Set([
  "NAME",
  "ROW_NAME",
  "NAME_URL",
  "MESSAGE",
  "CONSIDERED",
  "ROWS",
  "NAME_RULE",
]);

const PLACEHOLDER_PATTERN = /\{\{__([A-Z]+(?:_[A-Z]+)*)__\}\}/g;

/** Reads a template from disk. Never cached, so edits show on the next request (FR-13). */
export async function loadTemplate(viewsDir, file) {
  return readFile(join(viewsDir, file), "utf8");
}

/**
 * Fills a template's placeholders in a single pass, so a value that itself
 * contains a placeholder is never replaced again. Values must already be
 * HTML-safe; the caller decides how each one is made safe (FR-7).
 * Placeholders with no value become "". Unknown placeholders are left as they are.
 */
export function fillTemplate(template, values = {}) {
  for (const key of Object.keys(values)) {
    if (!PLACEHOLDERS.has(key)) throw new Error(`Unknown placeholder: ${key}`);
  }
  return template.replace(PLACEHOLDER_PATTERN, (match, key) =>
    PLACEHOLDERS.has(key) ? String(values[key] ?? "") : match,
  );
}

export async function renderTemplate(viewsDir, file, values) {
  return fillTemplate(await loadTemplate(viewsDir, file), values);
}
