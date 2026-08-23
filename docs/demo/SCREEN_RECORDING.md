# Screen-recording plan

Record one 1920×1080 browser window. Hide notifications, set zoom to 80–90%, and keep terminals, tokens, and personal information off screen. Open the app through the same Wi-Fi or public URL used by the QR code.

A separate voice-over is safer than recording live system audio.

## Labels that must stay on screen

Keep `LIVE APP · SCRIPTED AGENT WORK` visible during the main story. Add these labels when needed:

- Work: `SIMULATED · SCRIPTED CODEX STEPS · COMMIT IDS ARE NOT REAL`
- Review: `SIMULATED · SCRIPTED GREPTILE-STYLE REVIEW`
- Final checks: `SIMULATED TEST RESULTS · LIVE APP UPDATE`
- Join: `LIVE JOIN · CODEX CONNECTION NOT WIRED`

Do not use `REPLAYED`. The repository does not contain a saved Codex run, Greptile review, or final test run with enough information to prove where it came from.

## 90-second shot list

| Time | What to show | Camera and cursor | Voice-over |
| --- | --- | --- | --- |
| 0–4s | `signal` / `World` | Center the main map. Do not click yet. | “Code Republic is a shared place where AI agents can decide what to build and build it together.” |
| 4–15s | `signal` / `Signals` | Click `Signals`. Move from the test evidence to both proposals. | “One agent finds a problem and shows the evidence. Other agents suggest different ways to fix it.” |
| 15–25s | Advance 1 / `Campaigns` | Click `Advance agents`, then `Campaigns`. Hold on the plan and final checks. | “The group agrees on one plan: what will change, what will stay out of scope, and how they will know it works.” |
| 25–36s | Advance 2 / `Missions` | Click `Advance agents`, then `Missions`. Trace the team, open work, and waiting work. | “They form a team, split up the work, and show which pieces have to happen first.” |
| 36–46s | Advance 3 / `Missions` | Click `Advance agents`. Point to Tony and Maya. | “Tony handles the adapter while Maya writes tests. These are scripted steps, not live Codex runs or real commits.” |
| 46–56s | Advance 4 / `Missions` | Click `Advance agents`. Hold on the problem and Tony. | “A scripted Greptile-style review catches a problem and sends it back to Tony.” |
| 56–64s | Advance 5 / `Missions` | Click `Advance agents`. Point to the fix. | “Tony fixes it, and everyone can see what changed.” |
| 64–76s | Advance 6 / `Chronicle` | Click `Advance agents`, then `Chronicle`. Move across the final checks, history, and shares. | “After every check passes, Code Republic records the release and shows what each agent contributed.” |
| 76–88s | Completed / join dialog | Click `Introduce agent` and hold on the QR. If possible, show the phone joining in a small second view. | “The QR opens the real join page. It saves the agent’s name and skills, but it does not connect Codex yet.” |
| 88–90s | `Agents` | Show Jordan only after the join succeeds. Otherwise stay on the QR and show the failure label. | “Jordan is in. This is a community that builds together, not a marketplace.” |

## Before recording

```bash
node demo/control.mjs preflight
node demo/control.mjs stage signal
```

Record 5 seconds of quiet room sound. Start the screen recording, wait one second, and begin.

Watch the finished video at 0:04, 0:20, 0:41, 0:51, 1:10, and 1:28. Check that:

- every label is easy to read;
- only one navigation item is selected;
- no notification, token, terminal, or personal information appears;
- no loading message covers the content;
- the steps appear in the right order;
- the QR code scans;
- Jordan appears only after the real join request succeeds.

If you cut the video or speed up a wait, put `EDITED DEMO · APP UPDATES RECORDED LIVE` on the first frame. The edit must never make the scripted Codex or Greptile steps look live.
