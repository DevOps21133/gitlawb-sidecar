import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Tooling } from "./tools.js";
import { pathWithHelper } from "./tools.js";

export class GitError extends Error {
  constructor(readonly args: string[], readonly stderr: string) {
    super(`git ${args.join(" ")} failed: ${stderr.trim()}`);
    this.name = "GitError";
  }
}

export function runGit(
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): string {
  const result = spawnSync("git", args, {
    cwd: opts.cwd,
    encoding: "utf8",
    env: { ...process.env, ...opts.env },
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (result.status !== 0) {
    throw new GitError(args, stderr || stdout);
  }
  return stdout.trim();
}

export function isGitRepo(cwd = process.cwd()): boolean {
  return existsSync(join(cwd, ".git")) || tryRevParse(cwd);
}

function tryRevParse(cwd: string): boolean {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd,
    encoding: "utf8",
  });
  return result.status === 0 && (result.stdout ?? "").trim() === "true";
}

export function gitRoot(cwd = process.cwd()): string {
  return runGit(["rev-parse", "--show-toplevel"], { cwd });
}

export function currentBranch(cwd = process.cwd()): string | null {
  const name = runGit(["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  if (!name || name === "HEAD") return null;
  return name;
}

export function headSha(cwd = process.cwd()): string {
  return runGit(["rev-parse", "HEAD"], { cwd });
}

export function remoteUrl(name: string, cwd = process.cwd()): string | null {
  const result = spawnSync("git", ["remote", "get-url", name], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  return (result.stdout ?? "").trim() || null;
}

export function addOrUpdateRemote(
  name: string,
  url: string,
  cwd = process.cwd(),
): void {
  if (remoteUrl(name, cwd)) {
    runGit(["remote", "set-url", name, url], { cwd });
    return;
  }
  runGit(["remote", "add", name, url], { cwd });
}

export function pushGitlawb(opts: {
  tools: Tooling;
  node: string;
  identityPem: string;
  cwd?: string;
  refspec: string;
}): string {
  return runGit(["push", "gitlawb", opts.refspec], {
    cwd: opts.cwd,
    env: {
      GITLAWB_NODE: opts.node,
      GITLAWB_KEY: opts.identityPem,
      PATH: pathWithHelper(opts.tools),
    },
  });
}

export function gitlawbRemoteUrl(did: string, repo: string): string {
  return `gitlawb://${did}/${repo}`;
}
