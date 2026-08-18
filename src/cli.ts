#!/usr/bin/env node
import { cmdDoctor } from "./commands/doctor.js";
import { cmdInit } from "./commands/init.js";
import { cmdStatus } from "./commands/status.js";
import { cmdSync } from "./commands/sync.js";
import { cmdVerify } from "./commands/verify.js";
import { DEFAULT_NODE, type CliOptions } from "./core/types.js";

const HELP = `gitlawb-sidecar — signed GitLawb mirror next to GitHub

Usage:
  gitlawb-sidecar init      add a gitlawb remote, push HEAD, write Action + skills
  gitlawb-sidecar sync      push HEAD to gitlawb and fetch the certificate
  gitlawb-sidecar verify    check that HEAD has a matching signed certificate
  gitlawb-sidecar status    identity, remotes, mapping
  gitlawb-sidecar doctor    connectivity checks (exits 1 on failure)

Options:
  --node <url>         GitLawb node (default: ${DEFAULT_NODE})
  --dir <path>         identity directory
  --name <repo>        GitLawb repo name (init)
  --description <text> repo description (init)
  --ref <branch|sha>   branch to push (sync) or sha to check (verify)
  --no-integrate       do not write workflow / skill files
  --comment-pr         on GitHub Actions, comment + set commit status
  --show-pem-hint      print where to copy identity.pem for GITLAWB_IDENTITY_PEM
  --json               machine-readable output
  -h, --help           help

GitHub origin is never changed. Mirrors are public — do not use on private source.
Never run the official command named gl; oh-my-zsh aliases it to git pull.
`;

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    command: "",
    node: process.env.GITLAWB_NODE || DEFAULT_NODE,
    json: false,
    integrate: true,
    commentPr: false,
    showPemHint: false,
    help: false,
  };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--no-integrate") opts.integrate = false;
    else if (a === "--comment-pr") opts.commentPr = true;
    else if (a === "--show-pem-hint") opts.showPemHint = true;
    else if (a === "--node") opts.node = argv[++i] ?? opts.node;
    else if (a === "--dir") opts.dir = argv[++i];
    else if (a === "--name") opts.name = argv[++i];
    else if (a === "--description") opts.description = argv[++i];
    else if (a === "--ref") opts.ref = argv[++i];
    else if (a.startsWith("-")) {
      throw new Error(`unknown option: ${a}`);
    } else {
      rest.push(a);
    }
  }
  opts.command = rest[0] ?? "";
  return opts;
}

async function main(): Promise<number> {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 2;
  }
  if (opts.help || !opts.command) {
    console.log(HELP);
    return opts.help || !opts.command ? 0 : 2;
  }
  try {
    switch (opts.command) {
      case "init":
        return await cmdInit(opts);
      case "sync":
        return await cmdSync(opts);
      case "verify":
        return await cmdVerify(opts);
      case "status":
        return await cmdStatus(opts);
      case "doctor":
        return await cmdDoctor(opts);
      default:
        console.error(`unknown command: ${opts.command}`);
        console.log(HELP);
        return 2;
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}

const code = await main();
process.exit(code);
