# Blast Radius — Vision

## The problem

Shell one-liners get copy-pasted constantly — from install docs, Stack Overflow answers, and
increasingly from an AI agent's own suggested next step. Nobody reads a 40-token pipeline of
redirects and pipes character by character before hitting enter, and the tools that exist to
help are almost all keyword blocklists: grep for `rm -rf`, grep for `sudo`, grep for `curl`.
That approach can't tell `rm -rf ./build` (routine) from `rm -rf /` (catastrophic), or `curl
https://example.com` (harmless GET) from `curl https://example.com/install.sh | sudo bash`
(remote code execution as root). The blocklist either cries wolf on everything or misses the
actual danger, because it never looks at what the command *does* — only what words appear in
it.

## Who it's for

Developers and operators who are about to run a shell command someone (or something) else
wrote and want a fast, honest answer to one question: **what does running this actually do to
me?** The primary trigger is AI-agent-generated shell commands — copilots and coding agents
routinely emit shell one-liners as part of "helpful" automation, and those commands get less
scrutiny than hand-written ones because they arrive with an implicit stamp of authority.

## The core idea

Parse the command as shell syntax — not as a bag of keywords. Build a real (if intentionally
small) grammar: pipelines, redirects, command separators (`;`, `&&`, `||`), quoting. Walk the
resulting structure with a rule engine that reasons about *scope and intent*: is this `sudo`
escalating a routine package-manager call, or is it compounding with a destructive delete? Is
this redirect writing to a build artifact, or to `~/.ssh/authorized_keys`? Is this pipe running
a local binary, or piping a remote fetch straight into a shell? The output isn't a score — it's
a short list of specific, plain-English findings, each pointing at the exact part of the
command that earned it, so a distracted reader still catches the one line that matters.

## Key design decisions

- **Parse, don't grep.** A tokenizer and AST come first (Epic 1). Every risk rule operates on
  parsed structure — spans, redirect targets, pipeline stages — never on raw regex over the
  input string. This is what lets the tool distinguish `rm -rf ./build` from `rm -rf /`.
- **Explain, don't just flag.** Every finding carries a one-line, specific reason. "Danger" with
  no explanation is exactly the blocklist experience this project exists to replace.
- **100% client-side.** Nothing pasted into the box ever leaves the browser — no backend, no
  logging, no network call made with the pasted command. This matters because the commands
  people paste in here are often the exact ones they're nervous about (credentials in a curl
  call, an internal hostname) — the tool has to be trustworthy about not being the leak itself.
- **The wow moment ships first.** `curl http://x | sudo bash` flagged red next to a harmless
  green example is the first story of the first epic — the demo has to land before anything
  else gets built.
- **Static and portable.** No server, one `dist/` directory, relative asset paths — deployable
  to a subpath (`apps.charliekrug.com/blast-radius`) or opened straight from disk.

## What "v1 done" looks like

- The tokenizer/parser handles pipelines, redirects, and `;`/`&&`/`||` sequencing for realistic
  POSIX-ish one-liners (not full POSIX shell — see Non-goals).
- The rule engine covers: destructive filesystem ops scoped by target, remote-fetch-and-execute,
  `sudo`/root scope reasoning, outbound network + exfiltration shape, and redirects into
  sensitive paths.
- The landing page opens straight into the wow-moment demo — no empty state, no instructions
  required to see the point.
- Every finding has a specific one-line explanation naming the actual danger, not a bare
  severity badge.
- A pasted command can be shared via a permalink that reproduces the exact verdict.
- The page matches `docs/DESIGN.md`'s direction, is responsive at phone/tablet/desktop widths,
  and ships a real favicon and wordmark — not a functional-but-generic stub.

## Non-goals (for v1)

- Not a full POSIX/bash grammar (no functions, no arithmetic expansion, no here-docs) — enough
  syntax to reason about the risk surfaces that matter, not a shell interpreter.
- Not a sandbox or an executor — Blast Radius never runs the pasted command, only parses and
  reasons about it statically.
- Not a replacement for a real security audit — it's a fast first read, not a guarantee.
