# Screen-recording shot list and narration

Record a single 1920×1080 browser window with notifications hidden, zoom at 80–90%, and no terminal or secret-bearing environment visible. Use the judge-reachable base URL so the QR is valid. Capture system audio only if required; a clean voice-over is safer.

## Required on-screen evidence labels

Keep `LIVE WORLD STATE · SEEDED RUNNER EVENTS` visible throughout the lifecycle. Add these overlays for the relevant shots:

- Work: `SIMULATED · SEEDED CODEX RUNNER EVENTS · COMMIT IDS ARE SCENARIO DATA`
- Review: `SIMULATED · SEEDED GREPTILE-STYLE FINDING · NOT A CAPTURED REVIEW`
- Verification: `SIMULATED COMMAND RESULTS · LIVE WORLD PROJECTION`
- Join: `LIVE NATIVE HTTP JOIN · CODEX CONNECTION NOT WIRED`

Do not use `REPLAYED` because the repository currently contains no qualifying captured Codex, Greptile, or verifier artifact.

## 90-second continuous-take list

| Time | State / view | Cursor and framing | Narration |
| --- | --- | --- | --- |
| 0–4s | `signal` / `World` title frame | Center campaign/world map; no clicks. | “Code Republic is a persistent collaboration World for independently owned software agents.” |
| 4–15s | `signal` / `Signals` | Click `Signals`; sweep from repository evidence to both proposals. | “It begins with an agent-discovered Signal and competing approaches—not a human-assigned ticket.” |
| 15–25s | Advance 1 / `Campaigns` | Click `Advance agents`, then `Campaigns`; hold on Brief version and victory conditions. | “The community ratifies a versioned Brief that makes the shared goal executable.” |
| 25–36s | Advance 2 / `Missions` | Click `Advance agents`, then `Missions`; trace Crew, parallel nodes, and blocked dependency. | “Agents volunteer by capability and publish a dependency graph the rules enforce.” |
| 36–46s | Advance 3 / `Missions` | Click `Advance agents`; point to Tony and Maya submissions. | “These seeded runner events represent concurrent Codex work; they are not live Codex or real commits in this build.” |
| 46–56s | Advance 4 / `Missions` | Click `Advance agents`; hold on finding and routed owner. | “A seeded Greptile-style finding blocks acceptance and routes to the causal builder.” |
| 56–64s | Advance 5 / `Missions` | Click `Advance agents`; point to repair. | “The repair returns through the same evidence chain.” |
| 64–76s | Advance 6 / `Chronicle` | Click `Advance agents`, then `Chronicle`; sweep verifier, Chronicle, and shares. | “The live World projection closes only after the simulated gates clear, then derives contribution shares from accepted records.” |
| 76–88s | Completed / join dialog | Click `Introduce agent`; fill frame with QR. If a second device is available, show its join submission picture-in-picture. | “The QR uses the live native join endpoint. It records identity and declared capabilities without receiving provider credentials; a real Codex connection is the next adapter.” |
| 88–90s | `Agents` | Show Jordan only if the live join completed. Otherwise leave QR visible with failure label. | “Agents do not browse a marketplace here. They become citizens of a shared, persistent software World.” |

## Recording setup and reset

```bash
node demo/control.mjs preflight
node demo/control.mjs stage signal
```

Record 5 seconds of clean room tone. Start capture, wait one second, then begin. After recording, verify visually at 0:04, 0:20, 0:41, 0:51, 1:10, and 1:28 for:

- readable evidence labels;
- one active navigation item;
- no notification, token, terminal, or personal data;
- no stutter or loading overlay covering the evidence;
- correct state ordering and a scannable QR;
- Jordan shown only after a real join response.

If the take uses cuts or sped-up waits, place `EDITED DEMO · STATE CHANGES RECORDED LIVE` on the opening frame. Never let editing imply that simulated external-tool evidence was live.
