# Final demo readiness

Audit baseline: nested repository `code-republic`; `[EPIC-DEMO]` registration at `4fde0fb`; integrated main observed through `aa7a729`. This checklist must be refreshed immediately before judging because UI work is continuing in the same working tree.

## Current evidence matrix

| Area | Status | Evidence and presenter consequence |
| --- | --- | --- |
| `[EPIC-DEMO]` CI tag | Ready | `docs/EPICS.md` and `.github/workflows/main.yml` accept the tag at `4fde0fb`. |
| World authority and persistence | Implemented | Snapshot, action, SSE, reset, advance, and join routes use the append-only World authority and JSON event storage. |
| Signal and two proposals | Implemented as seeded state | Reset projects one validated Signal and two competing proposals. Label the scenario seeded. |
| Campaign, Crew, Missions, review, repair, release | Implemented as scripted demo transitions | `/demo/advance` appends deterministic events. State mutation is live; represented agent work is simulated. |
| Core rules | Implemented and covered by tests | Optimistic versioning, idempotency, dependency-aware claim checks, and independent-review checks exist. Re-run CI commands before presenting. |
| Native join | Implemented | `/join` and `POST /api/worlds/demo/join` create an Agent, publish capabilities, and return a suggested action. |
| QR transport | Implemented but environment-dependent | QR derives from `window.location.origin`. A phone test on the final LAN/public URL is still required. |
| A2A | Partial implementation | Agent Card plus invite-gated `SendMessage` handoff; not tasks, streaming, push, signatures, remote-card fetch, or full conformance. |
| Product UI | In progress at audit time | World, Signals, Campaigns, Missions, and Chronicle were styled in the live browser. Agent cards were still browser-default controls and the join dialog was not visible in the captured viewport, because the UI-owned CSS ended before those components. Do not judge-present until UI integration is committed and all views are rechecked. |
| Design suite | Verified design specification | Nine PNGs are valid 1536×1024 images. They are design references, not running-product evidence. |
| Live Codex runner | Not implemented | No Codex SDK/CLI integration, persistent thread reference, runner process, or real concurrent execution was found. |
| Live/captured Greptile | Not implemented | The finding is hard-coded in the demo transition and no captured Greptile artifact exists. |
| Real repository evidence | Not implemented in demo lifecycle | Seed base/result hashes do not resolve to commits in this repository. |
| Final clean-checkout verifier | Not implemented | Command strings and exit codes are seeded event payloads; no executor runs them. |
| Contribution shares | Implemented projection over seeded input | Shares total 100 in the completed scripted state, but are not derived from real accepted external evidence yet. |
| Replayed fallback | Not available | No artifact meets the provenance requirements. Use the simulated label, never replayed. |
| Root status documentation | Stale | `README.md` still says implementation has not started, while the app and APIs exist. Do not hand that sentence to judges as current status. |
| Seed-count documentation | Stale | `MVP_ACCEPTANCE.md` says four persistent Agents plus a fifth judge Agent; reset currently seeds six, and a judge join becomes the seventh. |

## Go/no-go checklist

### Required before presenting the live 90-second path

- [ ] `git status --short` shows no unexpected overlap in `demo/**` or `docs/demo/**`.
- [ ] `npm test`, `npm run typecheck`, and `npm run build` pass on the integrated tree.
- [ ] `node demo/control.mjs preflight` reports four passing HTTP checks.
- [ ] `node demo/control.mjs stage signal` succeeds.
- [ ] Six UI advances reach completed state and shares total 100.
- [ ] The browser is visually styled and matches the accepted light UI direction at 1920×1080.
- [ ] Signals, Campaigns, Missions, Chronicle, Agents, and the join dialog are visually inspected.
- [ ] Event stream reads `live` throughout one full rehearsal.
- [ ] The final base URL is not loopback-only.
- [ ] A real phone scans the displayed QR, submits the native join, and the presenter UI shows the new Agent.
- [ ] Reset removes the rehearsal Agent and returns exactly to the seeded opening state.
- [ ] All simulated evidence labels are visible/read aloud; no claim calls it live or replayed.
- [ ] No API keys, invite secrets beyond the demo code, personal data, terminal history, or notifications appear.
- [ ] Presenter completes two rehearsals between 88 and 90 seconds.

### Required before upgrading any evidence claim

- [ ] A Codex runner starts/resumes a real thread and publishes scoped artifacts.
- [ ] Displayed base/result commits resolve in the seeded repository.
- [ ] Before/after commands execute and their output is captured with exit codes.
- [ ] Greptile runs live or a capture records provenance, timestamp, repository, commit, request, result, and checksum.
- [ ] Final verification runs from a clean checkout.
- [ ] Reputation/share inputs link to accepted real Evaluation events.

## Current verdict

**Not ready to claim the full autonomous P0 loop.** It is safe to present as a working coordination authority and join surface with an explicitly seeded execution/review simulation, after the UI styling, integrated CI, and judge-phone QR checks pass.
