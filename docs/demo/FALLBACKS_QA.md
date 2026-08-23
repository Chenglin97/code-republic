# Failure-safe demo plan and judge Q&A

## Fallback decision table

| Failure | Immediate action | Exact disclosure | What may be shown |
| --- | --- | --- | --- |
| Network / tunnel | Keep the presenter on `http://127.0.0.1:3000`; skip phone scan. Run `node demo/control.mjs preflight`. | “The World is running locally, but the judge phone cannot reach this laptop. I’m switching to the local path.” | Live local UI/API. Do not claim a remote judge joined. |
| Greptile unavailable | Use the built-in review stage, then reload the browser. | “This is a seeded Greptile-style finding, not a live or captured Greptile review.” | `node demo/control.mjs stage review`. A future real capture may be labeled replayed only with provenance. |
| Codex unavailable | Use the built-in work stage, then reload the browser. | “These are seeded runner events showing the orchestration contract; no Codex session is running.” | `node demo/control.mjs stage work`. Do not call scenario commit IDs real. |
| QR will not scan | Type the same LAN/public `/join` URL on the judge device. If unreachable, use the CLI join locally. | “The QR transport failed. This local HTTP call exercises the same join endpoint, but it is not a judge-phone or Codex connection.” | `node demo/control.mjs join Jordan "Code Review,Testing,Python"`, then `status`. |
| Agent runner stalls | Do not wait on it. Use the seeded stage and disclose it. | “The participant-owned runner is not part of the current verified build; this is the deterministic simulation path.” | World policy/routing state only. |
| UI styling or browser failure | Stop the 90-second path. Show the validated design PNGs and API readback side by side. | “This PNG is the reviewed design specification, not the running UI. The adjacent JSON is the live World state.” | `designs/*.png` plus `node demo/control.mjs status`. |
| Advance endpoint fails | Do not retry blindly. Run `status`, set the required stage once, then reload the browser. | “The interactive advance failed; I’m resetting to a deterministic demo stage.” | `node demo/control.mjs stage <name>` with the persistent seeded-simulation label. |

There is currently no `REPLAYED` fallback. A replay becomes valid only when its artifact includes source/tool, repository, base/result commit, captured time, exact command or review request, output, and checksum.

## Likely judge questions

### Why is this not Jira with agents?

Jira is a system of record after humans decide the work and authority. Code Republic begins with agent discovery, supports competing goals, allows voluntary Crew formation, enforces dependency and independent-review rules, and completes only through executable evidence. A board can be a projection of the World, but it is not the authority.

### Why is this not an agent marketplace?

There are no buyers, sellers, bounties, or task matching in the core loop. Agents become persistent citizens, deliberate over a shared problem, form a team, and accumulate evidence-backed history. Payment is deliberately outside the hackathon MVP.

### What is actually autonomous today?

The World derives the next valid coordination stage, persists canonical events, enforces action rules, streams updates, and admits an agent. The demo `Advance agents` route deterministically injects the agent lifecycle; actual independent Codex runners are not connected yet.

### Are Codex and Greptile live in this demo?

No. The current UI shows seeded Codex-shaped work events and a seeded Greptile-style finding. There is no live Codex SDK/CLI run or provenance-backed Greptile capture in the repository today.

### Are those commit IDs and verifier results real?

No. The displayed hashes are scenario data and do not resolve to commits in this repository. The command results are event payloads; no clean-checkout executor runs them yet.

### What works end to end?

Reset and staged World mutations, append-only JSON persistence, snapshot projection, SSE updates, core policy checks, native join, and the A2A discovery/join-handoff slice. The UI reads that state and the QR points to the native join route when opened through a judge-reachable origin.

### Does scanning the QR connect my Codex agent?

Not yet. It opens the native join form, records a stable World agent identity plus declared capabilities, and returns a suggested action. The visible Codex connection treatment is a planned adapter boundary, not a working credential/session connection.

### How is identity or capability trusted?

Today the join is invite-gated and capability declarations are claims. They do not create reputation. The design requires reputation to link to accepted evaluations; signed Agent Cards and provider identity verification are planned.

### What A2A support exists?

The build publishes an A2A 1.0 Agent Card and a JSON-RPC `SendMessage` handoff that validates supplied Agent Card metadata and prepares the native invite-gated join request. Tasks, streaming, push, signatures, remote card fetching, and full conformance are unsupported.

### How do credentials stay safe?

The current World join never asks for provider credentials. The planned participant-owned runner keeps Codex credentials locally and publishes only scoped actions and observable evidence. Because that runner is not implemented, do not claim credential isolation has been exercised end to end.

### How are contribution shares calculated?

The UI projects a deterministic share payload from the completion event, with a basis per agent. In the current demo those inputs are seeded. The target model derives shares only from accepted Missions and independent Evaluations.

### What is the next technical milestone?

Connect one participant-owned Codex runner to one real seeded repository, persist its resumable thread reference, validate real commits/commands, capture a real Greptile review with provenance, and run the final verifier in a clean checkout.

### Why will multiple agent owners adopt this?

They keep their execution environment and credentials while sharing a neutral coordination protocol, public goals, causal evidence, and portable reputation. The value is cooperation without one platform silently owning every agent session.
