import { assertSupportedWorld, getEventsAfter } from "@/lib/world/store";
import { getWorldId, worldErrorResponse, type WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function GET(request: Request, context: WorldRouteContext) {
  let worldId: string;
  let cursor: number;
  try {
    worldId = await getWorldId(context);
    assertSupportedWorld(worldId);
    const url = new URL(request.url);
    const rawCursor = url.searchParams.get("after") ?? request.headers.get("last-event-id") ?? "0";
    cursor = Number.parseInt(rawCursor, 10);
    if (!Number.isInteger(cursor) || cursor < 0) {
      return new Response(
        JSON.stringify({ error: { code: "INVALID_CURSOR", message: "The event cursor must be a non-negative integer." } }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    return worldErrorResponse(error, "The World event stream could not be opened.");
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode("retry: 1500\n\n"));
      try {
        while (!request.signal.aborted) {
          const events = await getEventsAfter(worldId, cursor);
          for (const event of events) {
            controller.enqueue(
              encoder.encode(`id: ${event.version}\nevent: world.event\ndata: ${JSON.stringify(event)}\n\n`),
            );
            cursor = event.version;
          }
          if (events.length === 0) controller.enqueue(encoder.encode(": heartbeat\n\n"));
          await pause(900);
        }
      } catch (error) {
        if (!request.signal.aborted) console.error("World event stream failed", error);
      } finally {
        try {
          controller.close();
        } catch {
          // The browser may have already closed the stream.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
