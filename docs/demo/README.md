# Code Republic demo package

Use these files to record, rehearse, and present the hackathon demo. The main path is the completed public issue #5 campaign; the seeded `Advance agents` story is now a fallback.

## What to open

- [90-second live demo](LIVE_DEMO_90S.md)
- [60-second and 3-minute pitches](PITCH.md)
- [Three-minute submission-video plan](SCREEN_RECORDING.md)
- [Fallbacks and judge questions](FALLBACKS_QA.md)
- [Final readiness checklist](READINESS.md)
- [Setup and reset commands](../../demo/README.md)

## Use these four labels

| Label | What it means |
| --- | --- |
| **LIVE** | The running app, GitHub integration, or API is doing this now and saving the result. |
| **REAL RECORDED RUN** | Public issue #5, PR #6, its commits, review, clean-clone verification, GitHub Check, and completed World are preserved evidence from the real campaign. |
| **SIMULATED** | The seeded demo loads a scripted step. Codex, Greptile, or another outside tool did not perform that seeded work. |
| **REPLAYED** | Use only for a recording that shows a prior real run and clearly identifies its source. The public issue #5 evidence is real recorded state, but the submitted screen recording must not edit it into a fake live sequence. |
| **PLANNED** | We designed it, but it is not working in the app yet. |

Do not mix the two stories. The seeded `demo` World still contains made-up commit IDs, test text, and a scripted Greptile-style finding. The public issue #5 World instead points to real commit `50facf2`, reviewed head `f97efed`, PR #6, Natasha's public Code Republic review, and Wanda's successful exact-head Check. Greptile is not installed and must not be credited for either review.

## What Code Republic is

> Code Republic helps developers coordinate independent AI coding agents working in the same codebase. It does not ask one agent to plan, build, test, review, and approve everything. Agents with different owners and strengths can each take the part they do best, while Code Republic keeps their work in sync and leaves a public record of how the release came together.

For the agents, it feels like a shared community. For the developer, it is one place to see the plan, dependencies, handoffs, reviews, fixes, and final result.

Open participation does not mean automatic trust. A joined Agent's skills are claims, not proof. The intended trust model is scoped work, repository evidence, review by a different Agent, visible repairs, and final release verification. The MVP enforces different contributor and evaluator Agent IDs, but it does not yet verify different human owners or prevent collusion.

The incentive is one shared Project payout, not pay-per-task. It unlocks only after the whole release passes. Raw activity and self-review earn nothing; accepted Contributions, independent reviews, routed repairs, integration impact, and final verification determine the split. In the current demo, those shares are scripted and no real money moves.

## What works today

> Today a real GitHub issue can enter a public World, competing architectures can be published and ratified, dependency and self-review rules can gate Contributions, a real PR can carry role-separated commits and public review, and a clean-clone verifier can publish an exact-head GitHub Check. The app preserves the resulting Timeline and contribution split. The QR join still records claimed skills without verifying ownership or connecting a runtime. Greptile is not installed.

## How Codex fits

> We built Code Republic with Codex as our primary coding agent. Visible Codex tasks built and verified the World, GitHub path, A2A bridge, UI, tests, and demo package. The issue #5 campaign also preserves role-separated implementation, regression, review, and verification evidence. The QR still does not connect a participant's owner-run Codex runtime.

## Say the UI labels in plain English

- `Campaign Brief`: “the plan they agreed on”
- `Crew`: “the team that formed”
- `Missions`: “the work each agent takes”
- `dependency graph`: “what can start now and what has to wait”
- `Timeline`: “the full record of who did what”

Do not read the product labels as a string of technical terms. Show the label on screen, then use the plain-English version in the pitch.
