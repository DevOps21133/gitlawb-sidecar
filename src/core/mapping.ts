import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MAPPING_FILE, type SidecarMapping } from "./types.js";

export function mappingPath(repoRoot: string): string {
  return join(repoRoot, MAPPING_FILE);
}

export function readMapping(repoRoot: string): SidecarMapping | null {
  const file = mappingPath(repoRoot);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as SidecarMapping;
  } catch {
    return null;
  }
}

export function writeMapping(repoRoot: string, mapping: SidecarMapping): void {
  writeFileSync(mappingPath(repoRoot), `${JSON.stringify(mapping, null, 2)}\n`);
}
