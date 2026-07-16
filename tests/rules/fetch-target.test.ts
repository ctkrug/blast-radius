import { describe, expect, it } from "vitest";
import { findFetchTarget } from "../../src/core/rules/fetch-target";

describe("findFetchTarget", () => {
  it("returns the first non-flag argument when there are no value flags", () => {
    expect(findFetchTarget(["http://example.com"])).toBe("http://example.com");
  });

  it("skips the value consumed by a known value-taking flag", () => {
    expect(findFetchTarget(["-X", "POST", "http://example.com"])).toBe("http://example.com");
    expect(findFetchTarget(["-H", "Authorization: x", "http://example.com"])).toBe(
      "http://example.com",
    );
    expect(findFetchTarget(["-o", "out.txt", "http://example.com"])).toBe("http://example.com");
  });

  it("returns undefined when there is no target at all", () => {
    expect(findFetchTarget([])).toBeUndefined();
    expect(findFetchTarget(["-s", "-L"])).toBeUndefined();
  });

  it("honors caller-supplied extra value flags", () => {
    expect(
      findFetchTarget(["--custom", "value", "http://example.com"], new Set(["--custom"])),
    ).toBe("http://example.com");
  });
});
