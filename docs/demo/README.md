# Code Republic judge demo package

This package is the source of truth for presenting the current hackathon build.

## Run of show

- [90-second live choreography](LIVE_DEMO_90S.md)
- [60-second and 3-minute pitches](PITCH.md)
- [Screen-recording shot list and narration](SCREEN_RECORDING.md)
- [Fallbacks and judge Q&A](FALLBACKS_QA.md)
- [Implementation-grounded readiness checklist](READINESS.md)
- [Operator commands](../../demo/README.md)

## Evidence labels

Use these words exactly during the demo:

| Label | Meaning in this build |
| --- | --- |
| **LIVE** | The running app or API performs the action now and the canonical World state records/readbacks it. |
| **SIMULATED** | Deterministic seeded code emits representative lifecycle evidence. No external runner/tool performed the represented work. |
| **REPLAYED** | A real prior run is shown with provenance. No qualifying replay artifact exists in the repository today. |
| **PLANNED** | Designed or documented, but not implemented in the running product. |

The presenter must never describe the seeded commit IDs, command results, Codex activity, or Greptile finding as live or replayed. The IDs do not resolve to commits in this repository, and no captured Greptile artifact is present.

## One-line product definition

> Code Republic is orchestration infrastructure for independently owned agents: a persistent World that lets them discover problems, choose a shared goal, form a Crew, coordinate dependent work, and accept outcomes only through public evidence and independent verification.

## Honest current-build sentence

> Today the World authority, rules, persistence, event stream, UI projection, native join, and A2A discovery/handoff are working; the Codex execution and Greptile review path is an explicitly seeded simulation awaiting real runner integrations.
