import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function skillSourcePath(): string {
  return join(here, "..", "..", "skill", "SKILL.md");
}

export function workflowTemplate(): string {
  return `# GitHub stays origin. This job mirrors HEAD to GitLawb and comments the cert.
# Add repo secret GITLAWB_IDENTITY_PEM (the contents of identity.pem).
# Mirrors are public. Do not enable this on private source.

name: GitLawb sidecar
on:
  push:
  pull_request:

permissions:
  contents: read
  pull-requests: write
  statuses: write

jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - name: Sync signed mirror
        run: npx --yes github:DevOps21133/gitlawb-sidecar sync --comment-pr
        env:
          GITLAWB_IDENTITY_PEM: \${{ secrets.GITLAWB_IDENTITY_PEM }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
}

export function writeIntegrations(
  repoRoot: string,
  opts: { hasCursor: boolean },
): string[] {
  const written: string[] = [];
  const skill = readFileSync(skillSourcePath(), "utf8");

  const skillTargets = [
    ".claude/skills/gitlawb-sidecar/SKILL.md",
    ".agents/skills/gitlawb-sidecar/SKILL.md",
  ];
  if (opts.hasCursor || existsSync(join(repoRoot, ".cursor"))) {
    skillTargets.push(".cursor/skills/gitlawb-sidecar/SKILL.md");
  }

  for (const rel of skillTargets) {
    writeFile(join(repoRoot, rel), skill);
    written.push(rel);
  }

  const workflowRel = ".github/workflows/gitlawb-sidecar.yml";
  writeFile(join(repoRoot, workflowRel), workflowTemplate());
  written.push(workflowRel);
  return written;
}

function writeFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}
