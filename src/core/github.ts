import type { GithubRepo } from "./types.js";

const GITHUB_HOST = /^(?:www\.)?github\.com$/i;

export function parseGithubRemote(url: string): GithubRepo | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const scp = trimmed.match(/^git@([^:]+):(.+)$/i);
  if (scp) {
    return fromHostAndPath(scp[1], scp[2]);
  }

  try {
    const normalized = trimmed.replace(/^git\+/, "");
    const parsed = new URL(normalized);
    return fromHostAndPath(parsed.hostname, parsed.pathname);
  } catch {
    return null;
  }
}

function fromHostAndPath(host: string, pathname: string): GithubRepo | null {
  if (!GITHUB_HOST.test(host)) return null;
  const parts = pathname
    .replace(/^\/+/, "")
    .replace(/\.git$/i, "")
    .split("/")
    .filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) return null;
  return { owner, repo };
}

export function githubHttpsUrl(repo: GithubRepo): string {
  return `https://github.com/${repo.owner}/${repo.repo}`;
}
