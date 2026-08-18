import { existsSync } from "node:fs";
import { identityPemPath, resolveIdentityDir } from "../core/paths.js";
import { collapseDid } from "../core/certs.js";
import { gitRoot, isGitRepo, remoteUrl } from "../core/git.js";
import { parseGithubRemote } from "../core/github.js";
import { showDid } from "../core/identity.js";
import { readMapping } from "../core/mapping.js";
import { ensureTools } from "../core/tools.js";
import type { CliOptions } from "../core/types.js";

export async function cmdStatus(opts: CliOptions): Promise<number> {
  const dir = resolveIdentityDir(opts.dir);
  const pem = identityPemPath(dir);
  const hasPem = existsSync(pem);
  let did: string | null = null;
  if (hasPem) {
    try {
      const tools = ensureTools();
      did = showDid(tools, { node: opts.node, dir });
    } catch {
      did = null;
    }
  }

  const root = isGitRepo() ? gitRoot() : null;
  const mapping = root ? readMapping(root) : null;
  const origin = root ? remoteUrl("origin", root) : null;
  const gitlawb = root ? remoteUrl("gitlawb", root) : null;

  const out = {
    identityDir: dir,
    hasIdentity: hasPem,
    did,
    didCollapsed: did ? collapseDid(did) : null,
    node: mapping?.node || opts.node,
    inGitRepo: Boolean(root),
    origin,
    github: origin ? parseGithubRemote(origin) : null,
    gitlawbRemote: gitlawb,
    mapping,
  };

  if (opts.showPemHint) {
    if (!hasPem) {
      console.error("no identity.pem — run gitlawb-sidecar init");
      return 1;
    }
    if (opts.json) {
      console.log(JSON.stringify({ hint: "copy identity.pem into GITLAWB_IDENTITY_PEM", path: pem }, null, 2));
    } else {
      console.log(`Add this file as repo secret GITLAWB_IDENTITY_PEM:\n  ${pem}`);
      console.log("Never commit it. Treat it as a root credential.");
    }
    return 0;
  }

  if (opts.json) {
    console.log(JSON.stringify(out, null, 2));
    return 0;
  }

  console.log(`identity   ${out.didCollapsed ?? "(none)"}`);
  console.log(`dir        ${dir}${hasPem ? "" : "  (missing identity.pem)"}`);
  console.log(`node       ${out.node}`);
  console.log(`origin     ${origin ?? "(none)"}`);
  console.log(`gitlawb    ${gitlawb ?? "(none)"}`);
  if (mapping) {
    console.log(`mapped     ${mapping.gitlawbDid}/${mapping.gitlawbRepo}`);
  } else {
    console.log("mapped     (run gitlawb-sidecar init)");
  }
  return 0;
}
