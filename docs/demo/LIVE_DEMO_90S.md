# 90-second live demo

## Before you start the timer

1. Start the app with a URL the judge's phone can reach. Follow [the setup guide](../../demo/README.md).
2. Run `node demo/control.mjs preflight`. All four checks must return HTTP 200.
3. Run `node demo/control.mjs stage signal`.
4. Open the same Wi-Fi or public URL in the presenter browser and click `Problems`.
5. Set browser zoom to 80–90%. Keep the top controls, main content, and right side visible.
6. Ask one judge to scan the QR at the end and keep the default name, `Peter`.
7. Before the timer, say: “We built Code Republic with Codex as our primary coding agent. The app is really saving and updating the World as I click. The owner-run Codex and Greptile steps inside the product are scripted for this demo, and the skills entered at join are claims, not verified reputation.”

Do not run the live version if a check fails, the event stream does not say `live`, the page looks unfinished, or the judge's phone cannot open the URL. Use the matching fallback instead.

## What to do and say

| Time | What to show | What to say | Label |
| --- | --- | --- | --- |
| 0–8s | Stay on `Problems`. Point to the problem and its evidence. | “These agents can belong to anyone. So joining cannot mean trusted to ship.” | **LIVE state; seeded story** |
| 8–17s | Point to the test evidence and both proposals. | “Bruce brings evidence. Steve and Tony suggest different fixes. Their profiles help them find work; they do not prove the work is good.” | **LIVE state; seeded story and proposals** |
| 17–27s | Click `Advance agents`, then `Campaigns`. Point to the goal, limits, and checks. | “The group chooses one plan and agrees on the checks before anyone builds.” | **LIVE update; SIMULATED decision** |
| 27–38s | Click `Advance agents`, then `Missions`. Point to the team, dependency lines, and waiting work. | “Agents take different roles. The real rules stop blocked work from starting and stop a builder from accepting its own contribution.” | **LIVE rules; SIMULATED team-up** |
| 38–48s | Click `Advance agents`. Stay on `Missions` and point to Tony and Bruce. | “Tony builds while Bruce tests. The evidence shown here is scripted, not live Codex work or real commits.” | **SIMULATED Codex work** |
| 48–58s | Click `Advance agents`. Point to Natasha's finding and its route back to Tony. | “A different agent reviews the change, finds a problem, and sends it back to the responsible builder.” | **SIMULATED Greptile-style finding; LIVE update** |
| 58–65s | Click `Advance agents`. Point to the repaired version and retained finding. | “Tony repairs it without erasing the review trail.” | **SIMULATED fix; LIVE state** |
| 65–76s | Click `Advance agents`, then `Timeline`. Point to Wanda's verification, the history, and shares. | “Wanda checks the whole release. Only then does one scripted Project payout unlock. Activity and self-review earn nothing.” | **SIMULATED results and shares; LIVE screen; NO MONEY TRANSFER** |
| 76–86s | Click `Introduce agent` and hold on the QR. Cue the judge. | “Now anyone can join. This live form saves a name and claimed skills; it does not connect Codex or create trusted reputation.” | **LIVE QR and join; runtime is PLANNED** |
| 86–90s | After the judge submits, close the dialog, click `Agents`, and point to Peter. | “Peter is in. Anyone can join, but nothing ships on trust.” | **LIVE only if Peter appears** |

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
