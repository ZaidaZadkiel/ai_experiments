import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeQueryValue, escapeHtml } from "../src/html.js";

test("escapeHtml converts every character that could break a page", () => {
  assert.equal(
    escapeHtml(`<script>alert("x") & 'y'</script>`),
    "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;",
  );
});

test("escapeHtml accepts numbers", () => {
  assert.equal(escapeHtml(3), "3");
});

test("encodeQueryValue encodes the value for a link, including apostrophes", () => {
  assert.equal(encodeQueryValue("O'Brien"), "O%27Brien");
  assert.equal(encodeQueryValue("Ada Lovelace"), "Ada%20Lovelace");
  assert.equal(encodeQueryValue("a&b=c#d"), "a%26b%3Dc%23d");
  assert.equal(encodeQueryValue("José"), "Jos%C3%A9");
});
