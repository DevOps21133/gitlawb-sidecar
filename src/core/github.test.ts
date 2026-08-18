import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { githubHttpsUrl, parseGithubRemote } from "./github.js";

describe("parseGithubRemote", () => {
  it("parses HTTPS", () => {
    assert.deepEqual(parseGithubRemote("https://github.com/acme/widgets.git"), {
      owner: "acme",
      repo: "widgets",
    });
  });

  it("parses ssh scp form", () => {
    assert.deepEqual(parseGithubRemote("git@github.com:acme/widgets.git"), {
      owner: "acme",
      repo: "widgets",
    });
  });

  it("parses ssh://", () => {
    assert.deepEqual(
      parseGithubRemote("ssh://git@github.com/acme/widgets.git"),
      { owner: "acme", repo: "widgets" },
    );
  });

  it("parses www.github.com", () => {
    assert.deepEqual(parseGithubRemote("https://www.github.com/acme/widgets"), {
      owner: "acme",
      repo: "widgets",
    });
  });

  it("rejects gitlab", () => {
    assert.equal(parseGithubRemote("https://gitlab.com/acme/widgets.git"), null);
  });

  it("rejects empty", () => {
    assert.equal(parseGithubRemote(""), null);
  });

  it("builds https url", () => {
    assert.equal(
      githubHttpsUrl({ owner: "acme", repo: "widgets" }),
      "https://github.com/acme/widgets",
    );
  });
});
