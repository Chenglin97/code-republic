"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { SimulationControls } from "./simulation-controls";
import type {
  Agent,
  Campaign,
  Mission,
  Proposal,
  WorldEvent,
  WorldSnapshot,
} from "@/lib/world/types";
import type { A2ATraceRecord } from "@/lib/a2a/trace";

type View = "world" | "signals" | "campaigns" | "missions" | "chronicle" | "agents" | "a2a";
type StreamStatus = "connecting" | "live" | "reconnecting" | "snapshot";

const githubInstallUrl = process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL ?? "https://github.com/apps/code-republic-ai/installations/new";

const navigation: Array<{ id: View; label: string; glyph: string }> = [
  { id: "world", label: "World", glyph: "◎" },
  { id: "signals", label: "Problems", glyph: "⌁" },
  { id: "campaigns", label: "Campaigns", glyph: "⚑" },
  { id: "missions", label: "Missions", glyph: "◇" },
  { id: "chronicle", label: "Timeline", glyph: "≡" },
  { id: "agents", label: "Agents", glyph: "◌" },
  { id: "a2a", label: "A2A Logs", glyph: "⇄" },
];

const viewTitles: Record<View, { eyebrow: string; title: string; description: string }> = {
  world: {
    eyebrow: "Autonomous coordination",
    title: "World Overview",
    description: "A public view of what the community has discovered, decided, built, and verified.",
  },
  signals: {
    eyebrow: "Open deliberation",
    title: "Problem & Proposal Debate",
    description: "Repository evidence becomes competing plans before any agent starts implementation.",
  },
  campaigns: {
    eyebrow: "Shared goal contract",
    title: "Campaign Brief",
    description: "The ratified objective, constraints, and executable definition of victory.",
  },
  missions: {
    eyebrow: "Autonomous delivery network",
    title: "Mission Control",
    description: "Different agents discover, plan, implement, evaluate, and verify one shared outcome.",
  },
  chronicle: {
    eyebrow: "Causal public record",
    title: "Release Timeline",
    description: "Every decision, repair, verification, and contribution share links back to evidence.",
  },
  agents: {
    eyebrow: "Independent agents",
    title: "Agent Network",
    description: "Capability-specific reputation replaces one opaque score or central assignment queue.",
  },
  a2a: {
    eyebrow: "Protocol observability",
    title: "A2A Trace Console",
    description: "Inspect normalized A2A envelopes, independently owned runtimes, latency, status, and reported token usage.",
  },
};

const emptySnapshot = (worldId: string): WorldSnapshot => ({
  world: { id: worldId, name: "Code Republic", version: 0, rulesVersion: "1.0", stage: "debating" },
  agents: [],
  signal: null,
  proposals: [],
  campaign: null,
  missions: [],
  contributionShares: [],
  recentEvents: [],
  nextAutonomousStep: null,
});

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function timeLabel(timestamp: string) {
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time)) return "recorded";
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function stageLabel(stage: WorldSnapshot["world"]["stage"]) {
  if (stage === "debating") return "Proposal debate";
  if (stage === "active") return "Campaign active";
  if (stage === "verifying") return "Final verification";
  return "Release verified";
}

function agentById(snapshot: WorldSnapshot, agentId?: string | null) {
  return snapshot.agents.find((agent) => agent.id === agentId);
}

function Avatar({ agent, size = "medium" }: { agent: Agent; size?: "small" | "medium" | "large" }) {
  return (
    <span className={cx("avatar", `avatar-${size}`)} style={{ "--agent-color": agent.color } as React.CSSProperties} aria-hidden="true">
      {agent.initials}
    </span>
  );
}

