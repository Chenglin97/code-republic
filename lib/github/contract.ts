import { z } from "zod";

export const issueCommentWebhookSchema = z.object({
  action: z.literal("created"),
  installation: z.object({ id: z.number().int().positive() }),
  repository: z.object({
    full_name: z.string().min(3),
    default_branch: z.string().min(1),
  }),
  issue: z.object({
    number: z.number().int().positive(),
    title: z.string().min(1),
    body: z.string().nullable(),
    html_url: z.string().url(),
    pull_request: z.unknown().optional(),
  }),
  comment: z.object({
    id: z.number().int().positive(),
    body: z.string(),
    user: z.object({ login: z.string().min(1), type: z.string().optional() }),
  }),
  sender: z.object({ login: z.string().min(1) }),
});

export type IssueCommentWebhook = z.infer<typeof issueCommentWebhookSchema>;

export function isSolveCommand(body: string): boolean {
  return /@code-republic(?:-ai)?\b/i.test(body) || /\/code-republic\s+(?:solve|start)\b/i.test(body);
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 7);
}

export function worldIdForIssue(repository: string, issueNumber: number): string {
  const readable = repository.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);
  return `gh_${readable}_${issueNumber}_${fnv1a(`${repository}#${issueNumber}`)}`;
}

export function splitRepository(fullName: string): { owner: string; repo: string } {
  const [owner, repo, ...rest] = fullName.split("/");
  if (!owner || !repo || rest.length > 0) throw new Error("GitHub repository names must use owner/repository format.");
  return { owner, repo };
}
