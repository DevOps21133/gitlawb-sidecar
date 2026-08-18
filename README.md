# GitLawb sidecar

Unofficial companion. Adds [GitLawb](https://gitlawb.com) as a **signed second origin** next to GitHub.

GitHub stays `origin`. Humans keep reviewing there. Every push also lands on the public GitLawb node with an Ed25519 ref-update certificate.

```
npx gitlawb-sidecar init
```

That one command:

1. Creates or reuses a DID (keypair)
2. Registers on `https://node.gitlawb.com`
3. Adds a `gitlawb` remote — **does not touch `origin`**
4. Pushes `HEAD` and prints the certificate
5. Writes a GitHub Action workflow and coding-agent skills into the repo

After that, Claude Code, Cursor, and Codex pick up the skill, and every PR can carry a cert comment.

## Why this exists

GitLawb’s own CLI is named `gl`, which oh-my-zsh aliases to `git pull`. The explorer is DID soup. This package is the on-ramp that rides tools people already have: `npx`, GitHub Actions, and `SKILL.md`.

## Install

Needs Node 20+ and git. macOS or Linux (GitLawb’s helper has no native Windows build).

```sh
npx gitlawb-sidecar init
npx gitlawb-sidecar doctor
```

Installing the package also drops `SKILL.md` into `~/.claude/skills`, `~/.cursor/skills`, `~/.agents/skills`, and `~/.codex/skills` so Claude Code, Cursor, Codex, and Gemini pick it up on the next session.

### Claude Code plugin

After the package is on npm:

```
/plugin marketplace add https://unpkg.com/gitlawb-sidecar/.claude-plugin/marketplace.json
/plugin install gitlawb-sidecar@gitlawb-sidecar
```

Or just run `npx gitlawb-sidecar init` in a repo — that writes project-local skills Claude and Cursor already scan.

## Commands

| Command | What it does |
|---|---|
| `init` | identity, register, remote, first push, write Action + skills |
| `sync` | push `HEAD` to GitLawb, fetch cert |
| `verify` | fail if `HEAD` has no matching cert |
| `status` | remotes, DID, mapping |
| `doctor` | **exits 1** if anything is wrong |

Flags: `--node`, `--dir`, `--name`, `--json`, `--no-integrate`, `--comment-pr`, `--show-pem-hint`.

## GitHub Actions

`init` writes `.github/workflows/gitlawb-sidecar.yml`. Add a repo secret:

- `GITLAWB_IDENTITY_PEM` — contents of `identity.pem`

```sh
npx gitlawb-sidecar status --show-pem-hint
```

The job comments a sticky note on pull requests with the SHA, cert id, explorer URL, and raw cert JSON.

## Honest limits

- **Mirrors are public.** GitLawb private-read is not something you should trust. Do not enable this on private source.
- Certificates mean “this DID pushed this SHA.” They do not mean “only the owner can push” (GitLawb write authorization is still weak).
- A leaked identity cannot be revoked on the network. Rotate: new identity, new GitLawb repo, update `.gitlawb-sidecar.json`.
- This is not affiliated with GitLawb. It wraps their public node and `@gitlawb/gl` binaries. The public command is only `gitlawb-sidecar`, never `gl`.

## License

MIT
