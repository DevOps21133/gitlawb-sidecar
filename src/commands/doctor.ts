import { existsSync } from "node:fs";
import { GitlawbClient } from "../core/client.js";
import { gitRoot, isGitRepo, remoteUrl } from "../core/git.js";
import { parseGithubRemote } from "../core/github.js";
import { showDid } from "../core/identity.js";
import { readMapping } from "../core/mapping.js";
import { identityPemPath, resolveIdentityDir } from "../core/paths.js";
import { ensureTools } from "../core/tools.js";
import type { CliOptions, DoctorCheck } from "../core/types.js";

export async function cmdDoctor(opts: CliOptions): Promise<number> {
  const checks: DoctorCheck[] = [];
  const dir = resolveIdentityDir(opts.dir);

  try {
    const tools = ensureTools();
    checks.push({
      name: "git-remote-gitlawb",
      ok: existsSync(tools.helper),
      detail: tools.helper,
    });
    checks.push({
      name: "hidden gl binary",
      ok: existsSync(tools.gl),
      detail: `${tools.gl} (not on your PATH as gl)`,
    });
  } catch (err) {
    checks.push({
      name: "gitlawb tools",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  const pem = identityPemPath(dir);
  checks.push({
    name: "identity.pem",
    ok: existsSync(pem),
    detail: existsSync(pem) ? pem : `${pem} missing — run gitlawb-sidecar init`,
  });

  if (existsSync(pem)) {
    try {
      const tools = ensureTools();
      const did = showDid(tools, { node: opts.node, dir });
      checks.push({ name: "did", ok: Boolean(did), detail: did });
    } catch (err) {
      checks.push({
        name: "did",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    const health = await new GitlawbClient(opts.node).health();
    checks.push({
      name: "node health",
      ok: health.status === "ok",
      detail: `${opts.node} → ${health.status}`,
    });
  } catch (err) {
    checks.push({
      name: "node health",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  if (isGitRepo()) {
    const root = gitRoot();
    checks.push({ name: "git repo", ok: true, detail: root });
    const origin = remoteUrl("origin", root);
    const gh = origin ? parseGithubRemote(origin) : null;
    checks.push({
      name: "github origin",
      ok: true,
      detail: gh ? `${gh.owner}/${gh.repo}` : origin ? `non-github origin (${origin})` : "no origin",
    });
    const mapping = readMapping(root);
    checks.push({
      name: "mapping file",
      ok: Boolean(mapping),
      detail: mapping
        ? `${mapping.gitlawbDid}/${mapping.gitlawbRepo}`
        : "missing .gitlawb-sidecar.json",
    });
    const glRemote = remoteUrl("gitlawb", root);
    checks.push({
      name: "gitlawb remote",
      ok: Boolean(glRemote),
      detail: glRemote ?? "not added — run init",
    });
  } else {
    checks.push({ name: "git repo", ok: false, detail: "not inside a git work tree" });
  }

  checks.push({
    name: "public-mirror warning",
    ok: true,
    detail:
      "GitLawb copies are public. Sidecar will not keep private source private.",
  });

  if (opts.json) {
    console.log(
      JSON.stringify(
        { ok: checks.every((c) => c.ok), checks },
        null,
        2,
      ),
    );
  } else {
    for (const c of checks) {
      console.log(`${c.ok ? "ok " : "ERR"}  ${c.name}  ${c.detail}`);
    }
  }

  return checks.every((c) => c.ok) ? 0 : 1;
}
