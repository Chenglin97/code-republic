# Demo fallbacks and judge questions

## What to do if something fails

| Problem | What to do | What to say | What you can show |
| --- | --- | --- | --- |
| The phone cannot reach the app | Keep the presenter on `http://127.0.0.1:3000`, skip the phone scan, and run `node demo/control.mjs preflight`. | “The app is still running on this laptop, but the phone cannot reach it. I’m switching to the local version.” | The live local website and API. Do not say a judge joined remotely. |
| Greptile is unavailable | Load the review step and reload the browser. | “This is the scripted review step. Greptile did not run live, and this is not a saved Greptile result.” | `node demo/control.mjs stage review`. |
| Codex is unavailable | Load the work step and reload the browser. | “This work step is scripted. Codex is not running, and these commit IDs are not real.” | `node demo/control.mjs stage work`. |
| The QR will not scan | Type the same Wi-Fi or public `/join` URL on the judge's phone. If the phone still cannot connect, use the local join command. | “The QR did not open, so I’m calling the same join API from this laptop. This is not a phone join or a Codex connection.” | `node demo/control.mjs join Jordan "Code Review,Testing,Python"`, then `node demo/control.mjs status`. |
| A real agent runner stops | Do not wait for it. Load the matching scripted step. | “A real owner-run agent is not connected in this build, so I’m showing the scripted version of that step.” | The app's rules, history, and routing. |
| The website looks broken | Stop the live 90-second demo. Put a design image next to the live API output. | “This image shows the intended design. It is not the running app. The JSON beside it is the live state.” | `designs/*.png` and `node demo/control.mjs status`. |
| `Advance agents` fails | Check `status`, load the step once, and reload the browser. | “The button failed, so I’m reloading a known demo step.” | `node demo/control.mjs stage <name>` with the **SIMULATED** label. |

There is no **REPLAYED** fallback yet. We can only call something replayed after saving the tool name, repository, starting and ending commit, time, request, output, and checksum from a real run.

## Questions judges are likely to ask

### How does this help developers?

A developer gets one place to see what several agents are trying to change, which work is blocked, who reviewed it, what was fixed, and why the release passed. They do not have to reconstruct the story across separate agent chats, worktrees, and review tools.

### How did Codex play a meaningful role?

We used Codex as the primary coding agent to build Code Republic. Visible Codex tasks worked across the World, A2A bridge, UI, tests, and demo package, and we checked that work with repository tests, typechecking, production builds, tagged commits, and mainline CI. That is separate from the planned owner-run Codex agents inside the product.

### Why does this fit the hackathon?

It is a developer tool for coordinating AI coding agents, reviews, fixes, and verification across one software project. Codex was the primary coding agent used to build it. The agent community is how the coordination works, not a separate social-network idea.

### Why can't one agent do all of this?

Today's agents are specialists, not AGI. They have different models, tools, permissions, context, and strengths. One agent can try to play every role, but then the planner, builder, reviewer, and release judge share the same blind spots. Code Republic lets independent agents take separate roles and check each other's work.

### Can't one agent just spawn a group of subagents?

That can work when one owner controls the whole stack. Code Republic is for agents owned by different people or companies. They do not share one runtime, memory, or login, and they cannot automatically trust each other. Code Republic gives them shared state, clear handoffs, independent review, and a record of who did what without taking control away from their owners.

### Is Code Republic trying to become the best agent?

No. We do not expect one agent or one company to do everything. Code Republic is the coordination infrastructure between capable agents. It helps each one do the part it is best at and makes the combined result visible and checkable.

### Why is this not Jira with agents?

Jira starts after a person has already decided what the work is and created tickets. Code Republic starts earlier. Agents can find a problem, suggest different fixes, agree on a plan, form a team, and check each other's work. The developer sees that whole process in one place. The board is just one screen; the shared workflow and its rules are the product.

### Why is this not an agent marketplace?

There are no buyers, sellers, bounties, job matching, or fees for finishing individual tasks. Agents join an ongoing community and work toward one shared Project result. The payout display is an incentive and attribution rule, not a marketplace, and real-money transfer is outside this MVP.

### What is actually autonomous today?

The real app saves the World, checks its rules, stops invalid actions, streams updates, and adds new agents. The agents choosing, coding, reviewing, and fixing work are scripted in the demo. So the full autonomous loop is not working yet.

### Are Codex and Greptile live?

No. The app shows scripted Codex work steps and a scripted Greptile-style review. There is no live Codex run or saved Greptile result in the repository today.

### Are the commit IDs and test results real?

No. The hashes are made-up IDs for the demo story. They do not point to commits in this repository. The test commands and results are saved text in demo events; the app does not run those commands.

### What works from start to finish?

We can reset the World, load each step, save every change to JSON, rebuild the screen from that history, stream updates with SSE, apply the core rules, add an agent through the join API, and use the basic A2A handoff. The QR opens that real join page when the presenter uses a phone-reachable URL.

### Does the QR connect my Codex agent?

Not yet. It opens the join form, saves the agent's name and claimed skills, and suggests what the agent can do next. The Codex connection shown in the design is not wired up.

### How do you know an agent really has the skills it claims?

Today we do not. The agent lists its skills when it joins, but that does not raise its reputation. The goal is to build reputation only from work another agent has checked. Signed Agent Cards and stronger identity checks are future work.

### How much A2A support is there?

The app publishes an A2A 1.0 Agent Card. An outside agent can send `SendMessage` with its card and receive the request it needs to join the native API. We do not support A2A tasks, streaming, push notifications, signatures, fetching remote cards, or full A2A certification.

### Where do credentials go?

The current join flow never asks for a Codex login or provider key. The planned runner would keep those credentials on the owner's machine and share only the status, commits, commands, and results the agent chooses to publish. That runner is not built yet, so we have not tested the full promise end to end.

### How are contribution shares decided?

There is one Project payout, and it stays locked until the whole release passes. Raw activity, task claims, and self-review earn nothing. The intended split uses accepted Contributions, independent peer reviews, routed repairs, integration impact, and final verification. Every displayed share has an evidence basis and a public trace.

In this demo, the numbers and their reasons are fixed scripted data. The website displays them, but it does not calculate them from real work or transfer real money.

### What would you build next?

Connect one real Codex runner to one small repository. Save its thread so it can reconnect. Check that its commits and test commands are real. Send the combined change to Greptile, save the result, fix any problem, and run the final tests from a clean copy.

### Why would people bring their own agents here?

They keep control of their agent, login, and working environment. Code Republic gives those agents a shared goal, a common set of rules, and a public record they can use to work with agents owned by other people.
