#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const baseUrl = (process.env.CODE_REPUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
const inviteCode = process.env.CODE_REPUBLIC_DEMO_INVITE_CODE || "FAST-2026";

const stageAdvanceCount = new Map([
  ["signal", 0],
  ["campaign", 1],
  ["crew", 2],
  ["work", 3],
  ["review", 4],
  ["repair", 5],
  ["verified", 6],
]);

function fail(message) {
  throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const detail = typeof body === "string"
      ? body.slice(0, 240)
      : body?.error?.message || JSON.stringify(body);
    fail(`${options.method || "GET"} ${path} returned ${response.status}: ${detail}`);
  }
  return { response, body };
}

async function snapshot() {
  return (await request("/api/worlds/demo/snapshot")).body;
}

function summarize(state) {
  const accepted = state.missions.filter((mission) => mission.status === "accepted").length;
  const submitted = state.missions.filter((mission) => mission.contributionCommit).length;
  const findings = state.missions.filter((mission) => mission.finding).length;
  const shareTotal = state.contributionShares.reduce((sum, item) => sum + item.share, 0);
  return {
    baseUrl,
    worldVersion: state.world.version,
    worldStage: state.world.stage,
    agents: state.agents.length,
    campaign: state.campaign?.status || null,
    crew: state.campaign?.crewAgentIds.length || 0,
    missions: state.missions.length,
    submitted,
    findings,
    accepted,
    contributionShareTotal: shareTotal,
    nextAutonomousStep: state.nextAutonomousStep,
  };
}

function assertStage(name, state) {
  const checks = {
    signal: () => !state.campaign && state.proposals.length >= 2,
    campaign: () => state.campaign?.status === "active" && state.missions.length === 0,
    crew: () => state.missions.length >= 4 && !state.missions.some((mission) => mission.contributionCommit),
    work: () => state.missions.filter((mission) => mission.contributionCommit).length >= 2,
    review: () => state.missions.some((mission) => mission.finding && mission.status === "needs_work"),
    repair: () => state.missions.some((mission) => mission.finding)
      && !state.missions.some((mission) => mission.status === "needs_work")
      && state.world.stage !== "completed",
    verified: () => state.world.stage === "completed"
      && state.missions.length > 0
      && state.missions.every((mission) => mission.status === "accepted")
      && state.contributionShares.reduce((sum, item) => sum + item.share, 0) === 100,
  };
  if (!checks[name]?.()) fail(`World did not reach the expected ${name} state.`);
}

async function reset() {
  return (await request("/api/worlds/demo/demo/reset", { method: "POST" })).body.snapshot;
}

async function advance() {
  const result = (await request("/api/worlds/demo/demo/advance", { method: "POST" })).body;
  return result.snapshot;
}

async function setStage(name) {
  const count = stageAdvanceCount.get(name);
  if (count === undefined) {
    fail(`Unknown stage "${name}". Use: ${[...stageAdvanceCount.keys()].join(", ")}.`);
  }
  let state = await reset();
  for (let index = 0; index < count; index += 1) state = await advance();
  assertStage(name, state);
  return state;
}

async function preflight() {
  const checks = [];
  for (const [label, path] of [
    ["World UI", "/"],
    ["Judge join", "/join"],
    ["World snapshot", "/api/worlds/demo/snapshot"],
    ["A2A Agent Card", "/.well-known/agent-card.json"],
  ]) {
    const { response } = await request(path);
    checks.push({ label, status: response.status, pass: response.status === 200 });
  }
  const state = await snapshot();
  const host = new URL(baseUrl).hostname;
  const phoneReachable = !["localhost", "127.0.0.1", "::1", "0.0.0.0", "::"].includes(host);
  console.log(JSON.stringify({ checks, state: summarize(state), phoneReachable }, null, 2));
  if (!phoneReachable) {
    console.warn("QR PHONE WARNING: a phone cannot reach this URL. Open the app through its Wi-Fi address or a public URL before showing the QR code.");
  }
}

async function join(name, capabilityText) {
  const capabilities = (capabilityText || "Code Review,Testing,Python")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  const body = {
    inviteCode,
    displayName: name || "Jordan",
    capabilities,
    idempotencyKey: `demo-cli:${(name || "Jordan").toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${Date.now()}`,
  };
  const result = (await request("/api/worlds/demo/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })).body;
  return {
    agent: result.agent,
    firstActionEventId: result.firstActionEventId,
    suggestedAction: result.suggestedAction,
    state: summarize(result.snapshot),
  };
}

function usage() {
  console.log(`Code Republic demo control

Usage:
  node demo/control.mjs preflight
  node demo/control.mjs status
  node demo/control.mjs reset
  node demo/control.mjs advance
  node demo/control.mjs stage <signal|campaign|crew|work|review|repair|verified>
  node demo/control.mjs join [name] [comma-separated capabilities]

Environment:
  CODE_REPUBLIC_BASE_URL            default: ${DEFAULT_BASE_URL}
  CODE_REPUBLIC_DEMO_INVITE_CODE    default: FAST-2026

What is real:
  Every API update is saved and shown by the live app.

What is scripted:
  The advance command loads prepared Codex and Greptile-style steps. It does not
  run Codex, Greptile, repository commands, or real commits.`);
}

async function main() {
  const [command = "help", first, second] = process.argv.slice(2);
  if (command === "help" || command === "--help" || command === "-h") return usage();
  if (command === "preflight") return preflight();
  if (command === "status") return console.log(JSON.stringify(summarize(await snapshot()), null, 2));
  if (command === "reset") return console.log(JSON.stringify(summarize(await reset()), null, 2));
  if (command === "advance") return console.log(JSON.stringify(summarize(await advance()), null, 2));
  if (command === "stage") return console.log(JSON.stringify(summarize(await setStage(first)), null, 2));
  if (command === "join") return console.log(JSON.stringify(await join(first, second), null, 2));
  fail(`Unknown command "${command}". Run node demo/control.mjs --help.`);
}

main().catch((error) => {
  console.error(`DEMO CONTROL FAILED: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
