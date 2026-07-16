# Blast Radius — Architecture

A static, client-side-only TypeScript app (Vite + Vitest, no framework, no backend).

## Data flow

```
command string
  -> tokenize()        src/core/tokenizer.ts   -> Token[]
  -> parseTokens()      src/core/parser.ts      -> ScriptNode (AST)
  -> runRules()          src/core/risk-engine.ts -> Finding[]
  -> maxSeverity()                              -> overall Severity
= Verdict { overall, findings, parseError? }    src/core/analyze.ts
```

`analyze(command: string): Verdict` (`src/core/analyze.ts`) is the single entry point the UI
calls. It never throws: a tokenize/parse failure (e.g. an unterminated quote) is caught and
returned as a `caution` finding with `Verdict.parseError` set, per the graceful-degradation
requirement in the backlog.

## Core modules (`src/core/`)

- **`tokenizer.ts`** — splits a command line into `Token[]` (words + operators: `|`, `;`,
  `&&`, `||`, `>`, `>>`, `<`, `&`). Handles single/double quoting, backslash escapes, `#`
  comments. Throws `TokenizeError` on an unterminated quote. Process substitution (`<(...)`)
  and command substitution (`$(...)`) are consumed as a single word token flagged
  `unsupported: true` rather than parsed — the project's grammar is intentionally small
  (see `docs/VISION.md` non-goals).
- **`ast.ts`** — the parser's output shapes: `CommandNode` (words + typed `RedirectNode[]`),
  `PipelineNode` (piped `CommandNode` stages), `ScriptNode` (pipelines joined by
  `;`/`&&`/`||`/`&`).
- **`parser.ts`** — `parseTokens(tokens): ScriptNode`. Groups tokens into pipelines (split on
  `|`), then sequences pipelines by the separator operators. Pairs redirect operators with
  their target word into `RedirectNode`s. Throws `ParseError` (with a source position) on a
  redirect with no target or an empty command.
- **`risk-engine.ts`** — the rule *walker*, with no built-in detection logic itself.
  `runRules(script, commandRules, pipelineRules)` applies pipeline-scoped rules to each
  pipeline and command-scoped rules to each of its stages, flattening the results.
  `maxSeverity(findings)` reduces a finding list to one overall severity
  (`safe < caution < danger`).
- **`types.ts`** — `Severity`, `Finding` (severity + one-line `reason` + optional source
  `span`), `Verdict`.
- **`examples.ts`** — the wow-moment red/green example pair shown on the landing page,
  defined once so the UI and any future permalink defaults share one source of truth.
- **`permalink.ts`** — encodes/decodes a command into a `#c=<encoded>` URL hash fragment for
  the Share feature. Never touches a server — the hash is browser-only.

## Rules (`src/core/rules/`)

Each rule is a plain function conforming to `CommandRule` (`(cmd: CommandNode) => Finding[]`)
or `PipelineRule` (`(pipeline: PipelineNode) => Finding[]`). No rule knows about any other
rule directly.

- **`destructive-fs.ts`** — recursive `rm` scoped by target (danger if root/home/system-
  critical, caution otherwise), `mkfs`, `dd of=/dev/*`.
- **`remote-fetch-exec.ts`** *(pipeline rule)* — flags a `curl`/`wget` stage piped directly
  into a shell interpreter stage (optionally via `sudo`). This is the wow-moment pattern.
- **`network-exfil.ts`** — outbound `curl`/`wget` calls; danger when a data/upload flag is
  file-backed (`-d @file`, `-T file`) — local data leaving the machine — caution otherwise.
- **`sensitive-redirect.ts`** — write/append redirects landing on `/etc/*`, `~/.ssh/*`, or a
  shell rc file.
- **`sudo-scope.ts`** — builds the effective inner command `sudo` would run and re-evaluates
  it against `registry.ts`'s `baseCommandRules`; compounds to danger if the inner command is
  independently dangerous, otherwise a routine or generic root-privilege caution. A command
  with no `sudo` produces no finding.
- **`unsupported-syntax.ts`** — surfaces `CommandNode.hasUnsupportedSyntax` as an explicit
  caution ("couldn't fully analyze this part") instead of a silent false "safe".
- **`paths.ts`** — shared `isCatastrophicTarget`/`isSensitivePath` helpers used by
  `destructive-fs` and `sensitive-redirect`. Trailing slashes are normalized before matching
  so `rm -rf /etc/` is judged the same as `rm -rf /etc`.
- **`fetch-target.ts`** — shared `findFetchTarget` helper used by `network-exfil` and
  `remote-fetch-exec` to pick the real URL out of a curl/wget invocation's arguments, skipping
  both flags and the value a flag like `-X`/`-H`/`-o` consumes (otherwise that value gets
  mistaken for the target).
- **`registry.ts`** — `baseCommandRules`: the command rules that apply standalone AND get
  re-run against the inner command by `sudo-scope.ts` (kept separate from `index.ts` to avoid
  a `sudo-scope.ts` <-> `index.ts` import cycle).
- **`index.ts`** — the rule lists `analyze()` actually runs: `commandRules` and
  `pipelineRules`. Every new rule gets registered here.

## UI (`src/main.ts`, `src/styles/main.css`)

Vanilla DOM, no framework. `mount(root)` renders the page (paste panel, findings panel,
example grid), wires event listeners, and on load checks the URL hash via
`decodeCommandFromHash` to pre-fill and re-analyze a shared permalink. All user-supplied text
is HTML-escaped before being interpolated into `innerHTML`.

Visual direction, tokens, and layout intent are specified in `docs/DESIGN.md` (blueprint/
technical: navy + cyan + red accent, Space Grotesk display / IBM Plex Mono UI font, graph-
paper grid background, a dashed "blast radius" ring that pulses once on a danger finding).

## How to run

```bash
npm install
npm run dev          # local dev server (Vite)
npm test             # vitest run — full suite
npm run build        # static build to dist/ (base path "./", subpath-deployable)
npm run lint         # eslint
npm run format:check # prettier --check
```

Tests live in `tests/`, mirroring `src/core/` structure (`tests/rules/` for individual rule
modules). Vitest runs in `jsdom`, so `tests/main.test.ts` exercises the real DOM the UI
renders.
