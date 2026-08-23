# Demo commands

Run these commands from the nested `code-republic` repository.

## Start the app so a judge's phone can reach it

```bash
cd "/Users/chenglin/Documents/ChatGPT/greptile hackathon/code-republic"
npm ci
CODE_REPUBLIC_DEMO_INVITE_CODE=FAST-2026 npm run dev -- --hostname 0.0.0.0
```

In a second terminal, get the Mac's Wi-Fi address. Use that address in both the presenter browser and the demo tool. If `en0` is not your Wi-Fi connection, try `en1`.

```bash
DEMO_LAN_IP="$(ipconfig getifaddr en0)"
export CODE_REPUBLIC_BASE_URL="http://${DEMO_LAN_IP}:3000"
node demo/control.mjs preflight
open "$CODE_REPUBLIC_BASE_URL"
```

Do not open the presenter page as `localhost`. If you do, the QR code will also contain `localhost`, which points the judge's phone back to itself instead of your laptop. Use the Wi-Fi address or an approved public HTTPS tunnel. Test the final QR with a real phone before judging.

## Put the demo at a specific step

The `stage` command clears the current demo run and loads the requested step.

```bash
node demo/control.mjs stage signal
node demo/control.mjs stage campaign
node demo/control.mjs stage crew
node demo/control.mjs stage work
node demo/control.mjs stage review
node demo/control.mjs stage repair
node demo/control.mjs stage verified
```

Reload the browser after using `stage`. The browser may still be following the version from the previous run.

To prepare the 90-second demo:

```bash
node demo/control.mjs stage signal
```

Then click `Advance agents` six times during the demo:

1. The agents agree on a plan.
2. They form a team and lay out the work.
3. Tony and Bruce submit work at the same time.
4. The review finds a problem and sends it back to Tony.
5. Tony fixes it.
6. The final checks pass and the release is recorded.

## If the QR code does not work

The main path is still the judge scanning the QR and submitting the form. This command uses the same join API from the presenter laptop:

```bash
node demo/control.mjs join Peter "Code Review,Testing,Python"
node demo/control.mjs status
```

Call this the **local join fallback**. Do not say that a judge's phone joined or that Codex connected.

## What is real and what is scripted

- **Built with Codex:** Codex was the primary coding agent used to build and verify Code Republic during the hackathon. This is evidence about how the project was built, not a claim that Codex is running inside the product.
- **Live:** The app really saves the World, updates the screen, streams events, applies its rules, and adds a new agent through the join API.
- **Joined Agent:** The join flow saves a name and claimed skills. Those claims are discovery metadata, not verified reputation, and joining grants no repository credentials or release permission.
- **Simulated:** The `/demo/advance` route adds scripted Codex work, commit IDs, a Greptile-style review, a repair, test results, final checks, and contribution shares.
- **Payout:** The app displays one Project payout only after the scripted release passes. The share numbers and reasons are scripted, and the MVP does not transfer real money.
- **Replayed:** Nothing yet. Only use this word after saving a real run with its tool, repository, commit, time, request, and output.
- **Planned:** A real Codex runner on the participant's machine, a resumable Codex thread, real repository work, and a live or saved Greptile review.

See [the demo package](../docs/demo/README.md) for the scripts, recording plan, fallbacks, and final checklist.
