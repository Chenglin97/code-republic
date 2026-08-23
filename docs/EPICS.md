# Code Republic implementation epics

The hackathon build is divided by system boundary, not by screens or Jira-style tickets. Every implementation commit begins with one epic tag.

## `[EPIC-CORE]` World authority and persistence

Owns canonical state transitions, append-only events, projections, policy invariants, storage adapters, World APIs, and the autonomous demo lifecycle.

Definition of done:

- Optimistic version checks and idempotent actions
- Dependency-aware atomic Mission claims
- Independent-review enforcement
- Persistent local demo state with a Postgres-ready adapter boundary
- Snapshot, action, event-stream, reset, advance, and join endpoints
- Deterministic tests for policy-critical behavior

## `[EPIC-UI]` Living collaboration world

Owns the light-theme product experience and converts canonical World state into a legible autonomous-community interface.

Definition of done:

- Signal evidence and competing proposals
- Ratified Campaign Brief and victory conditions
- Voluntary Crew and Mission dependency graph
- Live Chronicle and visible Agent capabilities
- Review/repair and contribution-share states
- QR-friendly judge join with a useful first action

## `[EPIC-A2A]` Open agent interoperability

Owns the protocol surface that lets independently operated agents discover Code Republic and understand how to join.

Definition of done:

- Public Agent Card
- Explicit skills, authentication, and endpoint declarations
- Typed validation and conformance tests
- Honest documentation of supported and unsupported A2A behavior

## `[EPIC-CI]` Mainline confidence

Owns repository-wide integration and push-only CI on `main`.

Definition of done:

- Exact dependency installation
- Domain test suite
- TypeScript verification
- Production build
- No pull-request workflow; every pushed mainline checkpoint must pass the same commands locally first

## `[EPIC-DEMO]` Judge experience and pitch

Owns the live-demo choreography, screen recording, pitch narrative, presenter cues, evidence labels, and failure-safe fallback plan.

Definition of done:

- 90-second live demo and concise pitch scripts
- Recording shot list with exact product states
- Judge-agent QR interaction and presenter handoff
- Explicit distinction between live, simulated, replayed, and planned behavior
- Reset procedure, fallback paths, likely questions, and final readiness checklist

## Commit convention

```text
[EPIC-CORE] feat: enforce atomic Mission claims
[EPIC-UI] feat: render the live Mission dependency graph
[EPIC-A2A] feat: publish the Code Republic Agent Card
[EPIC-DEMO] docs: choreograph the judge experience
[EPIC-CI] chore: verify every mainline checkpoint
```

Documentation-only refinements use the epic whose product boundary they clarify. Cross-epic integration fixes use `[EPIC-CI]`.
