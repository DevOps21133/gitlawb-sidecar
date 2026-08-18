import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GitlawbClient } from "./client.js";
import { DEFAULT_NODE } from "./types.js";

const live = process.env.GITLAWB_LIVE === "1";
const DARWIN_DID =
  "did:key:z6MkgXfjsErZLG6subweEo25PwDTKuP5q2XXjg91rs5gyCZz";

describe("live node.gitlawb.com", { skip: !live }, () => {
  const client = new GitlawbClient(DEFAULT_NODE);

  it("health is ok", async () => {
    const h = await client.health();
    assert.equal(h.status, "ok");
  });

  it("reads darwin-ledger certs", async () => {
    const certs = await client.certs(DARWIN_DID, "darwin-ledger");
    assert.ok(certs.count >= 1);
    assert.ok(certs.certificates[0]?.signature);
    assert.ok(certs.certificates[0]?.new_sha);
  });

  it("reads darwin-ledger README blob", async () => {
    const text = await client.blob(DARWIN_DID, "darwin-ledger", "README.md");
    assert.match(text, /Darwin Ledger/);
  });
});