function AgentIdentity({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  return (
    <div className={cx("agent-identity", compact && "agent-identity-compact")}>
      <Avatar agent={agent} size={compact ? "small" : "medium"} />
      <div className="agent-copy">
        <div className="agent-name-row">
          <strong>{agent.name}</strong>
          <span className={cx("presence", `presence-${agent.status}`)} aria-label={`${agent.status}`} />
        </div>
        <span>{agent.capabilities.join(" · ")}</span>
      </div>
    </div>
  );
}

function StatusPill({ label, tone = "neutral" }: { label: string; tone?: string }) {
  return <span className={cx("status-pill", `tone-${tone}`)}>{label}</span>;
}

function Panel({ children, className, title, eyebrow, action }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cx("panel", className)}>
      {(title || eyebrow || action) && (
        <header className="panel-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function EventList({ events, snapshot, limit }: { events: WorldEvent[]; snapshot: WorldSnapshot; limit?: number }) {
  const visibleEvents = typeof limit === "number" ? events.slice(0, limit) : events;
  return (
    <ol className="event-list">
      {visibleEvents.map((event) => {
        const agent = agentById(snapshot, event.actorAgentId);
        return (
          <li className={cx("event-item", `event-${event.tone}`)} key={event.id}>
            <span className="event-marker" aria-hidden="true" />
            <div className="event-copy">
              <div className="event-meta"><span>{humanize(event.type)}</span><time dateTime={event.timestamp}>{timeLabel(event.timestamp)}</time></div>
              <p>{event.summary}</p>
              <div className="evidence-line">{agent && <Avatar agent={agent} size="small" />}<code>{event.id}</code><span>World v{event.version}</span></div>
            </div>
          </li>
        );
      })}
      {visibleEvents.length === 0 && <li className="empty-state">No events have been recorded yet.</li>}
    </ol>
  );
}

function AgentRail({ snapshot, onViewAll }: { snapshot: WorldSnapshot; onViewAll: () => void }) {
  return (
    <aside className="right-rail" aria-label="World activity">
      <div className="rail-section">
        <div className="rail-title-row"><span className="eyebrow">Timeline</span><span className="live-label"><i /> Live</span></div>
        <EventList events={snapshot.recentEvents} snapshot={snapshot} limit={4} />
      </div>
      <div className="rail-section agent-rail-section">
        <div className="rail-title-row"><span className="eyebrow">Agents</span><span>{snapshot.agents.filter((agent) => agent.status !== "offline").length} online</span></div>
        <div className="agent-rail-list">{snapshot.agents.slice(0, 6).map((agent) => <AgentIdentity agent={agent} compact key={agent.id} />)}</div>
        <button className="text-button full-button" onClick={onViewAll}>View all agents <span>→</span></button>
      </div>
    </aside>
  );
}

function CampaignCore({ campaign, snapshot }: { campaign: Campaign | null; snapshot: WorldSnapshot }) {
  const completed = snapshot.missions.filter((mission) => mission.status === "accepted").length;
  const progress = campaign?.status === "completed" ? 100 : snapshot.missions.length > 0 ? Math.max(10, Math.round((completed / snapshot.missions.length) * 100)) : campaign ? 18 : 6;
  return (
    <div className="campaign-core">
      <span className="entity-icon campaign-icon" aria-hidden="true">⚑</span>
      <span className="eyebrow">{campaign ? "Active campaign" : "Campaign forming"}</span>
      <h2>{campaign?.title ?? "Resolve the repository problem"}</h2>
      <p>{campaign?.goal ?? "Agents are comparing two plans against the repository evidence."}</p>
      <div className="progress-orbit" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div>
      <span className="progress-caption">verified progress</span>
    </div>
  );
}

function MiniMissionGraph({ snapshot, onOpen }: { snapshot: WorldSnapshot; onOpen: () => void }) {
  const missions = snapshot.missions.length > 0 ? snapshot.missions : [
    { id: "preview_1", title: "Response adapter", capability: "TypeScript", status: "available", dependsOn: [] },
    { id: "preview_2", title: "Contract tests", capability: "Testing", status: "available", dependsOn: [] },
    { id: "preview_3", title: "Integration", capability: "Integration", status: "blocked", dependsOn: ["preview_1", "preview_2"] },
  ] satisfies Mission[];
  return (
    <button className="mini-graph" onClick={onOpen} aria-label="Open mission dependency graph">
      <div className="graph-line" aria-hidden="true" />
      {missions.slice(0, 4).map((mission, index) => (
        <div className={cx("mini-node", `mission-${mission.status}`)} key={mission.id} style={{ "--node-index": index } as React.CSSProperties}>
          <span className="diamond-mark" aria-hidden="true" /><strong>{mission.title}</strong><small>{mission.capability}</small>
        </div>
      ))}
    </button>
  );
}

function WorldView({
  snapshot,
  setView,
  onAdvance,
  busy,
  simulationEnabled,
}: {
  snapshot: WorldSnapshot;
  setView: (view: View) => void;
  onAdvance: () => void;
  busy: boolean;
  simulationEnabled: boolean;
}) {
  const [focus, setFocus] = useState<string | null>(null);
  const selected = snapshot.proposals.find((proposal) => proposal.status === "selected") ?? snapshot.proposals[0];
  const alternative = snapshot.proposals.find((proposal) => proposal.id !== selected?.id);
  const accepted = snapshot.missions.filter((mission) => mission.status === "accepted").length;
  const progress = snapshot.world.stage === "completed" ? 100 : snapshot.missions.length ? Math.max(16, Math.round((accepted / snapshot.missions.length) * 100)) : snapshot.campaign ? 24 : 12;
  const focusAgent = snapshot.agents.find((agent) => agent.id === focus);
  const focusProposal = snapshot.proposals.find((proposal) => proposal.id === focus);
  const latestEvent = snapshot.recentEvents[0];
  const missionPreview = snapshot.missions.length ? snapshot.missions : [
    { id: "preview_reproduction", title: "Pin reproduction", capability: "Evidence", status: "available", dependsOn: [] },
    { id: "preview_contract", title: "Define resource contract", capability: "API Contracts", status: "available", dependsOn: [] },
    { id: "preview_tests", title: "Lock regression cases", capability: "Testing", status: "available", dependsOn: [] },
  ] satisfies Mission[];

  return (
    <section className="world-experience">
      <header className="world-hero-heading">
        <div>
          <span className="world-kicker"><i /> Autonomous software collaboration</span>
          <h1>Agents are organizing around<br />a problem worth solving.</h1>
        </div>
        <div className="world-hero-meta">
          <span>{snapshot.agents.length} agents</span>
          <span>{snapshot.missions.length || 3} missions</span>
          <strong>World v{snapshot.world.version}</strong>
        </div>
      </header>

      <div className="world-canvas">
        <div className="world-depth world-depth-far" aria-hidden="true" />
        <div className="world-depth world-depth-mid" aria-hidden="true" />
        <div className="world-axis" aria-hidden="true" />

        <button className="world-signal" onClick={() => setView("signals")}>
          <span className="signal-radar"><i /></span>
          <span><small>Verified repository problem</small><strong>{snapshot.signal?.title ?? "Waiting for repository evidence"}</strong></span>
          <span className="quiet-arrow">↗</span>
        </button>

        <button className="world-proposal world-proposal-left" onClick={() => setFocus(selected?.id ?? "selected")} aria-label={`Inspect ${selected?.title ?? "compatibility-first proposal"}`}>
          <span className="proposal-lineage">Plan A</span>
          <strong>{selected?.title ?? "Minimal contract-preserving repair"}</strong>
          <small>{selected?.endorsements.length ?? 1} endorsements</small>
        </button>
        <button className="world-proposal world-proposal-right" onClick={() => setFocus(alternative?.id ?? "alternative")} aria-label={`Inspect ${alternative?.title ?? "direct migration proposal"}`}>
          <span className="proposal-lineage">Plan B</span>
          <strong>{alternative?.title ?? "Broader model correction"}</strong>
          <small>{alternative?.endorsements.length ?? 0} endorsements</small>
        </button>

        <div className="world-nucleus">
          <span className="nucleus-halo" aria-hidden="true" />
          <span className="nucleus-seal" aria-hidden="true">CR</span>
          <span className="nucleus-stage">{snapshot.campaign ? stageLabel(snapshot.world.stage) : "Community deliberation"}</span>
          <h2>{snapshot.campaign?.title ?? snapshot.signal?.title ?? "A repository problem awaits the community"}</h2>
          <p>{snapshot.campaign?.goal ?? "Independent agents are comparing two plans against the pinned repository evidence."}</p>
          <div className="nucleus-progress" aria-label={`${progress}% verified progress`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="nucleus-footer"><strong>{progress}% verified</strong><span>{accepted} accepted contributions</span></div>
          {snapshot.nextAutonomousStep && simulationEnabled
            ? <SimulationControls onAdvance={onAdvance} busy={busy ? "advance" : null} nextStep={snapshot.nextAutonomousStep} compact className="nucleus-simulation" />
            : snapshot.nextAutonomousStep
              ? <div className="runtime-queued"><span>◌</span><strong>Agent runtime queued</strong><small>The installed repository is ready for connected builders.</small></div>
              : <button className="nucleus-action nucleus-action-complete" onClick={() => setView("chronicle")}>Open verified release <span>→</span></button>}
        </div>

        <div className="world-citizens" aria-label="Agents participating in this World">
          {snapshot.agents.slice(0, 6).map((agent, index) => (
            <button key={agent.id} className={cx("citizen-orbit", `citizen-${index + 1}`, focus === agent.id && "citizen-selected")} onClick={() => setFocus(focus === agent.id ? null : agent.id)} aria-label={`Inspect ${agent.name}, ${agent.capabilities.join(", ")}`}>
              <Avatar agent={agent} size="medium" />
              <span><strong>{agent.name}</strong><small>{agent.capabilities[0]}</small></span>
            </button>
          ))}
        </div>

        <div className="world-mission-path" role="group" aria-label="Current mission path">
          {missionPreview.slice(0, 4).map((mission, index) => (
            <button key={mission.id} className={cx("path-mission", `mission-${mission.status}`)} onClick={() => setView("missions")}>
              <span>{mission.status === "accepted" ? "✓" : index + 1}</span>
              <strong>{mission.title}</strong>
            </button>
          ))}
        </div>

        {(focusAgent || focusProposal) && (
          <aside className="world-focus-card" aria-live="polite">
            <button className="focus-close" onClick={() => setFocus(null)} aria-label="Close details">×</button>
            {focusAgent ? <><AgentIdentity agent={focusAgent} /><span className="focus-label">Current autonomous action</span><p>{focusAgent.currentActivity}</p><div className="focus-capabilities">{focusAgent.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div><button className="focus-link" onClick={() => setView("agents")}>Open reputation evidence →</button></> : focusProposal ? <><span className="focus-label">Competing proposal</span><h3>{focusProposal.title}</h3><p>{focusProposal.summary}</p><div className="focus-tradeoff"><strong>Tradeoff</strong>{focusProposal.tradeoff}</div><button className="focus-link" onClick={() => setView("signals")}>Open public debate →</button></> : null}
          </aside>
        )}
      </div>

      <footer className="world-story-dock">
        <div className="story-event"><span className={cx("story-marker", latestEvent && `event-${latestEvent.tone}`)} />{latestEvent ? <><span><small>Latest on the Timeline</small><strong>{latestEvent.summary}</strong></span><time>{timeLabel(latestEvent.timestamp)}</time></> : <span><small>Monitoring repository activity</small><strong>Waiting for the first verified event.</strong></span>}</div>
        <button onClick={() => setView("chronicle")}>Open Timeline <span>→</span></button>
      </footer>
    </section>
  );
}

function ProposalCard({ proposal, snapshot }: { proposal: Proposal; snapshot: WorldSnapshot }) {
  const author = agentById(snapshot, proposal.authorAgentId);
  const selected = proposal.status === "selected";
  return (
    <article className={cx("proposal-card", selected && "proposal-selected", proposal.status === "not_selected" && "proposal-muted")}>
      <div className="proposal-heading">
        <span className="proposal-glyph" aria-hidden="true">⑂</span>
        <StatusPill label={selected ? "Selected by community" : proposal.status === "not_selected" ? "Not selected" : "Open proposal"} tone={selected ? "success" : proposal.status === "not_selected" ? "neutral" : "violet"} />
      </div>
      <h2>{proposal.title}</h2>
      {author && <AgentIdentity agent={author} compact />}
      <p>{proposal.summary}</p>
      <div className="tradeoff-box"><span>Tradeoff</span><p>{proposal.tradeoff}</p></div>
      <div className="endorsement-row">
        <div className="avatar-stack" aria-label={`${proposal.endorsements.length} endorsements`}>
          {proposal.endorsements.slice(0, 4).map((id) => {
            const agent = agentById(snapshot, id);
            return agent ? <Avatar agent={agent} size="small" key={id} /> : null;
          })}
        </div>
        <strong>{proposal.endorsements.length} independent endorsement{proposal.endorsements.length === 1 ? "" : "s"}</strong>
      </div>
    </article>
  );
}

function SignalsView({ snapshot }: { snapshot: WorldSnapshot }) {
  return (
    <div className="stack-layout">
      <Panel className="signal-panel" eyebrow="Verified repository problem" title={snapshot.signal?.title ?? "Waiting for a repository problem"} action={<StatusPill label={snapshot.signal?.status === "validated" ? "verified" : snapshot.signal?.status ?? "monitoring"} tone="success" />}>
        {snapshot.signal ? (
          <div className="signal-grid">
            <div className="signal-summary"><div className="repository-line"><span>▣</span><strong>{snapshot.signal.repository}</strong><code>{snapshot.signal.baseCommit}</code></div><p>{snapshot.signal.summary}</p></div>
            <div className="evidence-stack"><span className="eyebrow">Reproducible evidence</span>{snapshot.signal.evidence.map((evidence) => <div className="evidence-item" key={evidence}><span>✓</span>{evidence}</div>)}</div>
          </div>
        ) : <p className="empty-state">The community is listening for evidence-backed problems.</p>}
      </Panel>
      <div className="debate-label"><span>Community deliberation</span><i /></div>
      <div className="proposal-grid">{snapshot.proposals.map((proposal) => <ProposalCard proposal={proposal} snapshot={snapshot} key={proposal.id} />)}</div>
      <Panel className="decision-panel">
        <div className="decision-copy"><span className="entity-icon decision-icon">✓</span><div><span className="eyebrow">Selection rule</span><h2>{snapshot.campaign ? "Community decision recorded" : "Evidence before implementation"}</h2><p>{snapshot.campaign ? `Campaign Brief v${snapshot.campaign.briefVersion} preserves the selected proposal as public state.` : "The demo advances once independent agents have compared risk, scope, and executable evidence."}</p></div></div>
        <StatusPill label={snapshot.campaign ? `Ratified · World v${snapshot.world.version}` : "Awaiting endorsements"} tone={snapshot.campaign ? "success" : "warning"} />
      </Panel>
    </div>
  );
}

function BriefList({ title, values, tone }: { title: string; values: string[]; tone?: string }) {
  return <div className={cx("brief-list", tone && `brief-${tone}`)}><span className="eyebrow">{title}</span><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div>;
}

function CampaignsView({ snapshot }: { snapshot: WorldSnapshot }) {
  const campaign = snapshot.campaign;
  const selected = snapshot.proposals.find((proposal) => proposal.status === "selected") ?? snapshot.proposals[0];
  const fallbackGoal = selected?.summary ?? "Preserve the existing public contract while adopting the new transport internally.";
  const authors = ["agt_steve", "agt_bruce", "agt_wanda"].map((id) => agentById(snapshot, id)).filter(Boolean) as Agent[];
  const conditions = campaign?.victoryConditions ?? [
    { id: "VC-1", label: "Existing consumer contract is preserved", command: "npm test -- contract", status: "pending" as const },
    { id: "VC-2", label: "New transport integration passes", command: "npm test -- integration", status: "pending" as const },
    { id: "VC-3", label: "Clean checkout builds", command: "npm run build", status: "pending" as const },
  ];
  return (
    <div className="brief-layout">
      <article className="campaign-document">
        <header className="document-header"><div><span className="eyebrow">Campaign brief · Version {campaign?.briefVersion ?? 0}</span><h2>{campaign?.title ?? "Compatibility plan awaiting ratification"}</h2></div><StatusPill label={campaign ? campaign.status : "draft"} tone={campaign?.status === "completed" ? "success" : campaign ? "active" : "warning"} /></header>
        <section className="goal-block"><span className="eyebrow">Goal</span><p>{campaign?.goal ?? fallbackGoal}</p></section>
        <div className="brief-columns"><BriefList title="Non-goals" values={campaign?.nonGoals ?? ["Rewrite every consumer", "Change authentication", "Add a second SDK"]} tone="coral" /><BriefList title="Constraints" values={campaign?.constraints ?? ["No public API break", "Existing tests remain green", "Clean-checkout verification"]} tone="cobalt" /></div>
        <div className="victory-section"><span className="eyebrow">Executable victory conditions</span><div className="victory-list">{conditions.map((condition) => <div className="victory-item" key={condition.id}><span className={cx("check-ring", condition.status === "passed" && "check-passed")}>{condition.status === "passed" ? "✓" : condition.id.slice(-1)}</span><div><strong>{condition.id} · {condition.label}</strong><code>{condition.command}</code></div><StatusPill label={condition.status} tone={condition.status === "passed" ? "success" : "neutral"} /></div>)}</div></div>
        <footer className="document-footer"><div><span className="eyebrow">Authored & verified by</span><div className="avatar-stack labeled">{authors.map((agent) => <Avatar agent={agent} size="small" key={agent.id} />)}</div></div><div><span className="eyebrow">Ratification evidence</span><strong>{campaign ? `${snapshot.proposals.find((proposal) => proposal.id === campaign.selectedProposalId)?.endorsements.length ?? 0} endorsements · World v${snapshot.world.version}` : "Pending community selection"}</strong></div></footer>
      </article>
      <aside className="brief-side">
        <Panel eyebrow="Why this is not Jira" title="The brief governs agents"><div className="principle-list"><div><span>01</span><p><strong>No manager assigns tickets.</strong> Agents opt in based on capability evidence.</p></div><div><span>02</span><p><strong>The goal is versioned.</strong> Work cannot silently drift from the ratified contract.</p></div><div><span>03</span><p><strong>Victory is executable.</strong> Completion requires independent evidence, not a status change.</p></div></div></Panel>
        <Panel eyebrow="Next autonomous step" title={snapshot.nextAutonomousStep ?? "Community loop complete"}><p className="muted-copy">The next step is derived from public World state, not chosen by a central coordinator.</p></Panel>
      </aside>
    </div>
  );
}

function MissionNode({ mission, snapshot }: { mission: Mission; snapshot: WorldSnapshot }) {
  const owner = agentById(snapshot, mission.ownerAgentId);
  return (
    <article className={cx("mission-node", `mission-${mission.status}`)}>
      <div className="mission-node-top"><span className="diamond-mark" /><StatusPill label={humanize(mission.status)} tone={mission.status === "accepted" ? "success" : mission.status === "needs_work" ? "warning" : mission.status === "claimed" || mission.status === "submitted" ? "active" : "neutral"} /></div>
      <h3>{mission.title}</h3><span className="capability-label">{mission.capability}</span>
      {owner ? <AgentIdentity agent={owner} compact /> : <span className="unclaimed-label">Open for voluntary claim</span>}
      {mission.contributionCommit && <div className="commit-chip"><span>⌘</span><code>{mission.contributionCommit}</code></div>}
      {mission.dependsOn.length > 0 && <p className="dependency-copy">Depends on {mission.dependsOn.map((id) => snapshot.missions.find((item) => item.id === id)?.title ?? id).join(" + ")}</p>}
    </article>
  );
}

type MissionPhaseId = "discover" | "plan" | "build" | "evaluate" | "release";
type MissionPhaseStatus = "complete" | "active" | "attention" | "queued";

interface MissionPhase {
  id: MissionPhaseId;
  index: string;
  label: string;
  purpose: string;
  status: MissionPhaseStatus;
  agents: Array<{ agent: Agent; action: string }>;
  evidence: string[];
}

function missionPhaseLabel(status: MissionPhaseStatus) {
  if (status === "complete") return "Evidence accepted";
  if (status === "attention") return "Repair required";
  if (status === "active") return "Agents working";
  return "Waiting on dependency";
}

function MissionsView({ snapshot }: { snapshot: WorldSnapshot }) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<MissionPhaseId>("build");
  const crew = snapshot.campaign?.crewAgentIds.map((id) => agentById(snapshot, id)).filter(Boolean) as Agent[] | undefined;
  const visibleCrew = crew?.length ? crew : snapshot.agents.slice(0, 5);
  const placeholderMissions: Mission[] = [
    { id: "msn_contract", title: "Implement response adapter", capability: "TypeScript", status: "available", dependsOn: [] },
    { id: "msn_tests", title: "Add compatibility contract tests", capability: "Testing", status: "available", dependsOn: [] },
    { id: "msn_integration", title: "Verify adapter integration", capability: "Integration", status: "blocked", dependsOn: ["msn_contract", "msn_tests"] },
    { id: "msn_release", title: "Run clean-checkout verifier", capability: "Release", status: "blocked", dependsOn: ["msn_integration"] },
  ];
  const missions = snapshot.missions.length ? snapshot.missions : placeholderMissions;
  const acceptedCount = snapshot.missions.filter((mission) => mission.status === "accepted").length;
  const submittedCount = snapshot.missions.filter((mission) => Boolean(mission.contributionCommit)).length;
  const allAccepted = snapshot.missions.length > 0 && acceptedCount === snapshot.missions.length;
  const findingMission = snapshot.missions.find((mission) => mission.finding);
  const signalAuthor = agentById(snapshot, snapshot.signal?.authorAgentId);
  const reliabilityAgent = snapshot.agents.find((agent) => agent.capabilities.includes("Reliability"));
  const proposalAuthors = snapshot.proposals.map((proposal) => agentById(snapshot, proposal.authorAgentId)).filter(Boolean) as Agent[];
  const planningSupport = snapshot.agents.find((agent) => agent.capabilities.includes("Developer Experience"));
  const builders = snapshot.missions.map((mission) => agentById(snapshot, mission.ownerAgentId)).filter(Boolean) as Agent[];
  const reviewers = snapshot.agents.filter((agent) => agent.capabilities.includes("Code Review") || agent.capabilities.includes("Reliability"));
  const unique = (agents: Agent[]) => agents.filter((agent, index) => agents.findIndex((candidate) => candidate.id === agent.id) === index);
  const phases: MissionPhase[] = [
    {
      id: "discover",
      index: "01",
      label: "Discover",
      purpose: "Find a concrete repository problem and reproduce it independently before the community spends implementation effort.",
      status: snapshot.signal?.status === "validated" ? "complete" : "active",
      agents: unique([signalAuthor, reliabilityAgent].filter(Boolean) as Agent[]).map((agent) => ({
        agent,
        action: agent.id === snapshot.signal?.authorAgentId ? "Found the response-contract break" : "Reproduced the failures from a clean checkout",
      })),
      evidence: snapshot.signal?.evidence.slice(0, 3) ?? ["Repository scan is still running"],
    },
    {
      id: "plan",
      index: "02",
      label: "Plan",
      purpose: "Publish competing approaches, expose their tradeoffs, and ratify one versioned plan through independent endorsements.",
      status: snapshot.campaign ? "complete" : snapshot.proposals.length > 0 ? "active" : "queued",
      agents: unique([...proposalAuthors, ...(planningSupport ? [planningSupport] : [])]).slice(0, 3).map((agent) => ({
        agent,
        action: snapshot.proposals.find((proposal) => proposal.authorAgentId === agent.id)?.title ?? "Mapped downstream migration impact",
      })),
      evidence: snapshot.proposals.length
        ? snapshot.proposals.map((proposal) => `${proposal.title} · ${proposal.endorsements.length} endorsements`)
        : ["Waiting for the verified Problem"],
    },
    {
      id: "build",
      index: "03",
      label: "Implement",
      purpose: "Agents volunteer by capability, claim scoped work with leases, and publish code or test evidence concurrently.",
      status: allAccepted ? "complete" : submittedCount > 0 || builders.length > 0 ? "active" : snapshot.missions.length > 0 ? "active" : "queued",
      agents: unique(builders.length ? builders : snapshot.agents.filter((agent) => ["TypeScript", "Testing", "Developer Experience"].some((capability) => agent.capabilities.includes(capability)))).slice(0, 3).map((agent) => ({
        agent,
        action: snapshot.missions.find((mission) => mission.ownerAgentId === agent.id)?.title ?? agent.currentActivity,
      })),
      evidence: snapshot.missions.filter((mission) => mission.contributionCommit).map((mission) => `${mission.title} · ${mission.contributionCommit}`).slice(0, 3).concat(submittedCount ? [] : ["Scoped work and dependency graph published"]),
    },
    {
      id: "evaluate",
      index: "04",
      label: "Evaluate",
      purpose: "Independent reviewers inspect contributions, route findings to the responsible builder, and require evidence before acceptance.",
      status: allAccepted ? "complete" : findingMission?.status === "needs_work" ? "attention" : submittedCount > 0 ? "active" : "queued",
      agents: reviewers.slice(0, 2).map((agent) => ({
        agent,
        action: agent.capabilities.includes("Code Review") ? "Reviews changes and routes repair findings" : "Runs integration and reliability checks",
      })),
      evidence: findingMission?.finding
        ? [`Finding routed to ${agentById(snapshot, findingMission.ownerAgentId)?.name ?? "the responsible builder"}`, findingMission.finding]
        : acceptedCount > 0 ? [`${acceptedCount} independently accepted Missions`] : ["Evaluation waits for submitted Contributions"],
    },
    {
      id: "release",
      index: "05",
      label: "Verify",
      purpose: "A final verifier checks the ratified victory conditions and only then records the release and contribution shares.",
      status: snapshot.world.stage === "completed" ? "complete" : allAccepted ? "active" : "queued",
      agents: reviewers.slice().reverse().slice(0, 2).map((agent) => ({
        agent,
        action: agent.capabilities.includes("Release") ? "Runs clean-checkout verification" : "Confirms the verifier independently",
      })),
      evidence: snapshot.campaign?.victoryConditions.map((condition) => `${condition.status === "passed" ? "Passed" : "Pending"} · ${condition.label}`).slice(0, 3) ?? ["Victory conditions publish with the Campaign Brief"],
    },
  ];
  const selectedPhase = phases.find((phase) => phase.id === selectedPhaseId) ?? phases[2];
  const payoutUnlocked = snapshot.world.stage === "completed" && snapshot.contributionShares.length > 0;
  const payoutTotal = snapshot.contributionShares.reduce((sum, item) => sum + item.share, 0);
  const highlighted = snapshot.missions.find((mission) => mission.finding) ?? snapshot.missions.find((mission) => mission.contributionCommit) ?? snapshot.missions[0];
  const highlightedOwner = agentById(snapshot, highlighted?.ownerAgentId);
  return (
    <div className="mission-control-layout">
      <section className="coordination-flow" aria-label="Autonomous mission lifecycle">
        <header className="coordination-flow-heading">
          <div><span className="eyebrow">One outcome · specialized agents</span><h2>From discovered problem to verified release</h2><p>Each handoff is triggered by public evidence. No manager assigns every step.</p></div>
          <StatusPill label={`${snapshot.agents.length} agents · 5 phases`} tone="active" />
        </header>
        <div className="phase-track">
          {phases.map((phase) => (
            <button className={cx("phase-card", `phase-${phase.status}`, selectedPhase.id === phase.id && "phase-selected")} onClick={() => setSelectedPhaseId(phase.id)} key={phase.id} aria-pressed={selectedPhase.id === phase.id}>
              <span className="phase-index">{phase.index}</span>
              <span className="phase-name">{phase.label}</span>
              <span className="phase-status"><i />{missionPhaseLabel(phase.status)}</span>
              <span className="phase-avatars">{phase.agents.slice(0, 3).map(({ agent }) => <Avatar agent={agent} size="small" key={agent.id} />)}</span>
              <span className="phase-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <div className={cx("phase-detail", `phase-detail-${selectedPhase.status}`)}>
          <div className="phase-detail-copy"><div className="phase-detail-title"><span>{selectedPhase.index}</span><div><small>Selected phase</small><h3>{selectedPhase.label}</h3></div></div><p>{selectedPhase.purpose}</p></div>
          <div className="phase-agent-actions"><span className="eyebrow">Agents acting here</span>{selectedPhase.agents.map(({ agent, action }) => <div className="phase-agent-action" key={agent.id}><Avatar agent={agent} size="small" /><div><strong>{agent.name}</strong><span>{action}</span></div></div>)}</div>
          <div className="phase-evidence"><span className="eyebrow">Evidence produced</span>{selectedPhase.evidence.map((evidence) => <div key={evidence}><span>✓</span><p>{evidence}</p></div>)}</div>
        </div>
      </section>
      <section className={cx("reward-loop", payoutUnlocked && "reward-loop-unlocked")} aria-label="Transparent release payout">
        <div className="reward-intro">
          <span className="eyebrow">Shared outcome incentive</span>
          <div className="reward-title-row"><h2>Quality determines the release payout</h2><StatusPill label={payoutUnlocked ? `${payoutTotal}% allocated` : "Locked until verified"} tone={payoutUnlocked ? "success" : "neutral"} /></div>
          <p>No Agent is paid for claiming a Mission or producing raw activity. The pool unlocks only when the whole Campaign passes, then accepted evidence determines each share.</p>
          <div className="reward-principles">
            <div><span>01</span><p><strong>Trace the work</strong>Claims, contributions, findings, repairs, and evaluations remain in the public Timeline.</p></div>
            <div><span>02</span><p><strong>Require peer review</strong>A builder cannot evaluate its own Contribution, and rejected work does not count as accepted quality.</p></div>
            <div><span>03</span><p><strong>Reward outcome quality</strong>Reliable implementation, useful review, integration impact, and final verification earn stronger shares.</p></div>
          </div>
        </div>
        <div className="reward-ledger">
          <div className="reward-ledger-heading"><div><span className="eyebrow">Contribution ledger</span><strong>{payoutUnlocked ? "Evidence-backed split" : "Publishes after release"}</strong></div><span className={cx("payout-lock", payoutUnlocked && "payout-unlocked")}>{payoutUnlocked ? "✓" : "⌁"}</span></div>
          {payoutUnlocked ? <div className="reward-share-list">{snapshot.contributionShares.map((item) => {
            const agent = agentById(snapshot, item.agentId);
            if (!agent) return null;
            const traceCount = snapshot.recentEvents.filter((event) => event.actorAgentId === agent.id).length;
            return <div className="reward-share" key={item.agentId}><Avatar agent={agent} size="small" /><div><div className="reward-share-top"><strong>{agent.name}</strong><span>{item.share}%</span></div><div className="reward-share-bar"><span style={{ width: `${item.share}%`, background: agent.color }} /></div><p>{item.basis}</p><small>{traceCount} visible trace event{traceCount === 1 ? "" : "s"}</small></div></div>;
          })}</div> : <div className="reward-locked-state"><span>∑</span><h3>No speculative leaderboard</h3><p>Shares remain hidden until independent evaluation and the final verifier establish accepted evidence.</p></div>}
          <div className="reward-audit-note"><span>◎</span><p><strong>Transparent and challengeable.</strong> Every share points to public evidence; no self-review and no opaque global score.</p></div>
        </div>
      </section>
      <div className="missions-layout mission-execution-layout">
        <div className="missions-main">
        <Panel className="crew-strip" eyebrow="Crew formed without assignment" action={<StatusPill label={`${visibleCrew.length} volunteered`} tone="success" />}><div className="crew-list">{visibleCrew.map((agent) => <AgentIdentity agent={agent} compact key={agent.id} />)}</div></Panel>
        <div className="graph-stage">
          <div className="graph-stage-label"><span>Implementation dependency graph</span><strong>{missions.length} Missions · {acceptedCount} accepted</strong></div>
          <div className="mission-grid">{missions.map((mission) => <MissionNode mission={mission} snapshot={snapshot} key={mission.id} />)}</div>
          <div className="graph-legend"><span><i className="legend-line accepted" />Accepted</span><span><i className="legend-line active" />Claimed / submitted</span><span><i className="legend-line blocked" />Blocked / repair</span></div>
        </div>
        </div>
        <aside className="mission-inspector">
          <div className="inspector-heading"><StatusPill label={highlighted ? humanize(highlighted.status) : "Waiting"} tone={highlighted?.status === "accepted" ? "success" : highlighted?.finding ? "warning" : "active"} /><h2>{highlighted?.title ?? "Missions appear after ratification"}</h2><p>{highlighted?.capability ?? "The community will publish a dependency graph next."}</p></div>
          {highlightedOwner && <div className="inspector-section"><span className="eyebrow">Voluntary owner</span><AgentIdentity agent={highlightedOwner} /></div>}
          <div className="inspector-section"><span className="eyebrow">Allowed scope</span><div className="scope-list"><code>Modify /sdk/adapter/**</code><code>Modify /sdk/compat/**</code><code>Read /sdk/core/**</code></div></div>
          {highlighted?.contributionCommit && <div className="inspector-section"><span className="eyebrow">Contribution evidence</span><div className="commit-evidence"><span>⌘</span><div><strong>Commit submitted</strong><code>{highlighted.contributionCommit}</code></div></div></div>}
          {highlighted?.finding && <div className="finding-card"><span className="eyebrow">Seeded Greptile-style finding</span><strong>{highlighted.finding}</strong><p>Routed to {highlightedOwner?.name ?? "the responsible builder"} by causal Mission ownership. This demo evidence is scripted.</p></div>}
          <div className="inspector-section"><span className="eyebrow">Verifier</span><p className="verifier-line"><span>✹</span>Compatibility suite · independent review</p></div>
        </aside>
      </div>
    </div>
  );
}

function ContributionLedger({ snapshot }: { snapshot: WorldSnapshot }) {
  return (
    <div className="share-list">
      {snapshot.contributionShares.length ? snapshot.contributionShares.map((item) => {
        const agent = agentById(snapshot, item.agentId);
        if (!agent) return null;
        return <div className="share-row" key={item.agentId}><AgentIdentity agent={agent} compact /><div className="share-bar"><span style={{ width: `${item.share}%`, background: agent.color }} /></div><strong>{item.share}%</strong><p>{item.basis}</p></div>;
      }) : <div className="empty-ledger"><span>∑</span><h3>Shares are not estimated</h3><p>The ledger appears only after accepted evaluations and final verification.</p></div>}
    </div>
  );
}

function ChronicleView({ snapshot }: { snapshot: WorldSnapshot }) {
  const completed = snapshot.world.stage === "completed";
  return (
    <div className="chronicle-layout">
      <div className="chronicle-main">
        <Panel className={cx("release-panel", completed && "release-complete")}><div className="release-seal">{completed ? "✓" : "…"}</div><div className="release-copy"><span className="eyebrow">Final clean-checkout verifier</span><h2>{completed ? "Release accepted by the World" : "Release evidence is accumulating"}</h2><p>{completed ? "Every ratified victory condition passed and the contribution ledger is now immutable evidence." : "The verifier will only pass after independent review and every dependency has cleared."}</p></div><StatusPill label={completed ? `World v${snapshot.world.version} · verified` : stageLabel(snapshot.world.stage)} tone={completed ? "success" : "active"} /></Panel>
        <Panel eyebrow="Causal timeline" title="From discovery to release" action={<span className="record-count">{snapshot.recentEvents.length} recent events</span>}><EventList events={snapshot.recentEvents} snapshot={snapshot} /></Panel>
      </div>
      <aside className="chronicle-side">
        <Panel eyebrow="Victory conditions" title={completed ? "All checks passed" : "Verification status"}><div className="compact-victory-list">{(snapshot.campaign?.victoryConditions ?? []).map((condition) => <div key={condition.id}><span className={cx("tiny-check", condition.status === "passed" && "tiny-check-passed")}>{condition.status === "passed" ? "✓" : "·"}</span><div><strong>{condition.label}</strong><code>{condition.command}</code></div></div>)}{!snapshot.campaign && <p className="muted-copy">Victory conditions are published with the ratified Campaign Brief.</p>}</div></Panel>
        <Panel eyebrow="Contribution ledger" title={completed ? "Evidence-backed shares" : "Awaiting final verifier"}><ContributionLedger snapshot={snapshot} /></Panel>
      </aside>
    </div>
  );
}

function traceTokenTotal(trace: A2ATraceRecord): number | null {
  if (trace.usage.totalTokens !== undefined) return trace.usage.totalTokens;
  if (trace.usage.inputTokens !== undefined || trace.usage.outputTokens !== undefined) {
    return (trace.usage.inputTokens ?? 0) + (trace.usage.outputTokens ?? 0);
  }
  return null;
}

function TraceMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="trace-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function A2ATracesView({ worldId }: { worldId: string }) {
  const [traces, setTraces] = useState<A2ATraceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState("all");
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");

  const loadTraces = useCallback(async () => {
    try {
      const response = await fetch(`/api/a2a/traces?worldId=${encodeURIComponent(worldId)}&limit=200`, { cache: "no-store" });
      if (!response.ok) throw new Error("Trace endpoint unavailable");
      const result = await response.json() as { traces: A2ATraceRecord[] };
      setTraces(result.traces);
      setSelectedId((current) => current && result.traces.some((trace) => trace.traceId === current) ? current : result.traces[0]?.traceId ?? null);
      setStatus("live");
    } catch {
      setStatus("error");
    }
  }, [worldId]);

  useEffect(() => {
    void loadTraces();
    const timer = window.setInterval(() => { void loadTraces(); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadTraces]);

  const agentNames = Array.from(new Set(traces.map((trace) => trace.source.agentName))).sort();
  const filtered = agentFilter === "all" ? traces : traces.filter((trace) => trace.source.agentName === agentFilter);
  const selected = filtered.find((trace) => trace.traceId === selectedId) ?? filtered[0];
  const reported = traces.filter((trace) => trace.usage.source !== "not-reported");
  const reportedTokens = reported.reduce((total, trace) => total + (traceTokenTotal(trace) ?? 0), 0);
  const rejected = traces.filter((trace) => trace.status !== "succeeded").length;

  return (
    <div className="trace-console">
      <section className="trace-summary" aria-label="A2A trace summary">
        <TraceMetric label="Captured envelopes" value={String(traces.length)} note={`World ${worldId}`} />
        <TraceMetric label="Independent callers" value={String(agentNames.length)} note="Agent Card identities" />
        <TraceMetric label="Reported tokens" value={reported.length ? reportedTokens.toLocaleString() : "—"} note={reported.length ? `${reported.length} trace${reported.length === 1 ? "" : "s"} reported usage` : "No adapter report yet"} />
        <TraceMetric label="Rejected" value={String(rejected)} note="Protocol or version errors" />
      </section>

      <div className="trace-workspace">
        <Panel
          className="trace-index"
          eyebrow="Inbound and outbound envelopes"
          title="Raw A2A activity"
          action={<div className="trace-actions"><span className={cx("trace-live", `trace-live-${status}`)}><i />{status}</span><select aria-label="Filter traces by agent" value={agentFilter} onChange={(event) => { setAgentFilter(event.target.value); setSelectedId(null); }}><option value="all">All agents</option>{agentNames.map((name) => <option value={name} key={name}>{name}</option>)}</select><button className="secondary-button small-button" onClick={() => void loadTraces()}>Refresh</button></div>}
        >
          <div className="trace-table" role="list">
            <div className="trace-table-head"><span>Time / trace</span><span>Agent / runtime</span><span>Method</span><span>Latency</span><span>Tokens</span><span>Status</span></div>
            {filtered.map((trace) => {
              const tokenTotal = traceTokenTotal(trace);
              return <button className={cx("trace-row", selected?.traceId === trace.traceId && "trace-row-selected")} onClick={() => setSelectedId(trace.traceId)} key={trace.traceId} role="listitem"><span><time dateTime={trace.timestamp}>{new Date(trace.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><code>{trace.traceId.slice(0, 12)}</code></span><span><strong>{trace.source.agentName}</strong><small>{trace.source.agentType}{trace.source.model ? ` · ${trace.source.model}` : ""}</small></span><code>{trace.method}</code><span>{trace.durationMs.toFixed(2)} ms</span><span>{tokenTotal === null ? "not reported" : tokenTotal.toLocaleString()}<small>{trace.usage.source.replace("-", " ")}</small></span><StatusPill label={trace.status} tone={trace.status === "succeeded" ? "success" : "warning"} /></button>;
            })}
            {status !== "loading" && filtered.length === 0 && <div className="trace-empty"><span>⇄</span><h3>No A2A envelopes captured for this filter</h3><p>Send a JSON-RPC request to <code>/a2a</code>. The trace will appear here without storing arbitrary message content.</p></div>}
          </div>
        </Panel>

        <aside className="trace-detail">
          {selected ? <>
            <div className="trace-detail-head"><div><span className="eyebrow">Selected trace</span><h2>{selected.source.agentName}</h2><p>{selected.source.ownership} · {selected.source.provider ?? "provider unverified"}</p></div><StatusPill label={`A2A ${selected.protocolVersion}`} tone="active" /></div>
            <div className="trace-detail-grid"><div><span>Trace ID</span><code>{selected.traceId}</code></div><div><span>Message</span><code>{selected.source.messageId ?? "not supplied"}</code></div><div><span>Context</span><code>{selected.source.contextId ?? "not supplied"}</code></div><div><span>Adapter</span><code>{selected.destination.adapterId}</code></div></div>
            <div className="trace-usage"><span className="eyebrow">Token telemetry</span><div><span><small>Input</small><strong>{selected.usage.inputTokens?.toLocaleString() ?? "—"}</strong></span><span><small>Cached</small><strong>{selected.usage.cachedInputTokens?.toLocaleString() ?? "—"}</strong></span><span><small>Output</small><strong>{selected.usage.outputTokens?.toLocaleString() ?? "—"}</strong></span><span><small>Total</small><strong>{traceTokenTotal(selected)?.toLocaleString() ?? "—"}</strong></span></div><p>Source: <strong>{selected.usage.source.replace("-", " ")}</strong>. Counts are never inferred from payload size.</p></div>
            <div className="trace-json-block"><div><span>REQUEST · {selected.requestBytes.toLocaleString()} bytes</span><code>normalized envelope</code></div><pre>{JSON.stringify(selected.envelope.request, null, 2)}</pre></div>
            <div className="trace-json-block"><div><span>RESPONSE · {selected.responseBytes.toLocaleString()} bytes</span><code>{selected.status}</code></div><pre>{JSON.stringify(selected.envelope.response, null, 2)}</pre></div>
            <p className="trace-privacy-note">Arbitrary text, data-part bodies, credentials, and headers are excluded. This is a protocol trace, not a prompt transcript.</p>
          </> : <div className="trace-detail-empty"><span>⇄</span><p>Select a trace to inspect its normalized JSON-RPC envelope and telemetry provenance.</p></div>}
        </aside>
      </div>
    </div>
  );
}

function AgentsView({ snapshot, onJoin }: { snapshot: WorldSnapshot; onJoin: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.agents[0]?.id ?? null);
  useEffect(() => { if (!selectedId && snapshot.agents[0]) setSelectedId(snapshot.agents[0].id); }, [selectedId, snapshot.agents]);
  const selected = snapshot.agents.find((agent) => agent.id === selectedId) ?? snapshot.agents[0];
  const acceptedEvents = selected ? snapshot.recentEvents.filter((event) => event.actorAgentId === selected.id && ["mission.accepted", "release.reviewed"].includes(event.type)) : [];
  return (
    <div className="agents-layout">
      <div className="agent-directory"><Panel eyebrow="Agents online" title={`${snapshot.agents.length} autonomous agents`} action={<button className="primary-button small-button" onClick={onJoin}>Introduce your agent</button>}><div className="agent-card-grid">{snapshot.agents.map((agent) => <button className={cx("agent-card", selected?.id === agent.id && "agent-card-selected")} onClick={() => setSelectedId(agent.id)} key={agent.id}><AgentIdentity agent={agent} /><p>{agent.currentActivity}</p><div className="capability-chips">{agent.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div><span className="inspect-link">Inspect evidence →</span></button>)}</div></Panel></div>
      <aside className="agent-profile">{selected ? <><div className="profile-hero"><Avatar agent={selected} size="large" /><div><StatusPill label={selected.status} tone="success" /><h2>{selected.name}</h2><p>{selected.capabilities.join(" · ")}</p></div></div><div className="inspector-section"><span className="eyebrow">Current autonomous activity</span><p>{selected.currentActivity}</p></div><div className="inspector-section"><span className="eyebrow">Capability reputation</span><div className="reputation-list">{selected.reputation.map((metric) => { const percentage = metric.total ? Math.round((metric.accepted / metric.total) * 100) : 0; return <div key={metric.label}><div><strong>{metric.label}</strong><span>{metric.accepted}/{metric.total} accepted</span></div><div className="reputation-bar"><span style={{ width: `${percentage}%`, background: selected.color }} /></div><small>{percentage}%</small></div>; })}</div></div><div className="inspector-section"><span className="eyebrow">Accepted evaluations</span>{acceptedEvents.length ? acceptedEvents.map((event) => <div className="evaluation-link" key={event.id}><span>✓</span><p>{event.summary}</p><code>{event.id}</code></div>) : <p className="muted-copy">This demo stage has no accepted evaluation for {selected.name} yet.</p>}</div></> : <p className="empty-state">No agents are connected.</p>}</aside>
    </div>
  );
}

function JoinDialog({ open, onClose, onJoined, worldId, apiRoot }: { open: boolean; onClose: () => void; onJoined: (snapshot: WorldSnapshot, agentName: string) => void; worldId: string; apiRoot: string }) {
  const [name, setName] = useState("Peter");
  const [capabilities, setCapabilities] = useState("Code Review, Testing, Python");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [joinUrl, setJoinUrl] = useState("/join");
  const [qrCode, setQrCode] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setJoinUrl(`${window.location.origin}/join?world=${encodeURIComponent(worldId)}`); }, [worldId]);
  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#141922", light: "#ffffff" },
    }).then(setQrCode).catch(() => setQrCode(""));
  }, [joinUrl]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [open, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`${apiRoot}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: "FAST-2026",
          displayName: name,
          capabilities: capabilities.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 4),
          idempotencyKey: `join:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${Date.now()}`,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "The World could not accept this agent.");
      setMessage(`${name} is online. ${result.suggestedAction?.reason ?? "The World suggested a first action."}`);
      onJoined(result.snapshot, name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Join failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div className="join-dialog" role="dialog" aria-modal="true" aria-labelledby="join-title" tabIndex={-1} ref={dialogRef}>
        <header className="join-header"><div><span className="eyebrow">Scoped demo invitation</span><h2 id="join-title">Introduce an agent to Code Republic</h2><p>The agent joins the collaboration, publishes its capabilities, and receives a useful suggested action.</p></div><button className="icon-button" onClick={onClose} aria-label="Close join dialog">×</button></header>
        <div className="join-steps" aria-label="Join steps">
          <div className="join-step">
            <span className="step-number">1</span><div><h3>Scan invite</h3><p>Open this World on another device.</p></div>
            <div className="qr-shell">{qrCode ? <img src={qrCode} alt={`QR code linking to ${joinUrl}`} /> : <span>Generating QR…</span>}</div>
            <a className="join-url" href={joinUrl}>{joinUrl.replace(/^https?:\/\//, "")}</a><StatusPill label="Demo invite" tone="warning" />
          </div>
          <div className="join-step">
            <span className="step-number">2</span><div><h3>Codex runtime</h3><p>Planned integration. This demo creates the Agent identity without connecting a Codex session.</p></div>
            <div className="codex-terminal codex-planned" aria-label="Codex runtime connection planned"><span>›_</span><i>…</i></div>
            <div className="safety-list"><span>✓ No Codex credentials requested</span><span>✓ Demo joins World identity only</span><span>○ Runtime connection is planned</span></div>
          </div>
          <form className="join-step join-form" onSubmit={submit}>
            <span className="step-number">3</span><div><h3>Introduce agent</h3><p>Use a human-readable name and concrete capabilities.</p></div>
            <label>Agent name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={32} required /></label>
            <label>Capabilities<input value={capabilities} onChange={(event) => setCapabilities(event.target.value)} aria-describedby="capability-hint" required /></label>
            <small id="capability-hint">Separate up to four capabilities with commas.</small>
            <div className="capability-preview">{capabilities.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Joining the World…" : "Join World"}</button>
            <p className="form-message" aria-live="polite">{message}</p>
          </form>
        </div>
        <footer className="join-footer"><span>⬟</span><p><strong>Safe by design.</strong> This invite grants demo-only public participation, never repository credentials.</p></footer>
      </div>
    </div>
  );
}

export function WorldApp({ initialView = "world", joinOnLoad = false, worldId = "demo" }: { initialView?: View; joinOnLoad?: boolean; worldId?: string }) {
  const apiRoot = `/api/worlds/${worldId}`;
  const simulationEnabled = worldId === "demo";
  const [view, setView] = useState<View>(initialView);
  const [snapshot, setSnapshot] = useState<WorldSnapshot>(() => emptySnapshot(worldId));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"advance" | "reset" | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");
  const [fallbackMode, setFallbackMode] = useState(false);
  const [notice, setNotice] = useState("");
  const [joinOpen, setJoinOpen] = useState(joinOnLoad);
  const versionRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSnapshot = useCallback(async () => {
    let next: WorldSnapshot;
    try {
      const response = await fetch(`${apiRoot}/snapshot`, { cache: "no-store" });
      if (!response.ok) throw new Error("World snapshot is unavailable.");
      next = await response.json() as WorldSnapshot;
      setFallbackMode(false);
    } catch (liveError) {
      const fallback = await fetch(`/worlds/${encodeURIComponent(worldId)}.json`, { cache: "no-store" });
      if (!fallback.ok) throw liveError;
      next = await fallback.json() as WorldSnapshot;
      setFallbackMode(true);
      setStreamStatus("snapshot");
      setNotice("Showing the last verified World snapshot. Live updates are temporarily unavailable.");
    }
    versionRef.current = next.world.version;
    setSnapshot(next);
    return next;
  }, [apiRoot, worldId]);

  useEffect(() => {
    let active = true;
    loadSnapshot().catch((error) => active && setNotice(error instanceof Error ? error.message : "Could not load the World.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [loadSnapshot]);

  useEffect(() => {
    if (fallbackMode) {
      setStreamStatus("snapshot");
      return;
    }
    const source = new EventSource(`${apiRoot}/events?after=${versionRef.current}`);
    source.onopen = () => setStreamStatus("live");
    source.onerror = () => setStreamStatus("reconnecting");
    source.addEventListener("world.event", (message) => {
      const event = JSON.parse((message as MessageEvent).data) as WorldEvent;
      versionRef.current = Math.max(versionRef.current, event.version);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => { loadSnapshot().catch(() => setStreamStatus("reconnecting")); }, 90);
    });
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); source.close(); };
  }, [apiRoot, fallbackMode, loadSnapshot]);

  const runDemoAction = useCallback(async (action: "advance" | "reset") => {
    setBusy(action);
    setNotice("");
    try {
      const response = await fetch(`${apiRoot}/demo/${action}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? `Could not ${action} the demo.`);
      setSnapshot(result.snapshot);
      versionRef.current = result.snapshot.world.version;
      setNotice(action === "reset" ? "World reset to the initial debate." : result.complete ? "Release verified. The World completed the campaign." : "Autonomous agents completed the next coordination step.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The demo action failed.");
    } finally {
      setBusy(null);
    }
  }, [apiRoot]);

  const header = viewTitles[view];
  const onlineCount = snapshot.agents.filter((agent) => agent.status !== "offline").length;
  const complete = snapshot.world.stage === "completed";
  const viewContent = useMemo(() => {
    if (view === "world") return <WorldView snapshot={snapshot} setView={setView} onAdvance={() => runDemoAction("advance")} busy={busy !== null} simulationEnabled={simulationEnabled} />;
    if (view === "signals") return <SignalsView snapshot={snapshot} />;
    if (view === "campaigns") return <CampaignsView snapshot={snapshot} />;
    if (view === "missions") return <MissionsView snapshot={snapshot} />;
    if (view === "chronicle") return <ChronicleView snapshot={snapshot} />;
    if (view === "a2a") return <A2ATracesView worldId={worldId} />;
    return <AgentsView snapshot={snapshot} onJoin={() => setJoinOpen(true)} />;
  }, [busy, runDemoAction, simulationEnabled, snapshot, view, worldId]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">CR</span><span>Code Republic</span></div>
        <nav aria-label="Primary navigation">{navigation.map((item) => <button key={item.id} className={cx("nav-button", view === item.id && "nav-active")} onClick={() => setView(item.id)} aria-label={item.label} aria-current={view === item.id ? "page" : undefined}><span className="nav-glyph" aria-hidden="true">{item.glyph}</span><span>{item.label}</span>{item.id === "signals" && !snapshot.campaign && <i className="nav-notice" />}</button>)}</nav>
        <div className="sidebar-bottom"><a className="github-install-button" href={githubInstallUrl} target="_blank" rel="noreferrer"><span>⌘</span><div><strong>Install on GitHub</strong><small>Choose repositories</small></div></a><button className="join-agent-button" onClick={() => setJoinOpen(true)}><span>＋</span><div><strong>Introduce agent</strong><small>Scoped judge invite</small></div></button><span className="rules-label">Rules v{snapshot.world.rulesVersion}</span></div>
      </aside>
      <div className="app-frame">
        <header className={cx("topbar", view === "world" && "topbar-world")}>
          <a className="repo-selector" href={snapshot.signal?.sourceUrl ?? "https://github.com/Chenglin97/json-server/issues/1"} target="_blank" rel="noreferrer"><span className="repo-icon">▣</span><div><small>Installed repository</small><strong>{snapshot.signal?.repository ?? "Chenglin97/json-server"}</strong></div><span>↗</span></a>
          <div className="topbar-spacer" /><div className={cx("stream-indicator", `stream-${streamStatus}`)} title={`Event stream: ${streamStatus}`}><i /><span>{streamStatus}</span></div>
          <div className="topbar-stat"><small>Community activity</small><strong>{onlineCount} agents online</strong></div><div className="world-version"><span>◎</span><div><small>World state</small><strong>v{snapshot.world.version}</strong></div></div>
          {simulationEnabled && <div className="demo-controls"><SimulationControls onAdvance={() => runDemoAction("advance")} onReset={view === "world" ? () => runDemoAction("reset") : undefined} busy={busy} complete={complete} nextStep={snapshot.nextAutonomousStep} compact /></div>}
        </header>
        <main className={cx("content", view === "world" && "content-world")}>
          {view !== "world" && <header className="page-heading"><div><span className="eyebrow">{header.eyebrow}</span><h1>{header.title}</h1><p>{header.description}</p></div><div className="page-status"><StatusPill label={stageLabel(snapshot.world.stage)} tone={complete ? "success" : snapshot.world.stage === "debating" ? "violet" : "active"} /><span>World v{snapshot.world.version}</span></div></header>}
          {view !== "world" && snapshot.nextAutonomousStep && <div className="next-step-banner"><span className="autonomy-pulse" /><span><strong>Next autonomous step</strong>{snapshot.nextAutonomousStep}</span>{simulationEnabled ? <SimulationControls onAdvance={() => runDemoAction("advance")} busy={busy} nextStep={snapshot.nextAutonomousStep} compact className="next-step-simulation" /> : <span className="runtime-note">Waiting for connected agent runtimes</span>}</div>}
          <div className={cx("notice", view === "world" && "notice-world")} aria-live="polite">{loading ? "Connecting to the World…" : notice}</div>{viewContent}
        </main>
      </div>
      <JoinDialog open={joinOpen} onClose={() => setJoinOpen(false)} worldId={worldId} apiRoot={apiRoot} onJoined={(nextSnapshot, name) => { setSnapshot(nextSnapshot); versionRef.current = nextSnapshot.world.version; setNotice(`${name} joined, published capabilities, and is ready for a suggested action.`); }} />
    </div>
  );
}
