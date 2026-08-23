# Code Republic demo package

Use these files to rehearse and present the hackathon demo.

## What to open

- [90-second live demo](LIVE_DEMO_90S.md)
- [60-second and 3-minute pitches](PITCH.md)
- [Screen-recording plan](SCREEN_RECORDING.md)
- [Fallbacks and judge questions](FALLBACKS_QA.md)
- [Final readiness checklist](READINESS.md)
- [Setup and reset commands](../../demo/README.md)

## Use these four labels

| Label | What it means |
| --- | --- |
| **LIVE** | The running app or API is doing this now and saving the result. |
| **SIMULATED** | The demo loads a scripted step. Codex, Greptile, or another outside tool did not perform the work. |
| **REPLAYED** | This came from a real earlier run, and we saved enough information to prove where it came from. There is no such recording in the repository today. |
| **PLANNED** | We designed it, but it is not working in the app yet. |

Never call the demo's commit IDs, test results, Codex activity, or Greptile-style finding live or replayed. The commit IDs do not exist in this repository, and there is no saved Greptile result.

## What Code Republic is

> Code Republic helps developers coordinate independent AI coding agents working in the same codebase. It does not ask one agent to plan, build, test, review, and approve everything. Agents with different owners and strengths can each take the part they do best, while Code Republic keeps their work in sync and leaves a public record of how the release came together.

For the agents, it feels like a shared community. For the developer, it is one place to see the plan, dependencies, handoffs, reviews, fixes, and final result.

Open participation does not mean automatic trust. A joined Agent's skills are claims, not proof. The intended trust model is scoped work, repository evidence, review by a different Agent, visible repairs, and final release verification. The MVP enforces different contributor and evaluator Agent IDs, but it does not yet verify different human owners or prevent collusion.

The incentive is one shared Project payout, not pay-per-task. It unlocks only after the whole release passes. Raw activity and self-review earn nothing; accepted Contributions, independent reviews, routed repairs, integration impact, and final verification determine the split. In the current demo, those shares are scripted and no real money moves.

## What works today

> Today the shared state, dependency and self-review rules, live updates, website, join flow, and basic A2A handoff work. Join records claimed skills but does not verify them or connect a runtime. The Codex work and Greptile review shown in the demo are scripted placeholders for the real integrations.

## How Codex fits

> We built Code Republic with Codex as our primary coding agent. The visible Codex tasks helped build and verify the World, A2A bridge, UI, tests, and this demo package. That build process is separate from the owner-run Codex agents shown inside the product; that runtime connection is not wired yet.

## Say the UI labels in plain English

- `Campaign Brief`: “the plan they agreed on”
- `Crew`: “the team that formed”
- `Missions`: “the work each agent takes”
- `dependency graph`: “what can start now and what has to wait”
- `Timeline`: “the full record of who did what”

Do not read the product labels as a string of technical terms. Show the label on screen, then use the plain-English version in the pitch.
