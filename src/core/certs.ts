import type { RefCertificate } from "./types.js";

export type CertExpectation = {
  sha?: string;
  pusherDid?: string;
};

export type CertCheck = {
  ok: boolean;
  reasons: string[];
};

export function normalizeSha(sha: string): string {
  return sha.trim().toLowerCase();
}

export function findCertForSha(
  certs: RefCertificate[],
  sha: string,
): RefCertificate | undefined {
  const want = normalizeSha(sha);
  return certs.find((c) => normalizeSha(c.new_sha) === want);
}

export function checkCert(
  cert: RefCertificate,
  expected: CertExpectation = {},
): CertCheck {
  const reasons: string[] = [];
  if (!cert.id) reasons.push("certificate is missing id");
  if (!cert.signature) reasons.push("certificate is missing signature");
  if (!cert.pusher_did) reasons.push("certificate is missing pusher_did");
  if (!cert.new_sha) reasons.push("certificate is missing new_sha");
  if (expected.sha && normalizeSha(cert.new_sha) !== normalizeSha(expected.sha)) {
    reasons.push(
      `new_sha ${cert.new_sha} does not match expected ${expected.sha}`,
    );
  }
  if (
    expected.pusherDid &&
    cert.pusher_did.trim() !== expected.pusherDid.trim()
  ) {
    reasons.push(
      `pusher_did ${cert.pusher_did} does not match ${expected.pusherDid}`,
    );
  }
  return { ok: reasons.length === 0, reasons };
}

export function didKeyPart(did: string): string {
  const trimmed = did.trim();
  if (trimmed.startsWith("did:key:")) return trimmed.slice("did:key:".length);
  return trimmed;
}

export function collapseDid(did: string): string {
  const key = didKeyPart(did);
  if (key.length <= 16) return did.startsWith("did:key:") ? did : `did:key:${key}`;
  return `did:key:${key.slice(0, 8)}…${key.slice(-4)}`;
}

export function explorerRepoUrl(did: string, repo: string): string {
  return `https://explorer.gitlawb.com/repos/${didKeyPart(did)}/${repo}`;
}

export function certsApiUrl(node: string, did: string, repo: string): string {
  const base = node.replace(/\/$/, "");
  return `${base}/api/v1/repos/${encodeURIComponent(did)}/${encodeURIComponent(repo)}/certs`;
}
