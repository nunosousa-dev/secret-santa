import assert from "node:assert/strict";

// Server-response checks only; this does not replace interactive mobile/browser QA.
const base = new URL(process.env.BASE_URL ?? "http://localhost:3000");

async function get(path, expectedStatus = 200) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, expectedStatus, `${path}: unexpected HTTP status`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/, `${path}: expected HTML`);
  const html = await response.text();
  if (expectedStatus === 200) {
    assert.ok(/<html[^>]*lang="pt-PT"/.test(html), `${path}: missing Portuguese document language`);
  } else {
    // Next may send an error shell plus a client-rendered not-found payload.
    assert.ok(html.includes("Página não encontrada."), `${path}: missing Portuguese not-found fallback`);
  }
  return html;
}

const home = await get("/");
const stylesheet = home.match(/href="([^\"]+\.css(?:\?[^\"]*)?)"/);
assert.ok(stylesheet, "Home page must load its stylesheet");
const stylesheetResponse = await fetch(new URL(stylesheet[1].replaceAll("&amp;", "&"), base));
assert.equal(stylesheetResponse.status, 200, "Stylesheet must be served");
const paths = [...new Set([...home.matchAll(/href="(\/p\/[a-zA-Z0-9-]+)"/g)].map(match => match[1]))];
if (!paths.length) assert.ok(home.includes("A família está a chegar."), "Empty family must have an explanatory state");
for (const path of paths) {
  const html = await get(path);
  assert.ok(html.includes("A minha lista de desejos"), `${path}: missing wishes section`);
  assert.ok(html.includes('href="/#familia"'), `${path}: missing return navigation`);
}
await get("/p/perfil-inexistente", 404);
await get("/pagina-inexistente", 404);
const admin = await get("/admin");
assert.ok(!admin.includes("Perfis e ligações privadas"), "Anonymous admin page must not expose the dashboard");
console.log(`Passed: family page, ${paths.length} linked profiles, unknown routes, and protected admin entry.`);
