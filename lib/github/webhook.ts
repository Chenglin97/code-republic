import { issueCommentWebhookSchema, isSolveCommand, worldIdForIssue } from "./contract";
import { verifyGithubSignature } from "./signature";
import { createGithubIssueEvents } from "../world/seed";
import type { CreateWorldResult } from "../world/authority";
import type { WorldEvent } from "../world/types";

export interface GithubWebhookDependencies {
  createWorld(worldId: string, events: WorldEvent[]): Promise<CreateWorldResult>;
  resolveDefaultBranchHead(installationId: number, repository: string, branch: string): Promise<string>;
  postIssueComment(installationId: number, repository: string, issueNumber: number, body: string): Promise<void>;
}

function issueSummary(body: string | null): string {
  const compact = (body ?? "No issue description was supplied.").replace(/\s+/g, " ").trim();
  return compact.slice(0, 420) || "No issue description was supplied.";
}

export async function handleGithubWebhook(
  request: Request,
  dependencies: GithubWebhookDependencies,
  webhookSecret = process.env.GITHUB_WEBHOOK_SECRET,
): Promise<Response> {
  const rawBody = await request.text();
  if (!webhookSecret) return Response.json({ error: "GitHub webhook secret is not configured." }, { status: 503 });
  if (!await verifyGithubSignature(rawBody, request.headers.get("x-hub-signature-256"), webhookSecret)) {
    return Response.json({ error: "Invalid GitHub webhook signature." }, { status: 401 });
  }

  if (request.headers.get("x-github-event") !== "issue_comment") {
    return Response.json({ accepted: true, ignored: true, reason: "unsupported_event" });
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Webhook body must be valid JSON." }, { status: 400 });
  }
  const parsed = issueCommentWebhookSchema.safeParse(input);
  if (!parsed.success) return Response.json({ accepted: true, ignored: true, reason: "unsupported_payload" });
  const payload = parsed.data;
  if (payload.issue.pull_request || payload.comment.user.type === "Bot" || !isSolveCommand(payload.comment.body)) {
    return Response.json({ accepted: true, ignored: true, reason: "not_a_solve_command" });
  }

  const worldId = worldIdForIssue(payload.repository.full_name, payload.issue.number);
  const baseCommit = await dependencies.resolveDefaultBranchHead(
    payload.installation.id,
    payload.repository.full_name,
    payload.repository.default_branch,
  );
  const result = await dependencies.createWorld(worldId, createGithubIssueEvents({
    worldId,
    repository: payload.repository.full_name,
    baseCommit: baseCommit.slice(0, 7),
    issueNumber: payload.issue.number,
    issueUrl: payload.issue.html_url,
    title: payload.issue.title,
    summary: issueSummary(payload.issue.body),
    requestedBy: payload.sender.login,
  }));
  const worldUrl = new URL(`/?world=${encodeURIComponent(worldId)}`, request.url).toString();
  await dependencies.postIssueComment(
    payload.installation.id,
    payload.repository.full_name,
    payload.issue.number,
    [
      "### Code Republic accepted this problem",
      "",
      `World: ${worldUrl}`,
      `Pinned revision: \`${baseCommit.slice(0, 7)}\``,
      "",
      "Independent agents are now comparing competing plans before implementation. The public World records every decision, contribution, peer review, verification result, and projected reward share.",
    ].join("\n"),
  );

  return Response.json({ accepted: true, created: result.created, worldId, worldUrl });
}
