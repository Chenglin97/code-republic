# Final demo checklist

Audit starting point: nested repository `code-republic`; `[EPIC-DEMO]` was added at `4fde0fb`; integrated main was checked through `aa7a729`. Check everything again right before judging because the UI is still being changed in the same working tree.

## What works and what does not

| Area | Status | What we found |
| --- | --- | --- |
| `[EPIC-DEMO]` commit tag | Ready | `docs/EPICS.md` and the main CI workflow accept the tag. |
| Codex's role in building Code Republic | Real process; prepare proof | Codex was the primary coding agent across visible project tasks. Keep one short piece of task, commit, test, build, or CI evidence ready for judges. Do not confuse this with the unbuilt owner-run Codex integration inside the product. |
| World data and history | Works | The app has snapshot, action, SSE, reset, advance, and join routes. It stores the World as a list of events in JSON. |
| Starting problem and two ideas | Scripted starting state | Reset loads one checked problem and two possible fixes. Call the story seeded or scripted. |
| Plan, team, work, review, fix, and release | Scripted steps | `/demo/advance` really saves each update, but the agents did not perform the work shown. |
| Core rules | Works and has tests | The app checks World versions, ignores repeat requests, blocks work whose dependencies are not done, and stops builders from reviewing their own work. |
| Join page and API | Works | `/join` and `POST /api/worlds/demo/join` add an agent, save its skills, and suggest a next step. |
| QR code | Works only with the right URL | It uses the URL in the presenter browser. We still need to test it with a real phone on the final Wi-Fi or public URL. |
| A2A | Partly works | The Agent Card and invite-gated `SendMessage` handoff work. Tasks, streaming, push, signatures, remote card fetching, and full support do not. |
| Website | Verified at presenter resolution | World, Problems, Campaigns, Missions, Timeline, Agents, and the join dialog rendered at 1920×1080 with no horizontal overflow or browser console errors. |
| Join dialog wording | Honest | The dialog labels the Codex runtime as planned, says no session is connected, and explains that the demo creates only the Agent identity. |
| Design images | Checked | All nine PNG files are valid 1536×1024 images. They show the intended design, not proof that the website works. |
| Real Codex runner | Not built | There is no Codex SDK or CLI connection, saved Codex thread, runner process, or real parallel coding. |
| Real or saved Greptile review | Not built | The review is written directly into the demo step. There is no Greptile result file. |
| Real commits | Not in the demo | The starting and ending hashes shown by the story do not exist in this repository. |
| Final test runner | Not built | The test commands and exit codes are text in the demo events. The app does not run them. |
| Project payout and contribution shares | Display and unlock state work; numbers are scripted | The payout display stays locked until the World reaches a completed release with shares. The final numbers add to 100 and show an evidence basis and trace, but they are fixed demo data, not calculated from real checked work. No money is transferred. |
| Saved replay | None | Do not use the word replayed. |
| Root `README.md` | Out of date | It says implementation has not started even though the app and APIs exist. Do not use that sentence with judges. |
| Agent count in `MVP_ACCEPTANCE.md` | Out of date | The document says four starting agents plus the judge. The app starts with six; the judge becomes number seven. |

## Must pass before showing the live 90-second demo

- [ ] `git status --short` shows no unexpected changes in `demo/**` or `docs/demo/**`.
- [ ] `npm test`, `npm run typecheck`, and `npm run build` all pass.
- [ ] The first sentence explains the developer problem: coordinating several coding agents in one codebase.
- [ ] The pitch explains why one agent is not enough: today's agents have different strengths, and a builder should not be the only reviewer or release judge.
- [ ] The story names the separate roles: Maya finds and tests, Sofia plans, Tony builds, Charlie reviews, and Nina verifies the release.
- [ ] The presenter says the agents can have different owners and keep their own runtimes, logins, tools, and repository access.
- [ ] The presenter calls this one Project payout, not pay-per-task: it unlocks only after the whole release passes, and raw activity or self-review earns nothing.
- [ ] The presenter labels the displayed shares scripted and says the MVP does not transfer real money.
- [ ] The presenter can show one short proof that Codex was the primary coding agent used to build the project: a visible task plus tagged commits, tests, build, or mainline CI.
- [ ] The presenter clearly separates “built with Codex” from the owner-run Codex integration that is not wired yet.
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

- [ ] A real Codex runner starts or resumes a thread and publishes its work.
- [ ] Every commit shown by the app exists in the demo repository.
- [ ] The before-and-after commands really run, and their output and exit codes are saved.
- [ ] Greptile runs live, or we save a real result with the time, repository, commit, request, output, and checksum.
- [ ] The final tests run from a clean copy of the repository.
- [ ] Reputation and shares point back to real work and reviews that the World accepted.

## Current answer

**Do not say the full autonomous loop works yet.** We can honestly show a real shared World, its rules, its history, and the join flow. The coding and review steps are scripted examples. Before judges see the live version, rerun the final preflight and test the QR with a real phone on the presentation network.
