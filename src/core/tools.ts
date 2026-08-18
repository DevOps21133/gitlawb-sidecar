import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { sidecarHome } from "./paths.js";

export type Tooling = {
  gl: string;
  helper: string;
  binDir: string;
};

function binsIn(pkgDir: string): Tooling | null {
  const binDir = join(pkgDir, "bin");
  const gl = join(binDir, "gl");
  const helper = join(binDir, "git-remote-gitlawb");
  if (existsSync(gl) && existsSync(helper)) return { gl, helper, binDir };
  return null;
}

function bundledGl(): Tooling | null {
  try {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve("@gitlawb/gl/package.json");
    return binsIn(dirname(pkgJson));
  } catch {
    return null;
  }
}

function cachedGl(): Tooling | null {
  const pkgDir = join(sidecarHome(), "tools", "node_modules", "@gitlawb", "gl");
  return binsIn(pkgDir);
}

function installCachedGl(): Tooling {
  const prefix = join(sidecarHome(), "tools");
  const result = spawnSync(
    process.execPath,
    [
      join(dirname(process.execPath), "npm"),
      "install",
      "--prefix",
      prefix,
      "@gitlawb/gl@0.7.1",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    const npmCli = join(
      dirname(dirname(process.execPath)),
      "lib",
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js",
    );
    const retry = spawnSync(
      process.execPath,
      [npmCli, "install", "--prefix", prefix, "@gitlawb/gl@0.7.1"],
      { encoding: "utf8" },
    );
    if (retry.status !== 0) {
      throw new Error(
        `failed to install @gitlawb/gl:\n${retry.stderr || result.stderr}`,
      );
    }
  }
  const tools = cachedGl();
  if (!tools) {
    throw new Error("installed @gitlawb/gl but binaries are missing");
  }
  return tools;
}

export function ensureTools(): Tooling {
  return bundledGl() ?? cachedGl() ?? installCachedGl();
}

export function pathWithHelper(tools: Tooling, basePath = process.env.PATH ?? ""): string {
  const parts = basePath.split(":").filter((p) => p && p !== tools.binDir);
  return [tools.binDir, ...parts].join(":");
}
