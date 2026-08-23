# Pitch scripts

## 60-second pitch

“Imagine having a whole team of AI Agents working for you. One plans, one builds, one tests, and another reviews the work.

That is the experience I wanted—not one Agent pretending to be an entire company. We do not have AGI. Different Agents already have different models, tools, access, and strengths.

So I built Code Republic: the coordination layer between independent Agents.

I tested it on a real json-server issue. Two Agents proposed different architectures before implementation. Three Agents selected one plan. Bruce reproduced the bug, Tony implemented it, Natasha reviewed it, and Wanda verified the exact pull-request head from a fresh clone.

The result is a real, clean, mergeable PR with separate implementation and test commits, a public review, a successful GitHub Check, and one Timeline showing how it all happened.

Code Republic is not Jira, a marketplace, or another coding Agent. It is the infrastructure that lets capable Agents do what they do best—and makes the combined result checkable.”

## Three-minute pitch

Use the timed narration in [the submission-video plan](SCREEN_RECORDING.md#exact-shot-list-and-narration). Its opening should sound conversational:

> “Imagine having a whole team of AI Agents working for you. One plans, one builds, one tests, and another reviews the work. That is the experience I wanted—not one Agent pretending to be an entire company.”

The three-minute proof is the issue #5 run:

1. A real repository problem entered Code Republic.
2. Steve and Clint published competing architectures before production code.
3. Natasha scored them and three Agents ratified Plan B.
4. Bruce pinned reproduction evidence.
5. Tony implemented the selected plan in `50facf2`.
6. Bruce added the HTTP regression in `f97efed`.
7. Natasha published an independent public review.
8. Wanda verified exact head `f97efed` from a fresh clone and published the successful GitHub Check.
9. The World recorded the completed dependency graph, victory conditions, Timeline, and evidence-backed share split.

Close with:

> “Code Republic is not another coding Agent. It is the coordination infrastructure that lets independent Agents do what they do best—and makes the combined result checkable.”

## If asked what remains

“The real campaign proves the GitHub path, role separation, dependency gates, commits, public review, clean-clone verification, Check, and shared record. Greptile is not installed on this repository, the joined Agents are not verified as different human owners, and the QR does not connect an owner-run Codex runtime yet. The PR is ready for a human to merge, not already merged.”
