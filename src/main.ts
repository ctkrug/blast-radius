import { analyze } from "./core/analyze";
import { EXAMPLES, type Example } from "./core/examples";
import { decodeCommandFromHash, encodeCommandToHash } from "./core/permalink";
import type { Finding, Severity, Verdict } from "./core/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SEVERITY_LABEL: Record<Severity, string> = {
  safe: "safe",
  caution: "caution",
  danger: "danger",
};

function findingHtml(finding: Finding): string {
  const pulse =
    finding.severity === "danger" ? '<span class="blast-pulse" aria-hidden="true"></span>' : "";
  return `
    <li class="finding finding--${finding.severity}">
      <span class="severity-badge severity-badge--${finding.severity}">
        ${pulse}${SEVERITY_LABEL[finding.severity]}
      </span>
      <p class="finding-reason">${escapeHtml(finding.reason)}</p>
    </li>
  `;
}

function verdictHtml(verdict: Verdict, hasInput: boolean): string {
  if (!hasInput) {
    return `<p class="findings-empty">Paste a command above and hit Analyze to see its risk breakdown here.</p>`;
  }

  if (verdict.findings.length === 0) {
    return `
      <p class="findings-empty findings-empty--safe">
        <span class="severity-badge severity-badge--safe">safe</span>
        No risk findings — nothing here matches a known danger pattern.
      </p>
    `;
  }

  return `<ul class="finding-list">${verdict.findings.map(findingHtml).join("")}</ul>`;
}

function exampleCardHtml(example: Example): string {
  const verdict = analyze(example.command);
  const top = verdict.findings[0];
  const severity: Severity = verdict.overall;

  return `
    <button
      class="example-card example-card--${severity}"
      type="button"
      data-example-id="${example.id}"
      aria-label="Load example: ${escapeHtml(example.label)}"
    >
      <span class="example-label">${escapeHtml(example.label)}</span>
      <code class="example-command">${escapeHtml(example.command)}</code>
      <span class="example-verdict">
        <span class="severity-badge severity-badge--${severity}">
          ${severity === "danger" ? '<span class="blast-pulse" aria-hidden="true"></span>' : ""}${SEVERITY_LABEL[severity]}
        </span>
        <span class="example-reason">${escapeHtml(top ? top.reason : "No risk findings.")}</span>
      </span>
    </button>
  `;
}

export function mount(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page">
      <header class="site-header">
        <span class="wordmark">
          <span class="wordmark-glyph" aria-hidden="true">&#9678;</span>Blast<span class="wordmark-accent">Radius</span>
        </span>
        <p class="tagline">Know what a shell command actually does — before you run it.</p>
      </header>

      <main class="hero">
        <section class="panel paste-panel" aria-labelledby="paste-heading">
          <h2 id="paste-heading" class="panel-heading">Paste a command</h2>
          <textarea
            id="command-input"
            class="command-input"
            placeholder="curl https://example.com/install.sh | sudo bash"
            spellcheck="false"
            aria-label="Shell command to analyze"
          ></textarea>
          <div class="paste-actions">
            <button id="analyze-btn" class="btn btn-primary" type="button" disabled>
              Analyze<span class="btn-hint" aria-hidden="true">&#8984;&#9166;</span>
            </button>
            <button id="share-btn" class="btn btn-secondary" type="button" disabled>Share</button>
            <span class="paste-hint" id="paste-hint">Nothing you paste ever leaves your browser.</span>
          </div>
        </section>

        <section class="panel findings-panel" aria-labelledby="findings-heading">
          <h2 id="findings-heading" class="panel-heading">Risk breakdown</h2>
          <div id="result" class="findings" aria-live="polite"></div>
        </section>
      </main>

      <section class="examples" aria-labelledby="examples-heading">
        <h2 id="examples-heading">See it in action</h2>
        <div class="example-grid" id="example-grid"></div>
      </section>

      <footer class="site-footer">
        <p>100% client-side — no backend, no logging, no network call made with what you paste.</p>
      </footer>
    </div>
  `;

  const input = root.querySelector<HTMLTextAreaElement>("#command-input")!;
  const button = root.querySelector<HTMLButtonElement>("#analyze-btn")!;
  const shareButton = root.querySelector<HTMLButtonElement>("#share-btn")!;
  const result = root.querySelector<HTMLDivElement>("#result")!;
  const exampleGrid = root.querySelector<HTMLDivElement>("#example-grid")!;

  exampleGrid.innerHTML = EXAMPLES.map(exampleCardHtml).join("");

  function runAnalysis(): void {
    result.innerHTML = verdictHtml(analyze(input.value), input.value.trim().length > 0);
  }

  function syncButtonState(): void {
    const isEmpty = input.value.trim().length === 0;
    button.disabled = isEmpty;
    shareButton.disabled = isEmpty;
  }

  input.addEventListener("input", syncButtonState);
  input.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runAnalysis();
    }
  });

  button.addEventListener("click", runAnalysis);

  const shareLabel = shareButton.textContent;
  let shareResetTimer: number | undefined;

  shareButton.addEventListener("click", () => {
    if (input.value.trim().length === 0) return;

    window.location.hash = encodeCommandToHash(input.value);
    const shareUrl = window.location.href;

    navigator.clipboard?.writeText(shareUrl).catch(() => {
      // Clipboard access can be denied/unavailable; the URL is already in
      // the address bar via the hash update, so sharing still works.
    });

    shareButton.textContent = "Copied!";
    window.clearTimeout(shareResetTimer);
    shareResetTimer = window.setTimeout(() => {
      shareButton.textContent = shareLabel;
    }, 1500);
  });

  exampleGrid.addEventListener("click", (event) => {
    const card = (event.target as HTMLElement).closest<HTMLButtonElement>(".example-card");
    if (!card) return;
    const example = EXAMPLES.find((e) => e.id === card.dataset.exampleId);
    if (!example) return;
    input.value = example.command;
    syncButtonState();
    runAnalysis();
    input.focus();
  });

  const sharedCommand = decodeCommandFromHash(window.location.hash);
  if (sharedCommand) {
    input.value = sharedCommand;
    syncButtonState();
    runAnalysis();
  } else {
    syncButtonState();
    result.innerHTML = verdictHtml({ overall: "safe", findings: [] }, false);
  }
}

const root = document.getElementById("app");
if (root) {
  mount(root);
}
