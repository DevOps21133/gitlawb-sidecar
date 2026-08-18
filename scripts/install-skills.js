#!/usr/bin/env node
/**
 * Copy SKILL.md into user-level Claude / Cursor / Codex / Gemini skill dirs
 * so agents pick it up without a project-local init.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skill = join(root, "skill", "SKILL.md");
if (!existsSync(skill)) process.exit(0);

const homes = [
  ".claude/skills/gitlawb-sidecar",
  ".cursor/skills/gitlawb-sidecar",
  ".agents/skills/gitlawb-sidecar",
  ".codex/skills/gitlawb-sidecar",
  ".gemini/skills/gitlawb-sidecar",
  ".copilot/skills/gitlawb-sidecar",
];

for (const rel of homes) {
  try {
    const dir = join(homedir(), rel);
    mkdirSync(dir, { recursive: true });
    copyFileSync(skill, join(dir, "SKILL.md"));
  } catch {
    // never fail install because a skill dir could not be written
  }
}
