import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { GitlawbClient } from "../core/client.js";
import { checkCert, collapseDid, explorerRepoUrl, findCertForSha } from "../core/certs.js";
import {
  addOrUpdateRemote,
  currentBranch,
  gitRoot,
  gitlawbRemoteUrl,
  headSha,
  isGitRepo,
  pushGitlawb,
  remoteUrl,
} from "../core/git.js";
import { parseGithubRemote, githubHttpsUrl } from "../core/github.js";
import { createRepo, ensureIdentity, register } from "../core/identity.js";
import { writeIntegrations } from "../core/integrate.js";
import { writeMapping } from "../core/mapping.js";
import { identityPemPath, resolveIdentityDir } from "../core/paths.js";
import { ensureTools } from "../core/tools.js";
import type { CliOptions } from "../core/types.js";

export async function cmdInit(opts: CliOptions): Promise<number> {
  if (!isGitRepo()) {
    console.error("not a git repository — run this inside a repo (GitHub origin stays untouched)");
    return 1;
  }
  const root = gitRoot();
  const tools = ensureTools();
  const dir = resolveIdentityDir(opts.dir);
  const node = opts.node;

  const origin = remoteUrl("origin", root);
  const github = origin ? parseGithubRemote(origin) : null;
  const repoName =
    opts.name ||
    github?.repo ||
    basename(root).replace(/[^A-Za-z0-9._-]+/g, "-");
  const description =
    opts.description ||
    (github
      ? `signed public mirror of ${githubHttpsUrl(github)}`
      : "signed public mirror via gitlawb-sidecar");

  const did = ensureIdentity(tools, { node, dir });
  register(tools, { node, dir });
  createRepo(tools, { node, dir, name: repoName, description });

  addOrUpdateRemote("gitlawb", gitlawbRemoteUrl(did, repoName), root);

  const branch = currentBranch(root);
  const sha = headSha(root);
  const dest = branch ?? `sidecar-${sha.slice(0, 12)}`;
  console.log(`pushing ${sha.slice(0, 12)} → gitlawb ${dest}`);
  pushGitlawb({
    tools,
    node,
    identityPem: identityPemPath(dir),
    cwd: root,
    refspec: `HEAD:refs/heads/${dest}`,
  });

  const client = new GitlawbClient(node);
  const certs = await client.certs(did, repoName);
  const cert = findCertForSha(certs.certificates, sha);
  if (!cert) {
    console.error(
      `pushed ${sha} but no matching certificate yet — try: gitlawb-sidecar verify`,
    );
  } else {
    const checked = checkCert(cert, { sha, pusherDid: did });
    if (!checked.ok) {
      console.error(`certificate found but checks failed:\n- ${checked.reasons.join("\n- ")}`);
    }
  }

  writeMapping(root, {
    version: 1,
    github,
    gitlawbDid: did,
    gitlawbRepo: repoName,
    node,
    createdAt: new Date().toISOString(),
  });

  const written: string[] = [];
  if (opts.integrate) {
    written.push(
      ...writeIntegrations(root, { hasCursor: existsSync(join(root, ".cursor")) }),
    );
  }

  const summary = {
    github: github ? githubHttpsUrl(github) : null,
    originUntouched: true,
    did: collapseDid(did),
    didFull: did,
    gitlawbRepo: repoName,
    node,
    sha,
    certId: cert?.id ?? null,
    explorer: explorerRepoUrl(did, repoName),
    files: written,
    next:
      "add repo secret GITLAWB_IDENTITY_PEM (contents of identity.pem) so GitHub Actions can sign",
    warning:
      "GitLawb mirrors are public. Do not use this on private source.",
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("");
    console.log("GitLawb sidecar is set up. GitHub origin was not changed.");
    if (summary.github) console.log(`  GitHub     ${summary.github}`);
    console.log(`  GitLawb    ${summary.explorer}`);
    console.log(`  identity   ${summary.did}`);
    console.log(`  commit     ${sha}`);
    console.log(`  cert       ${summary.certId ?? "(pending)"}`);
    if (written.length) {
      console.log("  wrote");
      for (const f of written) console.log(`    ${f}`);
    }
    console.log("");
    console.log("This copy is public. Do not mirror private source.");
    console.log(
      "For Actions: store identity.pem in repo secret GITLAWB_IDENTITY_PEM",
    );
  }
  return 0;
}
