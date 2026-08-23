import { describe, expect, it, vi } from "vitest";
import { handleGithubWebhook, type GithubWebhookDependencies } from "./webhook";

const secret = "test-webhook-secret";

async function signature(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return `sha256=${Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    action: "created",
    installation: { id: 42 },
    repository: { full_name: "Chenglin97/json-server", default_branch: "main" },
    issue: {
      number: 1,
      title: "Primitive array resources crash during startup",
      body: "roles: [role-1] throws before the API starts",
      html_url: "https://github.com/Chenglin97/json-server/issues/1",
    },
    comment: { id: 99, body: "@code-republic solve this end to end", user: { login: "chenglin97", type: "User" } },
    sender: { login: "chenglin97" },
    ...overrides,
  };
}

async function webhookRequest(body: unknown, signatureOverride?: string) {
  const raw = JSON.stringify(body);
  return new Request("https://code-republic.example/api/github/webhooks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": "issue_comment",
      "x-hub-signature-256": signatureOverride ?? await signature(raw),
    },
    body: raw,
  });
}

describe("GitHub issue intake", () => {
  it("creates a pinned World and comments with the public trace", async () => {
    const createWorld = vi.fn<GithubWebhookDependencies["createWorld"]>().mockImplementation(async (_worldId, events) => ({
      created: true,
      snapshot: {
        world: { id: events[0]!.worldId, name: "Code Republic", version: events.length, rulesVersion: "1.0", stage: "debating" },
        agents: [], signal: null, proposals: [], campaign: null, missions: [], contributionShares: [], recentEvents: [], nextAutonomousStep: null,
      },
    }));
    const postIssueComment = vi.fn<GithubWebhookDependencies["postIssueComment"]>().mockResolvedValue();
    const dependencies: GithubWebhookDependencies = {
      createWorld,
      postIssueComment,
      resolveDefaultBranchHead: vi.fn().mockResolvedValue("89a34a44b7a6a5311dc84f3b8a1b8b45c0905aea"),
    };

    const response = await handleGithubWebhook(await webhookRequest(payload()), dependencies, secret);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ accepted: true, created: true });
    expect(result.worldId).toMatch(/^gh_chenglin97_json_server_1_/);
    const events = createWorld.mock.calls[0]?.[1];
    expect(events?.find((event) => event.type === "signal.published")?.payload).toMatchObject({
      signal: { repository: "Chenglin97/json-server", baseCommit: "89a34a4", issueNumber: 1 },
    });
    expect(postIssueComment).toHaveBeenCalledWith(42, "Chenglin97/json-server", 1, expect.stringContaining("Code Republic accepted this problem"));
  });

  it("rejects unsigned payloads before parsing or mutation", async () => {
    const dependencies = {
      createWorld: vi.fn(),
      postIssueComment: vi.fn(),
      resolveDefaultBranchHead: vi.fn(),
    } as unknown as GithubWebhookDependencies;

    const response = await handleGithubWebhook(await webhookRequest(payload(), "sha256=00"), dependencies, secret);

    expect(response.status).toBe(401);
    expect(dependencies.createWorld).not.toHaveBeenCalled();
  });

  it("ignores ordinary issue discussion", async () => {
    const dependencies = {
      createWorld: vi.fn(),
      postIssueComment: vi.fn(),
      resolveDefaultBranchHead: vi.fn(),
    } as unknown as GithubWebhookDependencies;
    const ordinary = payload({ comment: { id: 99, body: "I can reproduce this", user: { login: "chenglin97", type: "User" } } });

    const response = await handleGithubWebhook(await webhookRequest(ordinary), dependencies, secret);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ignored: true, reason: "not_a_solve_command" });
    expect(dependencies.createWorld).not.toHaveBeenCalled();
  });
});
