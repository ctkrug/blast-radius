import { analyze } from "./core/analyze";
import type { Verdict } from "./core/types";

function render(verdict: Verdict): string {
  if (verdict.findings.length === 0) {
    return `<p data-severity="safe">No risk findings.</p>`;
  }

  const items = verdict.findings
    .map((f) => `<li data-severity="${f.severity}">${f.reason}</li>`)
    .join("");

  return `<ul>${items}</ul>`;
}

function mount(root: HTMLElement): void {
  root.innerHTML = `
    <main>
      <h1>Blast Radius</h1>
      <textarea id="command-input" placeholder="Paste a shell command..."></textarea>
      <button id="analyze-btn" type="button">Analyze</button>
      <div id="result"></div>
    </main>
  `;

  const input = root.querySelector<HTMLTextAreaElement>("#command-input")!;
  const button = root.querySelector<HTMLButtonElement>("#analyze-btn")!;
  const result = root.querySelector<HTMLDivElement>("#result")!;

  button.addEventListener("click", () => {
    result.innerHTML = render(analyze(input.value));
  });
}

const root = document.getElementById("app");
if (root) {
  mount(root);
}
