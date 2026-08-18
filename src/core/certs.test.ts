import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkCert,
  collapseDid,
  didKeyPart,
  findCertForSha,
  normalizeSha,
} from "./certs.js";
import type { RefCertificate } from "./types.js";

const cert: RefCertificate = {
  id: "5e6e1291-bf06-413a-afa2-a29e82c1c8c1",
  issued_at: "2026-08-18T08:00:40.511525053+00:00",
  new_sha: "b062e9504faab4ca0124aa05d44967ebbe2d7e0f",
  old_sha: "e36387d8f91ef59320567258e60a4c07ec057be7",
  node_did: "did:key:z6Mkicjkc95VcFx38Xg2SvFV2ENsu3dLDoWborjPGVodHXoH",
  pusher_did: "did:key:z6MkgXfjsErZLG6subweEo25PwDTKuP5q2XXjg91rs5gyCZz",
  ref_name: "refs/heads/main",
  signature: "3N5qAXP1tEPimXZprLvyL4pnIQcMFuTHHJiIJCtTTkDtPW-Ddv2UzfJaeLQn2MIQutQBhCXCvPJft2Cl2A3MAA",
};

describe("certs", () => {
  it("normalizes sha case", () => {
    assert.equal(normalizeSha("ABC"), "abc");
  });

  it("finds cert by sha ignoring case", () => {
    const found = findCertForSha([cert], cert.new_sha.toUpperCase());
    assert.equal(found?.id, cert.id);
  });

  it("passes matching sha and pusher", () => {
    const r = checkCert(cert, {
      sha: cert.new_sha,
      pusherDid: cert.pusher_did,
    });
    assert.equal(r.ok, true);
    assert.deepEqual(r.reasons, []);
  });

  it("fails on sha mismatch", () => {
    const r = checkCert(cert, { sha: "0".repeat(40) });
    assert.equal(r.ok, false);
    assert.match(r.reasons[0] ?? "", /does not match/);
  });

  it("fails on pusher mismatch", () => {
    const r = checkCert(cert, { pusherDid: "did:key:z6Mkother" });
    assert.equal(r.ok, false);
  });

  it("collapses dids", () => {
    assert.equal(didKeyPart(cert.pusher_did).startsWith("z6Mk"), true);
    assert.match(collapseDid(cert.pusher_did), /did:key:z6MkgXfj…yCZz/);
  });
});
