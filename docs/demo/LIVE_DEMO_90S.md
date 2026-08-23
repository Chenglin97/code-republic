# 90-second live demo

## Before you start the timer

1. Start the app with a URL the judge's phone can reach. Follow [the setup guide](../../demo/README.md).
2. Run `node demo/control.mjs preflight`. All four checks must return HTTP 200.
3. Run `node demo/control.mjs stage signal`.
4. Open the same Wi-Fi or public URL in the presenter browser and click `Signals`.
5. Set browser zoom to 80–90%. Keep the top controls, main content, and right side visible.
6. Ask one judge to scan the QR at the end and keep the default name, `Jordan`.
7. Before the timer, say: “The app is really saving and updating the World as I click. The Codex and Greptile work you’ll see is scripted for this demo.”

Do not run the live version if a check fails, the event stream does not say `live`, the page looks unfinished, or the judge's phone cannot open the URL. Use the matching fallback instead.

## What to do and say

| Time | What to show | What to say | Label |
| --- | --- | --- | --- |
| 0–7s | Stay on `Signals`. Point to the problem and test evidence. | “Most tools start with a person writing a ticket. Here, Maya spots a problem in the code and shows the test failures.” | **LIVE state; seeded story** |
| 7–15s | Point to both proposals. | “Two agents suggest different fixes. The group compares them and picks a direction.” | **LIVE state; seeded proposals** |
| 15–23s | Click `Advance agents`, then `Campaigns`. Point to the goal, limits, and checks. | “They agree on one plan: what they will change, what they will not change, and how they will know it works.” | **LIVE update; SIMULATED decisions** |
| 23–33s | Click `Advance agents`, then `Missions`. Point to the team and the work that is waiting. | “Then they form a team and split up the work. Some pieces can start now; others have to wait.” | **LIVE update and rules; SIMULATED team-up** |
| 33–43s | Click `Advance agents`. Stay on `Missions` and point to Tony and Maya. | “Tony handles the adapter while Maya writes tests. These steps are scripted today—they are not live Codex runs or real commits.” | **SIMULATED Codex work** |
| 43–53s | Click `Advance agents`. Point to the finding and Tony. | “A scripted Greptile-style review catches a problem and sends it back to Tony, who owns that part.” | **SIMULATED finding; LIVE update** |
| 53–61s | Click `Advance agents`. Point to the repaired version. | “Tony fixes it, and the same review trail shows what changed.” | **SIMULATED fix; LIVE state** |
| 61–72s | Click `Advance agents`, then `Chronicle`. Point to the final checks, history, and shares. | “Once every check passes, Code Republic records the release and shows how much each agent contributed.” | **SIMULATED test results; LIVE screen** |
| 72–80s | Click `Introduce agent` and hold on the QR. Cue the judge. | “Now one of you can add an agent to the community. Please scan this code.” | **LIVE QR and join page** |
| 80–87s | The judge opens `/join`, keeps `Jordan`, and submits. Watch for the update. | “The World saves the agent’s name and skills. It never asks for your Codex login.” | **LIVE join; Codex connection is PLANNED** |
| 87–90s | Close the dialog if needed, click `Agents`, and point to Jordan. | “Jordan is in. This is a community that builds together, not a place where agents shop for jobs.” | **LIVE only if Jordan appears** |

## Words to avoid

- Do not say “Codex is coding now.” Say “these are scripted Codex work steps.”
- Do not say “Greptile found this live.” Say “this is a scripted Greptile-style review.”
- Do not call the hashes real commits. They are made-up IDs used by the demo story.
- Do not say the QR connects Codex. It adds a name and skills to the World and suggests what the agent can do next.
- If Jordan does not appear by 87 seconds, say: “The phone did not finish joining. I’ll show the local fallback after the timer.”

## Rehearsal targets

- All six clicks work on the first try.
- Each click and screen change takes less than 1.5 seconds.
- The judge opens the QR by 80 seconds and submits by 87 seconds.
- You finish between 88 and 90 seconds without rushing the words that explain what is scripted.
