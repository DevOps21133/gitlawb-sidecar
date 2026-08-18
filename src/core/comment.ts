import { readFileSync } from "node:fs";
import { STICKY_MARKER } from "./types.js";
import { certsApiUrl, collapseDid, explorerRepoUrl } from "./certs.js";
import type { RefCertificate } from "./types.js";

export function commentBody(opts: {
  sha: string;
  cert: RefCertificate;
  did: string;
  repo: string;
  node: string;
}): string {
  const explorer = explorerRepoUrl(opts.did, opts.repo);
  const certs = certsApiUrl(opts.node, opts.did, opts.repo);
  return `${STICKY_MARKER}
### GitLawb sidecar

Signed public mirror of this SHA is on the gitlawb network.

- commit: \`${opts.sha}\`
- cert: \`${opts.cert.id}\`
- pusher: \`${collapseDid(opts.cert.pusher_did)}\`
- explorer: ${explorer}
- cert JSON: ${certs}

GitHub is the source of truth. This is a **signed public copy** — do not mirror private source.
`;
}

type GhComment = { id: number; body: string };

export async function upsertPrComment(opts: {
  token: string;
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
}): Promise<void> {
  const base = `https://api.github.com/repos/${opts.owner}/${opts.repo}`;
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${opts.token}`,
    "x-github-api-version": "2022-11-28",
    "user-agent": "gitlawb-sidecar",
  };

  const listRes = await fetch(`${base}/issues/${opts.prNumber}/comments?per_page=100`, {
    headers,
  });
  if (!listRes.ok) {
    throw new Error(`list PR comments failed: ${listRes.status}`);
  }
  const comments = (await listRes.json()) as GhComment[];
  const existing = comments.find((c) => c.body.includes(STICKY_MARKER));

  if (existing) {
    const res = await fetch(`${base}/issues/comments/${existing.id}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ body: opts.body }),
    });
    if (!res.ok) throw new Error(`update PR comment failed: ${res.status}`);
    return;
  }

  const res = await fetch(`${base}/issues/${opts.prNumber}/comments`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ body: opts.body }),
  });
  if (!res.ok) throw new Error(`create PR comment failed: ${res.status}`);
}

export async function setCommitStatus(opts: {
  token: string;
  owner: string;
  repo: string;
  sha: string;
  state: "success" | "failure" | "error";
  description: string;
  targetUrl?: string;
}): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${opts.owner}/${opts.repo}/statuses/${opts.sha}`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${opts.token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "gitlawb-sidecar",
      },
      body: JSON.stringify({
        state: opts.state,
        context: "gitlawb-sidecar",
        description: opts.description.slice(0, 140),
        target_url: opts.targetUrl,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`set commit status failed: ${res.status}`);
  }
}

export function prNumberFromEnv(): number | null {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) return null;
  try {
    const event = JSON.parse(readFileSync(path, "utf8")) as {
      number?: number;
      pull_request?: { number?: number };
    };
    return event.pull_request?.number ?? event.number ?? null;
  } catch {
    return null;
  }
}
