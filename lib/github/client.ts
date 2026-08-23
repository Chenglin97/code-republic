import { createAppAuth } from "@octokit/auth-app";
import { request } from "@octokit/request";
import { splitRepository } from "./contract";

function githubAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) return null;
  return { appId, privateKey: privateKey.replace(/\\n/g, "\n") };
}

async function installationRequest(installationId: number) {
  const config = githubAppConfig();
  if (!config) throw new Error("GitHub App credentials are not configured.");
  const auth = createAppAuth(config);
  const authentication = await auth({ type: "installation", installationId });
  return request.defaults({
    headers: {
      authorization: `token ${authentication.token}`,
      "x-github-api-version": "2022-11-28",
    },
  });
}

export function githubAppReady(): boolean {
  return githubAppConfig() !== null && Boolean(process.env.GITHUB_WEBHOOK_SECRET);
}

export async function resolveDefaultBranchHead(installationId: number, repository: string, branch: string): Promise<string> {
  const github = await installationRequest(installationId);
  const { owner, repo } = splitRepository(repository);
  const response = await github("GET /repos/{owner}/{repo}/git/ref/{ref}", {
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  return response.data.object.sha;
}

export async function postIssueComment(installationId: number, repository: string, issueNumber: number, body: string): Promise<void> {
  const github = await installationRequest(installationId);
  const { owner, repo } = splitRepository(repository);
  await github("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}
