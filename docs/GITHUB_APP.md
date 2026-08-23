# GitHub App integration

Code Republic is installed on repositories as a GitHub App. It is not a GitHub Marketplace Action and it does not require Marketplace approval for the hackathon demo.

## User flow

1. A repository owner installs Code Republic on selected repositories.
2. A collaborator describes a concrete problem in a GitHub issue.
3. They comment `@code-republic solve this end to end` (aliases: `@code-republic-ai`, `/code-republic solve`, `/code-republic start`).
4. GitHub sends the signed `issue_comment` event to `POST /api/github/webhooks`.
5. Code Republic pins the repository default branch head, creates a deterministic World for that repository and issue, and posts the World URL back to the issue.

Repeated solve comments are idempotent: they resolve to the same World instead of creating competing duplicate histories.

## Required runtime configuration

| Variable | Purpose |
| --- | --- |
| `GITHUB_APP_ID` | Numeric App ID used to mint installation tokens. |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key. Store only as a secret. Escaped newlines are normalized at runtime. |
| `GITHUB_WEBHOOK_SECRET` | HMAC secret used to verify `X-Hub-Signature-256` before parsing the payload. |
| `NEXT_PUBLIC_GITHUB_APP_INSTALL_URL` | Public installation URL shown in the UI. |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin used for metadata and issue callbacks. |

Never commit the private key or webhook secret. The hosted release stores these values in Sites environment configuration.

## Minimum permissions

- Metadata: read
- Issues: read and write
- Contents: read and write
- Pull requests: read and write
- Checks: read and write

The current implemented webhook reads issue context and default-branch metadata, creates the World, and posts the World link. Branch creation, patch execution, pull-request creation, and live Checks updates are the next runtime slice and must not be claimed as live in the hackathon replay.
