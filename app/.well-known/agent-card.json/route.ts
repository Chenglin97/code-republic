import { createCodeRepublicAgentCard, validateAgentCard } from "../../../lib/a2a/card";

const CARD_ETAG = '"code-republic-agent-card-0.1.0"';

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  if (request.headers.get("if-none-match") === CARD_ETAG) {
    return new Response(null, {
      status: 304,
      headers: {
        "Cache-Control": "public, max-age=300",
        ETag: CARD_ETAG,
        Vary: "Host",
      },
    });
  }

  const card = createCodeRepublicAgentCard(new URL(request.url).origin);
  const validation = validateAgentCard(card);
  if (!validation.valid) {
    return Response.json({ error: "Published Agent Card failed local validation." }, { status: 500 });
  }

  return Response.json(card, {
    headers: {
      "Cache-Control": "public, max-age=300",
      ETag: CARD_ETAG,
      Vary: "Host",
    },
  });
}
