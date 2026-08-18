import { spawnSync } from "node:child_process";
import type { Tooling } from "./tools.js";
import { pathWithHelper } from "./tools.js";

export class GlError extends Error {
  constructor(
    readonly args: string[],
    readonly status: number | null,
    readonly stdout: string,
    readonly stderr: string,
  ) {
    super(
      `gl ${args.join(" ")} failed (${status ?? "no-status"}): ${(stderr || stdout).trim()}`,
    );
    this.name = "GlError";
  }
}

export function runGl(
  tools: Tooling,
  args: string[],
  opts: { node: string; dir: string; extraEnv?: NodeJS.ProcessEnv },
): string {
  const result = spawnSync(tools.gl, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      ...opts.extraEnv,
      GITLAWB_NODE: opts.node,
      PATH: pathWithHelper(tools),
    },
    // never inherit stdin — iCaptcha solver must run non-interactively
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (result.status !== 0) {
    throw new GlError(args, result.status, stdout, stderr);
  }
  return stdout;
}

export function runGlAllowFail(
  tools: Tooling,
  args: string[],
  opts: { node: string; dir: string },
): { ok: boolean; stdout: string; stderr: string } {
  try {
    const stdout = runGl(tools, args, opts);
    return { ok: true, stdout, stderr: "" };
  } catch (err) {
    if (err instanceof GlError) {
      return { ok: false, stdout: err.stdout, stderr: err.stderr };
    }
    throw err;
  }
}
