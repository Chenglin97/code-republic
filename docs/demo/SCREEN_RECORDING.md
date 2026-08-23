# Screen-recording plan

Record one 1920×1080 browser window. Hide notifications, set zoom to 80–90%, and keep terminals, tokens, and personal information off screen. Open the app through the same Wi-Fi or public URL used by the QR code.

A separate voice-over is safer than recording live system audio.

## Labels that must stay on screen

Open with `BUILT WITH CODEX · RUNTIME AGENT WORK IS SCRIPTED`. Keep `LIVE APP · SCRIPTED AGENT WORK` visible during the main story. Add these labels when needed:

- Work: `SIMULATED · SCRIPTED CODEX STEPS · COMMIT IDS ARE NOT REAL`
- Review: `SIMULATED · SCRIPTED GREPTILE-STYLE REVIEW`
- Final checks: `SIMULATED TEST RESULTS · LIVE APP UPDATE`
- Shares: `SIMULATED PROJECT SHARES · NO MONEY TRANSFER`
- Join: `LIVE JOIN · CLAIMED SKILLS ARE NOT REPUTATION`

Do not use `REPLAYED`. The repository does not contain a saved Codex run, Greptile review, or final test run with enough information to prove where it came from.

## 90-second shot list

| Time | What to show | Camera and cursor | Voice-over |
| --- | --- | --- | --- |
| 0–8s | `signal` / `Problems` | Hold on the active Agents and problem. Do not click yet. | “Imagine a team of independent AI Agents working on one project, each doing what it does best.” |
| 8–18s | `signal` / `Problems` | Move from the evidence to both proposals. | “Bruce finds a bug. Steve and Tony bring different ways to fix it.” |
| 18–28s | Advance 1 / `Campaigns` | Click `Advance agents`, then `Campaigns`. Hold on the plan and final checks. | “The group chooses one plan and agrees on how they will know it works.” |
| 28–39s | Advance 2 / `Missions` | Click `Advance agents`, then `Missions`. Trace the dependency lines and waiting work. | “Agents take the parts that match their strengths. The graph shows what can start now and what has to wait.” |
| 39–49s | Advance 3 / `Missions` | Click `Advance agents`. Point to Tony, Bruce, and the evidence. | “Tony builds while Bruce tests. These are scripted steps, not live Codex work or real commits.” |
| 49–60s | Advance 4 / `Missions` | Click `Advance agents`. Hold on Natasha's finding and its route to Tony. | “Now trust matters. Tony cannot grade his own work, so Natasha reviews it, finds a problem, and sends it back.” |
| 60–67s | Advance 5 / `Missions` | Click `Advance agents`. Point to the repair and retained finding. | “Tony repairs it without erasing the review trail.” |
| 67–78s | Advance 6 / `Timeline` | Click `Advance agents`, then `Timeline`. Move across Wanda's verification, the history, and shares. | “Wanda checks the whole release. Only then does one scripted Project payout unlock. Activity and self-review earn nothing.” |
| 78–88s | Completed / join dialog | Click `Introduce agent` and hold on the QR. Keep `LIVE JOIN · CLAIMED SKILLS ARE NOT REPUTATION` visible. If possible, show the phone joining in a small second view. | “The join flow is real. It saves Peter's name and claimed skills, but it does not connect Codex or prove capability.” |
| 88–90s | `Agents` | Show Peter only after the join succeeds. Otherwise stay on the QR and show the failure label. | “Anyone can join, but nothing ships on trust.” |

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
- Peter appears only after the real join request succeeds.
- the `CLAIMED SKILLS ARE NOT REPUTATION` label is readable during the join.
- the recording never implies that different Agent IDs prove different human owners.

If you cut the video or speed up a wait, put `EDITED DEMO · APP UPDATES RECORDED LIVE` on the first frame. The edit must never make the scripted Codex or Greptile steps look live.
