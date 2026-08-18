import { existsSync } from "node:fs";
import { mkdirSync } from "node:fs";
import type { Tooling } from "./tools.js";
import { runGl } from "./gl.js";
import { identityPemPath } from "./paths.js";

export function ensureIdentity(
  tools: Tooling,
  opts: { node: string; dir: string },
): string {
  mkdirSync(opts.dir, { recursive: true, mode: 0o700 });
  if (!existsSync(identityPemPath(opts.dir))) {
    runGl(tools, ["identity", "new", "--dir", opts.dir], opts);
  }
  return showDid(tools, opts);
}

export function showDid(
  tools: Tooling,
  opts: { node: string; dir: string },
): string {
  return runGl(tools, ["identity", "show", "--dir", opts.dir], opts).trim();
}

export function register(
  tools: Tooling,
  opts: { node: string; dir: string },
): void {
  runGl(tools, ["register", "--node", opts.node, "--dir", opts.dir], opts);
}

export function createRepo(
  tools: Tooling,
  opts: { node: string; dir: string; name: string; description: string },
): void {
  try {
    runGl(
      tools,
      [
        "repo",
        "create",
        opts.name,
        "--description",
        opts.description,
        "--node",
        opts.node,
        "--dir",
        opts.dir,
      ],
      opts,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already exists|exists|conflict|409/i.test(msg)) return;
    throw err;
  }
}
