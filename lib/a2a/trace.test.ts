import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { handleA2AJsonRpc } from "./bridge";
import { CODE_REPUBLIC_JOIN_MEDIA_TYPE } from "./bridge";
import { LocalJsonA2ATraceStorage } from "./trace-storage";
import {
  A2A_RUNTIME_METADATA_KEY,
  A2A_USAGE_METADATA_KEY,
  buildA2ATrace,
} from "./trace";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function tracedRequest(agentName = "Tony") {
  return {
    jsonrpc: "2.0" as const,
    id: `rpc-${agentName.toLowerCase()}`,
    method: "SendMessage",
    params: {
      message: {
        messageId: `msg-${agentName.toLowerCase()}`,
        contextId: "ctx-independent-owners",
        role: "ROLE_USER" as const,
        metadata: {
          [A2A_RUNTIME_METADATA_KEY]: {
            agentType: "codex-runtime",
            model: "gpt-5.6",
          },
          [A2A_USAGE_METADATA_KEY]: {
            inputTokens: 1200,
            cachedInputTokens: 400,
            outputTokens: 300,
            totalTokens: 1500,
          },
          "secret-api-key-value": "must-not-enter-trace",
        },
        parts: [{
          mediaType: CODE_REPUBLIC_JOIN_MEDIA_TYPE,
          data: {
            action: "join_world",
            worldId: "demo",
            agentCardUrl: `https://${agentName.toLowerCase()}.example/.well-known/agent-card.json?secret=not-persisted`,
            agentCard: {
              name: agentName,
              description: "Independently owned test agent.",
              supportedInterfaces: [{
                url: `https://${agentName.toLowerCase()}.example/a2a`,
                protocolBinding: "JSONRPC",
                protocolVersion: "1.0",
              }],
              provider: { organization: `${agentName} owner`, url: `https://${agentName.toLowerCase()}.example` },
              version: "1.0.0",
              capabilities: { streaming: false, pushNotifications: false },
              defaultInputModes: ["text/plain"],
              defaultOutputModes: ["text/plain"],
              skills: [{
                id: "bounded-work",
                name: "Bounded work",
                description: "Completes one bounded task.",
                tags: ["testing"],
              }],
            },
          },
        }, {
          text: "private prompt text that must never enter the trace store",
        }],
      },
    },
  };
}

describe("A2A trace normalization", () => {
  it("captures identity, runtime type, latency, and caller-reported token provenance", () => {
    const request = tracedRequest();
    const response = handleA2AJsonRpc(request);
    const trace = buildA2ATrace({
      payload: request,
      response,
      protocolVersion: "1.0",
      adapterId: "test-adapter",
      durationMs: 12.345,
      traceId: "trace-tony",
      timestamp: "2026-08-23T22:00:00.000Z",
    });

    expect(trace).toMatchObject({
      traceId: "trace-tony",
      source: {
        agentName: "Tony",
        ownership: "independently-owned",
        agentType: "codex-runtime",
        model: "gpt-5.6",
        cardUrl: "https://tony.example/.well-known/agent-card.json",
      },
      usage: {
        source: "caller-reported",
        inputTokens: 1200,
        outputTokens: 300,
        totalTokens: 1500,
      },
      durationMs: 12.35,
    });
    expect(JSON.stringify(trace.envelope)).not.toContain("private prompt text");
    expect(JSON.stringify(trace)).not.toContain("secret=not-persisted");
    expect(JSON.stringify(trace)).not.toContain("must-not-enter-trace");
    expect(trace.envelope.request).toMatchObject({
      method: "SendMessage",
      params: { message: { parts: [{ kind: "data" }, { kind: "text" }] } },
    });
  });

  it("prefers trusted adapter telemetry over caller-reported usage", () => {
    const request = tracedRequest("Bruce");
    const trace = buildA2ATrace({
      payload: request,
      response: handleA2AJsonRpc(request),
      protocolVersion: "1.0",
      adapterId: "sdk-adapter",
      durationMs: 4,
      adapterTelemetry: {
        agentType: "owner-sdk",
        model: "verified-model",
        usage: { inputTokens: 50, outputTokens: 25, totalTokens: 75 },
      },
    });

    expect(trace.source).toMatchObject({ agentName: "Bruce", agentType: "owner-sdk", model: "verified-model" });
    expect(trace.usage).toEqual({ source: "adapter-reported", inputTokens: 50, outputTokens: 25, totalTokens: 75 });
  });
});

describe("local A2A trace persistence", () => {
  it("keeps independently owned agents in one durable World trace feed", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "code-republic-a2a-"));
    temporaryDirectories.push(directory);
    const storage = new LocalJsonA2ATraceStorage(path.join(directory, "traces.json"));

    const writes = ["Tony", "Bruce"].map((name) => {
      const request = tracedRequest(name);
      return storage.append(buildA2ATrace({
        payload: request,
        response: handleA2AJsonRpc(request),
        protocolVersion: "1.0",
        adapterId: "test-adapter",
        durationMs: 3,
        traceId: `trace-${name.toLowerCase()}`,
        timestamp: `2026-08-23T22:00:0${name === "Tony" ? "1" : "2"}.000Z`,
      }));
    });
    await Promise.all(writes);

    const reloaded = new LocalJsonA2ATraceStorage(path.join(directory, "traces.json"));
    expect((await reloaded.list("demo", 10)).map((trace) => trace.source.agentName)).toEqual(["Bruce", "Tony"]);
  });
});
