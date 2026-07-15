import { describe, expect, it } from "vitest";
import { decodeCommandFromHash, encodeCommandToHash } from "../src/core/permalink";

describe("permalink encode/decode", () => {
  it("round-trips a command through the hash", () => {
    const command = "curl https://x/install.sh | sudo bash";
    const hash = encodeCommandToHash(command);
    expect(decodeCommandFromHash(hash)).toBe(command);
  });

  it("round-trips special characters (&, =, #, quotes)", () => {
    const command = `curl "http://x?a=1&b=2" > out.txt # comment`;
    const hash = encodeCommandToHash(command);
    expect(decodeCommandFromHash(hash)).toBe(command);
  });

  it("returns null for an empty hash", () => {
    expect(decodeCommandFromHash("")).toBeNull();
    expect(decodeCommandFromHash("#")).toBeNull();
  });

  it("returns null when the hash has no c param", () => {
    expect(decodeCommandFromHash("#other=1")).toBeNull();
  });
});
