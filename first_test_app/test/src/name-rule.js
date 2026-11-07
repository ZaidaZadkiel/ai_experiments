// The one name rule for the server (FR-6, FR-21). See REQUIREMENTS.md, "Name rule".
// A browser copy lives in src/views/name-rule.html; test/name-rule.test.js checks they agree.

export const MAX_NAME_LENGTH = 50;

const HTML_ENTITIES = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
};
const URL_CHARACTERS = "?#%+/=";

function convertCharacter(character) {
  if (Object.hasOwn(HTML_ENTITIES, character)) return HTML_ENTITIES[character];
  if (URL_CHARACTERS.includes(character)) return "_";
  const code = character.codePointAt(0);
  if (code >= 32 && code <= 126) return character;
  return "_";
}

/**
 * Turns a name as received into its stored form: trims spaces at both ends,
 * keeps at most 50 characters (counted before conversion), then converts
 * HTML characters to entities and everything else outside the rule to "_".
 * Returns "" when nothing usable is left.
 */
export function normalizeName(raw) {
  const trimmed = String(raw ?? "")
    .replace(/^ +/, "")
    .replace(/ +$/, "");
  const characters = Array.from(trimmed).slice(0, MAX_NAME_LENGTH);
  while (characters.length > 0 && characters[characters.length - 1] === " ") {
    characters.pop();
  }
  return characters.map(convertCharacter).join("");
}
