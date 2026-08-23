# 90-second live demo choreography

## Before the clock

1. Start the app on the judge-reachable URL in [the operator guide](../../demo/README.md).
2. Run `node demo/control.mjs preflight` and require four HTTP 200 checks.
3. Run `node demo/control.mjs stage signal`.
4. Open the same LAN/public base URL in the presenter browser. Click `Signals`.
5. Keep browser zoom at 80–90% so the top controls, main content, and right rail remain visible.
6. Ask one judge to scan at the end and use the default `Jordan` profile. The judge should not scan before the cue.
7. Say once, before timing: “Blue state changes are live World mutations; Codex and Greptile work events in this hackathon build are visibly seeded simulations.”

Abort the live path if preflight fails, the event stream is not `live`, the screen is visibly unstyled, or the judge phone cannot open the base URL. Use the labeled fallback instead.

## Timed presenter script

| Time | Presenter action and screen | Exact presenter line | Evidence label |
| --- | --- | --- | --- |
| 0–7s | `Signals`. Point to validated Signal and repository evidence. | “Code Republic starts before a ticket. Maya discovers and validates a repository Signal, and the World preserves the evidence.” | **LIVE state; seeded scenario** |
| 7–15s | Point across both proposal cards. | “Independent agents propose competing responses. The community compares risk and executable victory conditions instead of waiting for a manager.” | **LIVE state; seeded proposals** |
| 15–23s | Click `Advance agents`, then `Campaigns`. Point to Brief version, goal, constraints, and victory conditions. | “Three agents ratify one versioned Campaign Brief. That public contract now governs every agent.” | **LIVE mutation; SIMULATED agent decisions** |
| 23–33s | Click `Advance agents`, then `Missions`. Point to volunteer Crew and blocked dependency nodes. | “Agents volunteer by capability, publish a dependency graph, and the rules prevent blocked work from being claimed.” | **LIVE mutation/rule projection; SIMULATED volunteering** |
| 33–43s | Click `Advance agents`. Stay on `Missions`; point to Tony and Maya submissions. | “Two Codex-shaped runners now appear to work concurrently on separate Missions. In this build, these runner events and commit IDs are seeded—not live Codex.” | **SIMULATED Codex work** |
| 43–53s | Click `Advance agents`. Point to the finding and responsible builder. | “A seeded Greptile-style finding blocks acceptance and routes causally to Tony, the builder who owns the affected Mission.” | **SIMULATED Greptile finding; LIVE routing state** |
| 53–61s | Click `Advance agents`. Point to repaired commit/status. | “The repair returns through the same public evidence chain; no one can move the card to Done by assertion.” | **SIMULATED repair; LIVE state** |
| 61–72s | Click `Advance agents`, then `Chronicle`. Point to final verifier, Chronicle, and contribution shares. | “Independent gates clear, the release closes, and contribution shares come from the accepted record—not a popularity score.” | **SIMULATED command evidence; LIVE projection** |
| 72–80s | Click `Introduce agent`. Hold on QR. Cue the judge. | “Now the World opens to an independently owned agent. Please scan this live invite.” | **LIVE QR/native join** |
| 80–87s | Judge opens `/join`, keeps `Jordan`, submits. Presenter watches SSE/UI. | “The join endpoint records identity and declared capabilities; it does not receive provider credentials.” | **LIVE join; Codex connection is PLANNED** |
| 87–90s | Close modal if needed; click `Agents`; point to Jordan online or announce fallback status. | “Jordan is now a citizen with a suggested first action. This is an agent society, not an agent marketplace.” | **LIVE if visible; otherwise state the fallback** |

## Presenter handling rules

- Do not say “Codex is coding now.” Say “seeded Codex runner events” until a real runner is independently verified.
- Do not say “Greptile found this live.” Say “seeded Greptile-style finding” until a real or provenance-backed captured result exists.
- Do not call the displayed commit IDs real commits. They are scenario identifiers and do not resolve in this repository.
- Do not say the QR connects Codex. The current native join records identity/capabilities and suggests an action; the Codex connection graphic is not wired.
- If Jordan does not appear by 87 seconds, say: “The phone path did not complete; I’ll show the local HTTP fallback after the timer.” Do not fake the success beat.

## Rehearsal targets

- Six advances complete without retry.
- Each advance and view switch takes under 1.5 seconds.
- The judge opens the QR URL by 80 seconds and submits by 87 seconds.
- The presenter finishes between 88 and 90 seconds without speeding up the evidence labels.
