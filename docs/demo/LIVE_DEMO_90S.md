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
| 0–7s | Stay on `Problems`. Point to the problem and test evidence. | “No single coding agent is best at planning, building, testing, reviewing, and releasing.” | **LIVE state; seeded story** |
| 7–15s | Point to the problem, test evidence, and both proposals. | “Here, Bruce finds a problem. Steve and Tony bring different ways to fix it.” | **LIVE state; seeded story and proposals** |
| 15–23s | Click `Advance agents`, then `Campaigns`. Point to the goal, limits, and checks. | “They compare the ideas and agree on what to change and how to know it works.” | **LIVE update; SIMULATED decisions** |
| 23–33s | Click `Advance agents`, then `Missions`. Point to the team and the work that is waiting. | “Each agent takes the role it is strongest at. Code Republic keeps the handoffs and dependencies straight.” | **LIVE update and rules; SIMULATED team-up** |
| 33–43s | Click `Advance agents`. Stay on `Missions` and point to Tony and Bruce. | “Tony builds the adapter while Bruce writes tests. These are scripted steps, not live Codex runs or real commits.” | **SIMULATED Codex work** |
| 43–53s | Click `Advance agents`. Point to Natasha's finding and Tony. | “Natasha, the independent reviewer, confirms a scripted Greptile-style finding and sends it back to Tony.” | **SIMULATED finding; LIVE update** |
| 53–61s | Click `Advance agents`. Point to the repaired version. | “Tony fixes it, and the same review trail shows what changed.” | **SIMULATED fix; LIVE state** |
| 61–72s | Click `Advance agents`, then `Timeline`. Point to Wanda's verification, the history, and shares. | “In this scripted result, Wanda checks the whole release. Only then does one Project payout unlock, and every share points to accepted work.” | **SIMULATED results and shares; LIVE screen; NO MONEY TRANSFER** |
| 72–80s | Click `Introduce agent` and hold on the QR. Cue the judge. | “The QR opens the real join form. The center Codex panel is a placeholder—the connection is not wired.” | **LIVE QR; Codex connection is PLANNED** |
| 80–87s | The judge opens `/join`, keeps `Peter`, and submits. Watch for the update. | “Please scan and join. The World saves only the agent’s name and skills, never a Codex login.” | **LIVE join; Codex connection is PLANNED** |
| 87–90s | Close the dialog if needed, click `Agents`, and point to Peter. | “Peter is in—and visible in the same shared workflow.” | **LIVE only if Peter appears** |

## Words to avoid

- Do not say “Codex is coding now.” Say “these are scripted Codex work steps.”
- Do not say “Greptile found this live.” Say “this is a scripted Greptile-style review.”
- Do not call the hashes real commits. They are made-up IDs used by the demo story.
- Do not call the payout pay-per-task or imply money moved. The demo displays scripted shares for one completed Project; real-money transfer is outside the MVP.
- Do not say the QR connects Codex. It adds a name and skills to the World and suggests what the agent can do next.
- The join dialog explicitly labels the Codex runtime as planned. Do not imply that scanning the QR connects a Codex session.
- If Peter does not appear by 87 seconds, say: “The phone did not finish joining. I’ll show the local fallback after the timer.”

## Rehearsal targets

- All six clicks work on the first try.
- Each click and screen change takes less than 1.5 seconds.
- The judge opens the QR by 80 seconds and submits by 87 seconds.
- You finish between 88 and 90 seconds without rushing the words that explain what is scripted.
