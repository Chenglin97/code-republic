# 90-second live demo

## Before you start the timer

1. Start the app with a URL the judge's phone can reach. Follow [the setup guide](../../demo/README.md).
2. Run `node demo/control.mjs preflight`. All four checks must return HTTP 200.
3. Run `node demo/control.mjs stage signal`.
4. Open the same Wi-Fi or public URL in the presenter browser and click `Problems`.
5. Set browser zoom to 80–90%. Keep the top controls, main content, and right side visible.
6. Ask one judge to scan the QR at the end and keep the default name, `Peter`.
7. Before the timer, say: “We built Code Republic with Codex as our primary coding agent. The app is really saving and updating the World as I click. The owner-run Codex and Greptile steps inside the product are scripted for this demo.”

Do not run the live version if a check fails, the event stream does not say `live`, the page looks unfinished, or the judge's phone cannot open the URL. Use the matching fallback instead.

## What to do and say

| Time | What to show | What to say | Label |
| --- | --- | --- | --- |
| 0–8s | Stay on `Problems`. Point across the active Agents and the problem. | “Imagine a team of independent AI Agents working on one project, each doing what it does best.” | **LIVE state; seeded story** |
| 8–18s | Point to the test evidence and both proposals. | “Bruce finds a bug. Steve and Tony bring different ways to fix it.” | **LIVE state; seeded story and proposals** |
| 18–28s | Click `Advance agents`, then `Campaigns`. Point to the goal, limits, and checks. | “The group chooses one plan and agrees on how they will know it works.” | **LIVE update; SIMULATED decision** |
| 28–39s | Click `Advance agents`, then `Missions`. Point to the team, dependency lines, and waiting work. | “Agents take the parts that match their strengths. The graph shows what can start now and what has to wait.” | **LIVE dependency rules; SIMULATED team-up** |
| 39–49s | Click `Advance agents`. Stay on `Missions` and point to Tony and Bruce. | “Tony builds while Bruce tests. These are scripted steps, not live Codex work or real commits.” | **SIMULATED Codex work** |
| 49–60s | Click `Advance agents`. Point to Natasha's finding and its route back to Tony. | “Now trust matters. Tony cannot grade his own work, so Natasha reviews it, finds a problem, and sends it back.” | **LIVE self-review rule; SIMULATED Greptile-style finding** |
| 60–67s | Click `Advance agents`. Point to the repaired version and retained finding. | “Tony repairs it without erasing the review trail.” | **SIMULATED fix; LIVE state** |
| 67–78s | Click `Advance agents`, then `Timeline`. Point to Wanda's verification, the history, and shares. | “Wanda checks the whole release. Only then does one scripted Project payout unlock. Activity and self-review earn nothing.” | **SIMULATED results and shares; LIVE screen; NO MONEY TRANSFER** |
| 78–87s | Click `Introduce agent` and hold on the QR. Cue the judge. | “The join flow is real. It saves Peter's name and claimed skills, but it does not connect Codex or prove capability.” | **LIVE QR and join; runtime is PLANNED** |
| 87–90s | After the judge submits, close the dialog, click `Agents`, and point to Peter. | “Peter is in. Anyone can join, but nothing ships on trust.” | **LIVE only if Peter appears** |

## Words to avoid

- Do not say “Codex is coding now.” Say “these are scripted Codex work steps.”
- Do not say “Greptile found this live.” Say “this is a scripted Greptile-style review.”
- Do not call the hashes real commits. They are made-up IDs used by the demo story.
- Do not call the payout pay-per-task or imply money moved. The demo displays scripted shares for one completed Project; real-money transfer is outside the MVP.
- Do not say the QR connects Codex. It adds a name and skills to the World and suggests what the agent can do next.
- The join dialog explicitly labels the Codex runtime as planned. Do not imply that scanning the QR connects a Codex session.
- Do not say a joined Agent's skills are verified. They are self-declared discovery metadata, not reputation evidence.
- Do not say the MVP proves two Agents have different owners. It enforces different contributor and evaluator Agent IDs; owner identity and collusion checks are not built.
- Do not say an unknown Agent receives repository credentials or permission to ship. The current join flow receives neither.
- If Peter does not appear by 87 seconds, say: “The phone did not finish joining. I’ll show the local fallback after the timer.”

## Rehearsal targets

- All six clicks work on the first try.
- Each click and screen change takes less than 1.5 seconds.
- The judge opens the QR by 80 seconds and submits by 87 seconds.
- You finish between 88 and 90 seconds without rushing the words that explain what is scripted.
- The last sentence lands clearly: “Anyone can join, but nothing ships on trust.”
