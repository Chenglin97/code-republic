# Final demo checklist

Audit starting point: nested repository `code-republic`; integrated main and the completed public campaign were checked through `3382443`. Check the external state again immediately before judging.

## What works and what does not

| Area | Status | What we found |
| --- | --- | --- |
| `[EPIC-DEMO]` commit tag | Ready | `docs/EPICS.md` and the main CI workflow accept the tag. |
| Codex's role in building Code Republic | Real process; prepare proof | Codex was the primary coding agent across visible project tasks. Keep one short piece of task, commit, test, build, or CI evidence ready for judges. Do not confuse this with the unbuilt owner-run Codex integration inside the product. |
| World data and history | Works | The app has snapshot, action, SSE, reset, advance, and join routes. It stores the World as a list of events in JSON. |
| Public issue #5 campaign | Real completed run | World v34 records two architecture proposals, ratification before implementation, four accepted Missions, PR #6, commits `50facf2` and `f97efed`, Natasha's public review, Wanda's clean-clone verification, and a successful exact-head GitHub Check. |
| Starting problem and two ideas | Scripted starting state | Reset loads one checked problem and two possible fixes. Call the story seeded or scripted. |
| Plan, team, work, review, fix, and release | Scripted steps | `/demo/advance` really saves each update, but the agents did not perform the work shown. |
| Core rules | Works and has tests | The app checks World versions, ignores repeat requests, blocks work whose dependencies are not done, and stops builders from reviewing their own work. |
| Joined Agent trust | Declared only | Join saves a name and claimed skills. It does not verify capability, grant repository credentials, connect Codex, or create evidence-backed reputation. |
| Independent ownership | Not verified | The core rule requires different contributor and evaluator Agent IDs. It does not prove that those Agents have different human owners or prevent collusion. |
| Join page and API | Works | `/join` and `POST /api/worlds/demo/join` add an agent, save its skills, and suggest a next step. |
| QR code | Works only with the right URL | It uses the URL in the presenter browser. We still need to test it with a real phone on the final Wi-Fi or public URL. |
| A2A | Partly works | The Agent Card and invite-gated `SendMessage` handoff work. Tasks, streaming, push, signatures, remote card fetching, and full support do not. |
| Website | Verified at presenter resolution | World, Problems, Campaigns, Missions, Timeline, Agents, and the join dialog rendered at 1920×1080 with no horizontal overflow or browser console errors. |
| Join dialog wording | Honest | The dialog labels the Codex runtime as planned, says no session is connected, and explains that the demo creates only the Agent identity. |
| Design images | Checked | All nine PNG files are valid 1536×1024 images. They show the intended design, not proof that the website works. |
| Real Codex runner | Not built | There is no Codex SDK or CLI connection, saved Codex thread, runner process, or real parallel coding. |
| Real or saved Greptile review | Not built | The review is written directly into the demo step. There is no Greptile result file. |
| Real commits | Works in public campaign | PR #6 contains Tony implementation `50facf2` and Bruce HTTP regression `f97efed`. The seeded fallback still contains made-up hashes. |
| Final test runner | Real public evidence; seeded fallback is text | Wanda's public Check records a clean-clone run on exact head `f97efed`: 132 tests plus typecheck, lint, and formatting passed. |
| Project payout and contribution shares | Real recorded basis; no transfer | The completed public World records evidence-backed shares totaling 100. The split is supplied at finalization rather than calculated automatically, and no money is transferred. |
| Completed-run evidence | Ready | Show issue #5 and PR #6 as preserved real evidence. Do not edit it into a fake live sequence. |
| Agent count in `MVP_ACCEPTANCE.md` | Out of date | The document says four starting agents plus the judge. The app starts with six; the judge becomes number seven. |

## Must pass before showing the live 90-second demo

- [ ] `git status --short` shows no unexpected changes in `demo/**` or `docs/demo/**`.
- [ ] `npm test`, `npm run typecheck`, and `npm run build` all pass.
- [ ] The first sentence presents the vision: independent specialist Agents working together on one project.
- [ ] The first 40 seconds show the value before raising the trust question.
- [ ] Trust appears naturally at the independent-review step, after the audience understands why several Agents are useful.
- [ ] The answer is explicit: anyone can join, but nothing ships merely because an Agent claims it is good.
- [ ] The pitch explains why one agent is not enough: today's agents have different strengths, and a builder should not be the only reviewer or release judge.
- [ ] The story names the separate roles: Bruce finds and tests, Steve plans, Tony builds, Natasha reviews, and Wanda verifies the release.
- [ ] The presenter says the agents can have different owners and keep their own runtimes, logins, tools, and repository access.
- [ ] The presenter calls this one Project payout, not pay-per-task: it unlocks only after the whole release passes, and raw activity or self-review earns nothing.
- [ ] The presenter says the public share split is recorded, not automatically calculated, and the MVP does not transfer real money.
- [ ] The presenter can show one short proof that Codex was the primary coding agent used to build the project: a visible task plus tagged commits, tests, build, or mainline CI.
- [ ] The presenter clearly separates “built with Codex” from the owner-run Codex integration that is not wired yet.
- [ ] The presenter says joined skills are self-declared discovery metadata, not verified reputation.
- [ ] The presenter says the MVP enforces different Agent IDs for contribution and review, not verified different owners.
- [ ] The presenter never implies that joining grants repository credentials or permission to release.
- [ ] `node demo/control.mjs preflight` returns four successful checks.
- [ ] `node demo/control.mjs stage signal` works.
- [ ] Six clicks on `Advance agents` reach the completed release, and the shares add to 100.
- [x] The website looks finished at 1920×1080.
- [x] Problems, Campaigns, Missions, Timeline, Agents, and the join dialog have all been checked in the browser.
- [x] The join dialog labels the Codex runtime as planned and does not claim that a session is connected.
- [ ] The event stream says `live` during one full rehearsal.
- [ ] The presenter URL is not `localhost`, `127.0.0.1`, or `0.0.0.0`.
- [ ] A real phone scans the QR, submits the form, and the presenter sees the new agent.
- [ ] Reset removes the rehearsal agent and returns to the exact starting step.
- [ ] Every scripted part is labeled or explained. Nothing scripted is called live or replayed.
- [ ] No API key, personal information, terminal history, or notification appears.
- [ ] The presenter completes two rehearsals between 88 and 90 seconds.

## Must pass before we can say the full agent loop is real

- [ ] Agent and owner identities are authenticated strongly enough to detect self-review through a second Agent.
- [ ] Runtime credentials are scoped, stored by the owner, and tested with isolated repository work.
- [ ] A real Codex runner starts or resumes a thread and publishes its work.
- [ ] Every commit shown by the app exists in the demo repository.
- [ ] The before-and-after commands really run, and their output and exit codes are saved.
- [ ] Greptile runs live, or we save a real result with the time, repository, commit, request, output, and checksum.
- [ ] The final tests run from a clean copy of the repository.
- [ ] Reputation and shares point back to real work and reviews that the World accepted.

## Current answer

**Show the real completed issue #5 campaign, but keep the remaining boundary explicit.** The GitHub issue, plans, ratification, commits, public review, clean-clone verification, Check, and completed World are real. Greptile is not installed, different human owners are not verified, the QR does not connect an owner-run Codex runtime, the share split is not automatically calculated, no money moves, and PR #6 is ready for human merge rather than merged.
