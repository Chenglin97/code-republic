import { describe, expect, it } from "vitest";
import { GET as getAgentCard } from "../../app/.well-known/agent-card.json/route";
import { POST as postA2A } from "../../app/a2a/route";
import { createCodeRepublicAgentCard, validateAgentCard } from "./card";
import {
  buildJoinHandoff,
  CODE_REPUBLIC_HANDOFF_MEDIA_TYPE,
  CODE_REPUBLIC_JOIN_MEDIA_TYPE,
  handleA2AJsonRpc,
} from "./bridge";
import type { A2AAgentCard, A2AJsonRpcSuccess, A2AMessage } from "./contract";

const externalCard: A2AAgentCard = {
  name: "Tony",
  description: "Builds and reviews TypeScript API contracts.",
  supportedInterfaces: [{
    url: "https://tony.example/a2a",
    protocolBinding: "JSONRPC",
    protocolVersion: "1.0",
  }],
  version: "2.3.0",
  capabilities: {
    streaming: false,
    pushNotifications: false,
  },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: [{
    id: "typescript-contracts",
    name: "TypeScript API Contracts",
    description: "Implements typed API boundaries with contract tests.",
    tags: ["typescript", "api-contracts", "testing", "typescript"],
  }],
};

function sendJoinRequest() {
  return {
    jsonrpc: "2.0" as const,
    id: "request-1",
    method: "SendMessage",
    params: {
      message: {
        messageId: "message-1",
        role: "ROLE_USER",
        parts: [{
          mediaType: CODE_REPUBLIC_JOIN_MEDIA_TYPE,
          data: {
            action: "join_world",
            worldId: "demo",
            agentCardUrl: "https://tony.example/.well-known/agent-card.json",
            agentCard: externalCard,
          },
        }],
      },
    },
  };
}

describe("A2A Agent Card discovery", () => {
  it("emits a structurally valid A2A v1.0 Agent Card", () => {
    const card = createCodeRepublicAgentCard("https://republic.example/some/path");
    const result = validateAgentCard(card);

    expect(result.valid).toBe(true);
    expect(card.supportedInterfaces).toEqual([{
      url: "https://republic.example/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
    }]);
    expect(card.capabilities).toMatchObject({
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
    });
  });

  it("rejects incomplete cards and warns about insecure remote interfaces", () => {
    const incomplete = validateAgentCard({ name: "No interface" });
    expect(incomplete.valid).toBe(false);

    const insecure = validateAgentCard({
      ...externalCard,
      supportedInterfaces: [{
        url: "http://tony.example/a2a",
        protocolBinding: "JSONRPC",
        protocolVersion: "1.0",
      }],
    });
    expect(insecure.valid).toBe(true);
    if (insecure.valid) expect(insecure.warnings).toContain("supportedInterfaces.0.url should use HTTPS outside local development.");
  });

  it("serves the card from the standard well-known path with cache validation", async () => {
    const response = getAgentCard(new Request("https://republic.example/.well-known/agent-card.json"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(validateAgentCard(await response.json()).valid).toBe(true);

    const cached = getAgentCard(new Request("https://republic.example/.well-known/agent-card.json", {
      headers: { "If-None-Match": '"code-republic-agent-card-0.2.0"' },
    }));
    expect(cached.status).toBe(304);
  });
});

describe("A2A to Code Republic join bridge", () => {
  it("converts validated public metadata into the native invite-gated join contract", () => {
    const handoff = buildJoinHandoff({
      action: "join_world",
      worldId: "demo",
      agentCardUrl: "https://tony.example/.well-known/agent-card.json",
      agentCard: externalCard,
    });

    expect(handoff.status).toBe("invite_required");
    expect(handoff.nativeJoin.endpoint).toBe("/api/worlds/demo/join");
    expect(handoff.nativeJoin.body).toMatchObject({
      inviteCode: "<one-time-invite>",
      displayName: "Tony",
      capabilities: ["typescript", "api-contracts", "testing"],
    });
    expect(handoff.warnings).toContain("Capability declarations are discovery metadata, not reputation evidence.");
  });

  it("always emits a display name accepted by the native join endpoint", () => {
    const handoff = buildJoinHandoff({
      action: "join_world",
      worldId: "demo",
      agentCardUrl: "https://x.example/.well-known/agent-card.json",
      agentCard: { ...externalCard, name: "X" },
    });

    expect(handoff.nativeJoin.body.displayName).toBe("X Agent");
  });

  it("returns a direct A2A message containing the typed join handoff", () => {
    const response = handleA2AJsonRpc(sendJoinRequest()) as A2AJsonRpcSuccess<{ message: A2AMessage }>;
    const message = response.result.message;

    expect(response.id).toBe("request-1");
    expect(message.role).toBe("ROLE_AGENT");
    expect(message.contextId).toBe("ctx_message_1");
    expect(message.parts[0]).toMatchObject({
      mediaType: CODE_REPUBLIC_HANDOFF_MEDIA_TYPE,
      data: { status: "invite_required", worldId: "demo" },
    });
  });

  it("exposes the bridge over JSON-RPC 2.0 and enforces A2A v1.0", async () => {
    const response = await postA2A(new Request("https://republic.example/a2a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "A2A-Version": "1.0",
      },
      body: JSON.stringify(sendJoinRequest()),
    }));
    const payload = await response.json() as A2AJsonRpcSuccess<{ message: A2AMessage }>;
    expect(payload.result.message.parts[0]).toMatchObject({
      data: { status: "invite_required" },
    });

    const legacy = await postA2A(new Request("https://republic.example/a2a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendJoinRequest()),
    }));
    expect(await legacy.json()).toMatchObject({ error: { code: -32009 } });
  });

  it("reports task, streaming, and push boundaries with A2A error codes", () => {
    expect(handleA2AJsonRpc({
      jsonrpc: "2.0",
      id: 2,
      method: "GetTask",
      params: { id: "missing-task" },
    })).toMatchObject({ error: { code: -32001 } });
    expect(handleA2AJsonRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "SendStreamingMessage",
      params: {},
    })).toMatchObject({ error: { code: -32004 } });
    expect(handleA2AJsonRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "CreateTaskPushNotificationConfig",
      params: {},
    })).toMatchObject({ error: { code: -32003 } });
  });
});
