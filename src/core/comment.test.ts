import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commentBody } from "./comment.js";
import { STICKY_MARKER } from "./types.js";
import type { RefCertificate } from "./types.js";

const cert: RefCertificate = {
  id: "abc-cert",
  issued_at: "2026-08-18T00:00:00Z",
  new_sha: "deadbeef",
  old_sha: "0".repeat(40),
  node_did: "did:key:z6Mknode",
  pusher_did: "did:key:z6Mkpusher",
  ref_name: "refs/heads/main",
  signature: "sig",
};

describe("commentBody", () => {
  it("includes sticky marker, sha, and public-copy warning", () => {
    const body = commentBody({
      sha: "deadbeef",
      cert,
      did: "did:key:z6Mkpusher",
      repo: "widgets",
      node: "https://node.gitlawb.com",
    });
    assert.match(body, new RegExp(STICKY_MARKER));
    assert.match(body, /deadbeef/);
    assert.match(body, /abc-cert/);
    assert.match(body, /signed public copy/i);
    assert.match(body, /explorer\.gitlawb\.com/);
  });
});
