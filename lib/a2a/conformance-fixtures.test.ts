import { describe, expect, it, vi } from "vitest";
import invalidCard from "./fixtures/v1.0/agent-card.missing-supported-interfaces.invalid.json";
import validCard from "./fixtures/v1.0/agent-card.valid.json";
import joinRequest from "./fixtures/v1.0/send-message.join.request.json";
import joinResponse from "./fixtures/v1.0/send-message.join.response.json";
import overlappingPartRequest from "./fixtures/v1.0/send-message.overlapping-part-content.invalid.json";
import { buildJoinHandoff, type IndependentAgentAdapter } from "./adapter";
import { handleA2AJsonRpc } from "./bridge";
import { validateAgentCard } from "./card";
import type { CodeRepublicJoinIntent } from "./contract";

describe("A2A v1.0 compatibility fixtures", () => {
  it("accepts the versioned independently owned Agent Card fixture", () => {
    const result = validateAgentCard(validCard);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.card.supportedInterfaces[0]).toMatchObject({
        protocolBinding: "JSONRPC",
        protocolVersion: "1.0",
      });
      expect(result.warnings).toContain(
        "Agent Card is unsigned; treat declared identity and capabilities as unverified claims.",
      );
    }
  });

  it("rejects a fixture missing the v1.0 supportedInterfaces declaration", () => {
    const result = validateAgentCard(invalidCard);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues).toContainEqual(expect.objectContaining({ path: "supportedInterfaces" }));
    }
  });

  it("matches the golden direct-message join handoff", () => {
    expect(handleA2AJsonRpc(joinRequest)).toEqual(joinResponse);
  });

  it("rejects a Part fixture with overlapping one-of content members", () => {
    expect(handleA2AJsonRpc(overlappingPartRequest)).toMatchObject({
      id: "fixture-invalid-part-1",
      error: {
        code: -32602,
        data: [{ reason: "INVALID_PARAMS" }],
      },
    });
  });
});

describe("independently owned agent adapter boundary", () => {
  it("does not retrieve the caller-supplied Agent Card URL", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    try {
      expect(handleA2AJsonRpc(joinRequest)).toEqual(joinResponse);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("passes the caller-supplied card document to an injected local adapter", () => {
    let observedIntent: CodeRepublicJoinIntent | undefined;
    const adapter: IndependentAgentAdapter = {
      id: "fixture-owner-adapter",
      prepareJoin(intent) {
        observedIntent = intent;
        return buildJoinHandoff(intent);
      },
    };

    const response = handleA2AJsonRpc(joinRequest, { independentAgentAdapter: adapter });

    expect(observedIntent).toMatchObject({
      worldId: "demo",
      agentCardUrl: "https://tony.example/.well-known/agent-card.json",
      agentCard: { name: "Tony", version: "2.3.0" },
    });
    expect(response).toEqual(joinResponse);
  });
});
