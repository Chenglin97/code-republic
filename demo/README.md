# Demo operator commands

Run every command from the nested `code-republic` repository.

## Start on a judge-reachable URL

```bash
cd "/Users/chenglin/Documents/ChatGPT/greptile hackathon/code-republic"
npm ci
CODE_REPUBLIC_DEMO_INVITE_CODE=FAST-2026 npm run dev -- --hostname 0.0.0.0
```

In a second terminal, resolve the Mac's Wi-Fi address and use it for both the browser and demo control. If `en0` is not the active interface, try `en1`.

```bash
DEMO_LAN_IP="$(ipconfig getifaddr en0)"
export CODE_REPUBLIC_BASE_URL="http://${DEMO_LAN_IP}:3000"
node demo/control.mjs preflight
open "$CODE_REPUBLIC_BASE_URL"
```

Opening the UI as `localhost` makes the generated QR code point back to the judge's phone, not the presenter laptop. Use the LAN URL or an already-approved public HTTPS tunnel. Put the phone and laptop on the same network and test before judging.

## Rehearsal states

`stage` resets the World and then applies the minimum number of scripted demo advances. It is destructive to the current demo event log.

```bash
node demo/control.mjs stage signal
node demo/control.mjs stage campaign
node demo/control.mjs stage crew
node demo/control.mjs stage work
node demo/control.mjs stage review
node demo/control.mjs stage repair
node demo/control.mjs stage verified
```

Reload the browser after using `stage`. A browser that was already following a higher World version cannot infer that an external reset deliberately moved the demo back to the seeded version.

For the live 90-second path:

```bash
node demo/control.mjs stage signal
```

Then use the UI's `Advance agents` button six times. The first advance ratifies the Campaign; the next five form the Crew, emit concurrent-work evidence, route review, repair it, and complete verification.

## QR fallback and readback

The primary path is the judge scanning the on-screen QR and submitting the join form. The local HTTP fallback below proves the same native join endpoint, but must be called a local fallback—not a judge phone scan or a live Codex connection.

```bash
node demo/control.mjs join Jordan "Code Review,Testing,Python"
node demo/control.mjs status
```

## Evidence boundary

- Live: HTTP join, append-only World state, JSON persistence, snapshot, actions, SSE readback, rules, and UI projection.
- Simulated: events emitted by `/demo/advance`, including concurrent Codex work, commit IDs, Greptile-style finding, repair, command results, final verification, and share calculation inputs.
- Replayed: none currently. Do not use this label until a captured artifact records source, repository, commit, timestamp, and command/tool output.
- Planned: participant-owned Codex runner, persistent Codex thread resume, real repository execution, and live/captured Greptile review.

See [the demo package index](../docs/demo/README.md) for the presenter scripts and readiness evidence.
