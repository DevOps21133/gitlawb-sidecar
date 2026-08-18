import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export function sidecarHome(): string {
  return process.env.GITLAWB_SIDECAR_HOME || join(homedir(), ".gitlawb-sidecar");
}

export function defaultIdentityDir(): string {
  if (process.env.GITLAWB_SIDECAR_DIR) return process.env.GITLAWB_SIDECAR_DIR;
  const official = join(homedir(), ".gitlawb");
  if (existsSync(join(official, "identity.pem"))) return official;
  return sidecarHome();
}

/** Write GITLAWB_IDENTITY_PEM to a private temp dir and return that dir. */
export function materializeEnvIdentity(): string | undefined {
  const pem = process.env.GITLAWB_IDENTITY_PEM;
  if (!pem || !pem.trim()) return undefined;
  const dir = join(process.env.RUNNER_TEMP || tmpdir(), "gitlawb-sidecar-identity");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, "identity.pem");
  writeFileSync(file, pem.endsWith("\n") ? pem : `${pem}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  return dir;
}

export function resolveIdentityDir(explicit?: string): string {
  if (explicit) return explicit;
  const fromEnv = materializeEnvIdentity();
  if (fromEnv) return fromEnv;
  return defaultIdentityDir();
}

export function identityPemPath(dir: string): string {
  return join(dir, "identity.pem");
}
