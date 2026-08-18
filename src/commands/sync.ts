import { GitlawbClient } from "../core/client.js";
import {
  checkCert,
  explorerRepoUrl,
  findCertForSha,
} from "../core/certs.js";
import {
  commentBody,
  prNumberFromEnv,
  setCommitStatus,
  upsertPrComment,
} from "../core/comment.js";
import {
  addOrUpdateRemote,
  currentBranch,
  gitRoot,
  gitlawbRemoteUrl,
  headSha,
  isGitRepo,
  pushGitlawb,
} from "../core/git.js";
import { showDid } from "../core/identity.js";
import { readMapping } from "../core/mapping.js";
import { identityPemPath, resolveIdentityDir } from "../core/paths.js";
import { ensureTools } from "../core/tools.js";
import type { CliOptions } from "../core/types.js";

export async function cmdSync(opts: CliOptions): Promise<number> {
  if (!isGitRepo()) {
    console.error("not a git repository");
    return 1;
  }
  const root = gitRoot();
  const mapping = readMapping(root);
  const tools = ensureTools();
  const dir = resolveIdentityDir(opts.dir);
  const node = mapping?.node || opts.node;
  const did = mapping?.gitlawbDid || showDid(tools, { node, dir });
  const repo = mapping?.gitlawbRepo;
  if (!repo) {
    console.error("no .gitlawb-sidecar.json — run gitlawb-sidecar init first");
    return 1;
  }

  addOrUpdateRemote("gitlawb", gitlawbRemoteUrl(did, repo), root);

  const sha = headSha(root);
  const branch =
    opts.ref ||
    process.env.GITHUB_HEAD_REF ||
    currentBranch(root) ||
    `sidecar-${sha.slice(0, 12)}`;
  const refspec = `HEAD:refs/heads/${branch}`;

  try {
    pushGitlawb({
      tools,
      node,
      identityPem: identityPemPath(dir),
      cwd: root,
      refspec,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await maybeReportGithub({
      opts,
      sha,
      ok: false,
      description: "gitlawb push failed",
      explorer: explorerRepoUrl(did, repo),
    });
    console.error(msg);
    return 1;
  }

  const client = new GitlawbClient(node);
  const certs = await client.certs(did, repo);
  const cert = findCertForSha(certs.certificates, sha);
  if (!cert) {
    await maybeReportGithub({
      opts,
      sha,
      ok: false,
      description: "no certificate for SHA",
      explorer: explorerRepoUrl(did, repo),
    });
    console.error(`pushed ${sha} but no matching certificate`);
    return 1;
  }
  const checked = checkCert(cert, { sha, pusherDid: did });
  if (!checked.ok) {
    await maybeReportGithub({
      opts,
      sha,
      ok: false,
      description: checked.reasons[0] ?? "cert check failed",
      explorer: explorerRepoUrl(did, repo),
    });
    console.error(checked.reasons.join("\n"));
    return 1;
  }

  if (opts.commentPr) {
    await maybeReportGithub({
      opts,
      sha,
      ok: true,
      description: `cert ${cert.id.slice(0, 8)}`,
      explorer: explorerRepoUrl(did, repo),
      comment: commentBody({ sha, cert, did, repo, node }),
    });
  }

  const out = {
    sha,
    branch,
    certId: cert.id,
    explorer: explorerRepoUrl(did, repo),
    pusher: cert.pusher_did,
  };
  if (opts.json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(`synced ${sha.slice(0, 12)}  cert ${cert.id}`);
    console.log(out.explorer);
  }
  return 0;
}

async function maybeReportGithub(args: {
  opts: CliOptions;
  sha: string;
  ok: boolean;
  description: string;
  explorer: string;
  comment?: string;
}): Promise<void> {
  if (!args.opts.commentPr) return;
  const token = process.env.GITHUB_TOKEN;
  const slugged = process.env.GITHUB_REPOSITORY;
  if (!token || !slugged) return;
  const [owner, repo] = slugged.split("/");
  if (!owner || !repo) return;
  try {
    await setCommitStatus({
      token,
      owner,
      repo,
      sha: args.sha,
      state: args.ok ? "success" : "failure",
      description: args.description,
      targetUrl: args.explorer,
    });
    const pr = prNumberFromEnv();
    if (pr && args.comment) {
      await upsertPrComment({
        token,
        owner,
        repo,
        prNumber: pr,
        body: args.comment,
      });
    }
  } catch (err) {
    console.error(
      `github report skipped: ${err instanceof Error ? err.message : err}`,
    );
  }
}
