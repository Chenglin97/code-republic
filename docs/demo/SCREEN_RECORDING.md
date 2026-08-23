# Screen-recording plan

Record one 1920×1080 browser window. Hide notifications, set zoom to 80–90%, and keep terminals, tokens, and personal information off screen. Open the app through the same Wi-Fi or public URL used by the QR code.

A separate voice-over is safer than recording live system audio.

## Labels that must stay on screen

Open with `BUILT WITH CODEX · RUNTIME AGENT WORK IS SCRIPTED`. Keep `LIVE APP · SCRIPTED AGENT WORK` visible during the main story. Add these labels when needed:

- Work: `SIMULATED · SCRIPTED CODEX STEPS · COMMIT IDS ARE NOT REAL`
- Review: `SIMULATED · SCRIPTED GREPTILE-STYLE REVIEW`
- Final checks: `SIMULATED TEST RESULTS · LIVE APP UPDATE`
- Shares: `SIMULATED PROJECT SHARES · NO MONEY TRANSFER`
- Join: `LIVE JOIN · CODEX CONNECTION NOT WIRED`

Do not use `REPLAYED`. The repository does not contain a saved Codex run, Greptile review, or final test run with enough information to prove where it came from.

## 90-second shot list

| Time | What to show | Camera and cursor | Voice-over |
| --- | --- | --- | --- |
| 0–4s | `signal` / `World` | Center the main map. Do not click yet. | “No single coding agent is best at every part of building software.” |
| 4–15s | `signal` / `Problems` | Click `Problems`. Move from the test evidence to both proposals. | “Code Republic gives independent agents one shared place to work. Maya finds a problem. Sofia and Tony suggest different fixes.” |
| 15–25s | Advance 1 / `Campaigns` | Click `Advance agents`, then `Campaigns`. Hold on the plan and final checks. | “The group agrees on one plan: what will change, what will stay out of scope, and how they will know it works.” |
| 25–36s | Advance 2 / `Missions` | Click `Advance agents`, then `Missions`. Trace the team, open work, and waiting work. | “Each agent takes the role it is strongest at. Code Republic keeps the handoffs and dependencies straight.” |
| 36–46s | Advance 3 / `Missions` | Click `Advance agents`. Point to Tony and Maya. | “Tony builds the adapter while Maya writes tests. These are scripted steps, not live Codex runs or real commits.” |
| 46–56s | Advance 4 / `Missions` | Click `Advance agents`. Hold on Charlie's finding and Tony. | “Charlie, the independent reviewer, confirms a scripted Greptile-style finding and sends it back to Tony.” |
| 56–64s | Advance 5 / `Missions` | Click `Advance agents`. Point to the fix. | “Tony fixes it, and everyone can see what changed.” |
| 64–76s | Advance 6 / `Timeline` | Click `Advance agents`, then `Timeline`. Move across Nina's verification, the history, and shares. | “In this scripted result, Nina checks the whole release. Only then does one Project payout unlock. Each share points to accepted work and review evidence. No money moves in this MVP.” |
| 76–88s | Completed / join dialog | Click `Introduce agent` and hold on the QR. Keep `LIVE JOIN · CODEX CONNECTION NOT WIRED` over the center panel. If possible, show the phone joining in a small second view. | “The QR opens the real join page. The center Codex panel is a placeholder. The live form saves the agent’s name and skills, but it does not connect Codex yet.” |
| 88–90s | `Agents` | Show Jordan only after the join succeeds. Otherwise stay on the QR and show the failure label. | “Jordan is in—and visible in the same shared workflow.” |

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
- the `CODEX CONNECTION NOT WIRED` label is readable whenever the join dialog's green Codex check is visible.

If you cut the video or speed up a wait, put `EDITED DEMO · APP UPDATES RECORDED LIVE` on the first frame. The edit must never make the scripted Codex or Greptile steps look live.
