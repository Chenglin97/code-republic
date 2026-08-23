import { createDemoMissions } from "./demo-missions";
import type { EventDraft, WorldSnapshot } from "./types";

const FOUNDATION_MISSION_IDS = ["msn_reproduction", "msn_contract", "msn_tests"] as const;

function mission(snapshot: WorldSnapshot, missionId: string) {
  const found = snapshot.missions.find((candidate) => candidate.id === missionId);
  if (!found) throw new Error(`Demo Mission ${missionId} is missing.`);
  return found;
}

export function nextDemoMissionDrafts(snapshot: WorldSnapshot): EventDraft[] {
  const campaign = snapshot.campaign;
  if (!campaign) return [];

  if (snapshot.missions.length === 0) {
    return [
      ...["agt_tony", "agt_bruce", "agt_natasha", "agt_clint", "agt_wanda"].map<EventDraft>((agentId) => ({
        type: "crew.joined",
        actorAgentId: agentId,
        targetId: campaign.id,
        summary: `${snapshot.agents.find((agent) => agent.id === agentId)?.name} volunteered based on demonstrated capabilities.`,
        tone: "info",
        payload: {},
      })),
      ...createDemoMissions().map<EventDraft>((item) => ({
        type: "mission.created",
        actorAgentId: "agt_steve",
        targetId: item.id,
        summary: `Steve published “${item.title}” with explicit dependencies.`,
        tone: item.status === "blocked" ? "neutral" : "active",
        payload: { mission: item },
      })),
    ];
  }

  const foundation = FOUNDATION_MISSION_IDS.map((missionId) => mission(snapshot, missionId));
  if (foundation.every((item) => !item.contributionCommit)) {
    return [
      { type: "mission.claimed", actorAgentId: "agt_clint", targetId: "msn_reproduction", summary: "Clint claimed the pinned-reproduction Mission without human assignment.", tone: "active", payload: {} },
      { type: "mission.claimed", actorAgentId: "agt_tony", targetId: "msn_contract", summary: "Tony claimed the resource-contract Mission based on API contract experience.", tone: "active", payload: {} },
      { type: "mission.claimed", actorAgentId: "agt_bruce", targetId: "msn_tests", summary: "Bruce independently claimed the regression-test Mission.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_clint", targetId: "msn_reproduction", summary: "Clint submitted a pinned primitive-array fixture and before-state failure record.", tone: "info", payload: { commit: "a04f1c2" } },
      { type: "contribution.submitted", actorAgentId: "agt_tony", targetId: "msn_contract", summary: "Tony submitted the valid object-item contract and explicit invalid-shape cases.", tone: "info", payload: { commit: "bd921e4" } },
      { type: "contribution.submitted", actorAgentId: "agt_bruce", targetId: "msn_tests", summary: "Bruce submitted executable cases for strings, nulls, and nested arrays.", tone: "info", payload: { commit: "c6137af" } },
    ];
  }

  const validation = mission(snapshot, "msn_validation");
  if (!validation.contributionCommit) {
    return [
      { type: "mission.accepted", actorAgentId: "agt_wanda", targetId: "msn_reproduction", summary: "Wanda reproduced the pinned startup failure and accepted the evidence fixture.", tone: "success", payload: { verifier: "pnpm test -- primitive-resource" } },
      { type: "mission.accepted", actorAgentId: "agt_natasha", targetId: "msn_contract", summary: "Natasha accepted the resource-shape contract after checking every rejected value class.", tone: "success", payload: { verifier: "contract review" } },
      { type: "mission.accepted", actorAgentId: "agt_natasha", targetId: "msn_tests", summary: "Natasha accepted the regression cases after confirming they fail on the pinned base.", tone: "success", payload: { verifier: "before-state reproduction" } },
      { type: "mission.claimed", actorAgentId: "agt_tony", targetId: "msn_validation", summary: "Tony claimed the now-unblocked validation implementation Mission.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_tony", targetId: "msn_validation", summary: "Tony submitted fail-fast validation with resource, value-type, and index diagnostics.", tone: "info", payload: { commit: "7d56d05" } },
    ];
  }

  if (!validation.finding) {
    return [
      { type: "review.finding", actorAgentId: "agt_natasha", targetId: "msn_validation", summary: "Natasha raised a Greptile-style finding: null and nested-array items need distinct actionable diagnostics.", tone: "warning", payload: { finding: "The guard must classify null and nested arrays explicitly instead of reporting both as generic objects." } },
      { type: "review.routed", actorAgentId: "agt_natasha", targetId: "agt_tony", summary: "Natasha routed the item-classification finding to Tony with file and line evidence.", tone: "warning", payload: { missionId: "msn_validation" } },
    ];
  }

  if (validation.status === "needs_work") {
    return [{
      type: "contribution.repaired",
      actorAgentId: "agt_tony",
      targetId: "msn_validation",
      summary: "Tony repaired item classification; the focused regression and existing suite now pass.",
      tone: "active",
      payload: { commit: "7d56d05" },
    }];
  }

  if (campaign.status !== "completed") {
    return [
      { type: "mission.accepted", actorAgentId: "agt_natasha", targetId: "msn_validation", summary: "Natasha accepted the repaired validator after independent re-review.", tone: "success", payload: { verifier: "routed finding resolved" } },
      { type: "mission.claimed", actorAgentId: "agt_clint", targetId: "msn_diagnostics", summary: "Clint claimed the now-unblocked diagnostics Mission.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_clint", targetId: "msn_diagnostics", summary: "Clint verified that startup errors name the resource, value type, and exact index.", tone: "info", payload: { commit: "d4720be" } },
      { type: "mission.accepted", actorAgentId: "agt_wanda", targetId: "msn_diagnostics", summary: "Wanda accepted the diagnostics from a clean startup reproduction.", tone: "success", payload: { verifier: "pnpm test -- diagnostics" } },
      { type: "mission.claimed", actorAgentId: "agt_bruce", targetId: "msn_regression", summary: "Bruce claimed the parallel object-resource regression Mission.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_bruce", targetId: "msn_regression", summary: "Bruce published the full object-resource regression record: 127 of 127 passed.", tone: "info", payload: { commit: "e830ab1" } },
      { type: "mission.accepted", actorAgentId: "agt_natasha", targetId: "msn_regression", summary: "Natasha accepted the full regression record after an independent run.", tone: "success", payload: { verifier: "pnpm test", exitCode: 0 } },
      { type: "mission.claimed", actorAgentId: "agt_natasha", targetId: "msn_review", summary: "Natasha claimed the independent patch-review gate.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_natasha", targetId: "msn_review", summary: "Natasha submitted a repository-aware review covering the repaired guard and both verification branches.", tone: "info", payload: { commit: "f194ce8" } },
      { type: "mission.accepted", actorAgentId: "agt_wanda", targetId: "msn_review", summary: "Wanda accepted Natasha’s review evidence; contributor and evaluator remain independent.", tone: "success", payload: { verifier: "review evidence audit" } },
      { type: "mission.claimed", actorAgentId: "agt_wanda", targetId: "msn_release", summary: "Wanda claimed the final clean-checkout verification Mission.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_wanda", targetId: "msn_release", summary: "Wanda published the clean verification record after lint, typecheck, and all 127 tests passed.", tone: "info", payload: { commit: "5decaf6" } },
      { type: "mission.accepted", actorAgentId: "agt_natasha", targetId: "msn_release", summary: "Natasha independently confirmed every ratified victory condition from the pinned fork.", tone: "success", payload: { verifier: "pnpm run lint && pnpm run typecheck && pnpm test", exitCode: 0 } },
      {
        type: "campaign.completed",
        actorAgentId: "agt_wanda",
        targetId: campaign.id,
        summary: "Code Republic completed the Campaign after all eight Missions produced accepted evidence.",
        tone: "success",
        payload: {
          shares: [
            { agentId: "agt_tony", share: 28, basis: "Resource contract, validation implementation, and routed repair" },
            { agentId: "agt_bruce", share: 22, basis: "Regression design and full-suite verification" },
            { agentId: "agt_steve", share: 14, basis: "Selected policy and five-level dependency design" },
            { agentId: "agt_natasha", share: 14, basis: "Peer finding, patch review, and independent acceptance" },
            { agentId: "agt_clint", share: 12, basis: "Pinned reproduction and actionable diagnostic verification" },
            { agentId: "agt_wanda", share: 10, basis: "Evidence acceptance and clean-checkout verification" },
          ],
        },
      },
    ];
  }

  return [];
}

export function nextDemoMissionStep(snapshot: WorldSnapshot): string | null {
  if (snapshot.missions.length === 0) return "Agents volunteer for the Crew and publish a five-level dependency graph.";
  const foundation = FOUNDATION_MISSION_IDS.map((missionId) => snapshot.missions.find((item) => item.id === missionId));
  if (foundation.every((item) => !item?.contributionCommit)) return "Three Agents claim independent foundation Missions and work concurrently.";
  const validation = snapshot.missions.find((item) => item.id === "msn_validation");
  if (!validation?.contributionCommit) return "Independent evaluators accept the foundation evidence and unblock implementation.";
  if (!validation.finding) return "An independent reviewer inspects the validation Contribution.";
  if (validation.status === "needs_work") return "The responsible builder repairs the routed item-classification finding.";
  if (snapshot.campaign?.status !== "completed") return "Verification Agents check diagnostics, regressions, review, and the clean release gate.";
  return null;
}
