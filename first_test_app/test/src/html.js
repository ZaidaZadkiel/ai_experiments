const ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Makes any text safe to place in a page or an attribute value (FR-7). */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ENTITIES[character]);
}

/**
 * URL-encodes a query value for a link. Also encodes ! ' ( ) * so that,
 * for example, O'Brien becomes O%27Brien.
 */
export function encodeQueryValue(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      "%" + character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
  );
}
