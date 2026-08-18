import { GitlawbClient } from "../core/client.js";
import {
  certsApiUrl,
  checkCert,
  explorerRepoUrl,
  findCertForSha,
} from "../core/certs.js";
import { gitRoot, headSha, isGitRepo } from "../core/git.js";
import { showDid } from "../core/identity.js";
import { readMapping } from "../core/mapping.js";
import { resolveIdentityDir } from "../core/paths.js";
import { ensureTools } from "../core/tools.js";
import type { CliOptions } from "../core/types.js";

export async function cmdVerify(opts: CliOptions): Promise<number> {
  if (!isGitRepo()) {
    console.error("not a git repository");
    return 1;
  }
  const root = gitRoot();
  const mapping = readMapping(root);
  if (!mapping) {
    console.error("no .gitlawb-sidecar.json — run gitlawb-sidecar init first");
    return 1;
  }
  const tools = ensureTools();
  const dir = resolveIdentityDir(opts.dir);
  const did = mapping.gitlawbDid || showDid(tools, { node: mapping.node, dir });
  const sha = opts.ref && /^[0-9a-f]{7,40}$/i.test(opts.ref) ? opts.ref : headSha(root);

  const client = new GitlawbClient(mapping.node);
  const certs = await client.certs(did, mapping.gitlawbRepo);
  const cert = findCertForSha(certs.certificates, sha);
  if (!cert) {
    const payload = {
      ok: false,
      sha,
      reasons: [`no certificate for ${sha}`],
      certsUrl: certsApiUrl(mapping.node, did, mapping.gitlawbRepo),
    };
    if (opts.json) console.log(JSON.stringify(payload, null, 2));
    else console.error(payload.reasons[0]);
    return 1;
  }
  const checked = checkCert(cert, { sha, pusherDid: did });
  const payload = {
    ok: checked.ok,
    sha,
    certId: cert.id,
    pusher: cert.pusher_did,
    reasons: checked.reasons,
    explorer: explorerRepoUrl(did, mapping.gitlawbRepo),
    certsUrl: certsApiUrl(mapping.node, did, mapping.gitlawbRepo),
  };
  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else if (checked.ok) {
    console.log(`ok  ${sha.slice(0, 12)}  cert ${cert.id}`);
    console.log(payload.explorer);
  } else {
    console.error(checked.reasons.join("\n"));
  }
  return checked.ok ? 0 : 1;
}
