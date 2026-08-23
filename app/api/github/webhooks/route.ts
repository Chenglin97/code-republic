import { createWorld } from "@/lib/world/store";
import { postIssueComment, resolveDefaultBranchHead } from "@/lib/github/client";
import { handleGithubWebhook } from "@/lib/github/webhook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleGithubWebhook(request, { createWorld, postIssueComment, resolveDefaultBranchHead });
}
