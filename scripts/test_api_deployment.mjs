import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../api-deployment.js", import.meta.url), "utf8");
const defaultBaseUrl = "https://backend.branch.flowengineering.com";
const storageKey = "flow-api-base-url";

function visit(value, storage = new Map(), storageUnavailable = false) {
  let variables;
  runInNewContext(script, {
    URL, URLSearchParams,
    window: {
      location: { search: value === undefined ? "" : `?apiBaseUrl=${encodeURIComponent(value)}` },
      get sessionStorage() {
        if (storageUnavailable) throw new Error("Storage disabled");
        return {
          getItem: key => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, value),
          removeItem: key => storage.delete(key),
        };
      },
      mintlify: { api: { playground: {
        setServerVariables: value => { variables = value; },
      } } },
    },
  });
  return variables.baseUrl;
}

test("app links select only supported hosted backend roots", () => {
  for (const value of [
    defaultBaseUrl,
    "https://backend.acme.branch.flowengineering.com",
    "https://acme.backend.branch.flowengineering.com",
    "https://backend.acme-west.branch.flowengineering.com/",
  ]) {
    assert.equal(visit(value), new URL(value).origin);
  }
});

test("reject untrusted hosts, protocols, credentials, paths, and malformed links", () => {
  for (const value of [
    "", "not a URL", "javascript:alert(1)", "http://backend.branch.flowengineering.com",
    "https://backend.branch.flowengineering.com.attacker.example",
    "https://attacker.example/backend.branch.flowengineering.com",
    "https://backend.deployment-test-branch.flowengineering.com",
    "https://backend.govcloud.example", "https://localhost", "http://localhost:3000",
    "https://backend.-acme.branch.flowengineering.com",
    "https://backend.acme-.branch.flowengineering.com",
    "https://app.acme.branch.flowengineering.com",
    "https://backend.acme.extra.branch.flowengineering.com",
    `${defaultBaseUrl}:8443`, `${defaultBaseUrl}/customer-api`,
    `${defaultBaseUrl}?redirect=bad`, `${defaultBaseUrl}#bad`,
    "https://user:password@backend.branch.flowengineering.com",
  ]) {
    const storage = new Map([[storageKey, "https://backend.acme.branch.flowengineering.com"]]);
    assert.equal(visit(value, storage), defaultBaseUrl, value);
    assert.equal(storage.has(storageKey), false, value);
  }
});

test("selection survives reloads and updates when opened from another app", () => {
  const storage = new Map();
  const first = "https://backend.acme.branch.flowengineering.com";
  const second = "https://backend.other.branch.flowengineering.com";
  assert.equal(visit(first, storage), first);
  assert.equal(visit(undefined, storage), first);
  assert.equal(visit(second, storage), second);
  assert.equal(visit(undefined, storage), second);
  assert.equal(visit(defaultBaseUrl, storage), defaultBaseUrl);
  assert.equal(visit(undefined, storage), defaultBaseUrl);
});

test("direct visits and invalid stored URLs use the public default", () => {
  assert.equal(visit(), defaultBaseUrl);
  assert.equal(visit(undefined, new Map([[storageKey, "https://attacker.example"]])), defaultBaseUrl);
});

test("links and direct visits work with browser storage disabled", () => {
  const baseUrl = "https://backend.acme.branch.flowengineering.com";
  assert.equal(visit(baseUrl, new Map(), true), baseUrl);
  assert.equal(visit(undefined, new Map(), true), defaultBaseUrl);
});

test("checked-in spec defines the runtime server variable and public default", () => {
  const spec = JSON.parse(readFileSync(new URL("../openapi/customer-api.json", import.meta.url)));
  assert.deepEqual(spec.servers, [{
    description: "Flow API", url: "{baseUrl}",
    variables: { baseUrl: { default: defaultBaseUrl } },
  }]);
});
