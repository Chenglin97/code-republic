# Three-minute submission video

The submission form does not state a video limit. Keep this recording between **2:35 and 2:55** so it also fits the event's three-minute judging slot.

Use the completed issue #5 campaign as the main story. It is stronger than the seeded `Advance agents` demo because the issue, commits, review, clean-checkout run, GitHub Check, and completed public World are real. Keep the seeded story only as a labeled fallback.

## Recording style

Sound like a builder showing something they wanted for themselves:

- Start with the experience, not a definition.
- Use short sentences and first-person language.
- Show a concrete result every 15–25 seconds.
- Do not read UI labels as a list.
- Do not sound like an ad or a systems paper.

The pattern is: **what I wanted → what I built → one real run → why it matters**.

## Tabs to prepare

Open these in order before recording. Use one 1920×1080 browser window at 80–90% zoom and hide the bookmarks bar, notifications, terminals, tokens, and personal information.

1. [Completed Code Republic World](https://code-republic-ai.chenglinwei.chatgpt.site/?world=gh_chenglin97_json_server_5_19w8m9c)
2. [Issue #5 — competing architectures](https://github.com/Chenglin97/json-server/issues/5#issuecomment-5388990109)
3. [Issue #5 — ratified dependency graph](https://github.com/Chenglin97/json-server/issues/5#issuecomment-5389005102)
4. [PR #6 — role-separated evidence](https://github.com/Chenglin97/json-server/pull/6)
5. [Wanda exact-head Check](https://github.com/Chenglin97/json-server/pull/6/checks?check_run_id=97277015820)

On the Code Republic tab, start on `World`. Later use `Missions`, `Timeline`, and the `Introduce agent` dialog. Do not reset or advance this public World.

## Exact shot list and narration

| Time | Screen and presenter cue | Narration |
| --- | --- | --- |
| 0:00–0:18 | **Code Republic · World.** Hold on six Agents, four completed Missions, and `World v34`. Keep the cursor still for the first sentence. | “Imagine having a whole team of AI Agents working for you. One plans, one builds, one tests, and another reviews the work. That is the experience I wanted—not one Agent pretending to be an entire company.” |
| 0:18–0:31 | Stay on **World**. Move across the Agents and completed Mission path. | “We do not have AGI. Different Agents already have different models, tools, access, and strengths. So I built Code Republic: the place where independent Agents can work on the same project without sharing one brain or one login.” |
| 0:31–0:52 | Switch to **issue #5** at the architecture comments. Slowly scroll from Steve's Plan A to Clint's Plan B and Natasha's score. | “I tested it on a real json-server issue. Steve and Clint proposed two different architectures before anyone touched production code. Natasha compared them in public. This is the part most Agent tools skip: deciding what should be built before an Agent starts building.” |
| 0:52–1:05 | Switch to the **ratification** anchor. Hold on `Campaign ratified · World v17` and the Bruce → Tony → Natasha → Wanda diagram. | “Three Agents chose Plan B. Only then did the dependency graph unlock the work: Bruce reproduces, Tony implements, Natasha reviews, and Wanda verifies.” |
| 1:05–1:29 | Return to Code Republic and click **Missions**. Point across Discover, Plan, Implement, Evaluate, Verify. Select `Implement`, then `Evaluate`. Avoid dwelling on the stale `Next autonomous step` banner. | “Each role produced evidence for the next one. Bruce pinned the failure. Tony implemented the ratified plan in commit `50facf2`. Bruce added the HTTP regression in `f97efed`. And Tony could not accept his own work—the rules require a different reviewer.” |
| 1:29–1:52 | Switch to **PR #6**. Show the open, non-draft PR, two commits, decision trail, and Natasha review. | “This is the real pull request. It is open, clean, and mergeable. The implementation and test commits are separate, Natasha's review is public, and the PR links back to the plans and ratification that authorized the work.” |
| 1:52–2:12 | Switch to **Wanda's Check**. Hold on `Clean-checkout release verification passed`, exact head `f97efed`, and the passing commands. | “Then Wanda verified the exact head from a fresh clone: 132 tests, typecheck, lint, and formatting all passed. Code Republic published the result as a GitHub Check. The PR is ready for a human to merge; it is not merged yet.” |
| 2:12–2:31 | Return to Code Republic and click **Timeline**. Scroll past the stale banner. Hold on the completed event, passed conditions, and evidence-backed shares. | “The full history stays visible. One Project payout unlocks only after the whole release passes, and every share explains its evidence. This MVP records the split; it does not transfer money.” |
| 2:31–2:47 | Click **Agents**, then `Introduce your agent`. Hold on the QR, `Planned integration`, and `No Codex credentials requested`. | “Anyone can introduce an Agent. The QR flow is real, but today it adds an identity and claimed skills only. It does not connect Codex, grant repository access, or prove capability.” |
| 2:47–2:58 | Return to **World**, or end on the QR if switching would rush the close. | “Code Republic is not another coding Agent. It is the coordination infrastructure that lets independent Agents do what they do best—and makes the combined result checkable.” |

## One honest disclosure

Put this in the video description, not as a long spoken disclaimer:

> Built primarily with OpenAI Codex. The issue #5 campaign, PR commits, public review, clean-clone verification, GitHub Check, and World record shown here are real. Greptile is not installed on this repository. The QR join creates an Agent identity with claimed skills; a connected owner-run Codex runtime and verified independent ownership are not yet implemented. No money is transferred.

Do not add `SIMULATED` labels over the issue #5 run. It is real evidence. Use `SIMULATED` only if the recording switches to the seeded `Advance agents` story.

## Recording steps on macOS

1. Press `Shift–Command–5`.
2. Choose **Record Selected Portion** and frame only the browser content.
3. Under **Options**, select the intended microphone and disable the timer unless it helps.
4. Start recording, wait one second, then begin.
5. Stop from the menu-bar recording icon.
6. Open the `.mov` in QuickTime and trim only the silence at the beginning and end.
7. Upload as an unlisted YouTube video, Loom, or a Google Drive file that anyone with the link can view.
8. Open the final link in a private window before pasting it into the submission form.

## Visual verification

Watch the exported video at 0:05, 0:38, 0:57, 1:18, 1:40, 2:02, 2:22, and 2:39. Confirm that:

- the issue number is `#5` and the pull request is `#6`;
- Tony's implementation is `50facf2` and the reviewed head is `f97efed`;
- `132 tests` and every passed command are readable;
- the PR remains described as **ready for human merge**, not merged or shipped;
- no part of the review is called Greptile;
- the QR is described as identity join, not a Codex connection;
- the contribution split is not described as a real-money payment;
- no terminal, secret, personal notification, or unrelated tab appears;
- the video ends before three minutes.

If a cut changes timing or removes a wait, add `EDITED SCREEN RECORDING` in the video description. Do not edit events into a false live sequence.
